import React, { useState, useEffect } from 'react';
import Badge from './Badge';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  Cog6ToothIcon, 
  LockClosedIcon, 
  LockOpenIcon,
  SpinnerIcon 
} from './Icons';

// Client-only date formatter helper
function ClientDate({ iso }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!iso) return;
    try {
      setText(new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }));
    } catch {
      setText(iso);
    }
  }, [iso]);
  return <>{text}</>;
}

function parseDate(value) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
      return null;
    } catch { return null; }
}

const ElectionsTable = ({ elections, onMonitor, onToggleLock, loadingId }) => {

  const renderStatusBadge = (election) => {
    const now = Date.now();
    const start = parseDate(election.startDate)?.getTime();
    const end = parseDate(election.endDate)?.getTime();

    if (election.status === 'BLOCKED') return <Badge variant="error">BLOCCATA</Badge>;
    if (start && now < start) return <Badge variant="warning">NON INIZIATA</Badge>;
    if (end && now > end) return <Badge variant="info">CONCLUSA</Badge>;
    if (election.status === 'ACTIVE') return <Badge variant="success">ATTIVA</Badge>;
    return <Badge variant="default">{election.status}</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-bold text-slate/70 uppercase border-b border-gray-100">
            <th className="py-3 px-2">Nome</th>
            <th className="py-3 px-2">Stato</th>
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2 text-center">Registrati</th>
            <th className="py-3 px-2 text-center">Votanti</th>
            <th className="py-3 px-2 text-right">Azioni</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {elections.map((election) => (
            <tr key={election.id} className="group hover:bg-bgpage transition-colors border-b border-gray-50 last:border-0">
              <td className="py-4 px-2 font-bold text-primary">
                {election.title}
              </td>
              <td className="py-4 px-2">
                {renderStatusBadge(election)}
              </td>
              <td className="py-4 px-2 text-slate text-xs">
                <div className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> <ClientDate iso={election.startDate} /></div>
                <div className="flex items-center gap-1 mt-1"><CheckCircleIcon className="w-3 h-3"/> <ClientDate iso={election.endDate} /></div>
              </td>
              <td className="py-4 px-2 text-center font-mono text-slate">
                {election.registeredCount ?? 0}/{election.whitelistCount ?? 0}
              </td>
              <td className="py-4 px-2 text-center font-mono text-slate">
                {election.voteCount ?? 0}/{election.whitelistCount ?? 0}
              </td>
              <td className="py-4 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onMonitor(election.id)}
                    className="p-2 text-slate hover:text-secondary hover:bg-slate-100 rounded-lg transition-colors"
                    title="Gestisci Elezione"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => onToggleLock(election.id, election.status)}
                    className={`p-2 rounded-lg transition-colors ${
                      election.status === 'BLOCKED' 
                        ? 'text-error hover:bg-error-bg' 
                        : 'text-slate hover:text-error hover:bg-error-bg'
                    }`}
                    title={election.status === 'BLOCKED' ? 'Sblocca Elezione' : 'Blocca Elezione'}
                    disabled={loadingId === election.id}
                  >
                    {loadingId === election.id ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      election.status === 'BLOCKED' ? (
                        <LockClosedIcon className="w-5 h-5" />
                      ) : (
                        <LockOpenIcon className="w-5 h-5" />
                      )
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {elections.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate">
                  Nessuna elezione presente.
                </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ElectionsTable;
