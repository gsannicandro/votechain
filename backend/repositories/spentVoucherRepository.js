import pool from '../lib/db';

const CHECK_IS_SPENT = 'SELECT 1 FROM spent_vouchers WHERE signature_hash = $1 LIMIT 1';
const GET_SPENT_VOUCHER = 'SELECT * FROM spent_vouchers WHERE signature_hash = $1';
const INSERT_SPENT_VOUCHER = `
    INSERT INTO spent_vouchers (signature_hash, election_id, wallet_address)
    VALUES ($1, $2, $3)
`;

export default {
    
    async isVoucherSpent(signatureHash) {
        const { rowCount } = await pool.query(CHECK_IS_SPENT, [signatureHash]);
        return rowCount > 0;
    },

    async getSpentVoucher(signatureHash) {
        const { rows } = await pool.query(GET_SPENT_VOUCHER, [signatureHash]);
        return rows.length > 0 ? rows[0] : null;
    },

    async addSpentVoucher(signatureHash, electionId, walletAddress) {
        await pool.query(INSERT_SPENT_VOUCHER, [signatureHash, electionId, walletAddress]);
    }
};
