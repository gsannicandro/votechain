import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCreateElection } from '../../hooks/useCreateElection';

import { DashboardLayout } from '../../components/ui/DashboardContainer';
import Button from '../../components/ui/Button';
import ElectionBasicInfo from '../../components/ui/ElectionBasicInfo';
import ElectionTimeline from '../../components/ui/ElectionTimeline';
import CandidateManager from '../../components/ui/CandidateManager';
import WhitelistManager from '../../components/ui/WhitelistManager';

export default function CreateElectionPage() {
  const router = useRouter();

  const {
    form, updateField,
    candidates, setCandidates,
    whitelistEntries, setWhitelistEntries,
    status, loading, prefillLoading, result,
    isEditMode,
    handleSubmit
  } = useCreateElection();

  const pageTitle = isEditMode ? 'Modifica Elezione' : 'Nuova Elezione';
  const submitLabel = isEditMode ? 'Salva Modifiche' : 'Crea Elezione';
  const submitBusyLabel = isEditMode ? 'Salvataggio...' : 'Creazione...';

  return (
    <DashboardLayout>
      <Head>
        <title>VoteChain Admin | {pageTitle}</title>
      </Head>

      <div className="flex-1 flex flex-col min-h-0 bg-white">
        
        <header className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-primary">{pageTitle}</h1>
            <p className="text-xs text-slate">
              {isEditMode ? 'Modifica i parametri della elezione.' : 'Configura la nuova elezione.'}
            </p>
          </div>
        </header>

        <main className="p-3 md:p-5 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {!isEditMode && result && (
              <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-charcoal mb-2">Dettagli Creazione</h4>
                <p className="text-sm text-slate mb-1"><strong>ID generato:</strong> <span className="font-mono">{result.electionId}</span></p>
              </div>
            )}

            {prefillLoading ? (
               <div className="p-12 text-center text-slate">
                 Caricamento dati elezione in corso...
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                <ElectionBasicInfo form={form} onChange={updateField} />

                <ElectionTimeline form={form} onChange={updateField} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <CandidateManager candidates={candidates} setCandidates={setCandidates} />
                  <WhitelistManager whitelistEntries={whitelistEntries} setWhitelistEntries={setWhitelistEntries} />
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-col-reverse md:flex-row justify-end gap-3">
                  {status.message && status.type === 'error' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-error-bg text-error border border-error/20 font-semibold text-sm md:mr-auto">{status.message}</div>
                  )}
                  <Button variant="secondary" type="button" className="md:w-auto w-full !py-3 !text-sm px-6 !shadow-none" onClick={() => router.push('/admin/dashboard')}>Annulla</Button>
                  <Button type="submit" variant="primary" isLoading={loading} className="md:w-auto w-full !py-3 !text-sm px-6 !shadow-none">{loading ? submitBusyLabel : submitLabel}</Button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}