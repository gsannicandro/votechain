import React, { useState } from 'react';
import Link from 'next/link';
import Badge from './Badge';
import { 
  ChevronLeftIcon, 
  DocumentTextIcon, 
  ClockIcon
} from './Icons';

import Sidebar from './Sidebar';

const ElectionInfoSidebar = ({ electionDetails }) => {
  const [showRegolamento, setShowRegolamento] = useState(false);

  if (!electionDetails) return null;

  const now = new Date();
  const isPreStart = now < electionDetails.rawStart;
  const isEnded = now > electionDetails.rawEnd;

  return (
    <Sidebar>
      <div className="flex flex-col h-full -mt-20">

        <Link href="/student/dashboard" legacyBehavior>
          <a className="relative z-10 flex items-center text-slate-400 hover:text-white text-sm font-medium mb-10 transition-colors group w-fit">
            <ChevronLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Torna alla Dashboard
          </a>
        </Link>

        <div className="relative z-10 mb-6 flex-1">
          <div className="flex items-start justify-between mb-4">
            {isEnded ? <Badge variant="error">Terminata</Badge> : 
             isPreStart ? <Badge variant="warning">In Attesa</Badge> : 
             <Badge variant="success">Attiva</Badge>}
          </div>

          <h2 className="text-2xl font-bold mb-3 leading-tight">{electionDetails.title}</h2>
          
          <button 
            type="button"
            onClick={() => setShowRegolamento(!showRegolamento)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-secondary-bg hover:text-white uppercase tracking-widest bg-white/5 px-4 py-3 rounded-lg transition-all border border-white/10 mt-4 mb-4 hover:bg-white/10"
          >
            <span>{showRegolamento ? "Nascondi Regolamento" : "Leggi Regolamento"}</span>
            <ChevronLeftIcon className={`w-3 h-3 transition-transform ${showRegolamento ? '-rotate-90' : 'rotate-180'}`} />
          </button>

          <div className={`transition-all duration-300 overflow-hidden ${showRegolamento ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-black/20 rounded-xl p-4 border border-white/5 overflow-y-auto mb-4 custom-scrollbar max-h-56">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                {(electionDetails.voteRules && electionDetails.voteRules !== "Regolamento completo non disponibile nella versione demo. Si applicano le norme statutarie vigenti.") 
                  ? electionDetails.voteRules 
                  : "Nessun regolamento specifico disponibile per questa elezione. Si applicano le norme generali."}
              </p>
            </div>
          </div>
          
          {!showRegolamento && (
            <p className="text-slate-400 text-sm leading-relaxed animate-fadeIn">
              {electionDetails.description || "Nessuna descrizione disponibile per questa votazione."}
            </p>
          )}
        </div>

        <div className="relative z-10 mt-auto pt-8 border-t border-white/10 space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apertura Seggio</span>
              <span className="text-sm font-mono text-slate-200 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-secondary" /> {electionDetails.start}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chiusura Seggio</span>
              <span className="text-sm font-mono text-slate-200 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-error" /> {electionDetails.end}
              </span>
            </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ElectionInfoSidebar;
