
import React, { useState } from 'react';
import { Poll, User } from '../types';
import * as api from '../services/api';

interface PollItemProps {
  poll: Poll;
  user: User;
  onRefresh: () => void;
  onUnauthorized: () => void;
}

const PollItem: React.FC<PollItemProps> = ({ poll, user, onRefresh, onUnauthorized }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsVoting(true);
    setError(null);
    try {
      await api.votePoll(poll.id, selectedOption, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Abstimmung fehlgeschlagen.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-black/5 transition-all duration-500 overflow-hidden relative group">
      {/* Subtle indicator for brand identity */}
      <div className="absolute top-0 left-0 w-1 h-full bg-[#B5A47A]/20 group-hover:bg-[#B5A47A] transition-colors duration-500"></div>

      <div className="flex justify-between items-start mb-8 pl-2">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{poll.question}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {new Date(poll.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-[#1A1A1A] text-white px-3 py-1.5 rounded-md">
           <span className="text-[10px] font-black uppercase tracking-widest">
            {poll.total_votes} Stimmen
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-5 pl-2">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
          const isSelected = selectedOption === option.id;
          
          return (
            <div 
              key={option.id} 
              className={`relative cursor-pointer select-none`}
              onClick={() => !poll.has_voted && !isVoting && setSelectedOption(option.id)}
            >
              <div className="flex justify-between items-center mb-2 text-xs">
                <div className="flex items-center gap-3">
                  {!poll.has_voted && (
                    <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${isSelected ? 'border-[#B5A47A] bg-[#B5A47A]' : 'border-slate-300'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                    </div>
                  )}
                  <span className={`font-bold transition-colors ${isSelected ? 'text-[#B5A47A]' : 'text-slate-600'}`}>
                    {option.text}
                  </span>
                </div>
                <span className="text-[#1A1A1A] font-black">{percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-50 rounded h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${isSelected || poll.has_voted ? 'bg-[#B5A47A]' : 'bg-slate-200'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-end pl-2">
        {poll.has_voted ? (
          <div className="flex items-center gap-2 text-[#B5A47A] text-[10px] font-black uppercase tracking-[0.2em] bg-[#B5A47A]/5 px-4 py-2.5 rounded-lg border border-[#B5A47A]/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Abstimmung beendet
          </div>
        ) : (
          <button 
            disabled={!selectedOption || isVoting}
            onClick={handleVote}
            className={`text-[10px] font-black uppercase tracking-widest px-10 py-3.5 rounded-lg transition-all flex items-center gap-3 ${
              selectedOption 
                ? 'bg-[#1A1A1A] text-white hover:bg-[#B5A47A] shadow-lg active:scale-95' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isVoting && (
              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isVoting ? 'Übermittle...' : 'Stimme abgeben'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollItem;
