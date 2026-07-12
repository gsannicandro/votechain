import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Hooks & Components
import { useElectionVoucher } from '../../hooks/useElectionVoucher';
import Button from '../../components/ui/Button';
import AsyncState from '../../components/ui/AsyncState';
import ElectionInfoSidebar from '../../components/ui/ElectionInfoSidebar';
import VoucherActionArea from '../../components/ui/VoucherActionArea';
import StudentPageShell from '../../components/ui/StudentPageShell';

const RichiestaScheda = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const { 
    loading, 
    error, 
    electionDetails, 
    voucher, 
    requestVoucher 
  } = useElectionVoucher(id);

  const isPageLoading = !router.isReady || (!electionDetails && !error);

  if (isPageLoading) return (
    <AsyncState variant="loading" loadingMessage="Caricamento elezione..." className="min-h-screen bg-bgpage" />
  );
  
  if (!electionDetails) return (
    <AsyncState
      variant="error"
      className="min-h-screen bg-bgpage p-4"
      errorTitle="Errore"
      errorMessage={error || 'Elezione non trovata o ID mancante.'}
      action={(
        <Button className="mt-4 max-w-xs" variant="secondary" onClick={() => router.push('/student/dashboard')}>
          Torna alla Dashboard
        </Button>
      )}
    />
  );

  return (
    <>
      <Head>
        <title>{electionDetails.title} | VoteChain</title>
      </Head>

      <StudentPageShell sidebar={<ElectionInfoSidebar electionDetails={electionDetails} />}>

        <VoucherActionArea 
          electionDetails={electionDetails} 
          voucher={voucher} 
          loading={loading} 
          error={error} 
          onRequestVoucher={requestVoucher} 
        />
      </StudentPageShell>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </>
  );
};

export default RichiestaScheda;