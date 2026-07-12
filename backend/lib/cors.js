const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function handleCors(req, res) {
  const origin = req.headers.origin;
  
  // Only allow origins defined in env
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // Use env variables directly; fallback to empty if tailored control is desired via env only
  res.setHeader('Access-Control-Allow-Methods', process.env.CORS_METHODS || 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', process.env.CORS_HEADERS || 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', process.env.CORS_CREDENTIALS || 'false');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
