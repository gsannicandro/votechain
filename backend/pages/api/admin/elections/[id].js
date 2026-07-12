import { ethers } from 'ethers';
import { z } from 'zod';
import { withAuth } from '../../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../../lib/api-utils';
import { authContract, voteContract } from '../../../../utils/deployContracts';
import electionDAO from '../../../../repositories/electionDAO';
import whitelistDAO from '../../../../repositories/whitelistDAO';
import { getRegistriesLockStatus, getElectionMetrics } from '../../../../utils/registries';
import { computeCandidateMerkleTree, serializeMerklePlaceholder } from '../../../../utils/candidateMerkle';
import { buildElectionMetadataDocument, hashElectionMetadata } from '../../../../utils/electionMetadata';
import { buildCandidateMetadata, appendBlankCandidate, toUnixSeconds, serializeElection } from '../../../../utils/electionSerializers';

const electionUpdateSchema = z.object({
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

  const electionId = req.query.id;
  if (!electionId) res.status(400).json({ error: 'ID elezione mancante' });

  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
     res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  try {
     const election = await electionDAO.findById(electionId);
     if (!election) throw new ApiError('Elezione non trovata', 404);

    if (req.method === 'GET') {
      const [lockStatus, metrics, whitelistEntries] = await Promise.all([
        getRegistriesLockStatus({
          authAddress: election.auth_contract_address,
          voteAddress: election.vote_contract_address,
        }),
        getElectionMetrics({
          authAddress: election.auth_contract_address,
          voteAddress: election.vote_contract_address,
        }),
        whitelistDAO.listByElection(election.id),
      ]);
      return res.status(200).json(serializeElection(election, lockStatus, metrics, whitelistEntries));
    }
    
    // Checks for PUT/DELETE
    const existingStart = new Date(election.start_date).getTime();
    if (existingStart <= Date.now()) {
        throw new ApiError("L'elezione è già iniziata e non può essere modificata", 400);
    }
    
    if (req.method === 'DELETE') {
        await electionDAO.deleteElection(electionId);
        return res.status(204).end();
    }

    if (req.method === 'PUT') {
        const parsed = electionUpdateSchema.safeParse(req.body || {});
        if (!parsed.success) {
            throw new ApiError(parsed.error.issues[0]?.message || 'Payload non valido', 400);
        }

        const { title, description, voteRules, startDate, endDate, candidates, whitelist } = parsed.data;
        const startTs = toUnixSeconds(startDate);
        const endTs = toUnixSeconds(endDate);

        if (endTs <= startTs) throw new ApiError('La data di fine deve essere successiva alla data di inizio', 400);
        if (startTs <= Math.floor(Date.now() / 1000) - 60) throw new ApiError('La data di inizio deve essere nel futuro', 400);

        const filteredCandidates = candidates.filter(c => c.name !== 'Scheda Bianca');
        const baseCandidateMetadata = buildCandidateMetadata(filteredCandidates);
        const candidateListForContracts = appendBlankCandidate(baseCandidateMetadata);
        const candidateMerkle = serializeMerklePlaceholder(
            computeCandidateMerkleTree(candidateListForContracts)
        );
        const metadataDocument = buildElectionMetadataDocument({
            voteRules,
            startDate: startTs,
            endDate: endTs,
            candidates: candidateListForContracts,
        });
        const metadataHash = hashElectionMetadata(metadataDocument);

        await electionDAO.updateElection(electionId, {
            title,
            description,
            voteRules,
            startDate: startTs,
            endDate: endTs,
            candidates: baseCandidateMetadata,
            whitelist,
            candidateMerkle,
            metadataDocument,
            metadataHash,
        });

        await whitelistDAO.replaceEntries(electionId, whitelist);
        const newMerkleRoot = await whitelistDAO.generateAndStoreMerkleProofs(electionId);

        const oldStartTs = toUnixSeconds(election.start_date);
        const oldEndTs = toUnixSeconds(election.end_date);
        
        const updateTimesSafe = async (contract, newStart, newEnd, oldStart, oldEnd, funcs, getNextNonce) => {
            if (newStart < oldStart) {
                if (newStart !== oldStart) {
                    await (await contract[funcs.updateStart](newStart, { nonce: getNextNonce() })).wait();
                }
                if (newEnd !== oldEnd) {
                    await (await contract[funcs.updateEnd](newEnd, { nonce: getNextNonce() })).wait();
                }
            } else {
                if (newEnd !== oldEnd) {
                    await (await contract[funcs.updateEnd](newEnd, { nonce: getNextNonce() })).wait();
                }
                if (newStart !== oldStart) {
                    await (await contract[funcs.updateStart](newStart, { nonce: getNextNonce() })).wait();
                }
            }
        };

        // Auth Contract
        if (election.auth_contract_address && authContract) {
             const authRegistry = new ethers.Contract(
                 election.auth_contract_address,
                 [
                    'function updateMerkleRoot(bytes32 newRoot) external',
                    'function updateStartTime(uint256 newStartTime) external',
                    'function updateEndTime(uint256 newEndTime) external',
                    'function updateElectionMetadata(bytes32 newMetadata) external',
                    'error RegistrationAlreadyStarted()',
                    'error InvalidTimeWindow()',
                    'error RegistrationNotActive()'
                 ],
                 authContract.runner
             );
             
             // Manual Nonce Management for Auth Chain
             let authNonce = await authContract.runner.getNonce("latest");
             const nextAuthNonce = () => authNonce++;

             if (newMerkleRoot) {
                 await (await authRegistry.updateMerkleRoot(newMerkleRoot, { nonce: nextAuthNonce() })).wait();
             }

             await updateTimesSafe(
                 authRegistry, 
                 startTs, endTs, oldStartTs, oldEndTs,
                 { updateStart: 'updateStartTime', updateEnd: 'updateEndTime' },
                 nextAuthNonce
             );
             
             await (await authRegistry.updateElectionMetadata(metadataHash, { nonce: nextAuthNonce() })).wait();
        }

        // Vote Contract
        if (election.vote_contract_address && voteContract) {
            const voteRegistry = new ethers.Contract(
                election.vote_contract_address,
                [
                    'function updateStartTime(uint256 newStartTime) external',
                    'function updateEndTime(uint256 newEndTime) external',
                    'function updateElectionMetadata(bytes32 newMetadata) external',
                    'function updateCandidates(bytes16[] calldata _newCandidateIDs) external',
                    'error VotingAlreadyStarted()',
                    'error InvalidTimeWindow()',
                    'error ElectionLocked()'
                ],
                voteContract.runner
            );

            // Manual Nonce Management for Vote Chain
            let voteNonce = await voteContract.runner.getNonce("latest");
            const nextVoteNonce = () => voteNonce++;

            const candidateIds = candidateListForContracts.map((item) => item.id);
            
            await updateTimesSafe(
                 voteRegistry, 
                 startTs, endTs, oldStartTs, oldEndTs,
                 { updateStart: 'updateStartTime', updateEnd: 'updateEndTime' },
                 nextVoteNonce
             );

            await (await voteRegistry.updateElectionMetadata(metadataHash, { nonce: nextVoteNonce() })).wait();
            await (await voteRegistry.updateCandidates(candidateIds, { nonce: nextVoteNonce() })).wait();
        }
        
        // Return updated serialization logic
        const updatedElection = await electionDAO.findById(electionId);
        const [lockStatus, metrics, whitelistEntries] = await Promise.all([
             getRegistriesLockStatus({
                 authAddress: updatedElection.auth_contract_address,
                 voteAddress: updatedElection.vote_contract_address,
             }),
             getElectionMetrics({
                 authAddress: updatedElection.auth_contract_address,
                 voteAddress: updatedElection.vote_contract_address,
             }),
             whitelistDAO.listByElection(updatedElection.id),
        ]);
        
        return res.status(200).json(serializeElection(updatedElection, lockStatus, metrics, whitelistEntries));
    }

  } catch (error) {
     return handleApiError(res, error);
  }
}

export default withAuth(handler);
