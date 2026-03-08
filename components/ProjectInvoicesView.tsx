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

const getFileTypeLabel = (fileType?: string | null, filename?: string | null): string => {
  const type = (fileType || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (type.includes('jpeg') || type.includes('jpg') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'JPG';
  if (type.includes('png') || name.endsWith('.png')) return 'PNG';
  if (type.includes('webp') || name.endsWith('.webp')) return 'WEBP';
  if (type.includes('heic') || name.endsWith('.heic')) return 'HEIC';
  if (type.includes('heif') || name.endsWith('.heif')) return 'HEIF';
  if (type.includes('gif') || name.endsWith('.gif')) return 'GIF';
  if (type.includes('bmp') || name.endsWith('.bmp')) return 'BMP';
  if (type.includes('tiff') || name.endsWith('.tif') || name.endsWith('.tiff')) return 'TIFF';
  return 'Datei';
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
    name.endsWith('.bmp') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    name.endsWith('.tif') ||
    name.endsWith('.tiff')
  );
};

const isPdfFile = (fileType?: string | null, filename?: string | null): boolean => {
  const type = (fileType || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  return type.includes('pdf') || name.endsWith('.pdf');
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

  const loadInvoices = useCallback(async () => {
    if (!activeProjectId) return;

    setLoadingItems(true);

    try {
      const data = await api.getProjectInvoices(activeProjectId, onUnauthorized);
      const list = Array.isArray(data) ? data : [];
      setItems(list);
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
    loadInvoices();
  }, [activeProjectId, loadProject, loadInvoices]);

  /* =====================================================
     SECTION 07 - ACTIONS
  ===================================================== */

  const handleRefresh = async () => {
    setError(null);
    setSuccess(null);

    await Promise.all([
      loadProject(),
      loadInvoices()
    ]);
  };

  const handleUploadFile = async (file: File | null) => {
    if (!file) return;

    if (!activeProjectId) {
      setError('Kein aktives Projekt gewählt.');
      return;
    }

    if (!isAdmin) {
      setError('Keine Berechtigung zum Hochladen von Rechnungen.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.uploadProjectInvoice(
        {
          project_id: activeProjectId,
          file
        },
        onUnauthorized
      );

      setSuccess('Rechnung wurde hochgeladen.');
      await loadInvoices();
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
      await api.deleteProjectInvoice(invoiceId, onUnauthorized);
      setSuccess('Rechnung wurde gelöscht.');
      await loadInvoices();
    } catch (e: any) {
      setError(e?.message || 'Rechnung konnte nicht gelöscht werden.');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  /* =====================================================
     SECTION 08 - EARLY RETURN
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
     SECTION 09 - RENDER
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
          Hier werden alle projektbezogenen Rechnungen zentral abgelegt und mit Datum gespeichert.
        </div>
      </div>

      <div className="app-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">Übersicht</h2>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingProject || loadingItems || uploading || deletingInvoiceId !== null}
            className="btn-secondary"
          >
            {loadingProject || loadingItems || uploading || deletingInvoiceId !== null ? '...' : 'Aktualisieren'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]">
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Gesamt
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {items.length}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]">
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/50 font-black">
              Letzter Upload
            </div>
            <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              {items.length > 0 ? formatDateTime(items[0]?.created_at) : '-'}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="app-card space-y-4">
          <h2 className="text-lg font-black">Neue Rechnung hochladen</h2>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="btn-secondary cursor-pointer justify-center">
              {uploading ? 'Upload läuft...' : 'Datei aus Bibliothek wählen'}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.tif,.tiff,application/pdf,image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleUploadFile(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <label className="btn-secondary cursor-pointer justify-center">
              {uploading ? 'Upload läuft...' : 'Kamera öffnen'}
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                capture="environment"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleUploadFile(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>

          <div className="text-xs text-slate-500 dark:text-white/50">
            Erlaubt sind die üblichen Formate wie PDF sowie Bilddateien aus Galerie oder Kamera.
          </div>
        </div>
      )}

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Hochgeladene Rechnungen</h2>

        {loadingItems ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Rechnungen werden geladen...
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-white/60">
            Für dieses Projekt sind noch keine Rechnungen vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const deleting = deletingInvoiceId === item.id;
              const imageFile = isImageFile(item.file_type, item.original_filename);
              const pdfFile = isPdfFile(item.file_type, item.original_filename);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#121212]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-black text-slate-900 dark:text-white break-all">
                          {item.original_filename || `Rechnung #${item.id}`}
                        </div>

                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-[#B5A47A] text-[#1A1A1A]">
                          {getFileTypeLabel(item.file_type, item.original_filename)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-white/50">
                        Hochgeladen von:{' '}
                        <span className="font-black text-slate-700 dark:text-white/80">
                          {item.uploaded_by_name || `User #${item.uploaded_by}`}
                        </span>
                        {' · '}
                        <span className="font-black text-slate-700 dark:text-white/80">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                        >
                          Öffnen
                        </a>

                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
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

                    {(imageFile || pdfFile) && (
                      <div className="w-full lg:w-56 shrink-0">
                        {imageFile ? (
                          <a href={item.file_url} target="_blank" rel="noreferrer">
                            <img
                              src={item.file_url}
                              alt={item.original_filename}
                              className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-white/10"
                            />
                          </a>
                        ) : (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                          >
                            PDF Vorschau öffnen
                          </a>
                        )}
                      </div>
                    )}
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
