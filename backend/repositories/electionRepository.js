import pool from '../lib/db';

const SELECT_ACTIVE_ELECTIONS = "SELECT id, title, description, start_date, end_date FROM elections WHERE status = 'ACTIVE'";
const SELECT_CONTRACTS = "SELECT auth_contract_address, vote_contract_address FROM elections WHERE id = $1";
const SELECT_ELECTION_BY_ID = "SELECT id, title, description, start_date, end_date, status, auth_contract_address, vote_contract_address, clear_metadata FROM elections WHERE id = $1";

const SELECT_AVAILABLE_FOR_USER = `
  SELECT e.id, e.title, e.description, e.start_date, e.end_date
  FROM elections e
  JOIN whitelist w ON e.id = w.election_id
  WHERE e.status = 'ACTIVE'
    AND w.email = $1
    AND w.has_registered = FALSE
`;

const SELECT_ACTIVE_FOR_STUDENT = `
  SELECT
      e.id,
      e.title,
      e.description,
      e.start_date,
      e.end_date,
      e.status,
      e.auth_contract_address,
      e.vote_contract_address,
      w.has_registered,
      w.registered_at
  FROM elections e
  JOIN whitelist w ON e.id = w.election_id
  WHERE e.status IN ('ACTIVE', 'COMPLETED')
    AND w.email = $1
  ORDER BY e.end_date DESC
`;

const SELECT_IS_WHITELISTED = "SELECT id FROM whitelist WHERE email = $1 AND election_id = $2";
const SELECT_MERKLE_PROOF = "SELECT merkle_proof FROM whitelist WHERE email = $1 AND election_id = $2";
const SELECT_CANDIDATES = "SELECT id, name, party_name FROM candidates WHERE election_id = $1";

export default {
 
  async getActiveElections(client) {
    const queryRunner = client || pool;
    const { rows } = await queryRunner.query(SELECT_ACTIVE_ELECTIONS);
    return rows;
  },

  async getElectionContracts(electionId) {
    const { rows } = await pool.query(SELECT_CONTRACTS, [electionId]);
    return rows.length > 0 ? rows[0] : null;
  },

  async getElectionById(electionId) {
    const { rows } = await pool.query(SELECT_ELECTION_BY_ID, [electionId]);
    return rows.length > 0 ? rows[0] : null;
  },

  async getAvailableElectionsForUser(email) {
    const { rows } = await pool.query(SELECT_AVAILABLE_FOR_USER, [email]);
    return rows;
  },

  async findActiveElectionsForStudent(email) {
    const { rows } = await pool.query(SELECT_ACTIVE_FOR_STUDENT, [email]);
    return rows;
  },

  async isUserWhitelisted(email, electionId) {
    const { rows } = await pool.query(SELECT_IS_WHITELISTED, [email, electionId]);
    return rows.length > 0;
  },

  async getMerkleProof(email, electionId) {
    const { rows } = await pool.query(SELECT_MERKLE_PROOF, [email, electionId]);
    return rows.length > 0 ? rows[0].merkle_proof : [];
  },

  async getCandidates(electionId) {
    const { rows } = await pool.query(SELECT_CANDIDATES, [electionId]);
    return rows;
  }
};
