import { withAuth } from '../../../lib/authMiddleware';
import { handleApiError, ApiError } from '../../../lib/api-utils';
import { loadContractsSummary } from '../../../utils/deployContracts';
import { checkRpcNode, checkContract } from '../../../utils/healthCheckUtils';
import { getElectionMetrics } from '../../../utils/registries';
import whitelistDAO from '../../../repositories/whitelistDAO';
import electionDAO from '../../../repositories/electionDAO';
import { normalizeToISO } from '../../../utils/electionSerializers';

async function handler(req, res) {
  if (req.method !== 'GET') {
     res.setHeader('Allow', 'GET, OPTIONS');
     throw new ApiError('Metodo non consentito', 405);
  }

  try {
    const deployments = loadContractsSummary();

    const [authNode, voteNode, authFactoryCheck, voteFactoryCheck, elections] = await Promise.all([
      checkRpcNode(process.env.RPC_URL_1),
      checkRpcNode(process.env.RPC_URL_2),
      checkContract(process.env.RPC_URL_1, 'electionAuthFactory.json'),
      checkContract(process.env.RPC_URL_2, 'electionVoteBoxFactory.json'),
      electionDAO.findLatest(10),
    ]);

    const [electionMetrics, whitelistTotals] = await Promise.all([
      Promise.all(
        elections.map((item) =>
          getElectionMetrics({
            authAddress: item.auth_contract_address,
            voteAddress: item.vote_contract_address,
          })
        )
      ),
      Promise.all(elections.map((item) => whitelistDAO.countByElection(item.id))),
    ]);

    const mockResponse = {
      node: {
        name: 'Admin Sys',
        address: '0x71C...9A21',
        status: 'VERIFIED',
        updatedAt: new Date().toISOString(),
      },
      stats: {
        totalElections: elections.length,
        activeElections: elections.filter((item) => item.status === 'ACTIVE').length,
        pendingDeploys: deployments.available ? 0 : 1,
      },
      elections: elections.map((item, index) => ({
        id: item.id,
        title: item.title,
        smartContract: item.vote_contract_address || '--',
        deadline: normalizeToISO(item.end_date),
        status: item.status,
        startDate: normalizeToISO(item.start_date),
        endDate: normalizeToISO(item.end_date),
        description: item.description,
        whitelistCount: whitelistTotals[index] || 0,
        registeredCount: electionMetrics[index]?.registered ?? null,
        voteCount: electionMetrics[index]?.votes ?? null,
        results: electionMetrics[index]?.results || null,
      })),
      services: [
        {
          name: 'Blockchain Auth',
          status: authNode.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED',
          message: authNode.error || authNode.version || authNode.url,
        },
        {
          name: 'Blockchain Vote',
          status: voteNode.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED',
          message: voteNode.error || voteNode.version || voteNode.url,
        },
        {
          name: 'PostgreSQL',
          status: 'CONNECTED',
          latencyMs: 34,
        },
        {
          name: 'Auth Factory',
          status: deployments.available
            ? authFactoryCheck.status === 'connected'
              ? 'CONNECTED'
              : 'DISCONNECTED'
            : 'SKIPPED',
          message:
            deployments.available && authFactoryCheck.address
              ? authFactoryCheck.address
              : deployments.authFactory?.address || authFactoryCheck.error || 'Deployment non eseguito',
        },
        {
          name: 'Vote Factory',
          status: deployments.available
            ? voteFactoryCheck.status === 'connected'
              ? 'CONNECTED'
              : 'DISCONNECTED'
            : 'SKIPPED',
          message:
            deployments.available && voteFactoryCheck.address
              ? voteFactoryCheck.address
              : deployments.voteFactory?.address || voteFactoryCheck.error || 'Deployment non eseguito',
        },
      ],
    };

    return res.status(200).json(mockResponse);
  } catch (error) {
    return handleApiError(res, error);
  }
}

export default withAuth(handler);
