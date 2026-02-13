
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
    if (filteredOptions.length < 2) return setError('Mindestens 2 Antwortmöglichkeiten sind nötig.');

    setLoading(true);
    setError(null);
    try {
      await api.apiRequest('/gug/v1/polls', { 
        method: 'POST', 
        body: JSON.stringify({ 
          question, 
          options: filteredOptions,
          is_multiple_choice: isMultipleChoice,
          target_date: targetDate || null 
        }) 
      }, onUnauthorized);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Umfrage.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-top-6 duration-500 mb-12">
      <div className="flex items-center gap-6 mb-10">
        <div className="w-14 h-14 bg-[#B5A47A] text-[#1A1A1A] rounded-2xl flex items-center justify-center font-black text-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Umfrage & Termin</h3>
          <p className="text-[10px] font-black text-[#B5A47A] uppercase tracking-[0.2em]">Kalender-Synchronisation aktiv</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fragestellung</label>
            <input
              type="text"
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-white/10 focus:border-[#B5A47A] outline-none transition-all font-bold text-lg bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white"
              placeholder="Was soll entschieden werden?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Event-Datum (optional)</label>
            <input
              type="date"
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-white/10 focus:border-[#B5A47A] outline-none transition-all font-bold text-lg bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Optionen</label>
          <div className="grid gap-4">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-4">
                <input
                  type="text"
                  className="flex-grow px-6 py-4 rounded-xl border border-slate-200 dark:border-white/10 focus:border-[#B5A47A] outline-none transition-all font-bold text-sm bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="text-[#B5A47A] text-[10px] font-black uppercase tracking-widest">+ Weitere Option</button>
        </div>

        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
          <span className="text-sm font-black uppercase text-slate-700 dark:text-slate-300">Mehrfachauswahl erlauben</span>
          <button 
            type="button"
            onClick={() => setIsMultipleChoice(!isMultipleChoice)}
            className={`w-14 h-7 rounded-full transition-all relative ${isMultipleChoice ? 'bg-[#B5A47A]' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isMultipleChoice ? 'left-8' : 'left-1'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A1A1A] dark:bg-[#B5A47A] text-white dark:text-[#1A1A1A] font-black py-6 rounded-2xl shadow-xl hover:scale-[1.01] transition-all uppercase tracking-widest text-xs"
        >
          {loading ? 'Wird erstellt...' : 'Umfrage & Kalendereintrag erstellen'}
        </button>
      </form>
    </div>
  );
};

export default PollCreate;
