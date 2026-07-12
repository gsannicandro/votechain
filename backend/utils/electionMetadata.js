import { ethers } from 'ethers';

function toSafeString(value) {
  return value == null ? '' : String(value).trim();
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function buildElectionMetadataDocument({
  voteRules,
  startDate,
  endDate,
  candidates = [],
}) {
  return {
    version: 1,
    schedule: {
      startDate: Number(startDate),
      endDate: Number(endDate),
    },
    voteRules: toSafeString(voteRules),
    candidates: candidates.map(c => ({
        id: c.id ? toSafeString(c.id) : null,
        name: toSafeString(c.name),
        list: toSafeString(c.list || c.party),
    })),
  };
}

export function canonicalizeMetadataDocument(doc) {
  return JSON.stringify(sortKeys(doc));
}

export function hashElectionMetadata(doc) {
  const canonical = canonicalizeMetadataDocument(doc);
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}
