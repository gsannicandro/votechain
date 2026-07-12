import React, { useState } from 'react';
import { IdentificationIcon, CheckCircleIcon, PlusIcon } from './Icons';

const WhitelistManager = ({ whitelistEntries, setWhitelistEntries }) => {
  const [whitelistFileName, setWhitelistFileName] = useState(
    whitelistEntries.length > 0 ? 'Whitelist importata (preesistente)' : ''
  );
  const [whitelistError, setWhitelistError] = useState(null);

  const parseWhitelistCsv = (content) => {
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    
    const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
    
    const headerCells = lines[0].split(delimiter).map((cell) => cell.replace(/"/g, '').trim().toLowerCase());
    const hasHeader = headerCells.includes('email') || headerCells.includes('did') || headerCells.includes('identifier');

    const startIndex = hasHeader ? 1 : 0;
    const entries = [];

    for (let i = startIndex; i < lines.length; i += 1) {
      const value = lines[i].split(delimiter)[0]?.replace(/"/g, '').trim();
      if (value) {
        entries.push(value);
      }
    }
    return entries;
  };

  const handleWhitelistFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setWhitelistError('Carica un file CSV valido (.csv)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result?.toString() || '';
        const entries = parseWhitelistCsv(text);
        
        if (!entries.length) {
          setWhitelistError('Il file non contiene record validi');
          setWhitelistEntries([]);
          setWhitelistFileName('');
          return;
        }
        
        setWhitelistEntries(entries);
        setWhitelistFileName(file.name);
        setWhitelistError(null);
      } catch (err) {
        setWhitelistError('Impossibile leggere il file CSV');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const clearWhitelist = () => {
    setWhitelistEntries([]);
    setWhitelistFileName('');
    setWhitelistError(null);
  };

  return (
    <section className="bg-white rounded-2xl p-3 shadow-none border border-slate-200 flex flex-col h-full">
      <div className="flex items-center gap-2 font-bold text-lg text-charcoal mb-3 border-b border-slate-100 pb-2">
        <IdentificationIcon className="w-5 h-5 text-secondary shrink-0" /> Lista elettori ammessi
      </div>
      
      <div className="flex-1 flex flex-col">
        <p className="text-xs text-slate mb-3">
          Carica un file <strong>CSV</strong> contenente gli identificativi (email o DID) degli elettori ammessi.
        </p>
        
        {whitelistError && (
          <div className="mb-4 text-xs font-bold text-error bg-error-bg p-2 rounded-lg">
            {whitelistError}
          </div>
        )}

        <div className={`flex-1 border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-colors ${whitelistFileName ? 'border-success/30 bg-success-bg/30' : 'border-slate-200 hover:border-secondary/50'}`}>
          {whitelistFileName ? (
            <div className="text-center w-full">
              <div className="mx-auto w-10 h-10 bg-success-bg text-success rounded-full flex items-center justify-center mb-2">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-primary break-all mb-1">{whitelistFileName}</p>
              <p className="text-xs text-slate mb-3">{whitelistEntries.length} elettori</p>
              
              <div className="flex flex-wrap justify-center gap-1 mb-3 opacity-60">
                {whitelistEntries.slice(0, 3).map(e => (
                  <span key={e} className="text-[10px] bg-white border px-1.5 py-0.5 rounded-md">{e}</span>
                ))}
                {whitelistEntries.length > 3 && <span className="text-[10px] text-slate-400">...</span>}
              </div>

              <button type="button" onClick={clearWhitelist} className="text-xs text-error font-bold hover:underline">Rimuovi File</button>
            </div>
          ) : (
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
              <input type="file" accept=".csv" onChange={handleWhitelistFile} className="hidden" />
              <PlusIcon className="w-8 h-8 text-slate mb-2" />
              <span className="text-sm font-bold text-secondary">Carica CSV</span>
              <span className="text-xs text-slate-400 mt-1">o trascina qui</span>
            </label>
          )}
        </div>
      </div>
    </section>
  );
};

export default WhitelistManager;
