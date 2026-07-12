import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import electionService from '../services/electionService';
import { burnerWalletService } from '../services/burnerWallet';

export const useVotingBooth = (electionId) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [electionDetails, setElectionDetails] = useState(null);
  const [voted, setVoted] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [voterStatus, setVoterStatus] = useState('initializing');
  const [adminSignature, setAdminSignature] = useState(null);

  const initializeBooth = useCallback(async () => {
    if (!electionId) return;

    try {
        setLoading(true);
        setError('');

        const data = await electionService.getElectionDetails(electionId);
        
        if (!data.has_registered) {
            localStorage.removeItem(`voted_${electionId}`);
            localStorage.removeItem(`voucher_${electionId}`);
            router.replace(`/student/election_description?id=${electionId}`);
            return;
        }

        setElectionDetails({
            ...data,
            voteRules: data.vote_rules,
            start: new Date(data.start_date).toLocaleString('it-IT'),
            end: new Date(data.end_date).toLocaleString('it-IT'),
            rawStart: new Date(data.start_date),
            rawEnd: new Date(data.end_date)
        });

        const now = new Date();
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);

        if (now < start || now > end) {
            router.replace(`/student/election_description?id=${electionId}`);
            return;
        }

        localStorage.setItem(`entered_booth_${electionId}`, 'true');

        if (localStorage.getItem(`voted_${electionId}`)) {
            setVoted(true);
            setVoterStatus('completed');
            setTxHash('Voto già registrato in questa sessione.');
            setLoading(false);
            return;
        }

        const savedVoucher = localStorage.getItem(`voucher_${electionId}`);
        if (!savedVoucher) {
            router.replace(`/student/election_description?id=${electionId}`);
            return; 
        }
        const voucherData = JSON.parse(savedVoucher);

        setVoterStatus('authorizing');
        burnerWalletService.createOrGetWallet();

        const authData = await burnerWalletService.requestGasAndVotingRights(
            voucherData.voucher,
            voucherData.signature,
            electionId
        );

        setAdminSignature(authData.signature);
        setVoterStatus('ready');

    } catch (err) {
        if (err.status === 409) { 
             setVoted(true);
             setVoterStatus('completed');
             setTxHash('Il tuo voto risulta già registrato in modo sicuro sulla Blockchain.');
        } else {
             setError(err.message || "Errore inizializzazione seggio");
             setVoterStatus('error');
        }
    } finally {
        setLoading(false);
    }
  }, [electionId, router]);

  useEffect(() => {
    initializeBooth();
  }, [initializeBooth]);

  const castVote = async () => {
    if (!selectedOption) return;
    if (electionDetails.lockStatus?.authLocked || electionDetails.lockStatus?.voteLocked) {
      setError("L'elezione è attualmente bloccata e non è possibile votare.");
      return;
    }

    try {
      setLoading(true);
      setVoterStatus('voting');
      
      const savedVoucher = JSON.parse(localStorage.getItem(`voucher_${electionId}`));

      const receipt = await burnerWalletService.castVote(
        electionDetails.vote_contract_address,
        selectedOption.id,
        savedVoucher.voucher,
        adminSignature,
        process.env.NEXT_PUBLIC_VOTE_RPC_URL
      );

      setTxHash(receipt.hash);
      setVoted(true);
      setVoterStatus('completed');
      
      localStorage.setItem(`voted_${electionId}`, 'true');
      burnerWalletService.destroyWallet();

    } catch (err) {
      console.error(err);
      setError(err.message || "Errore durante l'invio del voto.");
      setVoterStatus('ready');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    electionDetails,
    voted,
    txHash,
    selectedOption,
    setSelectedOption,
    voterStatus,
    castVote
  };
};
