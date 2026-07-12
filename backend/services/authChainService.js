import { ethers } from "ethers";
import electionDAO from '../repositories/electionDAO';
import { ApiError } from '../lib/api-utils';
import logger from '../utils/logger';

// Enforce required environment variables or fallback safely for local dev
const AUTH_RPC_URL = process.env.RPC_URL_1;
const SERVER_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

if (!AUTH_RPC_URL || !SERVER_PRIVATE_KEY) {
    logger.warn('AuthChainService', 'Missing RPC_URL_1 or ADMIN_PRIVATE_KEY environment variables. Blockchain interactions will fail.');
}

const provider = AUTH_RPC_URL ? new ethers.JsonRpcProvider(AUTH_RPC_URL) : null;
const wallet = (SERVER_PRIVATE_KEY && provider) ? new ethers.Wallet(SERVER_PRIVATE_KEY, provider) : null;

const REGISTRY_ABI = [
  "function hasClaimed(bytes32 account) view returns (bool)",
  "function registerUser(bytes32[] calldata proof, bytes32 account) external",
  "function isLocked() view returns (bool)",
  "function timeStart() view returns (uint256)",
  "function timeEnd() view returns (uint256)"
];

const checkProvider = () => {
    if (!provider) throw new ApiError('Blockchain provider is not configured (RPC_URL_1 missing).', 503);
};

const checkWallet = () => {
    checkProvider();
    if (!wallet) throw new ApiError('Server wallet is not configured (ADMIN_PRIVATE_KEY missing).', 503);
};

export const authChainService = {

  async hasUserClaimed(registryAddress, userIdentity) {
    checkProvider();
    try {
      const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);
      return await contract.hasClaimed(userIdentity);
    } catch (error) {
      logger.error('AuthChainService', `Error checking claim status for ${registryAddress}`, error);
      throw new ApiError("Failed to check user claim status on-chain.", 502);
    }
  },

  async isElectionLocked(registryAddress) {
    checkProvider();
    try {
      const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);
      const isLocked = await contract.isLocked();

      // Sync election status in the database
      try {
          const status = isLocked ? 'BLOCKED' : 'ACTIVE';
          await electionDAO.updateElectionStatusByRegistry(registryAddress, status);
      } catch (dbError) {
          logger.warn('AuthChainService', 'Failed to sync election status to DB during lock check', dbError);
      }

      return isLocked;
    } catch (error) {
      logger.error('AuthChainService', `Error checking election lock status for ${registryAddress}`, error);
      throw new ApiError("Failed to check election lock status.", 502);
    }
  },

  async registerUserOnChain(registryAddress, userIdentity, proof) {
    checkWallet();
    try {
      const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, wallet);

      // Pre-flight checks
      const [isLocked, timeStart, timeEnd] = await Promise.all([
        contract.isLocked(),
        contract.timeStart(),
        contract.timeEnd()
      ]);

      const now = Math.floor(Date.now() / 1000);
      
      if (isLocked) {
          throw new ApiError("Election is locked (Emergency Stop).", 403);
      }
      if (now < timeStart) {
          throw new ApiError("Election has not started yet.", 400);
      }
      if (now > timeEnd) {
          throw new ApiError("Election has ended.", 400);
      }

      // Execute transaction
      const tx = await contract.registerUser(proof, userIdentity);
      await tx.wait();

      return tx;
    } catch (error) {
      // Re-throw known ApiErrors
      if (error instanceof ApiError) throw error;

      logger.error('AuthChainService', `Error registering user on ${registryAddress}`, error);
      
      // Handle known Ethers errors
      if (error.code === 'CALL_EXCEPTION') {
          throw new ApiError("Blockchain transaction failed (Smart Contract Revert).", 400);
      }

      throw new ApiError("Failed to register user on AuthChain.", 502);
    }
  }
};
