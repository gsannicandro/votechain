import { z } from 'zod';
import { authorizationService } from '../../../services/authorizationService';
import { rateLimit } from '../../../middleware/rateLimit';
import { handleCors } from '../../../lib/cors';
import { handleApiError, ApiError } from '../../../lib/api-utils';

// Vote authorization API
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // Rate limit (strict)

const AuthorizeSchema = z.object({
  voucherSalt: z.string().min(1),
  unblindedSignature: z.string().min(1),
  walletAddress: z.string().min(1),
  electionId: z.number().or(z.string()),
});

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const limitReached = limiter(req, res);
  if (limitReached) return limitReached;

  if (req.method !== 'POST') {
     res.setHeader('Allow', 'POST, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  try {
    const parsed = AuthorizeSchema.safeParse(req.body);
    if (!parsed.success) {
       throw new ApiError(parsed.error.issues[0]?.message || 'Input non valido', 400);
    }
    const { voucherSalt, unblindedSignature, walletAddress, electionId } = parsed.data;

    const signature = await authorizationService.authorizeVote({
      voucherSalt,
      unblindedSignature,
      walletAddress,
      electionId
    });

    return res.status(200).json({
      message: 'Authorization successful',
      signature: signature
    });

  } catch (error) {
    return handleApiError(res, error);
  }
}
