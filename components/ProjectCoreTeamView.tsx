import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppRole,
  Member,
  ProjectCoreTeamMember,
  ProjectLite,
  User
} from '../types';
import * as api from '../services/api';

/* =====================================================
   SECTION 01 - TYPES
===================================================== */

interface Props {
  user: User;
  onUnauthorized: () => void;
}

type CoreTeamDisplayItem = {
  user_id: number;
  display_name: string;
  email?: string;
  username?: string;
  profile_image_url?: string;
  assigned_tasks_count: number;
  open_tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
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
  const [coreTeamMembers, setCoreTeamMembers] = useState<ProjectCoreTeamMember[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingCoreTeam, setLoadingCoreTeam] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingCoreTeam, setSavingCoreTeam] = useState(false);

  const [selectedAddUserId, setSelectedAddUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setProject(null);
      setError(e?.message || 'Projekt konnte nicht geladen werden.');
    } finally {
      setLoadingProject(false);
    }
  }, [activeProjectId, onUnauthorized]);

  /* =====================================================
     SECTION 06 - LOAD CORETEAM
  ===================================================== */

  const loadCoreTeam = useCallback(async () => {
    if (!activeProjectId) return;

    setLoadingCoreTeam(true);

    try {
      const data = await api.getProjectCoreTeamMembers(activeProjectId, onUnauthorized);
      setCoreTeamMembers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setCoreTeamMembers([]);
      setError(e?.message || 'Kernteam konnte nicht geladen werden.');
    } finally {
      setLoadingCoreTeam(false);
    }
  }, [activeProjectId, onUnauthorized]);

  /* =====================================================
     SECTION 07 - LOAD MEMBERS
  ===================================================== */

  const loadMembers = useCallback(async () => {
    if (!isAdmin) return;

    setLoadingMembers(true);

    try {
      const data = await api.getMembers(onUnauthorized);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [isAdmin, onUnauthorized]);

  /* =====================================================
     SECTION 08 - INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!activeProjectId) return;

    setError(null);
    setSuccess(null);

    loadProject();
    loadCoreTeam();
    loadMembers();
  }, [activeProjectId, loadProject, loadCoreTeam, loadMembers]);

  /* =====================================================
     SECTION 09 - MEMBER MAPS
  ===================================================== */

  const memberMap = useMemo(() => {
    const map = new Map<number, Member>();

    for (const member of members) {
      map.set(Number(member.id), member);
    }

    return map;
  }, [members]);

  const assignedCoreTeamIds = useMemo(() => {
    return new Set(coreTeamMembers.map((item) => Number(item.user_id)));
  }, [coreTeamMembers]);

  /* =====================================================
     SECTION 10 - DISPLAY DATA
  ===================================================== */

  const displayCoreTeamMembers = useMemo<CoreTeamDisplayItem[]>(() => {
    return coreTeamMembers
      .map((item) => {
        const member = memberMap.get(Number(item.user_id));

        return {
          user_id: Number(item.user_id),
          display_name: item.display_name || getMemberDisplayName(member),
          email: item.email || member?.email || '',
          username: item.username || member?.username || '',
          profile_image_url: item.profile_image_url || undefined,
          assigned_tasks_count: Number(item.assigned_tasks_count || 0),
          open_tasks_count: Number(item.open_tasks_count || 0),
          completed_tasks_count: Number(item.completed_tasks_count || 0),
          created_at: item.created_at || ''
        };
      })
      .sort((a, b) => {
        if (b.assigned_tasks_count !== a.assigned_tasks_count) {
          return b.assigned_tasks_count - a.assigned_tasks_count;
        }
        return a.display_name.localeCompare(b.display_name, 'de');
      });
  }, [coreTeamMembers, memberMap]);

  const availableMembers = useMemo(() => {
    return members
      .filter((member) => !assignedCoreTeamIds.has(Number(member.id)))
      .sort((a, b) =>
        getMemberDisplayName(a).localeCompare(getMemberDisplayName(b), 'de')
      );
  }, [members, assignedCoreTeamIds]);

  /* =====================================================
     SECTION 11 - ACTIONS
  ===================================================== */

  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);

    await Promise.all([
      loadProject(),
      loadCoreTeam(),
      loadMembers()
    ]);
  };

  const handleAddMember = async () => {
    const nextUserId = Number(selectedAddUserId);

    if (!isAdmin) {
      setError('Keine Berechtigung für die Kernteam-Verwaltung.');
      return;
    }

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    if (!Number.isFinite(nextUserId) || nextUserId <= 0) {
      setError('Bitte ein Mitglied auswählen.');
      return;
    }

    const nextIds = Array.from(new Set([
      ...coreTeamMembers.map((item) => Number(item.user_id)),
      nextUserId
    ]));

    setSavingCoreTeam(true);
    setError(null);
    setSuccess(null);

    try {
      await api.saveProjectCoreTeamMembers(
        {
          project_id: activeProjectId,
          members: nextIds
        },
        onUnauthorized
      );

      setSelectedAddUserId('');
      setSuccess('Mitglied wurde ins Kernteam aufgenommen.');
      await loadCoreTeam();
    } catch (e: any) {
      setError(e?.message || 'Mitglied konnte nicht hinzugefügt werden.');
    } finally {
      setSavingCoreTeam(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!isAdmin) {
      setError('Keine Berechtigung für die Kernteam-Verwaltung.');
      return;
    }

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    const nextIds = coreTeamMembers
      .map((item) => Number(item.user_id))
      .filter((id) => id !== Number(userId));

    setSavingCoreTeam(true);
    setError(null);
    setSuccess(null);

    try {
      await api.saveProjectCoreTeamMembers(
        {
          project_id: activeProjectId,
          members: nextIds
        },
        onUnauthorized
      );

      setSuccess('Mitglied wurde aus dem Kernteam entfernt.');
      await loadCoreTeam();
    } catch (e: any) {
      setError(e?.message || 'Mitglied konnte nicht entfernt werden.');
    } finally {
      setSavingCoreTeam(false);
    }
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
      {success && <div className="alert-success">{success}</div>}

      <div className="app-card space-y-3">
        <h1 className="text-2xl font-black">Projekt Kernteam</h1>

        <div className="text-sm text-slate-500 dark:text-white/60">
          Projekt:{' '}
          <span className="font-black text-slate-900 dark:text-white">
            {loadingProject ? 'Lädt...' : (project?.title || `Projekt #${activeProjectId}`)}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-white/50">
          Hier siehst du, wer im Kernteam ist und wie viele Aufgaben den jeweiligen Personen im Projekt zugewiesen sind.
        </div>
      </div>

      <div className="app-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Kernteam Übersicht</h2>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingProject || loadingCoreTeam || loadingMembers || savingCoreTeam}
            className="btn-secondary"
          >
            {loadingProject || loadingCoreTeam || loadingMembers || savingCoreTeam ? '...' : 'Aktualisieren'}
          </button>
        </div>

        {loadingCoreTeam ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Kernteam wird geladen...
          </div>
        ) : displayCoreTeamMembers.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Aktuell sind in diesem Projekt noch keine Mitglieder im Kernteam eingetragen.
          </div>
        ) : (
          <div className="space-y-3">
            {displayCoreTeamMembers.map((item) => (
              <div
                key={item.user_id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#B5A47A] flex-shrink-0">
                      {item.profile_image_url ? (
                        <img
                          src={item.profile_image_url}
                          alt={item.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="font-black text-slate-900 dark:text-white">
                        {item.display_name}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-white/50 mt-1">
                        {item.email || item.username || `Mitglied-ID: ${item.user_id}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
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

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(item.user_id)}
                        disabled={savingCoreTeam}
                        className="btn-secondary"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="app-card space-y-4">
          <h2 className="text-lg font-black">Kernteam Verwaltung</h2>

          {loadingMembers ? (
            <div className="text-sm text-slate-500 dark:text-white/60">
              Mitglieder werden geladen...
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-white/60">
              Es sind aktuell keine weiteren Mitglieder verfügbar, die ins Kernteam aufgenommen werden können.
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-[1fr_auto] gap-3">
                <select
                  className="form-input"
                  value={selectedAddUserId}
                  onChange={(e) => setSelectedAddUserId(e.target.value)}
                  disabled={savingCoreTeam}
                >
                  <option value="">Mitglied auswählen</option>
                  {availableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getMemberDisplayName(member)}{member.email ? ` (${member.email})` : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={savingCoreTeam || !selectedAddUserId}
                  className="btn-primary"
                >
                  {savingCoreTeam ? '...' : 'Zum Kernteam hinzufügen'}
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-white/50">
                Superadmin und Vorstand können Mitglieder hier direkt aufnehmen oder aus dem Kernteam entfernen.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCoreTeamView;
