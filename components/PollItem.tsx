
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
    setError(null);
    try {
      await api.votePoll(poll.id, selectedOptions, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Abstimmung fehlgeschlagen.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border-2 border-slate-200 dark:border-white/10 transition-all mb-10 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
             <span className="bg-[#B5A47A] text-[#1A1A1A] px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                {poll.target_date ? `TERMINDATUM: ${new Date(poll.target_date).toLocaleDateString('de-DE')}` : 'VEREINSUMFRAGE'}
             </span>
             {poll.is_multiple_choice && (
               <span className="bg-slate-900 text-white dark:bg-white dark:text-[#1A1A1A] px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Mehrfachwahl</span>
             )}
          </div>
          <h3 className="text-3xl sm:text-5xl font-black text-black dark:text-white tracking-tighter leading-[0.95]">{poll.question}</h3>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black">
                {poll.author_name?.charAt(0) || 'V'}
             </div>
             <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
               Von {poll.author_name || 'Vorstand'} • {poll.total_votes} abgegebene Stimmen
             </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.id);
          
          return (
            <div 
              key={option.id} 
              className={`group relative cursor-pointer transition-all duration-300 p-8 rounded-2xl border-2 ${
                isSelected 
                  ? 'border-[#B5A47A] bg-[#B5A47A]/10' 
                  : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:border-slate-400'
              }`}
              onClick={() => handleOptionToggle(option.id)}
            >
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6">
                  {!poll.has_voted && !isVisitor && (
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#B5A47A] border-[#B5A47A] scale-110 shadow-lg' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isSelected && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                  )}
                  {/* KONTRAST: Schwarze Schrift auf weißem Grund */}
                  <span className="text-xl sm:text-2xl font-black text-black dark:text-white">{option.text}</span>
                </div>
                {poll.has_voted && (
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#B5A47A]">{percentage.toFixed(0)}%</span>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{option.votes} Stimmen</p>
                  </div>
                )}
              </div>
              
              {poll.has_voted && (
                <div className="absolute inset-0 bg-slate-200/20 dark:bg-white/5 pointer-events-none rounded-2xl overflow-hidden">
                  <div className="h-full bg-[#B5A47A]/20 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-8 text-red-600 font-black text-xs uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-8 border-t-2 border-slate-100 dark:border-white/5 pt-12">
        <div className="flex items-center gap-4">
           <div className={`w-3 h-3 rounded-full animate-pulse ${poll.has_voted ? 'bg-green-500' : 'bg-orange-500'}`}></div>
           <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
             {poll.has_voted ? 'Du hast bereits abgestimmt' : 'Wähle deine Antwort oben aus'}
           </p>
        </div>
        
        {!poll.has_voted && !isVisitor && (
          <button 
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || isVoting}
            className="w-full sm:w-auto bg-[#1A1A1A] dark:bg-[#B5A47A] text-white dark:text-[#1A1A1A] px-16 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
          >
            {isVoting ? 'VERARBEITUNG...' : 'STIMME JETZT SENDEN'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollItem;
