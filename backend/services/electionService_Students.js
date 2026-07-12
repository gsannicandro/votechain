import electionRepository from '../repositories/electionRepository';
import { ApiError } from '../lib/api-utils';
import { normalizeToISO, appendBlankCandidate} from '../utils/electionSerializers';

// Student election service
export const electionServiceStudents = {

    async getAvailableElections(email) {
        const rawElections = await electionRepository.findActiveElectionsForStudent(email);

        if (!rawElections || rawElections.length === 0) {
            return [];
        }

        // Map to frontend structure (ISO dates)
        return rawElections.map(election => ({
            id: election.id,
            title: election.title,
            description: election.description,
            start_date: normalizeToISO(election.start_date),
            end_date: normalizeToISO(election.end_date),
            status: election.status,
            auth_contract_address: election.auth_contract_address,
            vote_contract_address: election.vote_contract_address,
            has_registered: election.has_registered,
            registered_at: normalizeToISO(election.registered_at)
        }));
    },

    async getElectionDetails(email, electionId) {
        // Verify access
        const isWhitelisted = await electionRepository.isUserWhitelisted(email, electionId);
        if (!isWhitelisted) {
            throw new ApiError("ACCESS_DENIED: User not authorized for this election.", 403);
        }

        // Fetch election data
        const election = await electionRepository.getElectionById(electionId);
        if (!election) {
            throw new ApiError("NOT_FOUND: Election not found.", 404);
        }

        // Fetch user registration status
        const allActive = await electionRepository.findActiveElectionsForStudent(email);
        const myElectionStatus = allActive.find(e => e.id === electionId);

        if (!myElectionStatus) {
            if (election.status !== 'ACTIVE' && election.status !== 'COMPLETED') {
                throw new ApiError("ELECTION_ENDED: Election not active.", 403);
            }
        }

        // Candidates and blank vote handling
        let candidates = [];

        if (election.clear_metadata && election.clear_metadata.candidates) {
            candidates = election.clear_metadata.candidates.map(c => ({
                ...c,
                party_name: c.list || c.party || ''
            }));
        } else {
            candidates = await electionRepository.getCandidates(electionId);
        }

        const candidatesWithBlank = appendBlankCandidate(candidates);

        return {
            ...election,
            start_date: normalizeToISO(election.start_date),
            end_date: normalizeToISO(election.end_date),
            has_registered: myElectionStatus ? myElectionStatus.has_registered : false,
            candidates: candidatesWithBlank,
            vote_rules: election.clear_metadata?.voteRules || ""
        };
    }
};

export default electionServiceStudents;
