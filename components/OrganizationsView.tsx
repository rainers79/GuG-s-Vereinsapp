import React, { useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import {
  OrganizationModule,
  OrganizationWithMembership
} from '../types';

interface OrganizationsViewProps {
  organizations: OrganizationWithMembership[];
  activeOrganizationId: number | null;
  onActiveOrganizationChange: (organizationId: number | null) => void;
  onOrganizationsRefresh: () => Promise<void> | void;
  onUnauthorized: () => void;
}

const OrganizationsView: React.FC<OrganizationsViewProps> = ({
  organizations,
  activeOrganizationId,
  onActiveOrganizationChange,
  onOrganizationsRefresh,
  onUnauthorized
}) => {
  const [loading, setLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modules, setModules] = useState<OrganizationModule[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    primary_color: '',
    secondary_color: ''
  });

  const [inviteForm, setInviteForm] = useState({
    role: 'member',
    email: ''
  });

  const [joinToken, setJoinToken] = useState('');

  const activeOrganization = useMemo(() => {
    if (!activeOrganizationId) return null;
    return organizations.find(org => org.id === activeOrganizationId) || null;
  }, [organizations, activeOrganizationId]);

  const canManageActiveOrganization = useMemo(() => {
    const role = activeOrganization?.membership_role || '';
    return ['owner', 'admin', 'vorstand'].includes(role);
  }, [activeOrganization]);

  useEffect(() => {
    let mounted = true;

    const loadModules = async () => {
      if (!activeOrganizationId || activeOrganizationId <= 0) {
        setModules([]);
        return;
      }

      try {
        setModulesLoading(true);
        const rows = await api.getOrganizationModules(activeOrganizationId, onUnauthorized);
        if (mounted) {
          setModules(rows);
        }
      } catch (err: any) {
        if (mounted) {
          setModules([]);
          setError(err?.message || 'Module konnten nicht geladen werden.');
        }
      } finally {
        if (mounted) {
          setModulesLoading(false);
        }
      }
    };

    loadModules();

    return () => {
      mounted = false;
    };
  }, [activeOrganizationId, onUnauthorized]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name.trim()) {
      setError('Bitte einen Vereinsnamen eingeben.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setInviteLink('');

      const created = await api.createOrganization(
        {
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          primary_color: createForm.primary_color.trim(),
          secondary_color: createForm.secondary_color.trim()
        },
        onUnauthorized
      );

      await onOrganizationsRefresh();
      onActiveOrganizationChange(created.id);

      setCreateForm({
        name: '',
        description: '',
        primary_color: '',
        secondary_color: ''
      });

      setSuccess('Community wurde erstellt und aktiviert.');
    } catch (err: any) {
      setError(err?.message || 'Community konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeOrganizationId || activeOrganizationId <= 0) {
      setError('Bitte zuerst eine aktive Community auswählen.');
      return;
    }

    try {
      setInviteLoading(true);
      setError(null);
      setSuccess(null);
      setInviteLink('');

      const response = await api.createOrganizationInvite(
        {
          organization_id: activeOrganizationId,
          role: inviteForm.role as 'owner' | 'vorstand' | 'admin' | 'member' | 'guest',
          email: inviteForm.email.trim() || undefined
        },
        onUnauthorized
      );

      setInviteLink(response.invite_link || '');
      setSuccess('Einladungslink wurde erstellt.');
    } catch (err: any) {
      setError(err?.message || 'Einladung konnte nicht erstellt werden.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleJoinByToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinToken.trim()) {
      setError('Bitte einen Einladungstoken oder Link eingeben.');
      return;
    }

    try {
      setJoinLoading(true);
      setError(null);
      setSuccess(null);

      const normalizedToken = extractInviteToken(joinToken.trim());

      await api.acceptOrganizationInvite(
        { token: normalizedToken },
        onUnauthorized
      );

      await onOrganizationsRefresh();
      setJoinToken('');
      setSuccess('Community erfolgreich beigetreten.');
    } catch (err: any) {
      setError(err?.message || 'Beitritt zur Community fehlgeschlagen.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setSuccess('Einladungslink wurde in die Zwischenablage kopiert.');
    } catch {
      setError('Einladungslink konnte nicht kopiert werden.');
    }
  };

  const enabledModules = modules.filter(module => Number(module.is_enabled) === 1);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-4xl font-black tracking-tighter uppercase">
          Communities
        </h2>
        <div className="h-1.5 w-16 bg-[#B5A47A] mt-3 mb-4 mx-auto sm:mx-0 rounded-full" />
        <p className="opacity-50 text-[10px] font-black uppercase tracking-[0.3em]">
          Multi-Community Verwaltung
        </p>
      </div>

      {(error || success) && (
        <div className="mb-6 space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-bold text-green-700">
              {success}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold uppercase">
                Eigene Communities
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-black/40">
                Auswahl der aktiven Community für die App
              </p>
            </div>

            <div className="text-xs font-bold uppercase tracking-wide text-black/50">
              Zugeordnet: {organizations.length}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {organizations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm font-semibold text-black/50">
                Noch keine Community zugeordnet.
              </div>
            ) : (
              organizations.map(org => {
                const isActive = org.id === activeOrganizationId;

                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      onActiveOrganizationChange(org.id);
                      setInviteLink('');
                      setSuccess(`Aktive Community gewechselt zu ${org.name}.`);
                      setError(null);
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      isActive
                        ? 'border-[#B5A47A] bg-[#F8F3E7] shadow-md'
                        : 'border-slate-200 bg-white hover:border-[#B5A47A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-black uppercase tracking-wide text-[#1A1A1A]">
                          {org.name}
                        </div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-black/40">
                          Rolle: {org.membership_role || 'member'}
                        </div>
                      </div>

                      {isActive && (
                        <div className="rounded-full bg-[#B5A47A] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">
                          Aktiv
                        </div>
                      )}
                    </div>

                    {org.description ? (
                      <div className="mt-3 text-sm font-medium text-black/65">
                        {org.description}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <h3 className="text-lg font-bold uppercase">
            Neue Community anlegen
          </h3>

          <form onSubmit={handleCreateOrganization} className="mt-5 grid gap-4">
            <input
              type="text"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Name der Community"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
              disabled={loading}
            />

            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Beschreibung"
              className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
              disabled={loading}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                value={createForm.primary_color}
                onChange={(e) =>
                  setCreateForm(prev => ({ ...prev, primary_color: e.target.value }))
                }
                placeholder="Primärfarbe optional"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
                disabled={loading}
              />

              <input
                type="text"
                value={createForm.secondary_color}
                onChange={(e) =>
                  setCreateForm(prev => ({ ...prev, secondary_color: e.target.value }))
                }
                placeholder="Sekundärfarbe optional"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-[#1A1A1A] px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-[#B5A47A] hover:text-[#1A1A1A] disabled:opacity-50"
              >
                {loading ? 'Erstelle...' : 'Community anlegen'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold uppercase">
                Aktive Community
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-black/40">
                Detailansicht und Modulstatus
              </p>
            </div>

            <div className="text-xs font-bold uppercase tracking-wide text-black/50">
              {activeOrganization ? activeOrganization.name : 'Keine Auswahl'}
            </div>
          </div>

          {!activeOrganization ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm font-semibold text-black/50">
              Bitte zuerst eine Community auswählen.
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-[#FAFAFA] p-4">
                <div className="text-sm font-black uppercase tracking-wide">
                  {activeOrganization.name}
                </div>
                <div className="mt-2 text-sm font-medium text-black/65">
                  {activeOrganization.description || 'Keine Beschreibung hinterlegt.'}
                </div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-black/45">
                  Rolle: {activeOrganization.membership_role || 'member'} · Status: {activeOrganization.membership_status || 'active'}
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-black uppercase tracking-widest text-black/45">
                  Aktivierte Module
                </div>

                {modulesLoading ? (
                  <div className="mt-3 text-sm font-semibold text-black/50">
                    Module werden geladen...
                  </div>
                ) : enabledModules.length === 0 ? (
                  <div className="mt-3 text-sm font-semibold text-black/50">
                    Keine Module aktiv.
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enabledModules.map(module => (
                      <span
                        key={module.id || `${module.organization_id}_${module.module_key}`}
                        className="rounded-full bg-[#F1E7C8] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]"
                      >
                        {module.module_key}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <h3 className="text-lg font-bold uppercase">
            Einladung erstellen
          </h3>

          {!activeOrganization ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm font-semibold text-black/50">
              Bitte zuerst eine aktive Community auswählen.
            </div>
          ) : !canManageActiveOrganization ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm font-semibold text-black/50">
              Für diese Community fehlen dir die Rechte zum Erstellen von Einladungen.
            </div>
          ) : (
            <>
              <form onSubmit={handleCreateInvite} className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm(prev => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
                    disabled={inviteLoading}
                  >
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                    <option value="vorstand">Vorstand</option>
                    <option value="admin">Admin</option>
                  </select>

                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="E-Mail optional"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
                    disabled={inviteLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="rounded-2xl bg-[#1A1A1A] px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-[#B5A47A] hover:text-[#1A1A1A] disabled:opacity-50"
                  >
                    {inviteLoading ? 'Erstelle...' : 'Einladung erzeugen'}
                  </button>
                </div>
              </form>

              {inviteLink ? (
                <div className="mt-5 rounded-2xl border border-[#E6D8A8] bg-[#FBF7EA] p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-black/45">
                    Einladungslink
                  </div>

                  <div className="mt-3 break-all rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black/75">
                    {inviteLink}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="rounded-2xl bg-[#B5A47A] px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#1A1A1A] transition-all hover:opacity-90"
                    >
                      Link kopieren
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <h3 className="text-lg font-bold uppercase">
            Per Einladung beitreten
          </h3>

          <form onSubmit={handleJoinByToken} className="mt-5 grid gap-4">
            <textarea
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value)}
              placeholder="Einladungslink oder Token einfügen"
              className="min-h-[100px] w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none transition-all focus:border-[#B5A47A]"
              disabled={joinLoading}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={joinLoading}
                className="rounded-2xl bg-[#1A1A1A] px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-[#B5A47A] hover:text-[#1A1A1A] disabled:opacity-50"
              >
                {joinLoading ? 'Prüfe...' : 'Community beitreten'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function extractInviteToken(rawValue: string): string {
  if (!rawValue) return '';

  try {
    if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
      const parsed = new URL(rawValue);
      const invite = parsed.searchParams.get('invite');
      return invite ? invite.trim() : rawValue.trim();
    }
  } catch {
    return rawValue.trim();
  }

  return rawValue.trim();
}

export default OrganizationsView;
