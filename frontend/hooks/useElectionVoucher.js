import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import electionService from '../services/electionService';
import blindSignatureService from '../services/blindSignatureService';

export const useElectionVoucher = (electionId) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [electionDetails, setElectionDetails] = useState(null);
  const [voucher, setVoucher] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

  const fetchDetails = useCallback(async () => {
    if (!electionId) return;
    
    setLoading(true);
    try {
      const data = await electionService.getElectionDetails(electionId);
      
      const now = new Date();
      const endDate = new Date(data.end_date);
      const isEnded = now > endDate;

      if (!data.has_registered) {
           if (localStorage.getItem(`voted_${electionId}`)) localStorage.removeItem(`voted_${electionId}`);
           if (localStorage.getItem(`voucher_${electionId}`)) localStorage.removeItem(`voucher_${electionId}`);
      } else {
           if (localStorage.getItem(`voted_${electionId}`) && !isEnded) {
               router.replace(`/student/vote?id=${electionId}`);
               return;
           }
      }

      setElectionDetails({
          ...data,
          voteRules: data.vote_rules,
          start: new Date(data.start_date).toLocaleString('it-IT'),
          end: new Date(data.end_date).toLocaleString('it-IT'),
          rawStart: new Date(data.start_date),
          rawEnd: new Date(data.end_date),
          status: data.status
      });

      const savedVoucher = localStorage.getItem(`voucher_${electionId}`);
      if (savedVoucher) {
          const parsed = JSON.parse(savedVoucher);
          setVoucher(parsed.signature);
      }
    } catch (err) {
      setError(err.message || 'Errore caricamento dettagli');
    } finally {
      setLoading(false);
    }
  }, [electionId, router]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const requestVoucher = async () => {
    if (!electionId) return;

    try {
        setLoading(true);
        setError('');

        const keyRes = await fetch(`${API_URL}/api/eligibility/keys`);
        const { N, E } = await keyRes.json();
        if (!N || !E) throw new Error("Chiavi server non disponibili");

        const rawToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const { blinded, r } = blindSignatureService.blind(rawToken, { N, E });

        const token = localStorage.getItem('token');
        const signRes = await fetch(`${API_URL}/api/eligibility/blind-sign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ electionId, blindedMessage: blinded })
        });

        const signData = await signRes.json();
        if (!signRes.ok) throw new Error(signData.message || "Errore emissione firma");

        const signature = blindSignatureService.unblind(signData.blindSignature, r, { N, E });

        const voucherData = { voucher: rawToken, signature, electionId };
        localStorage.setItem(`voucher_${electionId}`, JSON.stringify(voucherData));
        setVoucher(signature);

    } catch (err) {
        console.error(err);
        setError(err.message || "Errore durante la richiesta della scheda");
    } finally {
        setLoading(false);
    }
  };

  return {
    loading,
    error,
    electionDetails,
    voucher,
    requestVoucher
  };
};
