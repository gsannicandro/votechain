import pool from '../lib/db';
import { ApiError } from '../lib/api-utils';

const INSERT_ELECTION = `
  INSERT INTO elections (
    title,
    description,
    start_date,
    end_date,
    status,
    auth_contract_address,
    vote_contract_address,
    metadata_hash,
    clear_metadata
  )
  VALUES ($1, $2, to_timestamp($3) AT TIME ZONE 'UTC', to_timestamp($4) AT TIME ZONE 'UTC', $5, $6, $7, $8, $9)
  RETURNING *;
`;

const INSERT_CANDIDATE = `
  INSERT INTO candidates (election_id, name, party_name)
  VALUES ($1, $2, $3)
  RETURNING *;
`;

const SELECT_ELECTIONS = `
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.status,
    e.auth_contract_address,
    e.vote_contract_address,
    e.metadata_hash,
    e.clear_metadata,
    json_agg(
      json_build_object('name', c.name, 'party', c.party_name)
    ) FILTER (WHERE c.id IS NOT NULL) AS candidates
  FROM elections e
  LEFT JOIN candidates c ON c.election_id = e.id
  GROUP BY e.id
  ORDER BY e.created_at DESC
  LIMIT $1;
`;

const SELECT_ELECTION_BY_ID = `
  SELECT 
    e.id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.status,
    e.auth_contract_address,
    e.vote_contract_address,
    e.metadata_hash,
    e.clear_metadata,
    json_agg(
      json_build_object('name', c.name, 'party', c.party_name)
    ) FILTER (WHERE c.id IS NOT NULL) AS candidates
  FROM elections e
  LEFT JOIN candidates c ON c.election_id = e.id
  WHERE e.id = $1
  GROUP BY e.id;
`;

const UPDATE_ELECTION = `
  UPDATE elections
  SET
    title = $2,
    description = $3,
    start_date = to_timestamp($4),
    end_date = to_timestamp($5),
    clear_metadata = $6,
    metadata_hash = $7,
    updated_at = NOW()
  WHERE id = $1
  RETURNING *;
`;

const DELETE_CANDIDATES = 'DELETE FROM candidates WHERE election_id = $1';

const DELETE_ELECTION = 'DELETE FROM elections WHERE id = $1';

const UPDATE_CONTRACTS = `
  UPDATE elections
  SET auth_contract_address = $2, vote_contract_address = $3, merkle_root = $4
  WHERE id = $1
  RETURNING *;
`;

const UPDATE_STATUS_BY_REGISTRY = `
  UPDATE elections
  SET status = $2
  WHERE auth_contract_address = $1 OR vote_contract_address = $1
  RETURNING *;
`;

const UPDATE_STATUS_BY_ID = `
  UPDATE elections
  SET status = $2
  WHERE id = $1
  RETURNING *;
`;

export default {
  async createElection({
    title,
    description,
    voteRules,
    startDate,
    endDate,
    authAddress,
    voteAddress,
    metadataHash,
    candidates = [],
    whitelist = [],
    candidateMerkle = null,
    metadataDocument = null,
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const electionResult = await client.query(INSERT_ELECTION, [
        title,
        description || null,
        startDate,
        endDate,
        'ACTIVE',
        authAddress,
        voteAddress,
        metadataHash,
        JSON.stringify({ voteRules, candidates, whitelist, candidateMerkle, metadataDocument }),
      ]);

      const election = electionResult.rows[0];

      for (const candidate of candidates) {
        await client.query(INSERT_CANDIDATE, [
          election.id,
          candidate.name,
          candidate.list || null,
        ]);
      }

      await client.query('COMMIT');
      return election;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new ApiError('Failed to create election: ' + error.message, 500);
    } finally {
      client.release();
    }
  },

  async findLatest(limit = 10) {
    const { rows } = await pool.query(SELECT_ELECTIONS, [limit]);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(SELECT_ELECTION_BY_ID, [id]);
    return rows[0] || null;
  },

  async updateElection(id, {
    title,
    description,
    voteRules,
    startDate,
    endDate,
    candidates = [],
    whitelist = [],
    candidateMerkle = null,
    metadataDocument = null,
    metadataHash = null,
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updatedElection = await client.query(UPDATE_ELECTION, [
        id,
        title,
        description || null,
        startDate,
        endDate,
        JSON.stringify({ voteRules, candidates, whitelist, candidateMerkle, metadataDocument }),
        metadataHash,
      ]);

      if (updatedElection.rowCount === 0) {
          throw new ApiError('Election not found', 404);
      }

      await client.query(DELETE_CANDIDATES, [id]);

      for (const candidate of candidates) {
        await client.query(INSERT_CANDIDATE, [
          id,
          candidate.name,
          candidate.list || null,
        ]);
      }

      await client.query('COMMIT');
      return updatedElection.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update election: ' + error.message, 500);
    } finally {
      client.release();
    }
  },

  async deleteElection(id) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(DELETE_CANDIDATES, [id]);
      const { rowCount } = await client.query(DELETE_ELECTION, [id]);
      
      if (rowCount === 0) {
          throw new ApiError('Election not found', 404);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete election: ' + error.message, 500);
    } finally {
      client.release();
    }
  },

  async updateContractAddresses(id, authAddress, voteAddress, merkleRoot) {
    const { rows } = await pool.query(UPDATE_CONTRACTS, [id, authAddress, voteAddress, merkleRoot]);
    if (rows.length === 0) {
      throw new ApiError('Election not found', 404);
    }
    return rows[0];
  },

  async updateElectionStatusByRegistry(registryAddress, status) {
    const { rows } = await pool.query(UPDATE_STATUS_BY_REGISTRY, [registryAddress, status]);
    if (rows.length === 0) {
      throw new ApiError('Election not found', 404);
    }
    return rows[0];
  },

  async updateElectionStatusById(id, status) {
    const { rows } = await pool.query(UPDATE_STATUS_BY_ID, [id, status]);
    if (rows.length === 0) {
      throw new ApiError('Election not found', 404);
    }
    return rows[0];
  },
};
