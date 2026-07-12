import tokenService from './tokenService';
import { handleCors } from './cors';
import { handleApiError, ApiError } from './api-utils';

export function withAuth(handler) {
    return async (req, res) => {
        if (handleCors(req, res)) {
            return;
        }

        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new ApiError('Authentication required. Missing or invalid Bearer token.', 401);
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                throw new ApiError('Token missing.', 401);
            }

            try {
                const decoded = tokenService.verifyToken(token);
                req.user = decoded;
            } catch (jwtError) {
                throw new ApiError('Invalid or expired token.', 401);
            }

            return await handler(req, res);

        } catch (error) {
            return handleApiError(res, error);
        }
    };
}
