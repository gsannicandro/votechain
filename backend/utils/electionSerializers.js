import { ethers } from 'ethers';

export const BLANK_CANDIDATE_ID = '0x00000000000000000000000000000000';
const BLANK_CANDIDATE = {
  name: 'Scheda Bianca',
  list: '',
  id: BLANK_CANDIDATE_ID,
};

export function buildCandidateMetadata(list) {
  return list.map((candidate) => {
    const label = `${candidate.name.trim()}|${candidate.list?.trim() || ''}`;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(label));
    return {
      ...candidate,
      id: ethers.hexlify(ethers.dataSlice(hash, 0, 16)),
    };
  });
}

export function appendBlankCandidate(candidates = []) {
  if (candidates.some((candidate) => candidate.id === BLANK_CANDIDATE_ID)) {
    return candidates;
  }
  return [...candidates, { ...BLANK_CANDIDATE }];
}

// Converts a date input (string or Date) to Unix timestamp in seconds.
export function toUnixSeconds(value) {
    let dateStr = value;
    if (typeof value === 'string' && !value.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(value)) {
        dateStr = value + 'Z';
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) throw new Error('Data non valida');
    return Math.floor(date.getTime() / 1000);
}

// Normalizes a date input to an ISO string, returning null if invalid.
export function normalizeToISO(value) {
    if (!value) return null;
    try {
        if (value instanceof Date) return value.toISOString();
        const s = String(value);
        if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d.toISOString();
        }
        const t = s.replace(' ', 'T');
        const d2 = new Date(t + 'Z');
        if (!isNaN(d2.getTime())) return d2.toISOString();
        const d3 = new Date(s);
        return isNaN(d3.getTime()) ? null : d3.toISOString();
    } catch (e) {
        return null;
    }
}

// Serializes election data (with optional metrics and whitelist) for API response.
export function serializeElection(election, lockStatus = null, metrics = null, whitelist = []) {
    const clearMetadata = election.clear_metadata || {};
    const metadataDocument = clearMetadata.metadataDocument || null;
    const normalizedCandidates =
        metadataDocument?.candidates || clearMetadata.candidates || election.candidates || [];
    const results = metrics?.results || {};
    const candidatesWithVotes = normalizedCandidates.map((candidate) => {
        const candidateId = typeof candidate.id === 'string' ? candidate.id.toLowerCase() : null;
        const canonicalList = candidate.list ?? candidate.party ?? '';
        return {
            ...candidate,
            list: canonicalList,
            party: (candidate.party ?? canonicalList) || null,
            votes: candidateId && results ? results[candidateId] || 0 : 0,
        };
    });

    return {
        id: election.id,
        title: election.title,
        description: election.description,
        voteRules: clearMetadata.voteRules || metadataDocument?.voteRules || null,
        startDate: normalizeToISO(election.start_date),
        endDate: normalizeToISO(election.end_date),
        status: election.status,
        authRegistry: election.auth_contract_address,
        voteRegistry: election.vote_contract_address,
        candidates: candidatesWithVotes,
        lockStatus,
        whitelist,
        metrics,
        results,
        candidateMerkle: clearMetadata.candidateMerkle || null,
        metadataDocument,
        metadataHash: election.metadata_hash,
    };
}
