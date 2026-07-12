import { ethers } from 'ethers';
import electionRepository from '../repositories/electionRepository';
import { ApiError } from '../lib/api-utils';
import logger from '../utils/logger';
import { BLANK_CANDIDATE_ID } from '../utils/electionSerializers';

const VOTE_BOX_ABI = [
  "event VoteCast(bytes16 indexed candidateId)",
  "function getElectionInfo() external view returns (bytes32, uint256, uint256, bool)"
];

const VOTE_RPC_URL = process.env.RPC_URL_2 || 'http://127.0.0.1:8546';

// Convert DB ID to bytes16 used on-chain
const toBytes16 = (id) => {
  if (!id) return null;
  if (id.startsWith('0x')) return id.toLowerCase();
  return `0x${id.replace(/-/g, '')}`.toLowerCase();
};

export const tallyService = {
  // Get election results from chain and DB
  async getElectionResults(electionId) {
    let contracts, dbCandidates;
    try {
        [contracts, dbCandidates] = await Promise.all([
            electionRepository.getElectionContracts(electionId),
            electionRepository.getCandidates(electionId)
        ]);
    } catch (error) {
        logger.error('TallyService', `Failed to fetch election data for ${electionId}`, error);
        throw new ApiError('Error fetching election data.', 500);
    }

    if (!contracts || !contracts.vote_contract_address) {
      throw new ApiError("Election contract not found.", 404);
    }
    const contractAddress = contracts.vote_contract_address;

    // Connect to chain and fetch events
    let events = [];
    try {
        const provider = new ethers.JsonRpcProvider(VOTE_RPC_URL);
        const contract = new ethers.Contract(contractAddress, VOTE_BOX_ABI, provider);

        const filter = contract.filters.VoteCast();
        events = await contract.queryFilter(filter, 0, 'latest');
    } catch (error) {
        logger.error('TallyService', `Blockchain connection failed for ${contractAddress}`, error);
        throw new ApiError('Failed to fetch votes from blockchain.', 503);
    }

    // Tally votes
    const voteCounts = {};
    const validChainIds = new Map();

    dbCandidates.forEach(c => {
      const chainId = toBytes16(c.id);
      if (chainId) {
          voteCounts[chainId] = 0;
          validChainIds.set(chainId, c);
      }
    });
    voteCounts[BLANK_CANDIDATE_ID] = 0;

    events.forEach(event => {
      const candidateId = event.args.candidateId.toLowerCase();
      // Count if valid candidate or blank. Ignore unknown IDs
      if (voteCounts[candidateId] !== undefined) {
          voteCounts[candidateId]++;
      } else {
           logger.warn('TallyService', `Received vote for unknown candidate ID: ${candidateId} on election ${electionId}`);
      }
    });

    // Build results array
    const results = [];
    dbCandidates.forEach(c => {
      const chainId = toBytes16(c.id);
      if (chainId) {
        results.push({
          id: c.id,
          name: c.name,
          party: c.party_name,
          votes: voteCounts[chainId] || 0
        });
      }
    });

    // Add blank vote manually to result
    results.push({
        id: BLANK_CANDIDATE_ID,
        name: "Scheda Bianca",
        party: "Nessuno",
        votes: voteCounts[BLANK_CANDIDATE_ID] || 0
    });

    return results;
  }
};
