import React from 'react';
import Input from './Input';
import Button from './Button';
import StatusMessage from './StatusMessage';
import { ArrowRightIcon, ArrowLeftIcon, ClockIcon, EnvelopeIcon } from './Icons';

const StudentLoginForm = ({ 
  loginState 
}) => {
  const {
    contact, setContact,
    otpValues, otpInputs,
    step,
    message, messageType,
    isLoading,
    timeLeft,
    requestOtp,
    verifyOtp,
    handleOtpChange,
    handleOtpKeyDown,
    resetStep
  } = loginState;

  return (
    <div className="w-full h-full flex flex-col justify-center max-w-md mx-auto">
      
      {message && (
        <div className="mb-8 flex justify-center w-full">
          <StatusMessage 
            title={messageType === 'error' ? 'Attenzione' : 'Notifica'} 
            message={message} 
            type={messageType} 
          />
        </div>
      )}

      {step === 1 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-primary mb-2">Verifica Identità</h3>
            <p className="text-slate text-sm">Inserisci la tua email istituzionale per ricevere il codice.</p>
          </div>

          <form onSubmit={requestOtp} className="space-y-6">
            <Input 
              label="Email Istituzionale"
              type="email"
              placeholder="marco.rossi@studenti.poliba.it"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isLoading}
              icon={<EnvelopeIcon className="h-5 w-5" />}
              required
            />

            <Button type="submit" isLoading={isLoading} variant="primary" className="w-full">
              Richiedi Codice <ArrowRightIcon className="ml-2 w-5 h-5" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-primary mb-2">Inserisci Codice</h3>
            <p className="text-slate text-sm">Abbiamo inviato un OTP a <strong>{contact}</strong></p>
          </div>

          <form onSubmit={verifyOtp} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otpValues.map((val, i) => (
                <input
                  key={i}
                  ref={el => otpInputs.current[i] = el}
                  type="text"
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isLoading}
                  className="w-full h-14 text-center text-2xl font-bold text-primary border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all bg-bgpage focus:bg-white"
                  inputMode="numeric"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resetStep}
                className="inline-flex items-center text-sm font-semibold text-slate hover:text-secondary transition-colors"
              >
                <ArrowLeftIcon className="mr-2 w-4 h-4" /> Cambia email
              </button>
              
              {timeLeft && (
                <div className="flex items-center text-sm font-mono text-secondary bg-sky-50 px-3 py-1 rounded-lg">
                  <ClockIcon className="w-4 h-4 mr-1.5" /> {timeLeft}
                </div>
              )}
            </div>

            <Button type="submit" isLoading={isLoading} variant="primary" className="w-full">
              Verifica e Accedi
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentLoginForm;
