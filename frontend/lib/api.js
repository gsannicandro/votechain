const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SERVER_API_URL = process.env.SERVER_API_URL || API_URL;

// Resolve the correct base URL for client or server execution.
const getBaseUrl = (options = {}) => {
  if (options.baseUrl) return options.baseUrl;
  if (typeof window === 'undefined') return SERVER_API_URL;
  return API_URL;
};

// Generic API request helper.
async function apiRequest(endpoint, options = {}) {
  const { token, body, method = 'GET', ...customConfig } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customConfig.headers,
  };

  const config = {
    method,
    headers,
    ...customConfig,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const baseUrl = getBaseUrl(options);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${baseUrl}${cleanEndpoint}`, config);

  let payload = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      payload = await response.json();
  }

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || 'Errore nella richiesta API';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchDashboardData(token, opts = {}) {
  return apiRequest('/api/admin/dashboard', {
    token,
    ...opts
  });
}

export async function createElection(token, payload) {
  if (!token) throw new Error('Token mancante per creazione elezione');
  return apiRequest('/api/admin/elections', {
    method: 'POST',
    token,
    body: payload
  });
}

export async function fetchElectionDetails(token, electionId) {
  if (!token) throw new Error('Token mancante');
  return apiRequest(`/api/admin/elections/${electionId}`, {
    method: 'GET',
    token
  });
}

export async function updateElection(token, electionId, payload) {
  if (!token) throw new Error('Token mancante');
  return apiRequest(`/api/admin/elections/${electionId}`, {
    method: 'PUT',
    token,
    body: payload
  });
}

export async function lockElection(token, electionId) {
  if (!token) throw new Error('Token mancante');
  return apiRequest(`/api/admin/elections/${electionId}/lock`, {
    method: 'POST',
    token
  });
}

export async function unlockElection(token, electionId) {
  if (!token) throw new Error('Token mancante');
  return apiRequest(`/api/admin/elections/${electionId}/unlock`, {
    method: 'POST',
    token
  });
}

export default {
  get: (url, opts) => apiRequest(url, { ...opts, method: 'GET' }),
  post: (url, body, opts) => apiRequest(url, { ...opts, method: 'POST', body }),
  put: (url, body, opts) => apiRequest(url, { ...opts, method: 'PUT', body }),
  delete: (url, opts) => apiRequest(url, { ...opts, method: 'DELETE' }),
};
