import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppRole, Member, ProjectLite, Task, User } from '../types';
import * as api from '../services/api';

/* =====================================================
   SECTION 01 - TYPES
===================================================== */

interface Props {
  user: User;
  onUnauthorized: () => void;
}

type ProjectTaskSummary = {
  user_id: number;
  display_name: string;
  email?: string;
  assigned_tasks_count: number;
  open_tasks_count: number;
  completed_tasks_count: number;
};

/* =====================================================
   SECTION 02 - STORAGE KEYS
===================================================== */

const LS_ACTIVE_PROJECT = 'gug_active_project';

/* =====================================================
   SECTION 03 - HELPERS
===================================================== */

const getStoredProjectId = (): number => {
  const raw = localStorage.getItem(LS_ACTIVE_PROJECT);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const getMemberDisplayName = (member: Partial<Member> | null | undefined): string => {
  return (
    member?.display_name ||
    member?.username ||
    member?.email ||
    `Mitglied #${member?.id ?? 0}`
  );
};

/* =====================================================
   SECTION 04 - COMPONENT
===================================================== */

const ProjectCoreTeamView: React.FC<Props> = ({ user, onUnauthorized }) => {
  const [project, setProject] = useState<ProjectLite | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const activeProjectId = useMemo(() => getStoredProjectId(), []);
  const isAdmin = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  /* =====================================================
     SECTION 05 - LOAD PROJECT
  ===================================================== */

  const loadProject = useCallback(async () => {
    if (!activeProjectId) return;

    setLoadingProject(true);

    try {
      const data = await api.apiRequest<ProjectLite[]>('/gug/v1/projects', {}, onUnauthorized);
      const list = Array.isArray(data) ? data : [];
      const found = list.find((item) => Number(item.id) === Number(activeProjectId)) || null;
      setProject(found);
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht geladen werden.');
      setProject(null);
    } finally {
      setLoadingProject(false);
    }
  }, [activeProjectId, onUnauthorized]);

  /* =====================================================
     SECTION 06 - LOAD TASKS
  ===================================================== */

  const loadTasks = useCallback(async () => {
    if (!activeProjectId) return;

    setLoadingTasks(true);

    try {
      const data = await api.getTasks(
        onUnauthorized,
        {
          project_id: activeProjectId
        }
      );

      setTasks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Aufgaben konnten nicht geladen werden.');
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [activeProjectId, onUnauthorized]);

  /* =====================================================
     SECTION 07 - LOAD MEMBERS
  ===================================================== */

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);

    try {
      const data = await api.getMembers(onUnauthorized);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [onUnauthorized]);

  /* =====================================================
     SECTION 08 - INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!activeProjectId) return;
    setError(null);
    loadProject();
    loadTasks();
    loadMembers();
  }, [activeProjectId, loadProject, loadTasks, loadMembers]);

  /* =====================================================
     SECTION 09 - MEMBER MAP
  ===================================================== */

  const memberMap = useMemo(() => {
    const map = new Map<number, Member>();

    for (const member of members) {
      map.set(Number(member.id), member);
    }

    return map;
  }, [members]);

  /* =====================================================
     SECTION 10 - TASK SUMMARY
  ===================================================== */

  const taskSummary = useMemo<ProjectTaskSummary[]>(() => {
    const map = new Map<number, ProjectTaskSummary>();

    for (const task of tasks) {
      const assignedUserId = Number(task.assigned_user_id || 0);
      if (!assignedUserId) continue;

      const member = memberMap.get(assignedUserId);

      if (!map.has(assignedUserId)) {
        map.set(assignedUserId, {
          user_id: assignedUserId,
          display_name: getMemberDisplayName(member),
          email: member?.email || '',
          assigned_tasks_count: 0,
          open_tasks_count: 0,
          completed_tasks_count: 0
        });
      }

      const current = map.get(assignedUserId)!;
      current.assigned_tasks_count += 1;

      if (task.completed) {
        current.completed_tasks_count += 1;
      } else {
        current.open_tasks_count += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.assigned_tasks_count !== a.assigned_tasks_count) {
        return b.assigned_tasks_count - a.assigned_tasks_count;
      }
      return a.display_name.localeCompare(b.display_name, 'de');
    });
  }, [tasks, memberMap]);

  /* =====================================================
     SECTION 11 - REFRESH
  ===================================================== */

  const handleRefresh = async () => {
    setError(null);
    await Promise.all([
      loadProject(),
      loadTasks(),
      loadMembers()
    ]);
  };

  /* =====================================================
     SECTION 12 - EARLY RETURN
  ===================================================== */

  if (!activeProjectId) {
    return (
      <div className="app-card">
        <div className="text-sm text-slate-500 dark:text-white/60">
          Kein aktives Projekt gewählt. Öffne zuerst ein Projekt im Projektrad.
        </div>
      </div>
    );
  }

  /* =====================================================
     SECTION 13 - RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {error && <div className="alert-error">{error}</div>}

      <div className="app-card space-y-3">
        <h1 className="text-2xl font-black">Projekt Kernteam</h1>

        <div className="text-sm text-slate-500 dark:text-white/60">
          Projekt:{' '}
          <span className="font-black text-slate-900 dark:text-white">
            {loadingProject ? 'Lädt...' : (project?.title || `Projekt #${activeProjectId}`)}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-white/50">
          Hier siehst du aktuell die Aufgabenverteilung im Projekt. Die echte Kernteam-Verwaltung wird danach direkt mit der Projekt-API verbunden.
        </div>
      </div>

      <div className="app-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Aufgabenübersicht im Projekt</h2>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingProject || loadingTasks || loadingMembers}
            className="btn-secondary"
          >
            {loadingProject || loadingTasks || loadingMembers ? '...' : 'Aktualisieren'}
          </button>
        </div>

        {loadingTasks ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Aufgaben werden geladen...
          </div>
        ) : taskSummary.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Aktuell sind in diesem Projekt noch keine zugewiesenen Aufgaben vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {taskSummary.map((item) => (
              <div
                key={item.user_id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-black text-slate-900 dark:text-white">
                      {item.display_name}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-white/50 mt-1">
                      {item.email ? item.email : `Mitglied-ID: ${item.user_id}`}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-black text-slate-900 dark:text-white">
                      Gesamt: {item.assigned_tasks_count}
                    </div>
                    <div className="text-slate-500 dark:text-white/50">
                      Offen: {item.open_tasks_count}
                    </div>
                    <div className="text-slate-500 dark:text-white/50">
                      Erledigt: {item.completed_tasks_count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="app-card space-y-3">
          <h2 className="text-lg font-black">Kernteam Verwaltung</h2>

          <div className="text-sm text-slate-500 dark:text-white/60">
            Die Anzeige ist vorbereitet. Das Hinzufügen und Entfernen von Kernteam-Mitgliedern braucht jetzt noch die Backend-Routen und die Projekttabelle dafür.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCoreTeamView;
