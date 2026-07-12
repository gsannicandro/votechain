import React from 'react';
import Link from 'next/link';
import Button from './Button';
import { 
  CheckIcon, 
  ClockIcon, 
  UserIcon, 
  MinusIcon, 
  SpinnerIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon
} from './Icons';

export const VoteSuccess = ({ txHash }) => (
  <div className="animate-fade-in flex flex-col items-center justify-center h-full max-w-md mx-auto text-center py-10">
    <div className="w-24 h-24 bg-success-bg rounded-full flex items-center justify-center mb-8 border border-success/10 text-success shadow-sm">
      <CheckCircleIcon className="w-12 h-12" />
    </div>
    <h2 className="text-3xl font-bold text-primary mb-4">Voto Registrato!</h2>
    <p className="text-slate leading-relaxed mb-8">
      La tua preferenza è stata acquisita in modo anonimo e protetto. Grazie per aver partecipato a questa consultazione democratica.
    </p>
    
    {txHash && (
        <div className="w-full mb-8 p-4 bg-bgpage rounded-xl border border-gray-100 text-[10px] font-mono break-all text-slate-500 text-left">
            <span className="block font-bold text-slate-400 uppercase mb-1">Hash Transazione:</span>
            {txHash}
        </div>
    )}

    <Link href="/student/dashboard" legacyBehavior>
      <a className="w-full bg-secondary hover:bg-opacity-90 text-white font-bold py-4 rounded-xl shadow-xl transition-all flex items-center justify-center">
        Torna alla Dashboard
      </a>
    </Link>
  </div>
);

export const VotingArea = ({ 
  electionDetails, 
  selectedOption, 
  setSelectedOption, 
  voterStatus, 
  loading, 
  error, 
  onVote 
}) => {
  return (
    <div className="w-full md:w-[65%] p-8 lg:p-12 bg-white flex flex-col relative min-h-[500px]">
      
      {error && (
        <div className="flex p-4 mb-6 rounded-xl bg-error-bg border border-error/20 animate-fade-in">
          <XCircleIcon className="h-5 w-5 text-error shrink-0" />
          <div className="ml-3 text-sm font-bold text-error">{error}</div>
        </div>
      )}

      <div className="max-w-3xl mx-auto w-full flex flex-col h-full text-center">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">Esprimi la tua preferenza</h2>
            <p className="text-slate text-sm">Tutti i voti sono anonimi e protetti da crittografia end-to-end.</p>
            <div className="mt-6">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                    voterStatus === 'ready' ? 'bg-success-bg text-success border-success/10' : 'bg-info-bg text-info border-info/10'
                }`}>
                    {voterStatus === 'ready' ? (
                        <CheckIcon className="w-4 h-4 mr-1.5" />
                    ) : (
                        <ClockIcon className="w-4 h-4 mr-1.5" />
                    )}
                    {voterStatus === 'authorizing' ? 'In attesa di autorizzazione...' : 'Seggio Pronto'}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
          {electionDetails.candidates && electionDetails.candidates.map((candidate) => {
              const isBlank = candidate.isBlank || (candidate.name && candidate.name.toLowerCase().includes('bianca'));
              
              return (
                <label key={candidate.id} className={`group relative block cursor-pointer ${isBlank ? 'md:col-span-2' : ''}`}>
                    <input 
                        type="radio" 
                        name="vote-option" 
                        className="peer sr-only"
                        checked={selectedOption?.id === candidate.id}
                        onChange={() => setSelectedOption(candidate)}
                        disabled={voterStatus !== 'ready'}
                    />
                    <div className="flex items-start p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all peer-checked:border-secondary peer-checked:shadow-md peer-checked:bg-secondary-bg/10 h-full">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors ${
                            selectedOption?.id === candidate.id ? 'bg-secondary text-white' : 'bg-gray-100 text-slate'
                        }`}>
                            {isBlank ? (
                                <MinusIcon className="w-6 h-6" />
                            ) : (
                                <UserIcon className="w-6 h-6" />
                            )}
                        </div>
                        <div className="text-left">
                            <h3 className={`text-lg font-bold transition-colors ${selectedOption?.id === candidate.id ? 'text-secondary' : 'text-primary group-hover:text-secondary'}`}>
                                {candidate.name}
                            </h3>
                            <p className="text-sm text-slate">{candidate.party_name || (isBlank ? 'Nessuna preferenza' : 'Candidato Indipendente')}</p>
                        </div>
                    </div>
                </label>
              );
          })}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between text-left border border-gray-100 mt-auto">
            <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-bold text-primary mb-1">Conferma la selezione</h3>
                <p className="text-sm text-slate">Una volta inviato, il tuo voto non potrà essere modificato.</p>
            </div>
            <button 
                onClick={onVote}
                disabled={loading || !selectedOption || voterStatus !== 'ready'}
                className="bg-secondary disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-opacity-90 text-white font-semibold py-3 px-8 rounded-xl transition shadow-soft flex items-center shrink-0 min-w-[200px] justify-center"
            >
                {loading ? (
                    <SpinnerIcon className="animate-spin h-5 w-5 text-white" />
                ) : (
                    <>
                        Invia il mio Voto
                        <ArrowRightIcon className="ml-2 -mr-1 w-5 h-5" />
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
