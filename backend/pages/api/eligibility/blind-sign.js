import { z } from 'zod';
import { blindSignatureService } from '../../../services/blindSignatureService';
import { rateLimit } from '../../../middleware/rateLimit';
import { withAuth } from '../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../lib/api-utils';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }); // 50 requests / 15 min

const schema = z.object({
  electionId: z.number().or(z.string()),
  blindedMessage: z.string().min(1, 'Blinded message is required'),
});

async function handler(req, res) {
  const limitReached = limiter(req, res);
  if (limitReached) return limitReached;

  if (req.method !== 'POST') {
     res.setHeader('Allow', 'POST, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message || 'Input non valido', 400);
    }
    const { electionId, blindedMessage } = parsed.data;

    // User is guaranteed by withAuth
    const userEmail = req.user.sub || req.user.email;
    if (!userEmail) throw new ApiError('User identification failed', 401);

    const signature = await blindSignatureService.processBlindSignatureRequest(userEmail, blindedMessage, electionId);

    return res.status(200).json({ blindSignature: signature });
  } catch (error) {
    return handleApiError(res, error);
  }
}

export default withAuth(handler);
