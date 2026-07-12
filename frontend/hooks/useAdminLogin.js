import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminAuthService } from '../services/adminAuth';

export const useAdminLogin = () => {
  const router = useRouter();
  const [nodeId, setNodeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query?.session === 'invalid') {
      adminAuthService.clearSession();
    }

    if (adminAuthService.isAuthenticated()) {
      router.replace('/admin/dashboard');
    }
  }, [router.isReady, router.query, router]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const payload = await adminAuthService.login(nodeId, password);
      adminAuthService.saveSession(payload.token, payload.admin);

      setStatus({ 
        type: 'success', 
        message: 'Accesso in corso...' 
      });
      setTimeout(() => router.push('/admin/dashboard'), 800);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Credenziali non valide' });
    } finally {
      setLoading(false);
    }
  };

  return {
    nodeId,
    setNodeId,
    password,
    setPassword,
    loading,
    status,
    handleLogin
  };
};
