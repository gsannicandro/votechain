import crypto from 'crypto';
import { sendEmail } from '../lib/email';
import otpRepository from '../repositories/otpRepository';
import whitelistRepository from '../repositories/whitelistRepository';
import tokenService from '../lib/tokenService';
import { ApiError } from '../lib/api-utils';

export const authServiceStudents = {
    
    async requestOtp(email) {
        // Check whitelist
        const isWhitelisted = await whitelistRepository.isEmailWhitelisted(email);
        if (!isWhitelisted) {
            throw new ApiError('Email not authorized for voting.', 403);
        }

        // Generate 6-digit code (randomInt excludes max)
        const code = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP
        await otpRepository.saveOtp(email, code, expiresAt);

        // Send email
        await sendEmail(email, code);

        return { message: 'OTP code sent.' };
    },

    async verifyOtp(email, code) {
        // Validate and consume OTP (atomic)
        const otp = await otpRepository.validateAndConsumeOtp(email, code);

        if (!otp) {
            throw new ApiError('Invalid or expired code.', 401);
        }

        // Generate JWT
        const token = tokenService.generateToken({
            sub: email,
            scope: 'voter',
        });

        return {
            message: 'Verification successful.',
            token: token,
            expiresIn: tokenService.getDefaultExpiration()
        };
    }
};

export default authServiceStudents;
