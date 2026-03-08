import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppRole,
  Member,
  ProjectLite,
  ProjectShoppingItem,
  ProjectShoppingStatus,
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

const formatDateTime = (raw?: string | null): string => {
  if (!raw) return '';
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getMemberDisplayLabel = (member: Member): string => {
  const base = member.display_name || member.username || member.email || `Mitglied #${member.id}`;
  return member.email ? `${base} (${member.email})` : base;
};

/* =====================================================
   SECTION 04 - COMPONENT
===================================================== */

const ProjectShoppingView: React.FC<Props> = ({ user, onUnauthorized }) => {
  const [project, setProject] = useState<ProjectLite | null>(null);
  const [items, setItems] = useState<ProjectShoppingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [creatingItem, setCreatingItem] = useState(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [creatingTaskItemId, setCreatingTaskItemId] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newAssignedUserId, setNewAssignedUserId] = useState<string>('');

  const [editingItems, setEditingItems] = useState<Record<number, {
    title: string;
    description: string;
    quantity: string;
    unit: string;
    assigned_user_id: string;
  }>>({});

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeProjectId = useMemo(() => getStoredProjectId(), []);
  const isAdmin = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  /* =====================================================
     SECTION 05 - LOADERS
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

  const loadItems = useCallback(async () => {
    if (!activeProjectId) return;

    setLoadingItems(true);

    try {
      const data = await api.getProjectShoppingItems(activeProjectId, onUnauthorized);
      const list = Array.isArray(data) ? data : [];
      setItems(list);

      const nextEditing: Record<number, {
        title: string;
        description: string;
        quantity: string;
        unit: string;
        assigned_user_id: string;
      }> = {};

      for (const item of list) {
        nextEditing[item.id] = {
          title: item.title || '',
          description: item.description || '',
          quantity: item.quantity || '',
          unit: item.unit || '',
          assigned_user_id:
            item.assigned_user_id && Number(item.assigned_user_id) > 0
              ? String(item.assigned_user_id)
              : ''
        };
      }

      setEditingItems(nextEditing);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || 'Einkaufsliste konnte nicht geladen werden.');
    } finally {
      setLoadingItems(false);
    }
  }, [activeProjectId, onUnauthorized]);

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
     SECTION 06 - INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!activeProjectId) return;

    setError(null);
    setSuccess(null);

    loadProject();
    loadItems();
    loadMembers();
  }, [activeProjectId, loadProject, loadItems, loadMembers]);

  /* =====================================================
     SECTION 07 - MEMOS
  ===================================================== */

  const openItems = useMemo(() => {
    return items.filter((item) => item.status === 'open');
  }, [items]);

  const boughtItems = useMemo(() => {
    return items.filter((item) => item.status === 'bought');
  }, [items]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) =>
      getMemberDisplayLabel(a).localeCompare(getMemberDisplayLabel(b), 'de')
    );
  }, [members]);

  /* =====================================================
     SECTION 08 - STATE HELPERS
  ===================================================== */

  const updateEditingField = (
    itemId: number,
    field: 'title' | 'description' | 'quantity' | 'unit' | 'assigned_user_id',
    value: string
  ) => {
    setEditingItems((prev) => ({
      ...prev,
      [itemId]: {
        title: prev[itemId]?.title || '',
        description: prev[itemId]?.description || '',
        quantity: prev[itemId]?.quantity || '',
        unit: prev[itemId]?.unit || '',
        assigned_user_id: prev[itemId]?.assigned_user_id || '',
        [field]: value
      }
    }));
  };

  const canToggleItem = (item: ProjectShoppingItem): boolean => {
    if (isAdmin) return true;
    return Number(item.assigned_user_id || 0) === Number(user.id);
  };

  /* =====================================================
     SECTION 09 - ACTIONS
  ===================================================== */

  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);

    await Promise.all([
      loadProject(),
      loadItems(),
      loadMembers()
    ]);
  };

  const handleCreateItem = async () => {
    const title = newTitle.trim();

    if (!isAdmin) {
      setError('Keine Berechtigung zum Anlegen von Einkaufsposten.');
      return;
    }

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    if (!title) {
      setError('Titel fehlt.');
      return;
    }

    setCreatingItem(true);
    setError(null);
    setSuccess(null);

    try {
      await api.createProjectShoppingItem(
        {
          project_id: activeProjectId,
          title,
          description: newDescription.trim(),
          quantity: newQuantity.trim(),
          unit: newUnit.trim(),
          assigned_user_id: newAssignedUserId ? Number(newAssignedUserId) : null
        },
        onUnauthorized
      );

      setNewTitle('');
      setNewDescription('');
      setNewQuantity('');
      setNewUnit('');
      setNewAssignedUserId('');
      setSuccess('Einkaufsposten wurde angelegt.');

      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Einkaufsposten konnte nicht angelegt werden.');
    } finally {
      setCreatingItem(false);
    }
  };

  const handleSaveItem = async (item: ProjectShoppingItem) => {
    if (!isAdmin) {
      setError('Keine Berechtigung zum Bearbeiten.');
      return;
    }

    const edit = editingItems[item.id];
    if (!edit) {
      setError('Bearbeitungsdaten fehlen.');
      return;
    }

    const title = edit.title.trim();

    if (!title) {
      setError('Titel fehlt.');
      return;
    }

    setSavingItemId(item.id);
    setError(null);
    setSuccess(null);

    try {
      await api.updateProjectShoppingItem(
        item.id,
        {
          title,
          description: edit.description.trim(),
          quantity: edit.quantity.trim(),
          unit: edit.unit.trim(),
          assigned_user_id: edit.assigned_user_id ? Number(edit.assigned_user_id) : null
        },
        onUnauthorized
      );

      setSuccess('Einkaufsposten wurde gespeichert.');
      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Einkaufsposten konnte nicht gespeichert werden.');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleToggleItemStatus = async (item: ProjectShoppingItem) => {
    if (!canToggleItem(item)) {
      setError('Keine Berechtigung zum Abhaken dieses Postens.');
      return;
    }

    const nextStatus: ProjectShoppingStatus = item.status === 'bought' ? 'open' : 'bought';

    setSavingItemId(item.id);
    setError(null);
    setSuccess(null);

    try {
      await api.updateProjectShoppingItem(
        item.id,
        { status: nextStatus },
        onUnauthorized
      );

      setSuccess(
        nextStatus === 'bought'
          ? 'Einkaufsposten wurde als gekauft markiert.'
          : 'Einkaufsposten wurde wieder geöffnet.'
      );

      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Status konnte nicht geändert werden.');
    } finally {
      setSavingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!isAdmin) {
      setError('Keine Berechtigung zum Löschen.');
      return;
    }

    setDeletingItemId(itemId);
    setError(null);
    setSuccess(null);

    try {
      await api.deleteProjectShoppingItem(itemId, onUnauthorized);
      setSuccess('Einkaufsposten wurde gelöscht.');
      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Einkaufsposten konnte nicht gelöscht werden.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleCreateTaskFromItem = async (itemId: number) => {
    if (!isAdmin) {
      setError('Keine Berechtigung zum Erzeugen einer Aufgabe.');
      return;
    }

    setCreatingTaskItemId(itemId);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.createTaskFromProjectShoppingItem(itemId, onUnauthorized);
      setSuccess(result?.message || 'Aufgabe wurde erzeugt.');
      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Aufgabe konnte nicht erzeugt werden.');
    } finally {
      setCreatingTaskItemId(null);
    }
  };

  /* =====================================================
     SECTION 10 - EARLY RETURN
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
     SECTION 11 - ITEM CARD
  ===================================================== */

  const renderItemCard = (item: ProjectShoppingItem) => {
    const edit = editingItems[item.id] || {
      title: item.title || '',
      description: item.description || '',
      quantity: item.quantity || '',
      unit: item.unit || '',
      assigned_user_id: item.assigned_user_id ? String(item.assigned_user_id) : ''
    };

    const isSaving = savingItemId === item.id;
    const isDeleting = deletingItemId === item.id;
    const isCreatingTask = creatingTaskItemId === item.id;
    const canToggle = canToggleItem(item);

    return (
      <div
        key={item.id}
        className={`rounded-xl border p-4 space-y-4 ${
          item.status === 'bought'
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
            : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#121212]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-black text-slate-900 dark:text-white">
                {item.title}
              </div>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${
                  item.status === 'bought'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-[#1A1A1A]'
                }`}
              >
                {item.status === 'bought' ? 'Gekauft' : 'Offen'}
              </span>

              {item.linked_task_id ? (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-[#B5A47A] text-[#1A1A1A]">
                  Task #{item.linked_task_id}
                </span>
              ) : null}
            </div>

            <div className="text-xs text-slate-500 dark:text-white/50 mt-2">
              Zugewiesen an:{' '}
              <span className="font-black text-slate-700 dark:text-white/80">
                {item.assigned_user_name || 'Niemand'}
              </span>
            </div>

            {item.status === 'bought' && (item.completed_at || item.completed_by_name) ? (
              <div className="text-xs text-slate-500 dark:text-white/50 mt-1">
                Erledigt:{' '}
                <span className="font-black text-slate-700 dark:text-white/80">
                  {item.completed_by_name || 'Unbekannt'}
                </span>
                {item.completed_at ? ` · ${formatDateTime(item.completed_at)}` : ''}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleToggleItemStatus(item)}
              disabled={isSaving || !canToggle}
              className="btn-secondary"
            >
              {isSaving
                ? '...'
                : item.status === 'bought'
                  ? 'Wieder öffnen'
                  : 'Als gekauft markieren'}
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveItem(item)}
                  disabled={isSaving || isDeleting}
                  className="btn-primary"
                >
                  {isSaving ? '...' : 'Speichern'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateTaskFromItem(item.id)}
                  disabled={isSaving || isDeleting || isCreatingTask}
                  className="btn-secondary"
                >
                  {isCreatingTask ? '...' : item.linked_task_id ? 'Task vorhanden' : 'Als Aufgabe anlegen'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isSaving || isDeleting}
                  className="btn-secondary"
                >
                  {isDeleting ? '...' : 'Löschen'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="form-label">Titel</label>
            <input
              className="form-input"
              value={edit.title}
              onChange={(e) => updateEditingField(item.id, 'title', e.target.value)}
              disabled={!isAdmin || isSaving || isDeleting}
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Zugewiesene Person</label>
            <select
              className="form-input"
              value={edit.assigned_user_id}
              onChange={(e) => updateEditingField(item.id, 'assigned_user_id', e.target.value)}
              disabled={!isAdmin || isSaving || isDeleting || loadingMembers}
            >
              <option value="">Niemand</option>
              {sortedMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {getMemberDisplayLabel(member)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="form-label">Menge</label>
            <input
              className="form-input"
              value={edit.quantity}
              onChange={(e) => updateEditingField(item.id, 'quantity', e.target.value)}
              disabled={!isAdmin || isSaving || isDeleting}
              placeholder="z.B. 10"
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Einheit</label>
            <input
              className="form-input"
              value={edit.unit}
              onChange={(e) => updateEditingField(item.id, 'unit', e.target.value)}
              disabled={!isAdmin || isSaving || isDeleting}
              placeholder="z.B. kg, Stück, Flaschen"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="form-label">Beschreibung</label>
            <textarea
              className="form-input min-h-[88px]"
              value={edit.description}
              onChange={(e) => updateEditingField(item.id, 'description', e.target.value)}
              disabled={!isAdmin || isSaving || isDeleting}
              placeholder="Zusätzliche Hinweise"
            />
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     SECTION 12 - RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="app-card space-y-3">
        <h1 className="text-2xl font-black">Projekt Einkaufsliste</h1>

        <div className="text-sm text-slate-500 dark:text-white/60">
          Projekt:{' '}
          <span className="font-black text-slate-900 dark:text-white">
            {loadingProject ? 'Lädt...' : (project?.title || `Projekt #${activeProjectId}`)}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-white/50">
          Hier siehst du die projektbezogene Gesamtliste aller Einkaufsposten inklusive Zuständigkeit und Status.
        </div>
      </div>

      <div className="app-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">Gesamtübersicht</h2>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingProject || loadingItems || loadingMembers || creatingItem || savingItemId !== null}
            className="btn-secondary"
          >
            {loadingProject || loadingItems || loadingMembers || creatingItem || savingItemId !== null ? '...' : 'Aktualisieren'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]">
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Gesamt
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {items.length}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Offen
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {openItems.length}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Gekauft
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {boughtItems.length}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="app-card space-y-4">
          <h2 className="text-lg font-black">Neuen Einkaufsposten anlegen</h2>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="form-label">Titel</label>
              <input
                className="form-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={creatingItem}
                placeholder="z.B. Burger Buns"
              />
            </div>

            <div className="space-y-2">
              <label className="form-label">Zugewiesene Person</label>
              <select
                className="form-input"
                value={newAssignedUserId}
                onChange={(e) => setNewAssignedUserId(e.target.value)}
                disabled={creatingItem || loadingMembers}
              >
                <option value="">Niemand</option>
                {sortedMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberDisplayLabel(member)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="form-label">Menge</label>
              <input
                className="form-input"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                disabled={creatingItem}
                placeholder="z.B. 10"
              />
            </div>

            <div className="space-y-2">
              <label className="form-label">Einheit</label>
              <input
                className="form-input"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                disabled={creatingItem}
                placeholder="z.B. Stück"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="form-label">Beschreibung</label>
              <textarea
                className="form-input min-h-[88px]"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                disabled={creatingItem}
                placeholder="Zusätzliche Hinweise"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCreateItem}
              disabled={creatingItem || !newTitle.trim()}
              className="btn-primary"
            >
              {creatingItem ? '...' : 'Einkaufsposten anlegen'}
            </button>
          </div>
        </div>
      )}

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Offene Posten</h2>

        {loadingItems ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Einkaufsliste wird geladen...
          </div>
        ) : openItems.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Aktuell sind keine offenen Einkaufsposten vorhanden.
          </div>
        ) : (
          <div className="space-y-4">
            {openItems.map(renderItemCard)}
          </div>
        )}
      </div>

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Bereits gekauft</h2>

        {loadingItems ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Einkaufsliste wird geladen...
          </div>
        ) : boughtItems.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Noch keine Posten als gekauft markiert.
          </div>
        ) : (
          <div className="space-y-4">
            {boughtItems.map(renderItemCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectShoppingView;
