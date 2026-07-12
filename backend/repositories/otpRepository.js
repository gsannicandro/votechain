import pool from '../lib/db';

const INSERT_OTP = 'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)';

const VALIDATE_AND_CONSUME_OTP = `
    UPDATE otp_codes
    SET is_used = TRUE
    WHERE email = $1
      AND code = $2
      AND is_used = FALSE
      AND expires_at > NOW()
    RETURNING id, email, code
`;

const FIND_VALID_OTP = `
    SELECT id 
    FROM otp_codes 
    WHERE email = $1 
      AND code = $2 
      AND is_used = FALSE 
      AND expires_at > NOW()
`;

const MARK_OTP_USED = 'UPDATE otp_codes SET is_used = TRUE WHERE id = $1';

export default {
    
    async saveOtp(email, code, expiresAt) {
        await pool.query(INSERT_OTP, [email, code, expiresAt]);
    },

    async findValidOtp(email, code) {
        const { rows } = await pool.query(FIND_VALID_OTP, [email, code]);
        return rows.length > 0 ? rows[0] : null;
    },

    async markOtpAsUsed(id) {
        await pool.query(MARK_OTP_USED, [id]);
    },

    async validateAndConsumeOtp(email, code) {
        const { rows } = await pool.query(VALIDATE_AND_CONSUME_OTP, [email, code]);
        return rows.length > 0 ? rows[0] : null;
    }
};
