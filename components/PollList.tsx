
import React, { useState } from 'react';
import { Poll, User, AppRole } from '../types';
import PollCreate from './PollCreate';
import PollItem from './PollItem';

interface PollListProps {
  polls: Poll[];
  user: User;
  selectedPollId?: number | null;
  onRefresh: () => void;
  onUnauthorized: () => void;
}

const PollList: React.FC<PollListProps> = ({ polls, user, onRefresh, onUnauthorized }) => {
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;
const selectedPoll = polls.find(p => p.id === selectedPollId);
  return (
    <div className="space-y-8 sm:space-y-16 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10">
        <div className="text-center lg:text-left space-y-2 sm:space-y-4">
          <div className="inline-block px-4 py-1.5 sm:px-6 sm:py-2 bg-[#B5A47A]/20 text-[#B5A47A] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-1">
            MITGESTALTUNG
          </div>
          <h2 className="text-5xl sm:text-9xl font-black text-black dark:text-white tracking-tighter uppercase leading-[0.85]">Umfragen</h2>
          <p className="text-slate-500 text-sm sm:text-xl font-bold uppercase tracking-[0.1em] max-w-lg mx-auto lg:mx-0">
            Deine Meinung zählt. Alle Mitglieder können hier abstimmen.
          </p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`w-full sm:w-auto px-8 py-5 sm:px-14 sm:py-8 rounded-2xl sm:rounded-[2rem] font-black text-[11px] sm:text-[13px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 sm:gap-6 transition-all shadow-xl ${
              showCreate 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-[#B5A47A] text-[#1A1A1A] hover:bg-black hover:text-white'
            }`}
          >
            {showCreate ? 'ABBRECHEN' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                NEUE UMFRAGE
              </>
            )}
          </button>
        )}
      </div>

      {showCreate && canCreate && (
        <div className="animate-in slide-in-from-top-10 duration-700">
          <PollCreate 
            onSuccess={() => {
              setShowCreate(false);
              onRefresh();
            }} 
            onUnauthorized={onUnauthorized} 
          />
        </div>
      )}

    {selectedPoll ? (
  <PollItem 
    poll={selectedPoll}
    user={user}
    onRefresh={onRefresh}
    onUnauthorized={onUnauthorized}
  />
) : polls.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl sm:rounded-[4rem] p-12 sm:p-32 text-center border-2 sm:border-4 border-dashed border-slate-100 dark:border-white/5 shadow-2xl">
          <h3 className="text-2xl sm:text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Keine Umfragen</h3>
          <p className="text-slate-400 mt-4 text-sm sm:text-xl font-medium max-w-md mx-auto">Sobald es neue Themen gibt, erscheinen sie hier.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:gap-16">
          {polls.map((poll) => (
            <PollItem 
              key={poll.id} 
              poll={poll} 
              user={user} 
              onRefresh={onRefresh} 
              onUnauthorized={onUnauthorized} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;
