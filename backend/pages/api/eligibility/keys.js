import { getPublicComponents } from '../../../utils/rsaKeys';
import { handleCors } from '../../../lib/cors';
import { handleApiError, ApiError } from '../../../lib/api-utils';

export default function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return handleApiError(res, new ApiError('Metodo non consentito', 405));
  }

  try {
    const { N, E } = getPublicComponents();
    res.status(200).json({ N, E });
  } catch (error) {
    return handleApiError(res, error);
  }
}
