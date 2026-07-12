import React from 'react';
import { CalendarIcon } from './Icons';

const ElectionTimeline = ({ form, onChange }) => {
  return (
    <section className="bg-white rounded-2xl p-3 shadow-none border border-slate-200">
      <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-2">
        <CalendarIcon className="w-4 h-4 text-secondary shrink-0" />
        <h2 className="font-bold text-sm text-charcoal">Periodo</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-charcoal uppercase mb-1 ml-1">Inizio</label>
          <input 
            type="datetime-local" required value={form.startDate} onChange={onChange('startDate')}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none font-mono text-xs focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-charcoal uppercase mb-1 ml-1">Fine</label>
          <input 
            type="datetime-local" required value={form.endDate} onChange={onChange('endDate')}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 outline-none font-mono text-xs focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-colors"
          />
        </div>
      </div>
    </section>
  );
};

export default ElectionTimeline;
