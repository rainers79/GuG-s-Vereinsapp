
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
  const canCreate = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  return (
    <div className="space-y-16 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="text-center lg:text-left space-y-4">
          <div className="inline-block px-6 py-2 bg-[#B5A47A]/20 text-[#B5A47A] rounded-full text-[10px] font-black uppercase tracking-[0.5em] mb-2">
            STIMMBEDARF & MITGESTALTUNG
          </div>
          <h2 className="text-6xl sm:text-9xl font-black text-black tracking-tighter uppercase leading-[0.85]">Umfragen</h2>
          <p className="text-slate-500 text-lg sm:text-xl font-bold uppercase tracking-[0.1em] max-w-lg">
            Deine Meinung zählt. Alle Mitglieder können hier an der Vereinsentwicklung teilhaben.
          </p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`px-14 py-8 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] flex items-center gap-6 transition-all shadow-[0_20px_60px_-15px_rgba(181,164,122,0.4)] ${
              showCreate 
                ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-105' 
                : 'bg-[#B5A47A] text-[#1A1A1A] hover:bg-black hover:text-white active:scale-95 hover:scale-105'
            }`}
          >
            {showCreate ? 'ABBRECHEN' : (
              <>
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </div>
                NEUE UMFRAGE
              </>
            )}
          </button>
        )}
      </div>

      {showCreate && canCreate && (
        <div className="animate-in slide-in-from-top-20 duration-700">
          <PollCreate 
            onSuccess={() => {
              setShowCreate(false);
              onRefresh();
            }} 
            onUnauthorized={onUnauthorized} 
          />
        </div>
      )}

      {polls.length === 0 ? (
        <div className="bg-white rounded-[4rem] p-32 text-center border-4 border-dashed border-slate-100 shadow-2xl">
          <div className="text-slate-100 mb-12 flex justify-center">
             <div className="p-16 bg-slate-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
          </div>
          <h3 className="text-4xl font-black text-black uppercase tracking-tighter">Aktuell keine Fragen</h3>
          <p className="text-slate-400 mt-6 text-xl font-medium max-w-md mx-auto">Der Verein ruht. Sobald es neue Themen gibt, erscheinen sie hier.</p>
        </div>
      ) : (
        <div className="grid gap-16">
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
