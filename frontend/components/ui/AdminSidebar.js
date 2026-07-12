import React from 'react';
import { ShieldCheckIcon } from './Icons';

export const AdminSidebar = ({ adminName }) => (
  <div className="w-full md:w-1/3 bg-primary p-8 md:p-12 text-white flex flex-col relative overflow-hidden">
    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full bg-secondary opacity-10 blur-3xl"></div>
    
    <div className="relative z-10 flex items-center mb-12">
      <div className="h-10 w-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center mr-3 border border-white/10">
        <ShieldCheckIcon className="w-6 h-6 text-secondary-bg" />
      </div>
      <span className="font-bold tracking-tight text-xl">VoteChain Admin</span>
    </div>

    <div className="relative z-10 my-auto">
      <h2 className="text-3xl font-bold mb-4">Pannello di Controllo</h2>
      <p className="text-slate-400 leading-relaxed mb-8">
        Benvenuto, <span className="text-white font-semibold">{adminName || 'Amministratore'}</span>. 
        Da qui puoi monitorare lo stato dei nodi Blockchain, gestire gli Smart Contract delle elezioni e intervenire in caso di emergenza.
      </p>
      
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
        <h3 className="text-sm font-bold text-secondary-bg mb-2 uppercase tracking-wider">Stato Sistema</h3>
        <p className="text-sm text-slate-300">
          Tutti i sistemi sono operativi. Monitoraggio attivo 24/7.
        </p>
      </div>
    </div>
  </div>
);

export default AdminSidebar;