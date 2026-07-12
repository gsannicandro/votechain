import React from 'react';
import { DocumentTextIcon } from './Icons';

const ElectionBasicInfo = ({ form, onChange }) => {
  return (
    <section className="bg-white rounded-2xl p-3 shadow-none border border-slate-200">
      <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-2">
        <DocumentTextIcon className="w-4 h-4 text-secondary shrink-0" />
        <h2 className="font-bold text-sm text-charcoal">Dettagli</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-charcoal uppercase mb-1 ml-1">Titolo</label>
          <input 
            type="text" required value={form.title} onChange={onChange('title')}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none placeholder:text-slate-300 focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-colors"
            placeholder="Es: Consultazione Studentesca 2025"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-charcoal uppercase mb-1 ml-1">Descrizione</label>
            <textarea 
              rows={2} value={form.description} onChange={onChange('description')}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none resize-none placeholder:text-slate-300 focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-colors"
              placeholder="Dettagli visibili agli elettori..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-charcoal uppercase mb-1 ml-1">Regole</label>
            <textarea 
              rows={2} value={form.voteRules} onChange={onChange('voteRules')}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none resize-none placeholder:text-slate-300 focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-colors"
              placeholder="Es: Ogni studente ha un voto."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ElectionBasicInfo;
