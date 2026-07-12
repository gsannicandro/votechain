import React from 'react';
import { useRouter } from 'next/router';
import Button from './Button';
import StatusMessage from './StatusMessage';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from './Icons';

const VoucherActionArea = ({ 
  electionDetails, 
  voucher, 
  loading, 
  error, 
  onRequestVoucher 
}) => {
  const router = useRouter();
  
  const now = new Date();
  const isPreStart = now < electionDetails.rawStart;
  const isEnded = now > electionDetails.rawEnd;

  return (
    <div className="w-full md:w-[65%] p-12 bg-white flex flex-col relative items-center justify-center min-h-[500px]">
        
        {error && (
            <div className="w-full max-w-lg mb-6">
                <StatusMessage type="error" title="Si è verificato un errore" message={error} icon={<ExclamationTriangleIcon className="w-6 h-6"/>} />
            </div>
        )}

        {(!voucher && !electionDetails.has_registered) && (
          <div className="text-center max-w-lg animate-fadeIn">
            <div className="w-20 h-20 bg-secondary/5 rounded-full flex items-center justify-center mb-6 mx-auto">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/30 text-white transform rotate-3">
                    <ShieldCheckIcon className="w-7 h-7" />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-primary mb-3">Richiedi Scheda Elettorale</h2>
            <p className="text-slate text-sm leading-relaxed mb-8">
              Per garantire l'anonimato del voto, viene generato un voucher crittografico.
            </p>

            {isPreStart ? (
                <StatusMessage 
                    type="warning" 
                    title="Elezione non iniziata" 
                    message={`Potrai richiedere la scheda a partire dal ${electionDetails.start}`} 
                    icon={<ClockIcon className="w-6 h-6"/>}
                />
            ) : isEnded ? (
                <StatusMessage 
                    type="info" 
                    title="Elezione Terminata" 
                    message={`Il periodo di voto si è concluso il ${electionDetails.end}`} 
                    icon={<ExclamationTriangleIcon className="w-6 h-6"/>}
                />
            ) : (
                <Button 
                    onClick={onRequestVoucher} 
                    isLoading={loading}
                    disabled={electionDetails.status !== 'ACTIVE'}
                    variant="primary"
                >
                    Ottieni e Firma Scheda
                </Button>
            )}
          </div>
        )}

        {(!voucher && electionDetails.has_registered) && (
            <div className="animate-fadeIn w-full max-w-md">
                 <StatusMessage 
                    type="error"
                    icon={<ExclamationTriangleIcon className="w-8 h-8 text-red-500"/>}
                    title="Voucher smarrito"
                    message="Risulti registrato, ma il voucher digitale non è presente su questo dispositivo. Per sicurezza, il server non ne conserva copia."
                 />
                 <div className="mt-6 flex justify-center">
                    <Button variant="secondary" onClick={() => router.push('/student/dashboard')}>
                        Torna alla Dashboard
                    </Button>
                 </div>
            </div>
        )}

        {voucher && (
            <div className="animate-fadeIn w-full max-w-md text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 mx-auto border border-green-100">
                    <CheckCircleIcon className="w-10 h-10 text-green-500" />
                </div>
                
                <h3 className="text-2xl font-bold text-primary mb-2">Scheda Pronta</h3>
                <p className="text-slate-500 text-sm mb-6">Il tuo certificato di voto anonimo è stato generato.</p>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-left relative group hover:border-secondary/20 transition-colors">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Impronta Digitale (Hash)</span>
                  <div className="font-mono text-[10px] text-slate-600 break-all leading-relaxed opacity-75 group-hover:opacity-100 transition-opacity">
                    {voucher.substring(0, 100)}...
                  </div>
                </div>
                
                {!isEnded && !isPreStart && (
                  <div className="mb-6 w-full text-left">
                    <StatusMessage 
                      type="warning"
                      title="Attenzione: Procedura Irreversibile"
                      message="Se torni alla dashboard o chiudi questa sessione dopo aver generato la scheda, potresti perdere l'accesso se cambi dispositivo."
                      icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                    />
                  </div>
                )}

                {isPreStart ? (
                    <StatusMessage type="warning" title="Seggio non ancora aperto" message={`Apertura: ${electionDetails.start}`} />
                ) : isEnded ? (
                     <StatusMessage type="info" title="Elezioni Concluse" message="Non è più possibile votare." />
                ) : (
                    <Button onClick={() => router.push(`/student/vote?id=${electionDetails.id}`)} variant="primary">
                        Entra nel Seggio Virtuale
                        <ArrowRightIcon className="ml-2 w-5 h-5" />
                    </Button>
                )}
            </div>
        )}
    </div>
  );
};

export default VoucherActionArea;
