
import React, { useState } from 'react';
import * as api from '../services/api';

interface PollCreateProps {
  onSuccess: () => void;
  onUnauthorized: () => void;
}

const PollCreate: React.FC<PollCreateProps> = ({ onSuccess, onUnauthorized }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [targetDate, setTargetDate] = useState('');
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = options.filter(o => o.trim() !== '');
    
    if (!question.trim()) return setError('Bitte eine Frage eingeben.');
    if (filteredOptions.length < 2) return setError('Mindestens 2 Optionen nötig.');

    setLoading(true);
    setError(null);
    try {
      await api.createPoll({ 
        question, 
        options: filteredOptions,
        is_multiple_choice: isMultipleChoice,
        target_date: targetDate || null 
      }, onUnauthorized);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erstellung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-10 sm:p-16 shadow-3xl border-4 border-[#B5A47A] animate-in fade-in slide-in-from-top-10 duration-700 mb-16">
      <div className="flex items-center gap-8 mb-16">
        <div className="w-20 h-20 bg-[#B5A47A] text-[#1A1A1A] rounded-3xl flex items-center justify-center shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
        <div>
          <h3 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Neue Abstimmung</h3>
          <p className="text-[11px] font-black text-[#B5A47A] uppercase tracking-[0.4em]">Konfiguration für Vorstand & Admin</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-12">
        {error && <p className="text-red-600 bg-red-50 p-6 rounded-2xl border-2 border-red-200 font-black uppercase text-xs tracking-widest">{error}</p>}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Fragestellung</label>
            <input
              type="text"
              className="w-full px-8 py-6 rounded-2xl border-2 border-slate-200 dark:border-white/10 focus:border-[#B5A47A] outline-none transition-all font-black text-xl bg-slate-50 dark:bg-black/40 text-black dark:text-white placeholder:opacity-30"
              placeholder="z.B. Werden wir das Sommerfest am See feiern?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Event-Datum (Kalender-Link)</label>
            <input
              type="date"
              className="w-full px-8 py-6 rounded-2xl border-2 border-slate-200 dark:border-white/10 focus:border-[#B5A47A] outline-none transition-all font-black text-xl bg-slate-50 dark:bg-black/40 text-black dark:text-white"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Antwortmöglichkeiten</label>
          <div className="grid gap-4">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-4 group">
                <input
                  type="text"
                  className="flex-grow px-8 py-5 rounded-xl border-2 border-slate-100 dark:border-white/5 focus:border-[#B5A47A] outline-none transition-all font-bold text-lg bg-white dark:bg-white/5 text-black dark:text-white"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                   <button type="button" onClick={() => removeOption(idx)} className="p-5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="text-[#B5A47A] text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border-2 border-dashed border-[#B5A47A]/30 px-8 py-4 rounded-xl hover:bg-[#B5A47A]/5 transition-all">+ Option hinzufügen</button>
        </div>

        <div className="flex items-center justify-between p-8 bg-[#B5A47A]/5 rounded-3xl border-2 border-[#B5A47A]/20">
          <div>
            <span className="text-lg font-black uppercase text-black dark:text-white block">Mehrfachauswahl erlauben</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mitglieder können mehrere Kreuze setzen</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsMultipleChoice(!isMultipleChoice)}
            className={`w-16 h-8 rounded-full transition-all relative ${isMultipleChoice ? 'bg-[#B5A47A]' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${isMultipleChoice ? 'left-9' : 'left-1'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A1A1A] dark:bg-[#B5A47A] text-white dark:text-[#1A1A1A] font-black py-8 rounded-3xl shadow-3xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.4em] text-sm"
        >
          {loading ? 'DATEN WERDEN GESENDET...' : 'UMFRAGE JETZT ÖFFENTLICH STARTEN'}
        </button>
      </form>
    </div>
  );
};

export default PollCreate;
