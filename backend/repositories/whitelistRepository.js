import pool from '../lib/db';
import logger from '../utils/logger';
import { ApiError } from '../lib/api-utils';

const CHECK_IS_WHITELISTED = 'SELECT 1 FROM whitelist WHERE email = $1 LIMIT 1';

const CHECK_ELIGIBILITY = `
    SELECT 1 
    FROM whitelist w
    JOIN elections e ON w.election_id = e.id
    WHERE w.email = $1
      AND w.election_id = $2
      AND w.has_registered = FALSE
      AND e.status = 'ACTIVE'
      AND e.start_date <= NOW()
      AND e.end_date >= NOW()
    LIMIT 1
`;

const DEBUG_ELIGIBILITY = `
    SELECT w.has_registered, e.status, e.start_date, e.end_date, NOW() as current_time
    FROM whitelist w
    LEFT JOIN elections e ON w.election_id = e.id
    WHERE w.email = $1 AND w.election_id = $2
`;

const MARK_REGISTERED = `
    UPDATE whitelist 
    SET has_registered = TRUE,
        registered_at = NOW(),
        registration_tx_id = $3,
        blinded_token_hash = $4,
        signed_voucher = $5
    WHERE email = $1 
      AND election_id = $2 
      AND has_registered = FALSE
    RETURNING id
`;

export default {

    async isEmailWhitelisted(email) {
        const { rowCount } = await pool.query(CHECK_IS_WHITELISTED, [email]);
        return rowCount > 0;
    },

    async checkEligibility(email, electionId) {
        const { rowCount } = await pool.query(CHECK_ELIGIBILITY, [email, electionId]);

        if (rowCount === 0) {
            // Optional: Keep debug log only in development or if explicitly requested
            if (process.env.NODE_ENV === 'development') {
                const { rows } = await pool.query(DEBUG_ELIGIBILITY, [email, electionId]);
                const debugInfo = rows[0] ? JSON.stringify(rows[0]) : "No record found";
                logger.warn("WhitelistRepository", `Ineligible attempt: ${email} for election ${electionId}`, debugInfo);
            }
            return false;
        }
        return true;
    },

    async markAsRegistered(email, electionId, txId, blindedTokenHash, signedVoucher) {
        const { rowCount } = await pool.query(MARK_REGISTERED, [email, electionId, txId, blindedTokenHash, signedVoucher]);

        if (rowCount === 0) {
            throw new ApiError('Registration failed: User not eligible, election inactive, or already registered.', 409);
        }
        return true;
    }
};
