import { withAuth } from '../../../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../../../lib/api-utils';
import electionDAO from '../../../../../repositories/electionDAO';
import { emergencyLockRegistries } from '../../../../../utils/registries';

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

    // Call blockchain function to lock contracts
    await emergencyLockRegistries({
      authAddress: election.auth_contract_address,
      voteAddress: election.vote_contract_address,
    });

    // Update DB status
    await electionDAO.updateElectionStatusById(electionId, 'BLOCKED');

    return res.status(200).json({ message: 'Election locked successfully.' });
  } catch (error) {
    return handleApiError(res, error);
  }
}

export default withAuth(handler);
