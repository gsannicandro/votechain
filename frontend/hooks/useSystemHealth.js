import { useState, useEffect } from 'react';

export const useSystemHealth = (backendUrl) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHealth(data);
        setError(null);
      } catch (e) {
        console.error('Failed to fetch health:', e);
        setHealth(null);
        setError(e.message || 'Errore connessione');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const id = setInterval(fetchHealth, 5000);
    return () => clearInterval(id);
  }, [backendUrl]);

  return { health, loading, error };
};
