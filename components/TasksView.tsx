import React, { useEffect, useMemo, useState } from 'react';
import { AppRole } from '../types';
import * as api from '../services/api';

type LinkType = 'event' | 'poll';

interface Task {
  id: number;
  event_id: number | null;
  poll_id: number | null;
  title: string;
  description: string;
  assigned_user_id: number | null;
  role_tag: string;
  deadline_date: string | null;
  completed: boolean;
  completed_by: number | null;
  completed_at: string | null;
  created_by: number | null;
  created_at: string;
}

interface TasksViewProps {
  userId: number;
  userRole: AppRole;
  onUnauthorized: () => void;
}

const TasksView: React.FC<TasksViewProps> = ({ userId, userRole, onUnauthorized }) => {

  const canCreate = userRole === AppRole.SUPERADMIN || userRole === AppRole.VORSTAND;
  const canDelete = canCreate; // gleiche Berechtigung

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.apiRequest<Task[]>('/gug/v1/tasks', { method: 'GET' }, onUnauthorized);
      setTasks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Aufgaben.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const sortedTasks = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      const da = a.deadline_date ? new Date(a.deadline_date).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deadline_date ? new Date(b.deadline_date).getTime() : Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return copy;
  }, [tasks]);

  const toggleComplete = async (task: Task, completed: boolean) => {

    const isAssigned = task.assigned_user_id === userId;
    if (!isAssigned && !canCreate) {
      setError('Keine Berechtigung, diese Aufgabe zu ändern.');
      return;
    }

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed } : t));

    try {
      await api.apiRequest(
        `/gug/v1/tasks/${task.id}`,
        {
          method: 'POST',
          body: JSON.stringify({ completed })
        },
        onUnauthorized
      );
      setSuccess(completed ? 'Aufgabe erledigt.' : 'Aufgabe wieder offen.');
    } catch (e: any) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

  /* =====================================================
     NEU: DELETE TASK
  ===================================================== */

  const deleteTask = async (task: Task) => {

    if (!canDelete) {
      setError('Keine Berechtigung zum Löschen.');
      return;
    }

    if (!task.completed) {
      setError('Nur erledigte Aufgaben können gelöscht werden.');
      return;
    }

    const confirmDelete = window.confirm(
      `Erledigte Aufgabe "${task.title}" wirklich dauerhaft löschen?`
    );

    if (!confirmDelete) return;

    const previousTasks = [...tasks];

    // Optimistisches UI Update
    setTasks(prev => prev.filter(t => t.id !== task.id));

    try {
      await api.apiRequest(
        `/gug/v1/tasks/${task.id}`,
        { method: 'DELETE' },
        onUnauthorized
      );

      setSuccess('Aufgabe gelöscht.');

    } catch (e: any) {
      setTasks(previousTasks);
      setError(e?.message || 'Löschen fehlgeschlagen.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-xl p-4 sm:p-6">

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Aufgaben
        </h3>

        <button
          onClick={loadTasks}
          className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10"
        >
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-900 text-sm dark:bg-emerald-500/10 dark:text-emerald-200">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-slate-500 dark:text-white/60">
          Lädt…
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-white/60">
          Keine Aufgaben vorhanden.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((t) => {

            const isAssigned = t.assigned_user_id === userId;
            const canToggle = isAssigned || canCreate;

            return (
              <div
                key={t.id}
                className={`border rounded-xl p-4 transition ${
                  t.completed
                    ? 'bg-slate-50 dark:bg-white/5'
                    : 'bg-white dark:bg-[#121212]'
                }`}
              >
                <div className="flex items-start gap-3">

                  <input
                    type="checkbox"
                    checked={t.completed}
                    disabled={!canToggle}
                    onChange={(e) => toggleComplete(t, e.target.checked)}
                    className="mt-1 h-5 w-5"
                  />

                  <div className="flex-1">

                    <div className="flex justify-between items-start gap-4">

                      <div>
                        <h4 className={`font-extrabold ${
                          t.completed
                            ? 'line-through text-slate-500 dark:text-white/60'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-sm text-slate-600 dark:text-white/70 mt-1">
                            {t.description}
                          </p>
                        )}

                        <div className="text-xs text-slate-400 mt-2">
                          #{t.id} • {t.created_at}
                        </div>
                      </div>

                      {/* NEU: Delete Button */}
                      {canDelete && t.completed && (
                        <button
                          onClick={() => deleteTask(t)}
                          className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                        >
                          Löschen
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TasksView;
