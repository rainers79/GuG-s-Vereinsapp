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

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>('event');
  const [linkId, setLinkId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setError(null);
    setSuccess(null);

    const isAssigned = task.assigned_user_id === userId;
    if (!isAssigned && !canCreate) {
      setError('Keine Berechtigung, diese Aufgabe zu ändern.');
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed } : t)));

    try {
      await api.apiRequest<{ success: boolean; message?: string }>(
        `/gug/v1/tasks/${task.id}`,
        {
          method: 'POST',
          body: JSON.stringify({ completed })
        },
        onUnauthorized
      );
      setSuccess(completed ? 'Aufgabe erledigt.' : 'Aufgabe wieder offen.');
    } catch (e: any) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

  const resetCreateForm = () => {
    setLinkType('event');
    setLinkId('');
    setTitle('');
    setDescription('');
    setAssignedUserId('');
    setDeadlineDate('');
  };

  const createTask = async () => {
    setError(null);
    setSuccess(null);

    if (!canCreate) {
      setError('Keine Berechtigung zum Erstellen.');
      return;
    }

    const linkIdNum = parseInt(linkId, 10);
    if (!linkIdNum || linkIdNum <= 0) {
      setError('Bitte eine gültige ID für Event/Umfrage eingeben.');
      return;
    }

    const t = title.trim();
    if (!t) {
      setError('Titel ist Pflicht.');
      return;
    }

    const assignedNum = assignedUserId.trim() ? parseInt(assignedUserId.trim(), 10) : 0;
    if (assignedUserId.trim() && (!assignedNum || assignedNum <= 0)) {
      setError('Assigned User ID muss eine Zahl sein (oder leer lassen).');
      return;
    }

    if (deadlineDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate.trim())) {
      setError('Deadline Format muss YYYY-MM-DD sein (oder leer lassen).');
      return;
    }

    const payload: any = {
      title: t,
      description: description,
      assigned_user_id: assignedNum > 0 ? assignedNum : undefined,
      deadline_date: deadlineDate.trim() ? deadlineDate.trim() : undefined
    };

    if (linkType === 'event') payload.event_id = linkIdNum;
    if (linkType === 'poll') payload.poll_id = linkIdNum;

    try {
      setLoading(true);
      await api.apiRequest<{ success: boolean; id: number }>(
        '/gug/v1/tasks',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        onUnauthorized
      );
      setSuccess('Aufgabe erstellt.');
      setShowCreate(false);
      resetCreateForm();
      await loadTasks();
    } catch (e: any) {
      setError(e?.message || 'Erstellen fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-xl p-4 sm:p-6">
      {/* Header – Mobile optimiert */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Aufgaben
          </h3>
          <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
            Abhaken per Checkbox. Optional mit Deadline. Aufgaben sind immer einem Event oder einer Umfrage zugeordnet.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={loadTasks}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            disabled={loading}
          >
            Aktualisieren
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setShowCreate((v) => !v);
                setError(null);
                setSuccess(null);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[#B5A47A] text-[#1A1A1A] hover:brightness-110 transition"
            >
              Neue Aufgabe
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {success}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="py-10 text-center text-slate-500 dark:text-white/60 text-sm">
            Lädt…
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="py-10 text-center text-slate-500 dark:text-white/60 text-sm">
            Keine Aufgaben vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map((t) => {
              const linkLabel = t.event_id ? `Event #${t.event_id}` : t.poll_id ? `Umfrage #${t.poll_id}` : '—';
              const isAssigned = t.assigned_user_id === userId;
              const canToggle = isAssigned || canCreate;

              return (
                <div
                  key={t.id}
                  className={`border rounded-xl p-3 sm:p-4 transition ${
                    t.completed
                      ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      disabled={!canToggle}
                      onChange={(e) => toggleComplete(t, e.target.checked)}
                      className="mt-1 h-6 w-6 sm:h-5 sm:w-5 rounded border-slate-300"
                      title={!canToggle ? 'Keine Berechtigung' : 'Erledigt markieren'}
                    />

                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                          <h4
                            className={`text-sm sm:text-base font-extrabold ${
                              t.completed
                                ? 'text-slate-500 dark:text-white/60 line-through'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {t.title}
                          </h4>

                          {t.deadline_date && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#B5A47A]/15 text-[#B5A47A] self-start xs:self-auto">
                              {t.deadline_date}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/70">
                            {linkLabel}
                          </span>

                          {t.assigned_user_id && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/70">
                              Assigned #{t.assigned_user_id}
                            </span>
                          )}
                        </div>

                        {t.description && (
                          <p
                            className={`text-xs sm:text-sm ${
                              t.completed
                                ? 'text-slate-500 dark:text-white/50'
                                : 'text-slate-600 dark:text-white/70'
                            }`}
                          >
                            {t.description}
                          </p>
                        )}

                        <div className="text-[10px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-widest">
                          #{t.id} • {t.created_at}
                          {t.completed_at ? ` • ${t.completed_at}` : ''}
                        </div>

                        {!canToggle && (
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                            Nur Assigned User
                          </div>
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
    </div>
  );
};

export default TasksView;
