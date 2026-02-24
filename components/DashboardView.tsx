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
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-black mb-2">
          Willkommen, {user.displayName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Dein Vereins-Dashboard
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div
          onClick={() => onNavigate('calendar')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition"
        >
          <h3 className="font-black text-lg mb-2">Kalender</h3>
          <p className="text-sm text-slate-500">
            Termine & Events verwalten
          </p>
        </div>

        <div
          onClick={() => onNavigate('polls')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition"
        >
          <h3 className="font-black text-lg mb-2">Umfragen</h3>
          <p className="text-sm text-slate-500">
            {polls.length} aktive Umfragen
          </p>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition"
        >
          <h3 className="font-black text-lg mb-2">Aufgaben</h3>
          <p className="text-sm text-slate-500">
            Deine Aufgaben verwalten
          </p>
        </div>

      </div>

      {upcomingPolls.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 border">
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
