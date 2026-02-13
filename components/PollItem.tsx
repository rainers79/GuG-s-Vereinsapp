
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVisitor = user.role === AppRole.VISITOR;
  const canModify = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

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

  const handleDelete = async () => {
    if (!window.confirm('Diese Umfrage löschen?')) return;
    setIsDeleting(true);
    try {
      await api.deletePoll(poll.id, onUnauthorized);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Löschen fehlgeschlagen.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 shadow-xl border border-slate-100 dark:border-white/5 transition-all mb-8 relative overflow-hidden">
      <div className="flex flex-col gap-6 sm:gap-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-4 sm:space-y-6 flex-grow w-full">
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#B5A47A] text-[#1A1A1A] px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                {poll.target_date ? `EVENT: ${new Date(poll.target_date).toLocaleDateString('de-DE')}` : 'VOTING'}
              </span>
              {poll.has_voted && (
                <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  ✓ ABGESTIMMT
                </span>
              )}
            </div>
            
            <div className="bg-slate-50 dark:bg-black/20 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-white/5">
              <h3 className="text-2xl sm:text-5xl font-black text-black dark:text-white leading-tight tracking-tight">
                {poll.question}
              </h3>
            </div>
          </div>

          {canModify && (
            <button onClick={handleDelete} className="self-end sm:self-auto p-4 text-red-500 hover:bg-red-50 rounded-xl transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
            const isSelected = selectedOptions.includes(option.id);
            
            return (
              <div 
                key={option.id} 
                className={`group relative cursor-pointer transition-all p-5 sm:p-8 rounded-2xl border-2 ${
                  isSelected ? 'border-[#B5A47A] bg-[#B5A47A]/5' : 'border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-white/5'
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex justify-between items-center relative z-10 gap-4">
                  <div className="flex items-center gap-4">
                    {!poll.has_voted && !isVisitor && (
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'bg-[#B5A47A] border-[#B5A47A]' : 'border-slate-300'}`}>
                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    )}
                    <span className="text-base sm:text-2xl font-black text-black dark:text-white leading-tight">{option.text}</span>
                  </div>
                  {poll.has_voted && (
                    <span className="text-xl sm:text-2xl font-black text-[#B5A47A]">{percentage.toFixed(0)}%</span>
                  )}
                </div>
                
                {poll.has_voted && (
                  <div className="absolute inset-0 bg-slate-200/10 dark:bg-white/5 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="h-full bg-[#B5A47A]/20 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-4 pt-6 border-t border-slate-100 dark:border-white/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
            {poll.has_voted ? 'BEREITS ABGEGEBEN' : (poll.is_multiple_choice ? 'MEHRFACHAUSWAHL' : 'EINZELAUSWAHL')}
          </p>
          
          {!poll.has_voted && !isVisitor && (
            <button 
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              className="w-full sm:w-auto bg-black dark:bg-[#B5A47A] text-[#B5A47A] dark:text-[#1A1A1A] px-10 py-5 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl disabled:opacity-20"
            >
              STIMME ABSENDEN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollItem;
