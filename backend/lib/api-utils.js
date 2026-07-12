import { z } from 'zod';

export class ApiError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

const KNOWN_ERRORS_MAP = {
    'Invalid or expired code': 401,
    'Email not authorized for voting': 403,
    'User is not eligible': 403,
    'Election contract not found': 404,
    'RegistrationAlreadyStarted': 400,
    'VotingAlreadyStarted': 400,
    'InvalidTimeWindow': 400,
    'RegistrationNotActive': 400,
    'UserAlreadyRegistered': 400,
    'ElectionLocked': 400,
    'VoucherAlreadyUsed': 400,
    'InvalidCandidate': 400,
    'InvalidSignature': 400,
    'nonce has already been used': 409,
    'execution reverted': 400,
};

export function handleApiError(res, error) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({
            message: 'Invalid Input.',
            errors: error.errors
        });
    }

    // Explicit API Errors
    if (error instanceof ApiError) {
        return res.status(error.status).json({ message: error.message });
    }

    // Attempt to extract meaningful message from various error types (Ethers, native, etc)
    const errorMessage = error?.reason || error?.shortMessage || error?.message || 'Unknown error';

    // Check known patterns in the extracted message
    for (const [pattern, status] of Object.entries(KNOWN_ERRORS_MAP)) {
        if (errorMessage.includes(pattern)) {
            return res.status(status).json({ message: pattern }); // Return clean message
        }
    }

    console.error('[API Error Detailed]:', {
        message: error?.message,
        reason: error?.reason,
        code: error?.code,
        stack: error?.stack
    });

    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
}
