
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
  const canDelete = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

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
    if (!window.confirm('Möchten Sie diese Umfrage wirklich unwiderruflich löschen?')) return;
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
    <div className="bg-white rounded-[2.5rem] p-8 sm:p-14 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] border-2 border-slate-100 dark:border-white/10 transition-all mb-12 relative overflow-hidden">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="space-y-6 flex-grow">
            <div className="flex flex-wrap gap-3">
              <span className="bg-[#B5A47A] text-[#1A1A1A] px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-lg">
                {poll.target_date ? `TERMIN: ${new Date(poll.target_date).toLocaleDateString('de-DE')}` : 'VEREINSUMFRAGE'}
              </span>
              {poll.has_voted && (
                <span className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.3em]">
                  ✓ Abgestimmt
                </span>
              )}
            </div>
            
            {/* EXTREME LESBARKEIT: Riesige, schwarze Schrift für die Frage */}
            <h3 className="text-4xl sm:text-6xl font-black text-black leading-[1.1] tracking-tight">
              {poll.question}
            </h3>
            
            <div className="flex items-center gap-4 py-2 border-b border-slate-100 w-fit">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                {poll.author_name?.charAt(0) || 'V'}
              </div>
              <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
                Gestartet von {poll.author_name || 'Vorstand'} • {poll.total_votes} Teilnehmer
              </p>
            </div>
          </div>

          {canDelete && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-5 text-red-500 hover:bg-red-50 rounded-2xl transition-all border-2 border-transparent hover:border-red-100 shrink-0"
              title="Umfrage löschen"
            >
              {isDeleting ? (
                <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="space-y-6">
          {poll.options.map((option) => {
            const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
            const isSelected = selectedOptions.includes(option.id);
            
            return (
              <div 
                key={option.id} 
                className={`group relative cursor-pointer transition-all duration-400 p-8 rounded-3xl border-2 ${
                  isSelected 
                    ? 'border-[#B5A47A] bg-[#B5A47A]/10 scale-[1.02] shadow-xl' 
                    : 'border-slate-200 bg-slate-50/30 hover:bg-white hover:border-slate-400'
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-8">
                    {!poll.has_voted && !isVisitor && (
                      <div className={`w-10 h-10 rounded-2xl border-4 flex items-center justify-center transition-all ${isSelected ? 'bg-[#B5A47A] border-[#B5A47A] shadow-lg shadow-[#B5A47A]/30' : 'border-slate-300'}`}>
                        {isSelected && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    )}
                    {/* LESBARKEIT: Schwarze Antworttexte */}
                    <span className="text-xl sm:text-3xl font-black text-black">{option.text}</span>
                  </div>
                  {poll.has_voted && (
                    <div className="text-right">
                      <span className="text-3xl font-black text-[#B5A47A]">{percentage.toFixed(0)}%</span>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">{option.votes} STIMMEN</p>
                    </div>
                  )}
                </div>
                
                {poll.has_voted && (
                  <div className="absolute inset-0 bg-slate-200/10 pointer-events-none rounded-3xl overflow-hidden">
                    <div className="h-full bg-[#B5A47A]/15 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-600 font-black text-xs uppercase tracking-[0.2em] bg-red-50 p-6 rounded-2xl border-2 border-red-100 animate-in shake duration-300">{error}</p>}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-6 pt-10 border-t-4 border-slate-50">
          <div className="flex items-center gap-4">
             <div className={`w-4 h-4 rounded-full ${poll.has_voted ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse'}`}></div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
               {poll.has_voted ? 'DEINE STIMME WURDE GEZÄHLT' : (poll.is_multiple_choice ? 'MEHRFACHAUSWAHL MÖGLICH' : 'BITTE EINE OPTION WÄHLEN')}
             </p>
          </div>
          
          {!poll.has_voted && !isVisitor && (
            <button 
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              className="w-full sm:w-auto bg-black text-[#B5A47A] px-20 py-7 rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
            >
              {isVoting ? 'ÜBERMITTLUNG...' : 'STIMME ABSENDEN'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollItem;
