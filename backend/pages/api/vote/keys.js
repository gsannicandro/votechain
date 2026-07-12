import { blindSignatureService } from '../../../services/blindSignatureService';
import { handleCors } from '../../../lib/cors';
import { handleApiError, ApiError } from '../../../lib/api-utils';

export default function handler(req, res) {
    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, OPTIONS');
        return handleApiError(res, new ApiError('Metodo non consentito', 405));
    }

    try {
        // Expose Public Key (N, E) for client-side blinding
        const publicKey = blindSignatureService.getPublicKey();
        return res.status(200).json(publicKey);
    } catch (error) {
        return handleApiError(res, error);
    }
}
