import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppRole, ProjectInvoiceItem, ProjectLite, User } from '../types';
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

const getFileBadgeLabel = (fileType?: string | null, filename?: string | null): string => {
  const type = (fileType || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (type.includes('jpeg') || type.includes('jpg') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'JPG';
  if (type.includes('png') || name.endsWith('.png')) return 'PNG';
  if (type.includes('webp') || name.endsWith('.webp')) return 'WEBP';
  if (type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif')) return 'HEIC';
  if (type.includes('gif') || name.endsWith('.gif')) return 'GIF';
  return 'DATEI';
};

const isImageFile = (fileType?: string | null, filename?: string | null): boolean => {
  const type = (fileType || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  return (
    type.startsWith('image/') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
};

/* =====================================================
   SECTION 04 - COMPONENT
===================================================== */

const ProjectInvoicesView: React.FC<Props> = ({ user, onUnauthorized }) => {
  const [project, setProject] = useState<ProjectLite | null>(null);
  const [items, setItems] = useState<ProjectInvoiceItem[]>([]);

  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null);

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
      const data = await api.apiRequest<ProjectInvoiceItem[]>(
        `/gug/v1/project-invoices?project_id=${encodeURIComponent(String(activeProjectId))}`,
        {},
        onUnauthorized
      );

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || 'Rechnungen konnten nicht geladen werden.');
    } finally {
      setLoadingItems(false);
    }
  }, [activeProjectId, onUnauthorized]);

  /* =====================================================
     SECTION 06 - INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!activeProjectId) return;

    setError(null);
    setSuccess(null);

    loadProject();
    loadItems();
  }, [activeProjectId, loadProject, loadItems]);

  /* =====================================================
     SECTION 07 - MEMOS
  ===================================================== */

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
  }, [items]);

  /* =====================================================
     SECTION 08 - ACTIONS
  ===================================================== */

  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);
    await Promise.all([loadProject(), loadItems()]);
  };

  const handleUploadFile = async (file: File | null) => {
    if (!file) return;

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('project_id', String(activeProjectId));
      formData.append('file', file);

      await api.apiRequest<{ success: boolean; id: number; message?: string }>(
        '/gug/v1/project-invoices',
        {
          method: 'POST',
          body: formData
        },
        onUnauthorized
      );

      setSuccess('Rechnung wurde hochgeladen.');
      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Rechnung konnte nicht hochgeladen werden.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!isAdmin) {
      setError('Keine Berechtigung zum Löschen.');
      return;
    }

    setDeletingInvoiceId(invoiceId);
    setError(null);
    setSuccess(null);

    try {
      await api.apiRequest<{ success: boolean; message?: string }>(
        `/gug/v1/project-invoices/${invoiceId}`,
        {
          method: 'DELETE'
        },
        onUnauthorized
      );

      setSuccess('Rechnung wurde gelöscht.');
      await loadItems();
    } catch (e: any) {
      setError(e?.message || 'Rechnung konnte nicht gelöscht werden.');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  /* =====================================================
     SECTION 09 - EARLY RETURN
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
     SECTION 10 - RENDER
  ===================================================== */

  return (
    <div className="space-y-6">
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="app-card space-y-3">
        <h1 className="text-2xl font-black">Projekt Rechnungen</h1>

        <div className="text-sm text-slate-500 dark:text-white/60">
          Projekt:{' '}
          <span className="font-black text-slate-900 dark:text-white">
            {loadingProject ? 'Lädt...' : (project?.title || `Projekt #${activeProjectId}`)}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-white/50">
          Hier werden projektbezogene Rechnungen zentral abgelegt und dokumentiert.
        </div>
      </div>

      <div className="app-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">Upload</h2>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingProject || loadingItems || uploading || deletingInvoiceId !== null}
            className="btn-secondary"
          >
            {loadingProject || loadingItems || uploading || deletingInvoiceId !== null ? '...' : 'Aktualisieren'}
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

          <label className={`rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer dark:border-white/10 dark:bg-[#121212] ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Bibliothek
            </div>
            <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              Datei auswählen
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-white/60">
              PDF, Bild und übliche Formate
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/*,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleUploadFile(file);
                e.currentTarget.value = '';
              }}
            />
          </label>

          <label className={`rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer dark:border-white/10 dark:bg-[#121212] ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Kamera
            </div>
            <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              Foto aufnehmen
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-white/60">
              Direkt mit Kamera erfassen
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleUploadFile(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>

        {uploading && (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Datei wird hochgeladen...
          </div>
        )}
      </div>

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Rechnungsliste</h2>

        {loadingItems ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Rechnungen werden geladen...
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Aktuell sind keine Rechnungen für dieses Projekt vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const deleting = deletingInvoiceId === item.id;
              const fileBadge = getFileBadgeLabel(item.file_type, item.original_filename);
              const imagePreview = isImageFile(item.file_type, item.original_filename);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-[#B5A47A] text-[#1A1A1A]">
                          {fileBadge}
                        </span>

                        <div className="font-black text-slate-900 dark:text-white break-all">
                          {item.original_filename}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-white/50">
                        Hochgeladen von:{' '}
                        <span className="font-black text-slate-700 dark:text-white/80">
                          {item.uploaded_by_name || `Mitglied #${item.uploaded_by}`}
                        </span>
                        {' · '}
                        <span className="font-black text-slate-700 dark:text-white/80">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-white/50 break-all">
                        Dateityp:{' '}
                        <span className="font-black text-slate-700 dark:text-white/80">
                          {item.file_type || '-'}
                        </span>
                      </div>

                      {imagePreview ? (
                        <div className="pt-1">
                          <img
                            src={item.file_url}
                            alt={item.original_filename}
                            className="max-h-64 rounded-xl border border-slate-200 object-contain bg-white dark:border-white/10 dark:bg-[#1A1A1A]"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        Öffnen
                      </a>

                      <a
                        href={item.file_url}
                        download={item.original_filename}
                        className="btn-secondary"
                      >
                        Download
                      </a>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(item.id)}
                          disabled={deleting}
                          className="btn-secondary"
                        >
                          {deleting ? '...' : 'Löschen'}
                        </button>
                      )}
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

export default ProjectInvoicesView;
