import pool from '../lib/db';

const SELECT_ADMIN_BY_USERNAME = `
  SELECT id, username, password_hash
  FROM administrators
  WHERE username = $1
`;

export default {
  async findByUsername(username) {
    const { rows } = await pool.query(SELECT_ADMIN_BY_USERNAME, [username]);
    return rows[0];
  },
};
