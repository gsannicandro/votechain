import { useState, useEffect, useCallback } from 'react';
import electionService from '../services/electionService';

export const useStudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);
  const [error, setError] = useState('');

  const fetchElections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await electionService.getElections();
      
      const formattedElections = data.map(e => {
        if (!e.has_registered) {
            localStorage.removeItem(`voted_${e.id}`);
        }
        const isVotedLocal = typeof window !== 'undefined' ? localStorage.getItem(`voted_${e.id}`) : false;
        
        let userStatus = 'da_votare';
        if (e.has_registered) {
            userStatus = (isVotedLocal || (typeof window !== 'undefined' && localStorage.getItem(`entered_booth_${e.id}`))) ? 'votato' : 'registrato';
        } else if (isVotedLocal) {
            userStatus = 'votato';
        }

        const now = new Date();
        const start = new Date(e.start_date);
        const end = new Date(e.end_date);
        let electionStatus = e.status.toLowerCase();
        
        if (electionStatus === 'active') {
            if (now < start) electionStatus = 'upcoming';
            else if (now > end) electionStatus = 'completed';
        }

        return {
          id: e.id,
          title: e.title,
          description: e.description,
          startDateObj: start,
          endDateObj: end,
          startDate: start.toLocaleDateString('it-IT'),
          endDate: end.toLocaleDateString('it-IT'),
          status: electionStatus, // 'active', 'upcoming', 'completed', 'blocked'
          userStatus: userStatus, // 'da_votare', 'registrato', 'votato'
        };
      });

      setElections(formattedElections);
    } catch (err) {
      console.error(err);
      setError('Impossibile caricare le elezioni.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  return {
    loading,
    error,
    elections,
    refresh: fetchElections
  };
};
