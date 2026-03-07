import React, { useEffect, useMemo, useState } from 'react';
import {
  AppRole,
  Member,
  ProjectChatGroup,
  ProjectChatGroupMember,
  ProjectChatMessage,
  ProjectChatPermission,
  User
} from '../types';
import * as api from '../services/api';

interface Props {
  user: User;
  onUnauthorized: () => void;
}

type ProjectLite = {
  id: number;
  title?: string;
  description?: string;
};

const LS_ACTIVE_PROJECT = 'gug_active_project';

const ProjectChatView: React.FC<Props> = ({ user, onUnauthorized }) => {
  const [project, setProject] = useState<ProjectLite | null>(null);

  const [groups, setGroups] = useState<ProjectChatGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMembers, setGroupMembers] = useState<ProjectChatGroupMember[]>([]);
  const [permissions, setPermissions] = useState<ProjectChatPermission[]>([]);

  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [memberLoadError, setMemberLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCanWrite, setNewGroupCanWrite] = useState(true);
  const [newGroupCanUploadImages, setNewGroupCanUploadImages] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupCanWrite, setEditingGroupCanWrite] = useState(true);
  const [editingGroupCanUploadImages, setEditingGroupCanUploadImages] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);

  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const [permissionUserId, setPermissionUserId] = useState<string>('');
  const [permissionCanWrite, setPermissionCanWrite] = useState<string>('inherit');
  const [permissionCanUploadImages, setPermissionCanUploadImages] = useState<string>('inherit');
  const [savingPermission, setSavingPermission] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const isAdmin = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  const activeProjectId = useMemo(() => {
    const raw = localStorage.getItem(LS_ACTIVE_PROJECT);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, []);

  const selectedGroup = useMemo(() => {
    return groups.find((group) => Number(group.id) === Number(selectedGroupId)) || null;
  }, [groups, selectedGroupId]);

  const selectedGroupMembersDetailed = useMemo(() => {
    const selectedIds = new Set(groupMembers.map((item) => Number(item.user_id)));
    return members.filter((member) => selectedIds.has(Number(member.id)));
  }, [members, groupMembers]);

  useEffect(() => {
    if (!selectedGroup) return;
    setEditingGroupName(selectedGroup.name);
    setEditingGroupCanWrite(selectedGroup.can_write);
    setEditingGroupCanUploadImages(selectedGroup.can_upload_images);
  }, [selectedGroup]);

  useEffect(() => {
    if (!activeProjectId) return;

    api.apiRequest<ProjectLite[]>('/gug/v1/projects', {}, onUnauthorized)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find((item) => Number(item.id) === Number(activeProjectId)) || null;
        setProject(found);
      })
      .catch(() => {
        setProject(null);
      });
  }, [activeProjectId, onUnauthorized]);

  const loadGroups = async () => {
    if (!activeProjectId) return;

    setLoadingGroups(true);
    setError(null);

    try {
      const data = await api.getProjectChatGroups(activeProjectId, onUnauthorized);
      const list = Array.isArray(data) ? data : [];
      setGroups(list);

      if (list.length === 0) {
        setSelectedGroupId(null);
        setMessages([]);
        setGroupMembers([]);
        setPermissions([]);
        return;
      }

      setSelectedGroupId((prev) => {
        if (prev && list.some((group) => Number(group.id) === Number(prev))) {
          return prev;
        }
        return null;
      });
    } catch (e: any) {
      setError(e?.message || 'Chat-Gruppen konnten nicht geladen werden.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadAllMembers = async () => {
    if (!isAdmin) return;

    setLoadingMembers(true);
    setMemberLoadError(null);

    try {
      const data = await api.getMembers(onUnauthorized);
      setMembers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMembers([]);
      setMemberLoadError(e?.message || 'Mitglieder konnten nicht geladen werden.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    setLoadingGroupMembers(true);

    try {
      const data = await api.getProjectChatGroupMembers(groupId, onUnauthorized);
      const list = Array.isArray(data) ? data : [];
      setGroupMembers(list);
      setSelectedMemberIds(list.map((item) => Number(item.user_id)));
    } catch (e: any) {
      setGroupMembers([]);
      setSelectedMemberIds([]);
      setError(e?.message || 'Gruppenmitglieder konnten nicht geladen werden.');
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const loadPermissions = async (groupId: number) => {
    setLoadingPermissions(true);

    try {
      const data = await api.getProjectChatPermissions(groupId, onUnauthorized);
      setPermissions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setPermissions([]);
      setError(e?.message || 'Einzelrechte konnten nicht geladen werden.');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const loadMessages = async (groupId: number) => {
    if (!activeProjectId) return;

    setLoadingMessages(true);

    try {
      const data = await api.getProjectChatMessages(
        {
          project_id: activeProjectId,
          group_id: groupId,
          limit: 50
        },
        onUnauthorized
      );

      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Nachrichten konnten nicht geladen werden.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadGroups();
    loadAllMembers();
  }, [activeProjectId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setMessages([]);
      setGroupMembers([]);
      setPermissions([]);
      setSelectedMemberIds([]);
      setPermissionUserId('');
      return;
    }

    loadMessages(selectedGroupId);

    if (isAdmin) {
      loadGroupMembers(selectedGroupId);
      loadPermissions(selectedGroupId);
    }
  }, [selectedGroupId, isAdmin]);

  useEffect(() => {
    if (!selectedGroupId || !activeProjectId) return;

    const interval = setInterval(() => {
      loadMessages(selectedGroupId);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedGroupId, activeProjectId]);

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();

    if (!isAdmin) {
      setError('Keine Berechtigung zum Anlegen von Gruppen.');
      return;
    }

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    if (!name) {
      setError('Gruppenname fehlt.');
      return;
    }

    setCreatingGroup(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.createProjectChatGroup(
        {
          project_id: activeProjectId,
          name,
          can_write: newGroupCanWrite,
          can_upload_images: newGroupCanUploadImages
        },
        onUnauthorized
      );

      setNewGroupName('');
      setNewGroupCanWrite(true);
      setNewGroupCanUploadImages(false);
      setSuccess('Chat-Gruppe erstellt.');

      await loadGroups();

      if (result?.id) {
        setSelectedGroupId(Number(result.id));
      }
    } catch (e: any) {
      setError(e?.message || 'Chat-Gruppe konnte nicht erstellt werden.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!isAdmin || !selectedGroup) {
      setError('Keine Gruppe ausgewählt.');
      return;
    }

    const name = editingGroupName.trim();
    if (!name) {
      setError('Gruppenname fehlt.');
      return;
    }

    setSavingGroup(true);
    setError(null);
    setSuccess(null);

    try {
      await api.updateProjectChatGroup(
        selectedGroup.id,
        {
          name,
          can_write: editingGroupCanWrite,
          can_upload_images: editingGroupCanUploadImages
        },
        onUnauthorized
      );

      setSuccess('Gruppe gespeichert.');
      await loadGroups();
    } catch (e: any) {
      setError(e?.message || 'Gruppe konnte nicht gespeichert werden.');
    } finally {
      setSavingGroup(false);
    }
  };

  const toggleMemberSelection = (userId: number) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSaveMembers = async () => {
    if (!isAdmin || !selectedGroup) {
      setError('Keine Gruppe ausgewählt.');
      return;
    }

    setSavingMembers(true);
    setError(null);
    setSuccess(null);

    try {
      await api.saveProjectChatGroupMembers(
        {
          group_id: selectedGroup.id,
          members: selectedMemberIds
        },
        onUnauthorized
      );

      setSuccess('Gruppenmitglieder gespeichert.');
      await loadGroupMembers(selectedGroup.id);
    } catch (e: any) {
      setError(e?.message || 'Gruppenmitglieder konnten nicht gespeichert werden.');
    } finally {
      setSavingMembers(false);
    }
  };

  const handleSavePermission = async () => {
    if (!isAdmin || !selectedGroup) {
      setError('Keine Gruppe ausgewählt.');
      return;
    }

    const userId = Number(permissionUserId);

    if (!Number.isFinite(userId) || userId <= 0) {
      setError('Bitte ein Mitglied auswählen.');
      return;
    }

    setSavingPermission(true);
    setError(null);
    setSuccess(null);

    try {
      await api.saveProjectChatPermission(
        {
          group_id: selectedGroup.id,
          user_id: userId,
          can_write_override:
            permissionCanWrite === 'inherit'
              ? null
              : permissionCanWrite === 'allow',
          can_upload_images_override:
            permissionCanUploadImages === 'inherit'
              ? null
              : permissionCanUploadImages === 'allow'
        },
        onUnauthorized
      );

      setSuccess('Einzelrechte gespeichert.');
      setPermissionUserId('');
      setPermissionCanWrite('inherit');
      setPermissionCanUploadImages('inherit');
      await loadPermissions(selectedGroup.id);
    } catch (e: any) {
      setError(e?.message || 'Einzelrechte konnten nicht gespeichert werden.');
    } finally {
      setSavingPermission(false);
    }
  };

  const handleSendMessage = async () => {
    const message = newMessage.trim();

    if (!selectedGroup) {
      setError('Keine Gruppe ausgewählt.');
      return;
    }

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    if (!message) {
      return;
    }

    setSendingMessage(true);
    setError(null);
    setSuccess(null);

    try {
      await api.sendProjectChatMessage(
        {
          project_id: activeProjectId,
          group_id: selectedGroup.id,
          message,
          message_type: 'text'
        },
        onUnauthorized
      );

      setNewMessage('');
      await loadMessages(selectedGroup.id);
    } catch (e: any) {
      setError(e?.message || 'Nachricht konnte nicht gesendet werden.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!activeProjectId) {
    return (
      <div className="app-card">
        <div className="text-sm text-slate-500 dark:text-white/60">
          Kein aktives Projekt gewählt. Öffne zuerst ein Projekt im Projektrad.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="app-card">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black">Projekt Chat</h1>
          <div className="text-sm text-slate-500 dark:text-white/60">
            Projekt:{' '}
            <span className="font-black text-slate-900 dark:text-white">
              {project?.title || `Projekt #${activeProjectId}`}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-white/50">
            Zuerst Gruppe anlegen oder auswählen. Erst danach werden Bearbeitung, Mitglieder und Chat geöffnet.
          </div>
        </div>
      </div>

      {error && (
        <div className="app-card border border-red-200 bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="app-card border border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          {success}
        </div>
      )}

      <div className="grid xl:grid-cols-[340px_1fr] gap-6">
        <div className="space-y-6">
          {isAdmin && (
            <div className="app-card space-y-4">
              <h2 className="text-lg font-black">Neue Gruppe anlegen</h2>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50">
                  Gruppenname
                </label>
                <input
                  className="form-input w-full"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="z.B. Leitungsteam"
                  disabled={creatingGroup}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-white/80">
                <input
                  type="checkbox"
                  checked={newGroupCanWrite}
                  onChange={(e) => setNewGroupCanWrite(e.target.checked)}
                  disabled={creatingGroup}
                />
                <span>Gruppe darf schreiben</span>
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-white/80">
                <input
                  type="checkbox"
                  checked={newGroupCanUploadImages}
                  onChange={(e) => setNewGroupCanUploadImages(e.target.checked)}
                  disabled={creatingGroup}
                />
                <span>Gruppe darf Bilder senden</span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                  className="btn-primary"
                >
                  {creatingGroup ? '...' : 'Gruppe anlegen'}
                </button>
              </div>
            </div>
          )}

          <div className="app-card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Angelegte Gruppen</h2>
              <button
                type="button"
                onClick={loadGroups}
                disabled={loadingGroups}
                className="btn-secondary"
              >
                {loadingGroups ? '...' : 'Aktualisieren'}
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-white/60">
                Noch keine Chat-Gruppen vorhanden.
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => {
                  const isActive = Number(group.id) === Number(selectedGroupId);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`w-full text-left rounded-xl px-4 py-4 transition border ${
                        isActive
                          ? 'bg-[#B5A47A] text-[#1A1A1A] border-[#B5A47A]'
                          : 'bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-black">
                            {group.name}
                          </div>
                          <div className={`text-[11px] mt-2 ${isActive ? 'text-[#1A1A1A]/70' : 'text-slate-500 dark:text-white/50'}`}>
                            Schreiben: {group.can_write ? 'ja' : 'nein'}
                          </div>
                          <div className={`text-[11px] ${isActive ? 'text-[#1A1A1A]/70' : 'text-slate-500 dark:text-white/50'}`}>
                            Bilder: {group.can_upload_images ? 'ja' : 'nein'}
                          </div>
                        </div>

                        <div className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-[#1A1A1A]/70' : 'text-slate-400 dark:text-white/40'}`}>
                          {isActive ? 'Aktiv' : 'Öffnen'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!selectedGroup ? (
            <div className="app-card">
              <h2 className="text-lg font-black mb-3">Gruppenübersicht</h2>
              <div className="text-sm text-slate-500 dark:text-white/60">
                Wähle links eine vorhandene Gruppe aus. Erst dann wird der Bereich für Chat, Mitglieder und Rechte geöffnet.
              </div>
            </div>
          ) : (
            <>
              <div className="app-card space-y-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-black">{selectedGroup.name}</h2>
                  <div className="text-sm text-slate-500 dark:text-white/60">
                    Gruppenrechte: Schreiben {selectedGroup.can_write ? 'aktiv' : 'deaktiviert'} · Bilder {selectedGroup.can_upload_images ? 'aktiv' : 'deaktiviert'}
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                      <h3 className="text-base font-black mb-4">Gruppe bearbeiten</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50">
                            Gruppenname
                          </label>
                          <input
                            className="form-input w-full"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            disabled={savingGroup}
                          />
                        </div>

                        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-white/80">
                          <input
                            type="checkbox"
                            checked={editingGroupCanWrite}
                            onChange={(e) => setEditingGroupCanWrite(e.target.checked)}
                            disabled={savingGroup}
                          />
                          <span>Gruppe darf schreiben</span>
                        </label>

                        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-white/80">
                          <input
                            type="checkbox"
                            checked={editingGroupCanUploadImages}
                            onChange={(e) => setEditingGroupCanUploadImages(e.target.checked)}
                            disabled={savingGroup}
                          />
                          <span>Gruppe darf Bilder senden</span>
                        </label>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={handleSaveGroup}
                          disabled={savingGroup || !editingGroupName.trim()}
                          className="btn-primary"
                        >
                          {savingGroup ? '...' : 'Gruppe speichern'}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-base font-black">Mitglieder in dieser Gruppe</h3>
                        <button
                          type="button"
                          onClick={() => {
                            loadAllMembers();
                            loadGroupMembers(selectedGroup.id);
                          }}
                          className="btn-secondary"
                        >
                          Neu laden
                        </button>
                      </div>

                      {memberLoadError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-200">
                          {memberLoadError}
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50 mb-2">
                          Aktuell zugeordnet
                        </div>

                        {loadingGroupMembers ? (
                          <div className="text-sm text-slate-500 dark:text-white/60">Lädt…</div>
                        ) : selectedGroupMembersDetailed.length === 0 ? (
                          <div className="text-sm text-slate-500 dark:text-white/60">
                            Noch keine Mitglieder in dieser Gruppe.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedGroupMembersDetailed.map((member) => (
                              <div
                                key={member.id}
                                className="rounded-full bg-[#B5A47A] px-3 py-1 text-xs font-black text-[#1A1A1A]"
                              >
                                {member.display_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {loadingMembers ? (
                        <div className="text-sm text-slate-500 dark:text-white/60">Mitglieder werden geladen…</div>
                      ) : members.length === 0 ? (
                        <div className="text-sm text-slate-500 dark:text-white/60">
                          Keine Mitglieder verfügbar.
                        </div>
                      ) : (
                        <div className="max-h-[320px] overflow-y-auto space-y-2">
                          {members.map((member) => (
                            <label
                              key={member.id}
                              className="flex items-start gap-3 rounded-lg bg-slate-50 dark:bg-[#121212] p-3 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMemberIds.includes(Number(member.id))}
                                onChange={() => toggleMemberSelection(Number(member.id))}
                              />
                              <div>
                                <div className="font-black text-slate-900 dark:text-white">
                                  {member.display_name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-white/60">
                                  {member.email}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={handleSaveMembers}
                          disabled={savingMembers || loadingMembers}
                          className="btn-primary"
                        >
                          {savingMembers ? '...' : 'Mitglieder speichern'}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-base font-black">Einzelrechte</h3>
                        <button
                          type="button"
                          onClick={() => loadPermissions(selectedGroup.id)}
                          className="btn-secondary"
                        >
                          {loadingPermissions ? '...' : 'Rechte laden'}
                        </button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50">
                            Mitglied
                          </label>
                          <select
                            className="form-input w-full"
                            value={permissionUserId}
                            onChange={(e) => setPermissionUserId(e.target.value)}
                            disabled={savingPermission}
                          >
                            <option value="">Bitte auswählen</option>
                            {groupMembers.map((member) => (
                              <option key={member.user_id} value={member.user_id}>
                                {member.display_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50">
                            Schreibrecht
                          </label>
                          <select
                            className="form-input w-full"
                            value={permissionCanWrite}
                            onChange={(e) => setPermissionCanWrite(e.target.value)}
                            disabled={savingPermission}
                          >
                            <option value="inherit">Von Gruppe übernehmen</option>
                            <option value="allow">Erlauben</option>
                            <option value="deny">Verbieten</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50">
                            Bildrecht
                          </label>
                          <select
                            className="form-input w-full"
                            value={permissionCanUploadImages}
                            onChange={(e) => setPermissionCanUploadImages(e.target.value)}
                            disabled={savingPermission}
                          >
                            <option value="inherit">Von Gruppe übernehmen</option>
                            <option value="allow">Erlauben</option>
                            <option value="deny">Verbieten</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={handleSavePermission}
                          disabled={savingPermission || !permissionUserId}
                          className="btn-primary"
                        >
                          {savingPermission ? '...' : 'Rechte speichern'}
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {permissions.length === 0 ? (
                          <div className="text-sm text-slate-500 dark:text-white/60">
                            Keine Einzelrechte gespeichert.
                          </div>
                        ) : (
                          permissions.map((permission) => (
                            <div
                              key={`${permission.group_id}-${permission.user_id}`}
                              className="rounded-lg bg-slate-50 dark:bg-[#121212] p-3 text-xs"
                            >
                              <div className="font-black text-slate-900 dark:text-white">
                                {permission.display_name}
                              </div>
                              <div className="text-slate-500 dark:text-white/60 mt-1">
                                Schreiben:{' '}
                                {permission.can_write_override === null
                                  ? 'Gruppe'
                                  : permission.can_write_override
                                    ? 'Erlaubt'
                                    : 'Verboten'}
                              </div>
                              <div className="text-slate-500 dark:text-white/60">
                                Bilder:{' '}
                                {permission.can_upload_images_override === null
                                  ? 'Gruppe'
                                  : permission.can_upload_images_override
                                    ? 'Erlaubt'
                                    : 'Verboten'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="app-card space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">Chat · {selectedGroup.name}</h3>
                    <div className="text-xs text-slate-500 dark:text-white/60">
                      Der Chat öffnet sich erst nach Auswahl einer Gruppe.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadMessages(selectedGroup.id)}
                    disabled={loadingMessages}
                    className="btn-secondary"
                  >
                    {loadingMessages ? '...' : 'Chat laden'}
                  </button>
                </div>

                <div className="h-[420px] overflow-y-auto rounded-xl bg-slate-50 dark:bg-[#121212] p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-sm text-slate-500 dark:text-white/60">
                      Noch keine Nachrichten vorhanden.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const own = Number(message.user_id) === Number(user.id);

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${own ? 'justify-end' : 'justify-start'}`}
                        >
                          {!own && (
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#B5A47A] flex-shrink-0">
                              {message.profile_image_url ? (
                                <img
                                  src={message.profile_image_url}
                                  alt={message.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>
                          )}

                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              own
                                ? 'bg-[#B5A47A] text-[#1A1A1A]'
                                : 'bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10'
                            }`}
                          >
                            <div className={`text-[11px] font-black mb-1 ${own ? 'text-[#1A1A1A]/70' : 'text-slate-500 dark:text-white/50'}`}>
                              {message.display_name}
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {message.message}
                            </div>
                            <div className={`text-[10px] mt-2 ${own ? 'text-[#1A1A1A]/60' : 'text-slate-400 dark:text-white/40'}`}>
                              {new Date(message.created_at).toLocaleString('de-AT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    className="form-input flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nachricht schreiben..."
                    disabled={sendingMessage}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="btn-primary"
                  >
                    {sendingMessage ? '...' : 'Senden'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectChatView;
