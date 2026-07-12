import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import nookies from 'nookies';

// Hooks
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useSystemHealth } from '../../hooks/useSystemHealth';

// UI Components
import { DashboardLayout } from '../../components/ui/DashboardContainer';
import Button from '../../components/ui/Button'; 
import Card from '../../components/ui/Card';
import AsyncState from '../../components/ui/AsyncState';
import PageHeader from '../../components/ui/PageHeader';

// Refactored Components
import HealthStatusCard from '../../components/ui/HealthStatusCard';
import ElectionsTable from '../../components/ui/ElectionsTable';
import ElectionDetailsModal from '../../components/ui/ElectionDetailsModal';
import { fetchDashboardData } from '../../lib/api';

export default function Dashboard({ initialDashboard }) {
  const router = useRouter();
  const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // --- Logic via Custom Hooks ---
  const { 
    dashboard, 
    loading: dashboardLoading, 
    error: dashboardError, 
    rowLoading, 
    handleToggleLock, 
    handleLogout,
    updateLocalElectionStatus
  } = useAdminDashboard(initialDashboard);

  const { 
    health, 
    error: healthError 
  } = useSystemHealth(BACKEND_API_URL);

  // --- Local UI State ---
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (electionId) => {
    setSelectedElectionId(electionId);
    setIsModalOpen(true);
  };

  // --- Render ---
  return (
    <DashboardLayout>
      <div className="w-full p-8 overflow-y-auto">
        <Head>
          <title>VoteChain Admin | Dashboard</title>
        </Head>

        <PageHeader
          title="Gestione Elezioni"
          description="Monitoraggio nodi e controllo Smart Contracts"
          actions={(
            <>
            <Button 
              variant="primary" 
              className="px-6 py-2 h-10 text-sm whitespace-nowrap min-w-[160px] !shadow-none"
              onClick={() => router.push('/admin/create-election')}
            >
              + Nuova Elezione
            </Button>
            <Button 
              variant="secondary" 
              className="px-4 py-2 h-10 text-sm !shadow-none"
              onClick={handleLogout}
            >
              Esci
            </Button>
            </>
          )}
        />

        {/* 2. Loading / Error States */}
        {dashboardLoading && (
          <AsyncState variant="loading" loadingMessage="Caricamento dashboard..." />
        )}

        {dashboardError && !dashboardLoading && (
          <AsyncState variant="error" errorTitle="Errore Caricamento" errorMessage={dashboardError} />
        )}

        {/* 3. Main Content */}
        {!dashboardLoading && !dashboardError && dashboard && (
          <div className="space-y-6">
            
            {/* Health Monitor */}
            <HealthStatusCard health={health} error={healthError} />

            {/* Elections Table */}
            <Card title="Elezioni Attive">
              <ElectionsTable 
                elections={dashboard.elections}
                onMonitor={handleOpenModal}
                onToggleLock={handleToggleLock}
                loadingId={rowLoading}
              />
            </Card>

          </div>
        )}

        {/* 4. Details Modal */}
        <ElectionDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          electionId={selectedElectionId}
          onStatusChange={updateLocalElectionStatus}
        />

      </div>
    </DashboardLayout>
  );
}

// --- Server Side Props ---
export async function getServerSideProps(ctx) {
  const cookies = nookies.get(ctx);
  const token = cookies.votechain_admin_token;
  const baseUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000';

  if (!token) {
    return { redirect: { destination: '/admin', permanent: false } };
  }

  try {
    const data = await fetchDashboardData(token, {
      headers: { Authorization: `Bearer ${token}` },
      baseUrl,
    });
    return { props: { initialDashboard: data } };
  } catch (error) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
}