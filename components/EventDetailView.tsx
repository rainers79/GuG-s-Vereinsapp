// components/EventDetailView.tsx

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

interface Member {
  id: number;
  display_name: string;
  email: string;
  username: string;
}

interface Props {
  event: CalendarEvent;
  user: User;
  onBack: () => void;
  onCreatePoll: () => void;
  onOpenPoll: (pollId: number) => void;
  onCreateTasks: (eventId: string) => void;
}

const EventDetailView: React.FC<Props> = ({
  event,
  user,
  onBack,
  onCreatePoll,
  onOpenPoll,
  onCreateTasks
}) => {

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);

  const canManage =
    user.role === AppRole.SUPERADMIN ||
    user.role === AppRole.VORSTAND;

  const loadTasks = () => {
    setLoadingTasks(true);

    fetch('https://api.gug-verein.at/wp-json/gug/v1/tasks', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
      }
    })
      .then(r => r.json())
      .then((data: Task[]) => {

        const eventTasks = data.filter(
          t => t.event_id === Number(event.id)
        );

        const visibleTasks = canManage
          ? eventTasks
          : eventTasks.filter(t => t.assigned_user_id === user.id);

        setTasks(visibleTasks);
      })
      .finally(() => setLoadingTasks(false));
  };

  const loadMembers = () => {
    fetch('https://api.gug-verein.at/wp-json/gug/v1/members', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
      }
    })
      .then(r => r.json())
      .then((data: Member[]) => setMembers(data));
  };

  useEffect(() => {
    if (activeTab !== 'tasks') return;
    loadTasks();
    if (canManage) loadMembers();
  }, [activeTab]);

  const createTask = async () => {
    if (!newTitle.trim() || !assignedUserId) return;

    await fetch('https://api.gug-verein.at/wp-json/gug/v1/tasks', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('gug_token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_id: event.id,
        title: newTitle,
        description: newDescription,
        assigned_user_id: assignedUserId,
        role_tag: ''
      })
    });

    setNewTitle('');
    setNewDescription('');
    setAssignedUserId(null);
    setShowCreateTask(false);
    loadTasks();
  };

  const toggleTask = async (task: Task) => {
    await fetch(`https://api.gug-verein.at/wp-json/gug/v1/tasks/${task.id}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('gug_token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: task.status === 'done' ? 'open' : 'done'
      })
    });

    loadTasks();
  };

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
                <button
                  onClick={() => onOpenPoll(event.linkedPollId!)}
                  className="bg-[#B5A47A] px-4 py-2 rounded-lg font-bold text-black"
                >
                  Zur Umfrage
                </button>
              </div>
            ) : (
              canManage && (
                <button
                  onClick={onCreatePoll}
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
                onClick={() => setShowCreateTask(!showCreateTask)}
                className="bg-[#B5A47A] px-4 py-2 rounded-lg font-bold text-black mb-6"
              >
                Aufgabe erstellen
              </button>
            )}

            {showCreateTask && canManage && (
              <div className="mb-6 space-y-4">
                <input
                  type="text"
                  placeholder="Titel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border"
                />
                <textarea
                  placeholder="Beschreibung"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border"
                />
                <select
                  value={assignedUserId || ''}
                  onChange={(e) => setAssignedUserId(Number(e.target.value))}
                  className="w-full p-3 rounded-lg border"
                >
                  <option value="">Mitglied auswählen</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={createTask}
                  className="bg-black text-white px-4 py-2 rounded-lg"
                >
                  Speichern
                </button>
              </div>
            )}

            {loadingTasks && <p>Aufgaben werden geladen...</p>}

            {!loadingTasks && tasks.length === 0 && (
              <p>Keine Aufgaben vorhanden.</p>
            )}

            {!loadingTasks && tasks.length > 0 && (
              <div className="space-y-4">
                {tasks.map(task => {
                  const canToggle =
                    canManage || task.assigned_user_id === user.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border ${
                        task.status === 'done'
                          ? 'bg-green-50 border-green-300'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold">{task.title}</h4>
                          <p className="text-sm">{task.description}</p>
                        </div>

                        {canToggle && (
                          <button
                            onClick={() => toggleTask(task)}
                            className="px-3 py-1 rounded-lg bg-[#B5A47A] text-black font-bold"
                          >
                            {task.status === 'done' ? 'Rückgängig' : 'Erledigt'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default EventDetailView;
