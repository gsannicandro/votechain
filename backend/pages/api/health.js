import pool from '../../lib/db';
import { checkRpcNode, checkContract, checkWebService } from '../../utils/healthCheckUtils';
import { handleCors } from '../../lib/cors';
import { handleApiError, ApiError } from '../../lib/api-utils';

const PGADMIN_INTERNAL_URL = process.env.PGADMIN_URL || 'http://pgadmin-gui:80'; 

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, OPTIONS');
      return handleApiError(res, new ApiError('Metodo non consentito', 405));
  }

  const healthStatus = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    services: {
      database: { status: 'unknown' },
      pgadmin: { status: 'unknown' }, 
      blockchain_1: { status: 'unknown' },
      blockchain_2: { status: 'unknown' },
      auth_factory: { status: 'unknown' },
      vote_factory: { status: 'unknown' }
    }
  };

  let httpCode = 200;
  
  // RPC URLs
  const chain1Url = process.env.RPC_URL_1 || "http://blockchain-1:8545";
  const chain2Url = process.env.RPC_URL_2 || "http://blockchain-2:8546";

  try {
      const [dbResult, pgAdminResult, chain1Result, chain2Result, authContractResult, voteContractResult] = await Promise.all([
        pool.query('SELECT NOW()').then(() => ({ status: 'connected' })).catch((err) => ({ status: 'disconnected', error: err.message })),
        checkWebService(PGADMIN_INTERNAL_URL),
        checkRpcNode(chain1Url),
        checkRpcNode(chain2Url),
        checkContract(chain1Url, 'electionAuthFactory.json'),
        checkContract(chain2Url, 'electionVoteBoxFactory.json')
      ]);

      // POPULATE RESPONSE
      healthStatus.services.database = dbResult;
      healthStatus.services.pgadmin = pgAdminResult;
      healthStatus.services.blockchain_1 = chain1Result;
      healthStatus.services.blockchain_2 = chain2Result;
      healthStatus.services.auth_factory = authContractResult;
      healthStatus.services.vote_factory = voteContractResult;

      // Global Error Logic
      if (
        dbResult.status === 'disconnected' || 
        chain1Result.status === 'disconnected' || 
        chain2Result.status === 'disconnected'
      ) {
        healthStatus.status = 'critical_failure';
        httpCode = 503; 
      } else if (
        pgAdminResult.status === 'disconnected' ||
        authContractResult.status === 'disconnected' || 
        voteContractResult.status === 'disconnected'
      ) {
        healthStatus.status = 'degraded'; 
      }

      res.status(httpCode).json(healthStatus);
  } catch (error) {
    // If something catastrophic happens during the promise.all (unlikely due to catches inside but just in case)
    return handleApiError(res, error);
  }
}