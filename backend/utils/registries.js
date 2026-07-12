import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import logger from './logger';

// Registry helpers and config
const SERVER_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const AUTH_RPC_URL = process.env.RPC_URL_1;
const VOTE_RPC_URL = process.env.RPC_URL_2;

const ARTIFACTS_DIR = path.join(process.cwd(), 'constants');
const HARDHAT_ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'contracts');

// Load artifact JSON from known locations
function loadArtifact(name, fallbackPath) {
  const pathsToCheck = [
    path.join(ARTIFACTS_DIR, `${name}.json`),
    fallbackPath,
  ].filter(Boolean);

  for (const filePath of pathsToCheck) {
    if (filePath && fs.existsSync(filePath)) {
      try {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
          logger.warn('Registries', `Failed to parse artifact at ${filePath}`, e);
      }
    }
  }
  return null;
}

const authRegistryArtifact = loadArtifact(
  'authRegistry',
  path.join(HARDHAT_ARTIFACTS_DIR, 'authRegistry.sol', 'authRegistry.json')
);
const voteRegistryArtifact = loadArtifact(
  'voteBoxRegistry',
  path.join(HARDHAT_ARTIFACTS_DIR, 'voteBoxRegistry.sol', 'voteBoxRegistry.json')
);

// Instantiate registry contract by address and type
function getRegistryContract(address, type) {
  if (!address) {
    throw new Error(`Address for ${type} registry is missing.`);
  }

  const artifact = type === 'auth' ? authRegistryArtifact : voteRegistryArtifact;
  if (!artifact) {
    throw new Error(`Artifact for ${type}Registry not found.`);
  }

  const providerUrl = type === 'auth' ? AUTH_RPC_URL : VOTE_RPC_URL;
  if (!providerUrl) {
      throw new Error(`RPC URL for ${type} is not configured.`);
  }

  const provider = new ethers.JsonRpcProvider(providerUrl);
  
  if (!SERVER_PRIVATE_KEY) {
      throw new Error("ADMIN_PRIVATE_KEY is missing.");
  }

  const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY, provider);

  return new ethers.Contract(address, artifact.abi, wallet);
}

// Trigger emergency lock on both registries
export async function emergencyLockRegistries({ authAddress, voteAddress }) {
  const authRegistry = getRegistryContract(authAddress, 'auth');
  const voteRegistry = getRegistryContract(voteAddress, 'vote');

  const txAuth = await authRegistry.emergencyLock();
  const txVote = await voteRegistry.emergencyLock();

  await Promise.all([txAuth.wait(), txVote.wait()]);
  logger.info('Registries', `Emergency lock activated for Auth: ${authAddress} and Vote: ${voteAddress}`);
}

// Unlock both registries
export async function unlockRegistries({ authAddress, voteAddress }) {
  const authRegistry = getRegistryContract(authAddress, 'auth');
  const voteRegistry = getRegistryContract(voteAddress, 'vote');

  const txAuth = await authRegistry.unlock();
  const txVote = await voteRegistry.unlock();

  await Promise.all([txAuth.wait(), txVote.wait()]);
  logger.info('Registries', `Registries unlocked for Auth: ${authAddress} and Vote: ${voteAddress}`);
}

// Get lock status for both registries
export async function getRegistriesLockStatus({ authAddress, voteAddress }) {
  try {
    const authRegistry = getRegistryContract(authAddress, 'auth');
    const voteRegistry = getRegistryContract(voteAddress, 'vote');

    const [authLocked, voteLocked] = await Promise.all([
      authRegistry.isLocked(),
      voteRegistry.isLocked(),
    ]);

    return { authLocked, voteLocked };
  } catch (error) {
    logger.error('Registries', 'Failed to read registry lock status', error);
    return { authLocked: null, voteLocked: null, error: error.message };
  }
}

// Gather election metrics from registries
export async function getElectionMetrics({ authAddress, voteAddress }) {
  try {
    const authRegistry = getRegistryContract(authAddress, 'auth');
    const voteRegistry = getRegistryContract(voteAddress, 'vote');

    const [totalRegistered, voteLogs] = await Promise.all([
      authRegistry.totalRegisteredUsers().catch(() => null),
      voteRegistry
        .queryFilter(voteRegistry.filters.VoteCast(), 0, 'latest')
        .catch(() => []),
    ]);

    const tallies = {};
    voteLogs.forEach((log) => {
      if (!log?.args) return;
      const candidateId = (log.args.candidateId || log.args[0] || '').toLowerCase();
      if (!candidateId) return;
      tallies[candidateId] = (tallies[candidateId] || 0) + 1;
    });

    return {
      registered: totalRegistered ? Number(totalRegistered) : 0,
      votes: voteLogs.length,
      results: tallies,
    };
  } catch (error) {
    logger.error('Registries', 'Failed to fetch election metrics', error);
    return { registered: null, votes: null, results: null };
  }
}
