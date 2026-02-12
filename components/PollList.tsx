
import React, { useState } from 'react';
import { Poll, User, AppRole } from '../types';
import * as api from '../services/api';
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
  const canCreate = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div className="text-center sm:text-left">
          <h2 className="text-4xl font-bold text-[#1A1A1A] tracking-tighter">Umfragen</h2>
          <div className="h-1 w-16 bg-[#B5A47A] mt-2 mb-3 mx-auto sm:mx-0 rounded-full"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Mitbestimmung im GuG Verein</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${
              showCreate 
                ? 'bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50' 
                : 'bg-[#B5A47A] text-white hover:bg-[#1A1A1A] shadow-xl shadow-[#B5A47A]/10 active:scale-95'
            }`}
          >
            {showCreate ? 'Abbrechen' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Erstellen
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
        <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm">
          <div className="text-slate-100 mb-8 flex justify-center">
             <div className="p-10 border-4 border-dashed border-slate-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">Keine Einträge</h3>
          <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto font-medium">Aktuell liegen keine offenen Abstimmungen für Mitglieder vor.</p>
        </div>
      ) : (
        <div className="grid gap-10">
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
