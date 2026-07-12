import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchElectionDetails, lockElection, unlockElection } from '../../lib/api';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import StatusMessage from './StatusMessage';
import { 
  SpinnerIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon 
} from './Icons';

function ClientDate({ iso }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!iso) return;
    try {
      setText(new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }));
    } catch { setText(iso); }
  }, [iso]);
  return <>{text}</>;
}

const ElectionDetailsModal = ({ isOpen, onClose, electionId, onStatusChange }) => {
  const router = useRouter();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && electionId) {
      setLoading(true);
      setError(null);
      setDetails(null);
      const token = localStorage.getItem('votechain_admin_token');
      
      fetchElectionDetails(token, electionId)
        .then(setDetails)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, electionId]);

  const canEditElection = details ? (new Date(details.startDate).getTime() > Date.now()) : false;

  const handleLockAction = async (isLocking) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('votechain_admin_token');
      if (isLocking) await lockElection(token, electionId);
      else await unlockElection(token, electionId);

      const newStatus = isLocking ? 'BLOCKED' : 'ACTIVE';
      setDetails(prev => ({
        ...prev,
        status: newStatus,
        lockStatus: {
          authLocked: isLocking,
          voteLocked: isLocking
        }
      }));

      if (onStatusChange) onStatusChange(electionId, newStatus);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dettagli Elezione">
      {loading && (
         <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin text-secondary" /></div>
      )}

      {error && (
        <StatusMessage type="error" title="Errore" message={error} />
      )}

      {details && !loading && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-bgpage rounded-xl">
              <p className="text-slate/70 text-xs uppercase font-bold mb-1">ID Elezione</p>
              <p className="font-mono text-charcoal break-all">{details.id}</p>
            </div>
            <div className="p-4 bg-bgpage rounded-xl">
               <p className="text-slate/70 text-xs uppercase font-bold mb-1">Data Inizio - Fine</p>
               <p className="font-bold text-charcoal">
                 <ClientDate iso={details.startDate} /> <span className="text-slate-400">→</span> <ClientDate iso={details.endDate} />
               </p>
            </div>
          </div>

          {details.description && (
            <div>
              <h4 className="text-sm font-bold text-charcoal mb-2">Descrizione</h4>
              <p className="text-slate text-sm leading-relaxed">{details.description}</p>
            </div>
          )}
          
          {details.voteRules && (
            <div className="p-4 bg-bgpage rounded-xl border border-slate-100">
              <h4 className="text-sm font-bold text-charcoal mb-2 uppercase tracking-wider text-xs">Regolamento di Voto</h4>
              <p className="text-slate text-sm leading-relaxed whitespace-pre-wrap">{details.voteRules}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
             <h4 className="text-sm font-bold text-charcoal">Contratti Blockchain</h4>
             <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg text-xs">
                    <span className="font-bold text-slate">Auth Registry</span>
                    <Badge variant={details.lockStatus?.authLocked ? 'error' : 'success'}>
                       {details.lockStatus?.authLocked ? 'BLOCCATO' : 'ATTIVO'}
                    </Badge>
                    <span className="font-mono text-slate-400 hidden md:block">{details.authRegistry}</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg text-xs">
                    <span className="font-bold text-slate">Vote Registry</span>
                    <Badge variant={details.lockStatus?.voteLocked ? 'error' : 'success'}>
                       {details.lockStatus?.voteLocked ? 'BLOCCATO' : 'ATTIVO'}
                    </Badge>
                    <span className="font-mono text-slate-400 hidden md:block">{details.voteRegistry}</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-4">
              <h4 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-secondary" /> Metriche On-Chain
              </h4>
              <div className="flex gap-8">
                <div>
                   <p className="text-xs text-slate/70 uppercase">Registrati</p>
                   <p className="text-2xl font-bold text-primary">{details.metrics?.registered ?? 'N/D'}</p>
                </div>
                <div>
                   <p className="text-xs text-slate/70 uppercase">Voti Totali</p>
                   <p className="text-2xl font-bold text-primary">{details.metrics?.votes ?? 'N/D'}</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between bg-bgpage">
               <div>
                  <h4 className="text-sm font-bold text-charcoal mb-1">Configurazione</h4>
                  <p className="text-xs text-slate mb-3">
                    {canEditElection 
                      ? 'Modificabile fino all\'inizio del voto.' 
                      : 'Modifiche disabilitate (voto iniziato).'}
                  </p>
               </div>
               <Button 
                  variant="secondary" 
                  disabled={!canEditElection}
                  onClick={() => router.push(`/admin/create-election?edit=${details.id}`)}
                  className="w-full text-xs"
               >
                  Modifica Parametri
               </Button>
            </div>
          </div>

          {details.candidates?.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-charcoal mb-2">Risultati Parziali</h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bgpage text-xs text-slate uppercase">
                    <tr>
                      <th className="p-3">Candidato</th>
                      <th className="p-3">Lista/Partito</th>
                      <th className="p-3 text-right">Voti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.candidates.map((c, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="p-3 font-bold text-charcoal">{c.name}</td>
                        <td className="p-3 text-slate">{c.list || c.party || '-'}</td>
                        <td className="p-3 text-right font-mono font-bold text-secondary">
                          {typeof c.votes === 'number' ? c.votes : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-error font-bold mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" /> Zona di Pericolo
            </h4>
            <div className="bg-error-bg border border-error/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-error">
                Bloccando l'elezione impedirai nuove autenticazioni e nuovi voti interagendo direttamente con lo Smart Contract.
                {details.status === 'BLOCKED' && <strong> L'elezione è attualmente BLOCCATA.</strong>}
              </p>
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
};

export default ElectionDetailsModal;
