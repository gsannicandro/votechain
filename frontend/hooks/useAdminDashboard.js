import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { fetchDashboardData, lockElection, unlockElection } from '../lib/api';
import { adminAuthService } from '../services/adminAuth';

export const useAdminDashboard = (initialDashboard) => {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(!initialDashboard);
  const [error, setError] = useState(null);
  const [rowLoading, setRowLoading] = useState(null);
  const [hasFetched, setHasFetched] = useState(Boolean(initialDashboard));

  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return;
    
    const token = localStorage.getItem('votechain_admin_token');
    if (!token) {
      router.replace('/admin');
      return;
    }

    const profile = localStorage.getItem('votechain_admin_profile');
    setAdmin(profile ? JSON.parse(profile) : {});

    if (!initialDashboard && !hasFetched) {
      setHasFetched(true);
      const loadData = async () => {
        try {
          const data = await fetchDashboardData(token);
          setDashboard(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [router.isReady, initialDashboard, hasFetched, router]);

  const handleToggleLock = async (electionId, currentStatus) => {
    setRowLoading(electionId);
    try {
      const token = localStorage.getItem('votechain_admin_token');
      if (!token) throw new Error('Token mancante');
      
      if (currentStatus === 'BLOCKED') {
        await unlockElection(token, electionId);
      } else {
        await lockElection(token, electionId);
      }

      setDashboard((prev) => prev ? {
        ...prev,
        elections: prev.elections.map((e) =>
          e.id === electionId ? { ...e, status: currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED' } : e
        ),
      } : prev);
    } catch (err) {
      console.error('Toggle lock error:', err);
      alert(err.message || "Errore durante l'operazione");
    } finally {
      setRowLoading(null);
    }
  };

  const handleLogout = () => {
    adminAuthService.clearSession();
    router.push('/admin');
  };

  const updateLocalElectionStatus = useCallback((electionId, newStatus) => {
    setDashboard((prev) => prev ? {
        ...prev,
        elections: prev.elections.map((e) =>
          e.id === electionId ? { ...e, status: newStatus } : e
        ),
      } : prev);
  }, []);

  return {
    admin,
    dashboard,
    loading,
    error,
    rowLoading,
    handleToggleLock,
    handleLogout,
    updateLocalElectionStatus
  };
};
