import { z } from 'zod';
import authServiceStudents from '../../../services/authService_Students';
import { handleApiError, ApiError } from '../../../lib/api-utils';
import { handleCors } from '../../../lib/cors';

// Input validation schema
const RequestSchema = z.object({
    email: z.string().email(),
});

export default async function handler(req, res) {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return handleApiError(res, new ApiError('Metodo non consentito', 405));
    }

    try {
        const { email } = RequestSchema.parse(req.body);
        const result = await authServiceStudents.requestOtp(email);
        return res.status(200).json(result);
    } catch (error) {
        return handleApiError(res, error);
    }
}
