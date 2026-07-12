import { z } from 'zod';
import authServiceStudents from '../../../services/authService_Students';
import { handleApiError, ApiError } from '../../../lib/api-utils';
import { handleCors } from '../../../lib/cors';

// Validation schema: valid email and 6-char code
const VerifySchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
});

export default async function handler(req, res) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return handleApiError(res, new ApiError('Metodo non consentito', 405));
    }

    try {
        const { email, code } = VerifySchema.parse(req.body);
        const result = await authServiceStudents.verifyOtp(email, code);
        return res.status(200).json(result);
    } catch (error) {
        return handleApiError(res, error);
    }
}
