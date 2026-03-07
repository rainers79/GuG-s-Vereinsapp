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
const LS_PROJECT_CHAT_GROUP_ID = 'gug_active_project_chat_group';
const LS_PROJECT_CHAT_OPEN_GROUP_ID = 'gug_open_project_chat_group';

const ProjectChatView: React.FC<Props> = ({ user, onUnauthorized }) => {
  const [project, setProject] = useState<ProjectLite | null>(null);

  const [groups, setGroups] = useState<ProjectChatGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(() => {
    const raw = localStorage.getItem(LS_PROJECT_CHAT_GROUP_ID);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  const [openChatGroupId, setOpenChatGroupId] = useState<number | null>(() => {
    const raw = localStorage.getItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMembers, setGroupMembers] = useState<ProjectChatGroupMember[]>([]);
  const [permissions, setPermissions] = useState<ProjectChatPermission[]>([]);

  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCanWrite, setNewGroupCanWrite] = useState(true);
  const [newGroupCanUploadImages, setNewGroupCanUploadImages] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<string>('');
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
    return groups.find((group) => group.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const openChatGroup = useMemo(() => {
    return groups.find((group) => group.id === openChatGroupId) || null;
  }, [groups, openChatGroupId]);

  useEffect(() => {
    if (!selectedGroup) return;
    setEditingProjectId(String(selectedGroup.project_id));
    setEditingGroupName(selectedGroup.name);
    setEditingGroupCanWrite(selectedGroup.can_write);
    setEditingGroupCanUploadImages(selectedGroup.can_upload_images);
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem(LS_PROJECT_CHAT_GROUP_ID, String(selectedGroupId));
    } else {
      localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (openChatGroupId) {
      localStorage.setItem(LS_PROJECT_CHAT_OPEN_GROUP_ID, String(openChatGroupId));
    } else {
      localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
    }
  }, [openChatGroupId]);

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
        setOpenChatGroupId(null);
        setMessages([]);
        setGroupMembers([]);
        setPermissions([]);
        return;
      }

      setSelectedGroupId((prev) => {
        if (prev && list.some((group) => group.id === prev)) {
          return prev;
        }
        return list[0].id;
      });

      setOpenChatGroupId((prev) => {
        if (prev && list.some((group) => group.id === prev)) {
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

    try {
      const data = await api.getMembers(onUnauthorized);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    try {
      const data = await api.getProjectChatGroupMembers(groupId, onUnauthorized);
      const list = Array.isArray(data) ? data : [];
      setGroupMembers(list);
      setSelectedMemberIds(list.map((item) => Number(item.user_id)));
    } catch {
      setGroupMembers([]);
      setSelectedMemberIds([]);
    }
  };

  const loadPermissions = async (groupId: number) => {
    try {
      const data = await api.getProjectChatPermissions(groupId, onUnauthorized);
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      setPermissions([]);
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
    if (!selectedGroupId) return;
    loadGroupMembers(selectedGroupId);
    loadPermissions(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    if (!openChatGroupId) {
      setMessages([]);
      return;
    }
    loadMessages(openChatGroupId);
  }, [openChatGroupId]);

  useEffect(() => {
    if (!openChatGroupId || !activeProjectId) return;

    const interval = setInterval(() => {
      loadMessages(openChatGroupId);
    }, 5000);

    return () => clearInterval(interval);
  }, [openChatGroupId, activeProjectId]);

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
        setOpenChatGroupId(null);
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
    const nextProjectId = Number(editingProjectId);

    if (!name) {
      setError('Gruppenname fehlt.');
      return;
    }

    if (!Number.isFinite(nextProjectId) || nextProjectId <= 0) {
      setError('Projekt-Zuordnung fehlt.');
      return;
    }

    setSavingGroup(true);
    setError(null);
    setSuccess(null);

    try {
      await api.updateProjectChatGroup(
        selectedGroup.id,
        {
          project_id: nextProjectId,
          name,
          can_write: editingGroupCanWrite,
          can_upload_images: editingGroupCanUploadImages
        },
        onUnauthorized
      );

      const projectChanged = Number(selectedGroup.project_id) !== nextProjectId;

      setSuccess(projectChanged ? 'Gruppe wurde einem anderen Projekt zugeordnet.' : 'Gruppe gespeichert.');

      if (projectChanged) {
        if (openChatGroupId === selectedGroup.id) {
          setOpenChatGroupId(null);
        }
        setSelectedGroupId(null);
        await loadGroups();
        return;
      }

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

  const handleOpenChat = async () => {
    if (!selectedGroup) {
      setError('Keine Gruppe ausgewählt.');
      return;
    }

    setOpenChatGroupId(selectedGroup.id);
    setNewMessage('');
    await loadMessages(selectedGroup.id);
  };

  const handleCloseChat = () => {
    setOpenChatGroupId(null);
    setMessages([]);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    const message = newMessage.trim();

    if (!openChatGroup) {
      setError('Kein Chat geöffnet.');
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
          group_id: openChatGroup.id,
          message,
          message_type: 'text'
        },
        onUnauthorized
      );

      setNewMessage('');
      await loadMessages(openChatGroup.id);
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
          <h1 className="text-2xl font-black">Projekt Chat Verwaltung</h1>
          <div className="text-sm text-slate-500 dark:text-white/60">
            Projekt:{' '}
            <span className="font-black text-slate-900 dark:text-white">
              {project?.title || `Projekt #${activeProjectId}`}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-6">
          <div className="app-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Gruppen</h2>
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
              <div className="space-y-2">
                {groups.map((group) => {
                  const isSelected = group.id === selectedGroupId;
                  const isOpen = group.id === openChatGroupId;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`w-full text-left rounded-xl px-4 py-3 transition ${
                        isSelected
                          ? 'bg-[#B5A47A] text-[#1A1A1A]'
                          : 'bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-black">{group.name}</div>
                          <div className={`text-[11px] mt-1 ${isSelected ? 'text-[#1A1A1A]/70' : 'text-slate-500 dark:text-white/50'}`}>
                            Schreiben: {group.can_write ? 'ja' : 'nein'} · Bilder: {group.can_upload_images ? 'ja' : 'nein'}
                          </div>
                        </div>

                        {isOpen && (
                          <div className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-[#1A1A1A]/70' : 'text-[#B5A47A]'}`}>
                            Chat offen
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="app-card space-y-4">
              <h2 className="text-lg font-black">Gruppe anlegen</h2>

              <div className="space-y-2">
                <label className="form-label">Gruppenname</label>
                <input
                  className="form-input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="z.B. Leitungsteam"
                  disabled={creatingGroup}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Projekt</label>
                <input
                  className="form-input"
                  value={project?.title || `Projekt #${activeProjectId}`}
                  disabled
                />
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={newGroupCanWrite}
                  onChange={(e) => setNewGroupCanWrite(e.target.checked)}
                  disabled={creatingGroup}
                />
                <span>Gruppe darf schreiben</span>
              </label>

              <label className="flex items-center gap-3 text-sm">
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
        </div>

        <div className="space-y-6">
          {!selectedGroup ? (
            <div className="app-card">
              <div className="text-sm text-slate-500 dark:text-white/60">
                Bitte zuerst links eine Gruppe auswählen. Erst danach kannst du sie bearbeiten, Mitglieder zuweisen, Rechte setzen oder den Chat öffnen.
              </div>
            </div>
          ) : (
            <>
              <div className="app-card space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black">Gruppenverwaltung</h2>
                    <div className="text-sm text-slate-500 dark:text-white/60 mt-1">
                      Ausgewählt:{' '}
                      <span className="font-black text-slate-900 dark:text-white">
                        {selectedGroup.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {openChatGroupId === selectedGroup.id ? (
                      <button
                        type="button"
                        onClick={handleCloseChat}
                        className="btn-secondary"
                      >
                        Chat schließen
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenChat}
                        className="btn-primary"
                      >
                        Chat öffnen
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid xl:grid-cols-3 gap-6">
                  <div className="app-card space-y-4">
                    <h3 className="text-lg font-black">Gruppe bearbeiten</h3>

                    <div className="space-y-2">
                      <label className="form-label">Projekt-ID</label>
                      <input
                        className="form-input"
                        value={editingProjectId}
                        onChange={(e) => setEditingProjectId(e.target.value)}
                        disabled={savingGroup}
                        placeholder="Projekt-ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="form-label">Gruppenname</label>
                      <input
                        className="form-input"
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        disabled={savingGroup}
                      />
                    </div>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={editingGroupCanWrite}
                        onChange={(e) => setEditingGroupCanWrite(e.target.checked)}
                        disabled={savingGroup}
                      />
                      <span>Gruppe darf schreiben</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={editingGroupCanUploadImages}
                        onChange={(e) => setEditingGroupCanUploadImages(e.target.checked)}
                        disabled={savingGroup}
                      />
                      <span>Gruppe darf Bilder senden</span>
                    </label>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveGroup}
                        disabled={savingGroup || !editingGroupName.trim() || !editingProjectId.trim()}
                        className="btn-primary"
                      >
                        {savingGroup ? '...' : 'Gruppe speichern'}
                      </button>
                    </div>
                  </div>

                  <div className="app-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">Mitglieder</h3>
                      <button
                        type="button"
                        onClick={() => loadGroupMembers(selectedGroup.id)}
                        className="btn-secondary"
                      >
                        Laden
                      </button>
                    </div>

                    {loadingMembers ? (
                      <div className="text-sm text-slate-500 dark:text-white/60">Lädt…</div>
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

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveMembers}
                        disabled={savingMembers}
                        className="btn-primary"
                      >
                        {savingMembers ? '...' : 'Mitglieder speichern'}
                      </button>
                    </div>
                  </div>

                  <div className="app-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">Einzelrechte</h3>
                      <button
                        type="button"
                        onClick={() => loadPermissions(selectedGroup.id)}
                        className="btn-secondary"
                      >
                        Laden
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="form-label">Mitglied</label>
                      <select
                        className="form-input"
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
                      <label className="form-label">Schreibrecht</label>
                      <select
                        className="form-input"
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
                      <label className="form-label">Bildrecht</label>
                      <select
                        className="form-input"
                        value={permissionCanUploadImages}
                        onChange={(e) => setPermissionCanUploadImages(e.target.value)}
                        disabled={savingPermission}
                      >
                        <option value="inherit">Von Gruppe übernehmen</option>
                        <option value="allow">Erlauben</option>
                        <option value="deny">Verbieten</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSavePermission}
                        disabled={savingPermission || !permissionUserId}
                        className="btn-primary"
                      >
                        {savingPermission ? '...' : 'Rechte speichern'}
                      </button>
                    </div>

                    <div className="max-h-[160px] overflow-y-auto space-y-2">
                      {permissions.map((permission) => (
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {openChatGroup && (
                <div className="app-card space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black">Chat: {openChatGroup.name}</h2>
                      <div className="text-xs text-slate-500 dark:text-white/60 mt-1">
                        Projekt-ID: {openChatGroup.project_id} · Schreiben: {openChatGroup.can_write ? 'ja' : 'nein'} · Bilder: {openChatGroup.can_upload_images ? 'ja' : 'nein'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadMessages(openChatGroup.id)}
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectChatView;
