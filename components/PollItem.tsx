
import React, { useState } from 'react';
import { Poll, User, AppRole } from '../types';
import * as api from '../services/api';

interface PollItemProps {
  poll: Poll;
  user: User;
  onRefresh: () => void;
  onUnauthorized: () => void;
}

const PollItem: React.FC<PollItemProps> = ({ poll, user, onRefresh, onUnauthorized }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVisitor = user.role === AppRole.VISITOR;

  const handleOptionToggle = (id: string) => {
    if (poll.has_voted || isVoting || isVisitor) return;
    if (poll.is_multiple_choice) {
      setSelectedOptions(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]);
    } else {
      setSelectedOptions([id]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;
    setIsVoting(true);
    try {
      await api.apiRequest(`/gug/v1/polls/${poll.id}/vote`, { 
        method: 'POST', 
        body: JSON.stringify({ option_ids: selectedOptions }) 
      }, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Abstimmen.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-slate-200 dark:border-white/5 transition-all duration-500 relative overflow-hidden mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="bg-[#B5A47A] text-[#1A1A1A] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#B5A47A]/20">
                {poll.target_date ? `TERMIN: ${new Date(poll.target_date).toLocaleDateString('de-DE')}` : 'ABSTIMMUNG'}
             </span>
             {poll.has_voted && <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full">✓ Teilgenommen</span>}
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{poll.question}</h3>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {poll.author_name || 'Vorstand'} • {poll.total_votes} Stimmen bisher
          </p>
        </div>
        <div className="bg-slate-900 text-white dark:bg-[#B5A47A] dark:text-[#1A1A1A] px-6 py-4 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest">
           Status: Offen
        </div>
      </div>

      <div className="space-y-4">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.id);
          
          return (
            <div 
              key={option.id} 
              className={`relative cursor-pointer transition-all duration-300 p-6 rounded-2xl border-2 ${isSelected ? 'border-[#B5A47A] bg-[#B5A47A]/5' : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10'}`}
              onClick={() => handleOptionToggle(option.id)}
            >
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#B5A47A] border-[#B5A47A]' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isSelected && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                  </div>
                  {/* TEXT KONTRAST FIX: Starkes Schwarz auf Weiß */}
                  <span className="text-lg font-black text-slate-900 dark:text-white">{option.text}</span>
                </div>
                {poll.has_voted && <span className="text-lg font-black text-[#B5A47A]">{percentage.toFixed(0)}%</span>}
              </div>
              
              {poll.has_voted && (
                <div className="absolute inset-0 bg-slate-100/10 dark:bg-white/5 pointer-events-none">
                  <div className="h-full bg-[#B5A47A]/10 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex items-center justify-between gap-6 border-t border-slate-100 dark:border-white/5 pt-10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
          {poll.is_multiple_choice ? 'Mehrfachauswahl möglich. Wähle alle passenden Optionen.' : 'Einzelwahl. Wähle deine bevorzugte Option.'}
        </p>
        
        {!poll.has_voted && !isVisitor && (
          <button 
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || isVoting}
            className="bg-[#B5A47A] text-[#1A1A1A] px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            {isVoting ? 'Übermittle...' : 'Stimme jetzt abgeben'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollItem;
