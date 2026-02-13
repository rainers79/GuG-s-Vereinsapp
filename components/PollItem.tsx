
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
      setError(err.message || 'Die Abstimmungs-Route konnte nicht erreicht werden.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Diese Umfrage wirklich löschen?')) return;
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
    <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-8 sm:p-14 shadow-2xl border-2 border-slate-100 dark:border-white/5 transition-all mb-12 relative overflow-hidden">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="space-y-6 flex-grow">
            <div className="flex flex-wrap gap-3">
              <span className="bg-[#B5A47A] text-[#1A1A1A] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">
                {poll.target_date ? `EVENT: ${new Date(poll.target_date).toLocaleDateString('de-DE')}` : 'MITGLIEDER-VOTE'}
              </span>
              {poll.has_voted && (
                <span className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em]">
                  ✓ Deine Stimme zählt
                </span>
              )}
            </div>
            
            {/* KONTRAST-FIX: Text-Black im hellen Modus, Text-White im dunklen Modus */}
            <div className="bg-slate-50 dark:bg-black/20 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-white/5">
              <h3 className="text-4xl sm:text-6xl font-black text-black dark:text-white leading-[1.05] tracking-tight break-words">
                {poll.question || 'Keine Frage angegeben'}
              </h3>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#B5A47A] flex items-center justify-center font-black text-xs border border-[#B5A47A]/30">
                {poll.author_name?.charAt(0) || 'G'}
              </div>
              <p className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Initiator: {poll.author_name || 'Vorstand'} • {poll.total_votes} Beteiligungen
              </p>
            </div>
          </div>

          {canModify && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all border-2 border-transparent hover:border-red-100 shrink-0"
              title="Umfrage unwiderruflich löschen"
            >
              {isDeleting ? (
                <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {poll.options.map((option) => {
            const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
            const isSelected = selectedOptions.includes(option.id);
            
            return (
              <div 
                key={option.id} 
                className={`group relative cursor-pointer transition-all duration-400 p-8 rounded-3xl border-2 ${
                  isSelected 
                    ? 'border-[#B5A47A] bg-[#B5A47A]/10' 
                    : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300'
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-6">
                    {!poll.has_voted && !isVisitor && (
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#B5A47A] border-[#B5A47A] shadow-lg shadow-[#B5A47A]/30' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isSelected && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    )}
                    {/* ANTWORT TEXTE: Schwarz/Weiß je nach Modus */}
                    <span className="text-xl sm:text-2xl font-black text-black dark:text-white">{option.text}</span>
                  </div>
                  {poll.has_voted && (
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#B5A47A]">{percentage.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
                
                {poll.has_voted && (
                  <div className="absolute inset-0 bg-slate-200/20 dark:bg-white/5 pointer-events-none rounded-3xl overflow-hidden">
                    <div className="h-full bg-[#B5A47A]/20 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border-2 border-red-100 dark:border-red-900/30 font-black uppercase text-[10px] tracking-widest animate-in shake duration-500">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-4 pt-10 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full ${poll.has_voted ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
               {poll.has_voted ? 'STIMME BEREITS ABGEGEBEN' : (poll.is_multiple_choice ? 'MEHRFACHAUSWAHL' : 'EINZELAUSWAHL')}
             </p>
          </div>
          
          {!poll.has_voted && !isVisitor && (
            <button 
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              className="w-full sm:w-auto bg-black dark:bg-[#B5A47A] text-[#B5A47A] dark:text-[#1A1A1A] px-16 py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-10"
            >
              {isVoting ? 'SENDET...' : 'STIMME JETZT ABSENDEN'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollItem;
