import pool from '../lib/db';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { ApiError } from '../lib/api-utils';

const INSERT_WHITELIST = `
  INSERT INTO whitelist (election_id, email)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

const DELETE_WHITELIST = 'DELETE FROM whitelist WHERE election_id = $1';

const COUNT_BY_ELECTION = 'SELECT COUNT(*)::int AS count FROM whitelist WHERE election_id = $1';

const SELECT_BY_ELECTION = 'SELECT email FROM whitelist WHERE election_id = $1 ORDER BY email ASC';

const UPDATE_MERKLE_PROOF = `
  UPDATE whitelist
  SET merkle_proof = $1
  WHERE election_id = $2 AND email = $3
`;

export default {
  async bulkInsert(electionId, identifiers = []) {
    if (!identifiers?.length) return;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      for (const identifier of identifiers) {
        await client.query(INSERT_WHITELIST, [electionId, identifier]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new ApiError('Bulk insert failed: ' + error.message, 500);
    } finally {
      client.release();
    }
  },

  async replaceEntries(electionId, identifiers = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(DELETE_WHITELIST, [electionId]);
      
      if (identifiers && identifiers.length > 0) {
        for (const identifier of identifiers) {
          await client.query(INSERT_WHITELIST, [electionId, identifier]);
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new ApiError('Replace entries failed: ' + error.message, 500);
    } finally {
      client.release();
    }
  },

  async countByElection(electionId) {
    const { rows } = await pool.query(COUNT_BY_ELECTION, [electionId]);
    return rows[0] ? Number(rows[0].count) : 0;
  },

  async listByElection(electionId) {
    const { rows } = await pool.query(SELECT_BY_ELECTION, [electionId]);
    return rows.map((row) => row.email);
  },

  async generateAndStoreMerkleProofs(electionId) {
    const emails = await this.listByElection(electionId);
    if (emails.length === 0) {
       throw new ApiError('Whitelist is empty, cannot generate Merkle tree.', 400);
    }

    // Generate leaves: double keccak256 hash of each email
    const leaves = emails.map(email => keccak256(keccak256(Buffer.from(email, 'utf8'))));

    // Create Merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();

    // Generate and store proof for each email
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < emails.length; i++) {
        const proof = tree.getHexProof(leaves[i]);
        await client.query(UPDATE_MERKLE_PROOF, [JSON.stringify(proof), electionId, emails[i]]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new ApiError('Merkle proof generation failed: ' + error.message, 500);
    } finally {
      client.release();
    }

    return root;
  },
};
