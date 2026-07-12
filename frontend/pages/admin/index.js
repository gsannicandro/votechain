import Head from 'next/head';
import { DashboardLayout } from '../../components/ui/DashboardContainer';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import StatusMessage from '../../components/ui/StatusMessage';
import { LockClosedIcon, ArrowRightIcon, UserIcon } from '../../components/ui/Icons';
import Input from '../../components/ui/Input';
import { useAdminLogin } from '../../hooks/useAdminLogin';

export default function AdminLogin() {
  const { 
    nodeId, setNodeId, 
    password, setPassword, 
    loading, status, 
    handleLogin 
  } = useAdminLogin();

  return (
    <DashboardLayout>
      <Head>
        <title>VoteChain - Admin Access</title>
      </Head>

      <Sidebar 
        title="Pannello di Controllo"
        description="Accesso amministratori. Gestione del registro elettorale e monitoraggio elezioni."
      />
      
      <div className="flex-1 p-8 md:p-16 bg-white flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-bold text-primary mb-2">Autenticazione Amministratore</h3>
            <p className="text-slate-500 text-sm">Inserisci le credenziali.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Username"
              type="text"
              placeholder="admin"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              required
              variant="admin"
              className="space-y-1.5"
              icon={<UserIcon className="w-5 h-5" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="admin"
              className="space-y-1.5"
              icon={<LockClosedIcon className="w-5 h-5" />}
            />

            {status.message && (
              <div className="pt-2 animate-in fade-in duration-300">
                <StatusMessage 
                  type={status.type} 
                  title={status.type === 'error' ? 'Accesso Negato' : 'Successo'} 
                  message={status.message} 
                />
              </div>
            )}

            <div className="pt-4">
              <Button 
                type="submit" 
                isLoading={loading} 
                variant="primary"
                className="bg-primary hover:bg-slate-800 w-full"
              >
                <span>Accedi al Pannello</span>
                <ArrowRightIcon className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
