
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
      setSelectedOptions(prev => 
        prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
      );
    } else {
      setSelectedOptions([id]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;
    
    setIsVoting(true);
    setError(null);
    try {
      // API muss Array von OptionIDs unterstützen für Multiple Choice
      await api.apiRequest(`/gug/v1/polls/${poll.id}/vote`, { 
        method: 'POST', 
        body: JSON.stringify({ option_ids: selectedOptions }) 
      }, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Abstimmung fehlgeschlagen.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 dark:border-white/5 transition-all duration-500 relative group overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-[#B5A47A] opacity-20 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 pl-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${poll.is_multiple_choice ? 'bg-[#B5A47A] text-[#1A1A1A]' : 'bg-slate-100 dark:bg-white/10 opacity-60'}`}>
                {poll.is_multiple_choice ? 'Mehrfachauswahl' : 'Einzelwahl'}
             </span>
             {poll.has_voted && <span className="text-green-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Abgestimmt</span>}
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight">{poll.question}</h3>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">
            Erstellt am {new Date(poll.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })} • Von {poll.author_name || 'Vorstand'}
          </p>
        </div>
        <div className="bg-[#1A1A1A] dark:bg-[#B5A47A] text-white dark:text-[#1A1A1A] px-5 py-3 rounded-xl shadow-lg">
           <span className="text-sm font-black uppercase tracking-widest">
            {poll.total_votes} Stimmen
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
          {error}
        </div>
      )}

      <div className="space-y-6 pl-4">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.id);
          
          return (
            <div 
              key={option.id} 
              className={`relative cursor-pointer select-none transition-all duration-300 ${isVisitor ? 'cursor-default' : ''}`}
              onClick={() => handleOptionToggle(option.id)}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-4">
                  {!poll.has_voted && !isVisitor && (
                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${isSelected ? 'border-[#B5A47A] bg-[#B5A47A]' : 'border-slate-200 dark:border-white/10'}`}>
                      {isSelected && <svg className="w-4 h-4 text-[#1A1A1A]" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                    </div>
                  )}
                  <span className={`text-base font-bold transition-colors ${isSelected ? 'text-[#B5A47A]' : 'opacity-80'}`}>
                    {option.text}
                  </span>
                </div>
                {poll.has_voted && <span className="text-sm font-black opacity-40">{percentage.toFixed(0)}%</span>}
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${isSelected || poll.has_voted ? 'bg-[#B5A47A]' : 'bg-slate-200 dark:bg-white/10'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between pl-4">
        {isVisitor ? (
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Anmeldung erforderlich zum Abstimmen</span>
        ) : poll.has_voted ? (
          <div className="flex items-center gap-3 text-[#B5A47A] text-[11px] font-black uppercase tracking-[0.2em] bg-[#B5A47A]/10 px-6 py-4 rounded-2xl border border-[#B5A47A]/20">
            Dankeschön für deine Teilnahme!
          </div>
        ) : (
          <button 
            disabled={selectedOptions.length === 0 || isVoting}
            onClick={handleVote}
            className={`text-[11px] font-black uppercase tracking-[0.3em] px-12 py-5 rounded-2xl transition-all flex items-center gap-4 ${
              selectedOptions.length > 0 
                ? 'bg-[#1A1A1A] dark:bg-[#B5A47A] text-white dark:text-[#1A1A1A] hover:scale-105 shadow-2xl active:scale-95' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            {isVoting && (
              <svg className="animate-spin h-4 w-4 text-inherit" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isVoting ? 'Übermittle...' : 'STIMME JETZT ABGEBEN'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollItem;
