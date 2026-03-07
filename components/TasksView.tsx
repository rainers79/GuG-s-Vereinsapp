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

interface MemberLite {
  id: number;
  display_name?: string;
  name?: string;
  user_email?: string;
  email?: string;
}

interface TasksViewProps {
  userId: number;
  userRole: AppRole;
  onUnauthorized: () => void;
  onBack?: () => void;
}

const TasksView: React.FC<TasksViewProps> = ({ userId, userRole, onUnauthorized, onBack }) => {
  const canCreate = userRole === AppRole.SUPERADMIN || userRole === AppRole.VORSTAND;
  const canDelete = canCreate;

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAssignedUserId, setNewAssignedUserId] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  const activeProjectIdRaw = localStorage.getItem('gug_active_project');
  const activeProjectId = activeProjectIdRaw ? Number(activeProjectIdRaw) : 0;

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        activeProjectId > 0
          ? `/gug/v1/tasks?project_id=${activeProjectId}`
          : '/gug/v1/tasks';

      const data = await api.apiRequest<Task[]>(endpoint, { method: 'GET' }, onUnauthorized);
      setTasks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Aufgaben.');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!canCreate) return;

    try {
      const data = await api.getMembers(onUnauthorized);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    loadTasks();
    loadMembers();
  }, []);

  const memberNameMap = useMemo(() => {
    const map = new Map<number, string>();

    members.forEach((member) => {
      const label =
        member.display_name?.trim() ||
        member.name?.trim() ||
        member.user_email?.trim() ||
        member.email?.trim() ||
        `Mitglied #${member.id}`;

      map.set(Number(member.id), label);
    });

    return map;
  }, [members]);

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

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewAssignedUserId('');
    setNewDeadlineDate('');
  };

  const handleCreateTask = async () => {
    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!canCreate) {
      setError('Keine Berechtigung zum Erstellen.');
      return;
    }

    if (!title) {
      setError('Titel fehlt.');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await api.createTask(
        {
          title,
          description,
          assigned_user_id: newAssignedUserId ? Number(newAssignedUserId) : null,
          deadline_date: newDeadlineDate || null,
          project_id: activeProjectId > 0 ? activeProjectId : undefined,
          role_tag: ''
        } as any,
        onUnauthorized
      );

      setSuccess('Aufgabe erstellt.');
      resetCreateForm();
      setShowCreate(false);
      await loadTasks();
    } catch (e: any) {
      setError(e?.message || 'Erstellen fehlgeschlagen.');
    } finally {
      setCreating(false);
    }
  };

  const toggleComplete = async (task: Task, completed: boolean) => {
    const isAssigned = task.assigned_user_id === userId;
    if (!isAssigned && !canCreate) {
      setError('Keine Berechtigung, diese Aufgabe zu ändern.');
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed } : t)));

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
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

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
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

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

        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={() => {
                setShowCreate((prev) => !prev);
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[#B5A47A] text-[#1A1A1A]"
            >
              {showCreate ? 'Abbrechen' : 'Neue Aufgabe'}
            </button>
          )}

          <button
            onClick={loadTasks}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {showCreate && canCreate && (
        <div className="mb-6 border rounded-xl p-4 bg-slate-50 dark:bg-white/5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-500 dark:text-white/60 font-black uppercase tracking-widest">
                Titel
              </label>
              <input
                className="form-input w-full"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Aufgabe eingeben"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 dark:text-white/60 font-black uppercase tracking-widest">
                Mitglied zuweisen
              </label>
              <select
                className="form-input w-full"
                value={newAssignedUserId}
                onChange={(e) => setNewAssignedUserId(e.target.value)}
                disabled={creating}
              >
                <option value="">Bitte auswählen</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name ||
                      member.name ||
                      member.user_email ||
                      member.email ||
                      `Mitglied #${member.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 dark:text-white/60 font-black uppercase tracking-widest">
              Beschreibung
            </label>
            <textarea
              className="form-input w-full min-h-[110px]"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Beschreibung"
              disabled={creating}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-500 dark:text-white/60 font-black uppercase tracking-widest">
                Fälligkeitsdatum
              </label>
              <input
                type="date"
                className="form-input w-full"
                value={newDeadlineDate}
                onChange={(e) => setNewDeadlineDate(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                onClick={handleCreateTask}
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[#B5A47A] text-[#1A1A1A]"
              >
                {creating ? '...' : 'Aufgabe speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            const assignedLabel = t.assigned_user_id
              ? memberNameMap.get(Number(t.assigned_user_id)) || `Mitglied #${t.assigned_user_id}`
              : 'Nicht zugewiesen';

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
                        <h4
                          className={`font-extrabold ${
                            t.completed
                              ? 'line-through text-slate-500 dark:text-white/60'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-sm text-slate-600 dark:text-white/70 mt-1">
                            {t.description}
                          </p>
                        )}

                        <div className="text-xs text-slate-400 mt-2 space-y-1">
                          <div>#{t.id} • {t.created_at}</div>
                          <div>Zugewiesen an: {assignedLabel}</div>
                          {t.deadline_date && <div>Fällig: {t.deadline_date}</div>}
                        </div>
                      </div>

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
