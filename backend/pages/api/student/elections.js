import { withAuth } from '../../../lib/authMiddleware';
import electionServiceStudents from '../../../services/electionService_Students';
import { handleApiError, ApiError } from '../../../lib/api-utils';

// Student elections API
async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, OPTIONS');
        throw new ApiError('Metodo non consentito', 405);
    }

    try {
        const userEmail = req.user.sub || req.user.email;
        if (!userEmail) throw new ApiError('Identità utente non valida.', 401);

        const elections = await electionServiceStudents.getAvailableElections(userEmail);
        return res.status(200).json(elections);
    } catch (error) {
        return handleApiError(res, error);
    }
}

export default withAuth(handler);
