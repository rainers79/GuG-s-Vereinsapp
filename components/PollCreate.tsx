
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
    if (!question.trim()) return setError('Frage fehlt.');
    if (filteredOptions.length < 2) return setError('Mind. 2 Optionen.');

    setLoading(true);
    try {
      await api.createPoll({ question, options: filteredOptions, is_multiple_choice: isMultipleChoice, target_date: targetDate || null }, onUnauthorized);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 sm:p-12 border-2 border-[#B5A47A] mb-12 shadow-2xl">
      <h3 className="text-3xl sm:text-5xl font-black text-black dark:text-white uppercase tracking-tighter mb-8 leading-none">Neue Umfrage</h3>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Die Frage</label>
            <input
              type="text"
              className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 outline-none focus:border-[#B5A47A] font-black text-lg text-black dark:text-white"
              placeholder="Was willst du wissen?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Event Datum (Optional)</label>
            <input
              type="date"
              className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 outline-none focus:border-[#B5A47A] font-black text-black dark:text-white"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optionen</label>
          <div className="grid gap-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-3">
                <input
                  type="text"
                  className="flex-grow px-5 py-3 rounded-xl border-2 border-slate-100 dark:border-white/5 bg-white dark:bg-black/40 outline-none focus:border-[#B5A47A] font-bold text-black dark:text-white"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                   <button type="button" onClick={() => removeOption(idx)} className="p-3 text-red-500 bg-red-50 rounded-lg">×</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addOption} className="w-full py-4 border-2 border-dashed border-[#B5A47A]/40 rounded-xl text-[#B5A47A] font-black text-[10px] uppercase tracking-widest">+ Option hinzufügen</button>
        </div>

        <button type="submit" className="w-full bg-black dark:bg-[#B5A47A] text-[#B5A47A] dark:text-[#1A1A1A] py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl">
          {loading ? 'Sende...' : 'UMFRAGE STARTEN'}
        </button>
      </form>
    </div>
  );
};

export default PollCreate;
