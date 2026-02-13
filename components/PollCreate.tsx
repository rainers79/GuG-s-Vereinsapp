
import React, { useState } from 'react';
import * as api from '../services/api';

interface PollCreateProps {
  onSuccess: () => void;
  onUnauthorized: () => void;
}

const PollCreate: React.FC<PollCreateProps> = ({ onSuccess, onUnauthorized }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
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
      // API muss is_multiple_choice unterstützen
      await api.apiRequest('/gug/v1/polls', { 
        method: 'POST', 
        body: JSON.stringify({ 
          question, 
          options: filteredOptions,
          is_multiple_choice: isMultipleChoice 
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
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-top-6 duration-500">
      <div className="flex items-center gap-6 mb-10">
        <div className="w-14 h-14 bg-[#B5A47A] text-[#1A1A1A] rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-[#B5A47A]/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black text-inherit tracking-tighter uppercase">Neue Umfrage</h3>
          <p className="text-[10px] font-black text-[#B5A47A] uppercase tracking-[0.2em]">Mitbestimmung konfigurieren</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-10">
        {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>}
        
        <div className="space-y-3">
          <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Fragestellung</label>
          <input
            type="text"
            className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 dark:border-white/5 focus:ring-4 focus:ring-[#B5A47A]/10 focus:border-[#B5A47A] outline-none transition-all font-bold text-xl bg-slate-50 dark:bg-black/20 text-inherit placeholder:opacity-20"
            placeholder="Worüber soll abgestimmt werden?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Optionen</label>
          <div className="grid gap-4">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-4 group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <input
                  type="text"
                  className="flex-grow px-6 py-4 rounded-xl border border-slate-200 dark:border-white/10 focus:border-[#B5A47A] outline-none transition-all font-bold text-sm bg-white dark:bg-white/5 text-inherit"
                  placeholder={`Antwortmöglichkeit ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <button 
                    type="button" 
                    onClick={() => removeOption(idx)}
                    className="p-4 text-red-500 hover:bg-red-500 hover:text-white transition-all bg-red-500/5 rounded-xl border border-red-500/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="text-[#B5A47A] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 mt-4 px-6 py-3 hover:bg-[#B5A47A]/10 rounded-xl transition-all border border-dashed border-[#B5A47A]/30"
          >
            <span className="text-lg font-black">+</span>
            Option hinzufügen
          </button>
        </div>

        {/* Multiple Choice Toggle */}
        <div className="flex items-center justify-between p-6 bg-[#B5A47A]/5 rounded-2xl border border-[#B5A47A]/10">
          <div>
            <p className="text-sm font-black uppercase tracking-widest">Mehrfachauswahl</p>
            <p className="text-[10px] opacity-50 font-bold uppercase mt-1 tracking-tight">Erlaube Mitgliedern mehrere Antworten zu wählen</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsMultipleChoice(!isMultipleChoice)}
            className={`relative w-14 h-7 rounded-full transition-all duration-500 ${isMultipleChoice ? 'bg-[#B5A47A]' : 'bg-slate-200 dark:bg-white/10'}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ${isMultipleChoice ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            className="w-full bg-[#1A1A1A] dark:bg-[#B5A47A] text-white dark:text-[#1A1A1A] font-black py-6 px-8 rounded-2xl transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.3em] text-xs"
            disabled={loading}
          >
            {loading ? 'Veröffentlichung...' : 'UMFRAGE JETZT STARTEN'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PollCreate;
