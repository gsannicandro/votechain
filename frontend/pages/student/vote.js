import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Hooks & Components
import { useVotingBooth } from '../../hooks/useVotingBooth';
import AsyncState from '../../components/ui/AsyncState';
import ElectionInfoSidebar from '../../components/ui/ElectionInfoSidebar';
import { VotingArea, VoteSuccess } from '../../components/ui/VotingArea';
import StudentPageShell from '../../components/ui/StudentPageShell';

const SchermataVoto = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const { 
    loading, 
    error, 
    electionDetails, 
    voted, 
    txHash, 
    selectedOption, 
    setSelectedOption, 
    voterStatus, 
    castVote 
  } = useVotingBooth(id);

  const isPageLoading = !router.isReady || (!electionDetails && !error);

  if (isPageLoading) return (
    <AsyncState variant="loading" loadingMessage="Caricamento seggio..." className="min-h-screen bg-bgpage" />
  );

  if (!electionDetails && error) return (
    <AsyncState
      variant="error"
      className="min-h-screen bg-bgpage p-4 text-center"
      errorTitle="Errore Imprevisto"
      errorMessage={error}
      action={(
        <button
          onClick={() => router.push('/student/dashboard')}
          className="text-secondary font-bold hover:underline"
        >
          Torna alla Dashboard
        </button>
      )}
    />
  );

  return (
    <>
      <Head>
        <title>Esprimi Voto | VoteChain</title>
      </Head>

      <StudentPageShell sidebar={<ElectionInfoSidebar electionDetails={electionDetails} />}>

        {voted ? (
           <div className="p-8 lg:p-12 flex flex-col relative min-h-[500px]">
                <VoteSuccess txHash={txHash} />
             </div>
        ) : (
            <VotingArea 
                electionDetails={electionDetails}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
                voterStatus={voterStatus}
                loading={loading && voterStatus === 'voting'} 
                error={error}
                onVote={castVote}
            />
        )}
      </StudentPageShell>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </>
  );
};

export default SchermataVoto;