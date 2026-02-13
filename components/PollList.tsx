
import React, { useState } from 'react';
import { Poll, User, AppRole } from '../types';
import PollCreate from './PollCreate';
import PollItem from './PollItem';

interface PollListProps {
  polls: Poll[];
  user: User;
  onRefresh: () => void;
  onUnauthorized: () => void;
}

const PollList: React.FC<PollListProps> = ({ polls, user, onRefresh, onUnauthorized }) => {
  const [showCreate, setShowCreate] = useState(false);
  // Nur Vorstand oder Admin darf erstellen
  const canCreate = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-16">
        <div className="text-center sm:text-left">
           <div className="inline-block px-4 py-1 bg-[#B5A47A]/10 text-[#B5A47A] rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4">
            Demokratie-Modul
          </div>
          <h2 className="text-5xl sm:text-7xl font-black text-black dark:text-white tracking-tighter uppercase leading-none">Umfragen</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mt-3">Gestalte die Zukunft des GuG Vereins mit</p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-2xl ${
              showCreate 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-[#B5A47A] text-[#1A1A1A] hover:bg-black hover:text-white active:scale-95'
            }`}
          >
            {showCreate ? 'ABBRECHEN' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                ERSTELLEN
              </>
            )}
          </button>
        )}
      </div>

      {showCreate && canCreate && (
        <PollCreate 
          onSuccess={() => {
            setShowCreate(false);
            onRefresh();
          }} 
          onUnauthorized={onUnauthorized} 
        />
      )}

      {polls.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-[3rem] p-24 text-center border-2 border-slate-100 dark:border-white/5 shadow-2xl">
          <div className="text-slate-200 dark:text-white/5 mb-10 flex justify-center">
             <div className="p-12 border-4 border-dashed border-slate-100 dark:border-white/5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
          </div>
          <h3 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Alles erledigt</h3>
          <p className="text-slate-400 mt-4 text-lg font-medium max-w-sm mx-auto">Momentan gibt es keine offenen Fragen. Genieß die freie Zeit!</p>
        </div>
      ) : (
        <div className="grid gap-12">
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
