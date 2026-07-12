import { withAuth } from '../../../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../../../lib/api-utils';
import electionDAO from '../../../../../repositories/electionDAO';
import { unlockRegistries } from '../../../../../utils/registries';

async function handler(req, res) {
  if (req.method !== 'POST') {
     res.setHeader('Allow', 'POST, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  const electionId = req.query.id;
  if (!electionId) throw new ApiError('ID elezione mancante', 400);

  try {
    const election = await electionDAO.findById(electionId);
    if (!election) throw new ApiError('Elezione non trovata', 404);

    await unlockRegistries({
      authAddress: election.auth_contract_address,
      voteAddress: election.vote_contract_address,
    });

    // Update election status in the database
    await electionDAO.updateElectionStatusById(electionId, 'ACTIVE');

    return res.status(200).json({ message: 'Lock rimosso su entrambe le chain.' });
  } catch (error) {
    return handleApiError(res, error);
  }
}

export default withAuth(handler);
