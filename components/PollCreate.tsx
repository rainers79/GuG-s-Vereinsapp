
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
    
    if (!question.trim()) return setError('Bitte eine klare Frage eingeben.');
    if (filteredOptions.length < 2) return setError('Es werden mindestens 2 Antwortoptionen benötigt.');

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
    <div className="bg-white rounded-[3rem] p-12 sm:p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-4 border-[#B5A47A] mb-20 overflow-hidden">
      <div className="flex items-center gap-10 mb-20">
        <div className="w-24 h-24 bg-[#B5A47A] text-[#1A1A1A] rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 rotate-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
        <div>
          <h3 className="text-5xl font-black text-black tracking-tighter uppercase leading-tight">Umfrage Planen</h3>
          <p className="text-[12px] font-black text-[#B5A47A] uppercase tracking-[0.5em] mt-2">Vorstand-Werkzeugbox</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-16">
        {error && <p className="text-red-600 bg-red-50 p-8 rounded-3xl border-2 border-red-200 font-black uppercase text-sm tracking-widest animate-in shake duration-500">{error}</p>}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <label className="text-[12px] font-black text-slate-800 uppercase tracking-widest ml-1">Zentrale Frage</label>
            <input
              type="text"
              className="w-full px-10 py-7 rounded-[2rem] border-4 border-slate-100 focus:border-[#B5A47A] outline-none transition-all font-black text-2xl bg-slate-50 text-black placeholder:text-slate-300 shadow-inner"
              placeholder="z.B. Nächster Termin?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <label className="text-[12px] font-black text-slate-800 uppercase tracking-widest ml-1">Zugehöriges Datum (Kalender)</label>
            <input
              type="date"
              className="w-full px-10 py-7 rounded-[2rem] border-4 border-slate-100 focus:border-[#B5A47A] outline-none transition-all font-black text-2xl bg-slate-50 text-black shadow-inner"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-8">
          <label className="text-[12px] font-black text-slate-800 uppercase tracking-widest ml-1">Antworten</label>
          <div className="grid gap-6">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-6 items-center">
                <input
                  type="text"
                  className="flex-grow px-10 py-6 rounded-[1.5rem] border-4 border-slate-50 focus:border-[#B5A47A] outline-none transition-all font-bold text-xl bg-white text-black shadow-sm"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                   <button type="button" onClick={() => removeOption(idx)} className="p-6 text-red-500 hover:bg-red-50 rounded-2xl transition-all border-2 border-slate-100 hover:border-red-200 shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="w-full text-[#B5A47A] text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 border-4 border-dashed border-[#B5A47A]/40 p-8 rounded-3xl hover:bg-[#B5A47A]/5 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            WEITERE OPTION HINZUFÜGEN
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-10 bg-[#B5A47A]/5 rounded-[2.5rem] border-4 border-[#B5A47A]/20 gap-8">
          <div>
            <span className="text-2xl font-black uppercase text-black block tracking-tight">Mehrfachwahl-Modus</span>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Mitglieder können mehr als eine Antwort markieren</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsMultipleChoice(!isMultipleChoice)}
            className={`w-20 h-10 rounded-full transition-all relative ${isMultipleChoice ? 'bg-[#B5A47A]' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-2xl transition-all ${isMultipleChoice ? 'left-11' : 'left-1'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-[#B5A47A] font-black py-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.5em] text-sm flex items-center justify-center gap-6"
        >
          {loading ? (
            <div className="animate-spin h-6 w-6 border-4 border-[#B5A47A] border-t-transparent rounded-full" />
          ) : 'UMFRAGE JETZT STARTEN'}
        </button>
      </form>
    </div>
  );
};

export default PollCreate;
