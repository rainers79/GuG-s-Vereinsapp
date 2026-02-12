
import React, { useState } from 'react';
import * as api from '../services/api';

interface PollCreateProps {
  onSuccess: () => void;
  onUnauthorized: () => void;
}

const PollCreate: React.FC<PollCreateProps> = ({ onSuccess, onUnauthorized }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
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
      await api.createPoll(question, filteredOptions, onUnauthorized);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Umfrage.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-10 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-6 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-[#B5A47A] text-white rounded-lg flex items-center justify-center font-black">+</div>
        <h3 className="text-xl font-bold text-[#1A1A1A]">Neue Mitgliederumfrage</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-lg border border-red-100">{error}</p>}
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Themenstellung</label>
          <input
            type="text"
            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#B5A47A]/20 focus:border-[#B5A47A] outline-none transition-all font-bold text-lg text-[#1A1A1A] placeholder:text-slate-200"
            placeholder="Was möchten Sie zur Abstimmung stellen?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Antwortmöglichkeiten</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <input
                type="text"
                className="flex-grow px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#B5A47A]/20 focus:border-[#B5A47A] outline-none transition-all font-medium text-slate-700 bg-slate-50/30"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
              />
              {options.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => removeOption(idx)}
                  className="p-3 text-slate-300 hover:text-red-500 transition-all bg-slate-50 rounded-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-[#B5A47A] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 mt-4 px-4 py-2 hover:bg-[#B5A47A]/5 rounded-lg transition-all"
          >
            <span className="w-6 h-6 bg-[#B5A47A]/10 flex items-center justify-center rounded-md">+</span>
            Hinzufügen
          </button>
        </div>

        <div className="pt-10">
          <button
            type="submit"
            className="w-full bg-[#1A1A1A] hover:bg-[#B5A47A] text-white font-black py-5 px-6 rounded-xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
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
