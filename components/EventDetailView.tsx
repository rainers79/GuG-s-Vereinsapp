import React, { useState, useEffect } from 'react';
import { CalendarEvent, User, AppRole } from '../types';


type TabType = 'overview' | 'poll' | 'tasks';

interface Task {
  id: number;
  event_id: number;
  title: string;
  description: string;
  assigned_user_id: number;
  role_tag?: string;
  status?: string;
}

const EventDetailView: React.FC<Props> = ({
  event,
  user,
  onBack,
  onCreatePoll,
  onCreateTasks
}) => {

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const canManage =
    user.role === AppRole.SUPERADMIN ||
    user.role === AppRole.VORSTAND;

  // 🔥 Tasks laden wenn Aufgaben-Tab aktiv wird
  useEffect(() => {
    if (activeTab !== 'tasks') return;

    setLoadingTasks(true);

    fetch('https://api.gug-verein.at/wp-json/gug/v1/tasks', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
      }
    })
      .then(r => r.json())
      .then((data: Task[]) => {
        // Nach Event filtern
        const eventTasks = data.filter(t => t.event_id === Number(event.id));

        // Rollenlogik
        const visibleTasks = canManage
          ? eventTasks
          : eventTasks.filter(t => t.assigned_user_id === user.id);

        setTasks(visibleTasks);
      })
      .catch(err => console.error('Task Load Error:', err))
      .finally(() => setLoadingTasks(false));

  }, [activeTab, event.id, user.id, canManage]);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">

      <button
        onClick={onBack}
        className="mb-6 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-[#B5A47A]"
      >
        ← Zurück zum Kalender
      </button>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-8 border border-slate-200 dark:border-white/5">

        <h2 className="text-2xl font-black mb-2">{event.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {new Date(event.date).toLocaleDateString()}
        </p>

        <div className="flex bg-slate-200 dark:bg-[#111] p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-lg font-bold ${
              activeTab === 'overview'
                ? 'bg-[#B5A47A] text-black'
                : 'text-slate-700 dark:text-white'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('poll')}
            className={`flex-1 py-2 rounded-lg font-bold ${
              activeTab === 'poll'
                ? 'bg-[#B5A47A] text-black'
                : 'text-slate-700 dark:text-white'
            }`}
          >
            Umfrage
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-2 rounded-lg font-bold ${
              activeTab === 'tasks'
                ? 'bg-[#B5A47A] text-black'
                : 'text-slate-700 dark:text-white'
            }`}
          >
            Aufgaben
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <p className="mb-6 text-slate-700 dark:text-slate-300">
              {event.description || 'Keine Beschreibung vorhanden.'}
            </p>
          </div>
        )}

        {activeTab === 'poll' && (
          <div>
            {event.linkedPollId ? (
              <div>
                <p className="mb-4 text-green-600 font-bold">
                  Umfrage ist verknüpft.
                </p>
               <button className="bg-[#B5A47A] px-4 py-2 rounded-lg font-bold text-black">
                Zur Umfrage
                </button>
              </div>
            ) : (
              canManage && (
                <button
                  onClick={() => onCreatePoll(event.id)}
                  className="bg-[#B5A47A] px-4 py-2 rounded-lg font-bold text-black"
                >
                  Umfrage erstellen
                </button>
              )
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>

            {canManage && (
              <button
                onClick={() => onCreateTasks(event.id)}
                className="bg-[#B5A47A] px-4 py-2 rounded-lg font-bold text-black mb-6"
              >
                Aufgaben erstellen
              </button>
            )}

            {loadingTasks && (
              <p className="text-slate-500 dark:text-slate-400">
                Aufgaben werden geladen...
              </p>
            )}

            {!loadingTasks && tasks.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Keine Aufgaben vorhanden.
              </p>
            )}

            {!loadingTasks && tasks.length > 0 && (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-100 dark:bg-[#111] border border-slate-200 dark:border-white/5"
                  >
                    <h4 className="font-bold mb-1">{task.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {task.description}
                    </p>
                    {task.role_tag && (
                      <p className="text-xs mt-2 text-[#B5A47A] font-bold">
                        Rolle: {task.role_tag}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default EventDetailView;
