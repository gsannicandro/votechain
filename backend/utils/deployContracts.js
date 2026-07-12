import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import logger from "./logger";

const ARTIFACTS_DIR = path.join(process.cwd(), "constants");

// Ensure environment variables are loaded
const SERVER_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const AUTH_RPC_URL = process.env.RPC_URL_1;
const VOTE_RPC_URL = process.env.RPC_URL_2;

if (!SERVER_PRIVATE_KEY || !AUTH_RPC_URL || !VOTE_RPC_URL) {
    logger.warn("System", "Missing Blockchain Configuration in .env (RPC_URLs or PRIVATE_KEY). Blockchain interactions will fail.");
}

// Load JSON artifact by filename
function loadArtifact(filename) {
  try {
    const filePath = path.join(ARTIFACTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      logger.warn("System", `Artifact not found: ${filename}`);
      return null;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    logger.error("System", `Failed to load artifact ${filename}`, error);
    return null;
  }
}

const AuthFactoryData = loadArtifact("electionAuthFactory.json");
const VoteFactoryData = loadArtifact("electionVoteBoxFactory.json");

// Instantiate ethers Contract with wallet signer
function instantiateContract(artifact, providerUrl, label) {
  if (!artifact?.address || !artifact?.abi) {
    logger.warn("System", `[deployContracts] Artifact ${label} missing or incomplete. Run deployment scripts.`);
    return null;
  }

  if (!providerUrl || !SERVER_PRIVATE_KEY) {
      return null; // Missing config handled by earlier logs
  }

  try {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);
    return new ethers.Contract(artifact.address, artifact.abi, wallet);
  } catch (error) {
    logger.error("System", `[deployContracts] Failed to instantiate ${label}`, error);
    return null;
  }
}

// Export instantiated contracts (or null)
export const authContract = instantiateContract(AuthFactoryData, AUTH_RPC_URL, "AuthFactory");
export const voteContract = instantiateContract(VoteFactoryData, VOTE_RPC_URL, "VoteFactory");

// Return summary of loaded contracts and availability
export function loadContractsSummary() {
  return {
    authFactory: AuthFactoryData,
    voteFactory: VoteFactoryData,
    available: Boolean(AuthFactoryData && VoteFactoryData && authContract && voteContract),
  };
}

// Log connection status for both chains
export const logConnectionStatus = async () => {
  if (!authContract || !voteContract) {
    logger.warn("System", "Blockchain connection skipped: Artifacts or Config missing.");
    return;
  }

  try {
    const [authNetwork, voteNetwork] = await Promise.all([
      authContract.runner.provider.getNetwork(),
      voteContract.runner.provider.getNetwork(),
    ]);

    logger.info("System", `Connected to AUTH chain (ID: ${authNetwork.chainId})`);
    logger.info("System", `Connected to VOTE chain (ID: ${voteNetwork.chainId})`);
  } catch (error) {
    logger.error("System", "Blockchain connection check failed", error);
  }
};
