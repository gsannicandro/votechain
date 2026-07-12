import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminAuthService } from '../services/adminAuth';
import { createElection, updateElection, fetchElectionDetails } from '../lib/api';

const toInputValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export const useCreateElection = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
    voteRules: '',
    startDate: '',
    endDate: '',
  });
  const [candidates, setCandidates] = useState([]);
  const [whitelistEntries, setWhitelistEntries] = useState([]);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingElectionId, setEditingElectionId] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    
    if (!adminAuthService.isAuthenticated()) {
      router.replace('/admin');
      return;
    }

    const editId = router.query?.edit;
    if (editId) {
       loadEditData(editId);
    }
  }, [router.isReady, router.query]);

  const loadEditData = async (editId) => {
    setIsEditMode(true);
    setEditingElectionId(editId);
    setPrefillLoading(true);
    const token = localStorage.getItem('votechain_admin_token');

    try {
      const data = await fetchElectionDetails(token, editId);
      setForm({
        title: data.title || '',
        description: data.description || '',
        voteRules: data.voteRules || '',
        startDate: toInputValue(data.startDate),
        endDate: toInputValue(data.endDate),
      });
      setCandidates((data.candidates || []).map(c => ({ name: c.name, list: c.party || '' })));
      setWhitelistEntries(data.whitelist || []);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setPrefillLoading(false);
    }
  };

  const updateField = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const validateDates = () => {
    if (!form.startDate || !form.endDate) return 'Compila le date di inizio e fine';
    const startMs = new Date(form.startDate).getTime();
    const endMs = new Date(form.endDate).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 'Formato data non valido';
    if (!isEditMode && startMs <= Date.now()) return 'La data di inizio deve essere futura';
    if (endMs <= startMs) return 'La data di fine deve essere successiva all\'inizio';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: null, message: '' });
    
    const dateError = validateDates();
    if (dateError) {
      setStatus({ type: 'error', message: dateError });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('votechain_admin_token');
      const payload = {
        title: form.title,
        description: form.description,
        voteRules: form.voteRules,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        candidates,
        whitelist: whitelistEntries,
      };

      if (isEditMode && editingElectionId) {
        await updateElection(token, editingElectionId, payload);
        router.push(`/admin/dashboard?edited=${editingElectionId}`);
      } else {
        const data = await createElection(token, payload);
        setResult(data);
        setStatus({ type: 'success', message: 'Elezione creata con successo!' });
        router.push('/admin/dashboard?created=1');
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return {
    form, updateField,
    candidates, setCandidates,
    whitelistEntries, setWhitelistEntries,
    status, loading, prefillLoading, result,
    isEditMode,
    handleSubmit
  };
};
