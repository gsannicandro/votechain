import { withAuth } from '../../../../lib/authMiddleware';
import electionServiceStudents from '../../../../services/electionService_Students';
import { handleApiError, ApiError } from '../../../../lib/api-utils';

// Student election detail API (GET /api/student/elections/[id])
async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, OPTIONS');
        throw new ApiError('Metodo non consentito', 405);
    }

    try {
        const { id } = req.query;
        const userEmail = req.user.sub || req.user.email;

        if (!id) throw new ApiError('ID elezione mancante', 400);
        if (!userEmail) throw new ApiError('Identità utente non valida.', 401);

        const electionDetails = await electionServiceStudents.getElectionDetails(userEmail, id);
        return res.status(200).json(electionDetails);

    } catch (error) {
        return handleApiError(res, error);
    }
}

export default withAuth(handler);
