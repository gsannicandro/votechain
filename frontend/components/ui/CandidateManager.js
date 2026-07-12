import React, { useState } from 'react';
import { FlagIcon, PlusIcon, TrashIcon } from './Icons';
import Button from './Button';

const CandidateManager = ({ candidates, setCandidates }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [candidateDraft, setCandidateDraft] = useState({ name: '', list: '' });

  const handleAddCandidate = () => {
    if (!candidateDraft.name.trim()) return;
    setCandidates([
      ...candidates,
      {
        name: candidateDraft.name.trim(),
        list: candidateDraft.list.trim(),
      },
    ]);
    setCandidateDraft({ name: '', list: '' });
    setModalOpen(false);
  };

  return (
    <>
      <section className="bg-white rounded-2xl p-3 shadow-none border border-slate-200 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-lg text-charcoal">
            <FlagIcon className="w-5 h-5 text-secondary shrink-0" /> Candidati
          </div>
          <button 
            type="button" onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-white text-sm font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
          >
            <PlusIcon className="w-4 h-4" /> Aggiungi
          </button>
        </div>
        
        <div className="flex-1 space-y-2 min-h-[80px] overflow-y-auto">
          {candidates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate italic text-sm">
              Nessun candidato inserito.
            </div>
          ) : (
            candidates.map((c, i) => (
              <div key={`${c.name}-${i}`} className="flex justify-between items-center p-3 bg-bgpage rounded-xl border border-slate-100 group">
                <div>
                  <p className="font-bold text-sm text-primary">{c.name}</p>
                  <p className="text-xs text-slate">{c.list || 'Lista non specificata'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setCandidates(candidates.filter((_, idx) => idx !== i))} 
                  className="p-2 text-slate hover:text-error hover:bg-error-bg rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-primary">Nuovo Candidato</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase mb-1">Nome Candidato</label>
                <input 
                  type="text" 
                  value={candidateDraft.name} 
                  onChange={e => setCandidateDraft({...candidateDraft, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  placeholder="Mario Rossi"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase mb-1">Lista / Partito</label>
                <input 
                  type="text" 
                  value={candidateDraft.list} 
                  onChange={e => setCandidateDraft({...candidateDraft, list: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  placeholder="Lista Insieme"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" className="!w-auto px-4 !shadow-none" onClick={() => setModalOpen(false)}>
                Annulla
              </Button>
              <Button className="!w-auto px-6 !shadow-none" onClick={handleAddCandidate}>
                Aggiungi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateManager;
