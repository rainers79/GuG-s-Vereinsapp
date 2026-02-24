// components/DashboardView.tsx

import React from 'react';
import { User, Poll, ViewType } from '../types';

interface Props {
  user: User;
  polls: Poll[];
  onNavigate: (view: ViewType) => void;
}

const DashboardView: React.FC<Props> = ({ user, polls, onNavigate }) => {

  const upcomingPolls = polls.filter(p => p.target_date);

  return (
    <div className="space-y-10">

      {/* ================= PROFIL BEREICH ================= */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-xl">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

          {/* Profil Links */}
          <div className="flex items-center gap-6">

            {/* Rundes Profilbild */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] flex items-center justify-center text-3xl font-black text-[#1A1A1A] shadow-lg shadow-black/20">
              {user.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Name & Rolle */}
            <div>
              <h1 className="text-3xl font-black leading-tight">
                {user.displayName}
              </h1>
              <p className="text-sm text-[#B5A47A] font-bold uppercase tracking-widest mt-2">
                {user.role}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Willkommen im Vereins-Dashboard
              </p>
            </div>
          </div>

          {/* Logo Platzhalter Rechts */}
          <div className="flex items-center justify-center">

            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[#B5A47A]/40 flex items-center justify-center text-[#B5A47A] text-xs font-black uppercase tracking-widest text-center p-4">
              Vereins<br />Logo
            </div>

          </div>

        </div>

      </div>

      {/* ================= DASHBOARD KACHELN ================= */}
      <div className="grid md:grid-cols-3 gap-6">

        <div
          onClick={() => onNavigate('calendar')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition shadow-lg"
        >
          <h3 className="font-black text-lg mb-2">Kalender</h3>
          <p className="text-sm text-slate-500">
            Termine & Events verwalten
          </p>
        </div>

        <div
          onClick={() => onNavigate('polls')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition shadow-lg"
        >
          <h3 className="font-black text-lg mb-2">Umfragen</h3>
          <p className="text-sm text-slate-500">
            {polls.length} aktive Umfragen
          </p>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition shadow-lg"
        >
          <h3 className="font-black text-lg mb-2">Aufgaben</h3>
          <p className="text-sm text-slate-500">
            Deine Aufgaben verwalten
          </p>
        </div>

      </div>

      {/* ================= ANSTEHENDE UMFRAGEN ================= */}
      {upcomingPolls.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 border shadow-lg">
          <h3 className="font-black mb-4">Anstehende Umfragen</h3>
          <div className="space-y-2">
            {upcomingPolls.slice(0, 5).map(p => (
              <div key={p.id} className="text-sm">
                {p.question}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;
