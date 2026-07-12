import { withAuth } from '../../../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../../../lib/api-utils';
import { tallyService } from '../../../../../services/tallyService';

async function handler(req, res) {
  if (req.method !== 'GET') {
     res.setHeader('Allow', 'GET, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  const { id } = req.query;
  if (!id) throw new ApiError('ID elezione mancante', 400);

  try {
    const results = await tallyService.getElectionResults(id);
    return res.status(200).json(results);
  } catch (error) {
    return handleApiError(res, error);
  }
}

export default withAuth(handler);
