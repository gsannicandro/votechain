import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';


export function computeCandidateMerkleTree(candidates = []) {
  if (!candidates || candidates.length === 0) {
      return { root: null, leaves: [], version: 'v1' };
  }

  const leaves = candidates.map((c) => {
      const val = c.id || `${c.name}|${c.list || c.party || ''}`;
      return keccak256(val);
  });

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  return {
    root,
    leaves: candidates.map((candidate) => ({
      label: candidate.name,
      party: candidate.list || candidate.party || null,
      id: candidate.id
    })),
    version: 'v1',
  };
}

export function serializeMerklePlaceholder(tree) {
  if (!tree) return null;
  return {
    root: tree.root,
    leafCount: tree.leaves.length,
    version: tree.version,
  };
}

