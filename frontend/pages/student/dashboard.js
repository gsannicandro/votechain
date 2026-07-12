import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import Sidebar from '../../components/ui/Sidebar';
import IconButton from '../../components/ui/IconButton';
import ElectionCard from '../../components/ui/ElectionCard';
import AsyncState from '../../components/ui/AsyncState';
import PageHeader from '../../components/ui/PageHeader';
import StudentPageShell from '../../components/ui/StudentPageShell';
import { getStudentElectionBadges } from '../../utils/studentElectionBadges';
import { ArrowPathIcon, InboxIcon, DocumentTextIcon } from '../../components/ui/Icons';

const DashboardStudente = () => {
  const router = useRouter();
  const { loading, error, elections, refresh } = useStudentDashboard();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/student');
  };

  return (
    <>
      <Head>
        <title>Dashboard Studente | VoteChain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <StudentPageShell
        sidebar={(
          <Sidebar 
            title="Le tue consultazioni" 
            description="In questa sezione puoi monitorare le votazioni attive del tuo Ateneo."
            variant="student"
          >
          <div className="mt-auto pt-10 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors group"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 mr-3 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </div>
              Esci dalla sessione
            </button>
          </div>
          </Sidebar>
        )}
      >

        <div className="p-8 md:p-12 flex flex-col min-h-0">
          <PageHeader
            title="Elezioni Disponibili"
            description="Seleziona una card per approfondire o votare."
            className="mb-10 shrink-0"
            actions={(
            <IconButton onClick={refresh} isLoading={loading}>
              <ArrowPathIcon className="w-5 h-5" />
            </IconButton>
            )}
          />

          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {loading && elections.length === 0 ? (
              <AsyncState variant="loading" loadingMessage="Caricamento elezioni..." className="h-40" />
            ) : error ? (
              <AsyncState variant="error" errorMessage={error} />
            ) : elections.length === 0 ? (
              <AsyncState variant="empty" emptyMessage="Nessuna elezione attiva al momento." className="h-40" />
            ) : (
                elections.map((el) => (
                  <Link href={`/student/election_description?id=${el.id}`} key={el.id} legacyBehavior>
                    <a className="block group">
                      <ElectionCard 
                        title={el.title}
                        description={el.description}
                        startDate={el.startDate}
                        endDate={el.endDate}
                        isActive={el.status === 'active'}
                        iconColor="text-secondary"
                        // Usa icone standard importate
                        mainIcon={el.status === 'active' ? <DocumentTextIcon className="w-full h-full" /> : <InboxIcon className="w-full h-full" />}
                        badges={getStudentElectionBadges(el)}
                      />
                    </a>
                  </Link>
                ))
            )}
          </div>
      </StudentPageShell>

      <style jsx global>{`
        body { background-color: #F8FAFC; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </>
  );
};

export default DashboardStudente;