import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import authService from '../services/authService';

export const useStudentLogin = () => {
  const router = useRouter();
  const otpInputs = useRef([]);

  const [contact, setContact] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!otpExpiry) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = otpExpiry - now;
      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
        setMessage('Codice scaduto. Richiedine uno nuovo.');
        setMessageType('error');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpiry]);

  const requestOtp = async (e) => {
    e?.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!contact || !contact.includes('@')) {
      setMessage("Inserisci un'email valida.");
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.requestOtp(contact);
      setMessage(result.msg);
      setMessageType(result.success ? 'success' : 'error');
      if (result.success) {
        setStep(2);
        setOtpExpiry(Date.now() + 10 * 60 * 1000);
      }
    } catch (error) {
      setMessage('Errore di connessione al server.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpValues.join('');
    setMessage('');
    setIsLoading(true);

    if (fullOtp.length !== 6 || !/^\d+$/.test(fullOtp)) {
      setMessage('Inserisci un codice di 6 cifre valido.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.verifyOtpAndSign(contact, fullOtp);
      setMessage(result.msg);
      setMessageType(result.success ? 'success' : 'error');
      if (result.success) {
        if (result.token) localStorage.setItem('token', result.token);
        router.push('/student/dashboard');
      }
    } catch (error) {
      setMessage('Errore durante la verifica.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      const newValues = [...otpValues];
      digits.forEach((digit, i) => {
        if (index + i < 6) newValues[index + i] = digit;
      });
      setOtpValues(newValues);
      
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputs.current[nextIndex]?.focus();
    } else {
      const newValues = [...otpValues];
      newValues[index] = value.slice(-1);
      setOtpValues(newValues);
      if (value && index < 5) otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const resetStep = () => {
    setStep(1);
    setOtpValues(['', '', '', '', '', '']);
    setMessage('');
    setOtpExpiry(null);
    setTimeLeft('');
  };

  return {
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
  };
};
