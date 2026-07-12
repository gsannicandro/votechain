import { z } from 'zod';
import { withAuth } from '../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../lib/api-utils';
import { authContract, voteContract } from '../../../utils/deployContracts';
import electionDAO from '../../../repositories/electionDAO';
import whitelistDAO from '../../../repositories/whitelistDAO';
import { computeCandidateMerkleTree, serializeMerklePlaceholder } from '../../../utils/candidateMerkle';
import { buildElectionMetadataDocument, hashElectionMetadata } from '../../../utils/electionMetadata';
import { 
  buildCandidateMetadata, 
  appendBlankCandidate, 
  toUnixSeconds, 
  serializeMerklePlaceholder as serializeMerklePlaceholderUtil
} from '../../../utils/electionSerializers';

const electionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  voteRules: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  candidates: z
    .array(
      z.object({
        name: z.string().min(1, 'Nome candidato obbligatorio'),
        list: z.string().optional().default(''),
      })
    )
    .default([]),
  whitelist: z.array(z.string().min(3)).optional().default([]),
});

async function handler(req, res) {
  if (req.method !== 'POST') {
     res.setHeader('Allow', 'POST, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  let createdElectionId = null;

  try {
    const parsed = electionSchema.safeParse(req.body || {});
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Payload non valido', 400);
    }

    const { title, description, voteRules, startDate, endDate, candidates, whitelist } = parsed.data;
    const startTs = toUnixSeconds(startDate);
    const endTs = toUnixSeconds(endDate);

    if (endTs <= startTs) throw new ApiError('La data di fine deve essere successiva alla data di inizio', 400);
    if (startTs <= Math.floor(Date.now() / 1000) - 60) throw new ApiError('La data di inizio deve essere nel futuro', 400);

    if (!authContract || !voteContract) {
      throw new ApiError('Factory non disponibili. Esegui i deploy su entrambe le chain e riprova.', 503);
    }

    const baseCandidateMetadata = buildCandidateMetadata(candidates);
    const candidateListForContracts = appendBlankCandidate(baseCandidateMetadata);
    const candidateMerkle = computeCandidateMerkleTree(candidateListForContracts);
    const candidateIds = candidateListForContracts.map((item) => item.id);
    const metadataDocument = buildElectionMetadataDocument({
      voteRules,
      startDate: startTs,
      endDate: endTs,
      candidates: candidateListForContracts,
    });
    const metadataHash = hashElectionMetadata(metadataDocument);

    // Create election in DB first to get ID
    const client = await electionDAO.createElection({
      title,
      description,
      voteRules,
      startDate: startTs,
      endDate: endTs,
      authAddress: null,
      voteAddress: null,
      metadataHash,
      candidates: baseCandidateMetadata,
      candidateMerkle: serializeMerklePlaceholder(candidateMerkle),
      metadataDocument,
    });
    createdElectionId = client.id;

    // Insert whitelist
    await whitelistDAO.bulkInsert(client.id, whitelist);

    // Generate Merkle tree and proofs
    const merkleRoot = await whitelistDAO.generateAndStoreMerkleProofs(client.id);

    // Convert UUID to BigInt for contracts
    const electionIdForContracts = BigInt("0x" + client.id.replace(/-/g, ""));

    // Now create contracts with correct Merkle root
    const authTx = await authContract.createAuthRegistryContract(
      electionIdForContracts,
      merkleRoot,
      startTs,
      endTs,
      metadataHash
    );
    await authTx.wait();
    const authAddress = await authContract.authRegistries(electionIdForContracts);

    const voteTx = await voteContract.createVoteBoxRegistryContract(
      electionIdForContracts,
      startTs,
      endTs,
      metadataHash,
      candidateIds
    );
    await voteTx.wait();
    const voteAddress = await voteContract.voteBoxRegistries(electionIdForContracts);

    // Update election with contract addresses and merkle root
    await electionDAO.updateContractAddresses(client.id, authAddress, voteAddress, merkleRoot);

    return res.status(201).json({
      electionId: client.id,
      authRegistry: authAddress,
      voteRegistry: voteAddress,
      voteRules,
      candidateIds,
      candidates: baseCandidateMetadata,
      candidateMerkle: serializeMerklePlaceholder(candidateMerkle),
      metadataDocument,
      metadataHash,
      merkleRoot,
    });
  } catch (error) {
    if (createdElectionId) {
        console.error(`Rollback: Deleting election ${createdElectionId} due to error:`, error);
        await electionDAO.deleteElection(createdElectionId).catch(err => console.error("Failed to rollback election:", err));
    }
    return handleApiError(res, error);
  }
}

export default withAuth(handler);
