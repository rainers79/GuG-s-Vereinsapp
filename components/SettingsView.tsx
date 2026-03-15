import React, { useEffect, useMemo, useState } from 'react';
import { NotificationSettings, OrganizationWithMembership } from '../types';
import * as api from '../services/api';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  wheelAnimationEnabled: boolean;
  onWheelAnimationChange: (enabled: boolean) => void;
  onUnauthorized?: () => void;
  onOrganizationChanged?: () => void | Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  notificationSettings,
  setNotificationSettings,
  wheelAnimationEnabled,
  onWheelAnimationChange,
  onUnauthorized,
  onOrganizationChanged
}) => {

  /* =====================================================
     DND STATE
  ===================================================== */

  const [dndActive, setDndActive] = useState(
    () => localStorage.getItem('gug_dnd_active') === 'true'
  );

  const [dndStart, setDndStart] = useState(
    () => localStorage.getItem('gug_dnd_start') || '22:00'
  );

  const [dndEnd, setDndEnd] = useState(
    () => localStorage.getItem('gug_dnd_end') || '07:00'
  );

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  );

  /* =====================================================
     ORGANIZATION STATE
  ===================================================== */

  const [organizations, setOrganizations] = useState<OrganizationWithMembership[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);

  const [newOrganizationName, setNewOrganizationName] = useState('');
  const [newOrganizationDescription, setNewOrganizationDescription] = useState('');

  const [inviteRole, setInviteRole] = useState<'vorstand' | 'admin' | 'member' | 'guest'>('member');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCreating, setInviteCreating] = useState(false);
  const [organizationCreating, setOrganizationCreating] = useState(false);

  const activeOrganizationId = api.getActiveOrganizationId();

  const activeOrganization = useMemo(() => {
    return organizations.find((org) => org.id === activeOrganizationId) || null;
  }, [organizations, activeOrganizationId]);

  useEffect(() => {
    localStorage.setItem('gug_dnd_active', String(dndActive));
    localStorage.setItem('gug_dnd_start', dndStart);
    localStorage.setItem('gug_dnd_end', dndEnd);
  }, [dndActive, dndStart, dndEnd]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      if (!api.getToken()) return;

      try {
        setOrgLoading(true);
        setOrgError(null);

        const rows = await api.getOrganizations(onUnauthorized || (() => {}));

        if (!cancelled) {
          setOrganizations(rows);
        }
      } catch (err: any) {
        if (!cancelled) {
          setOrgError(err?.message || 'Communitys konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setOrgLoading(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  const isNowDnd = () => {
    if (!dndActive) return false;

    const now = currentTime;

    if (dndStart <= dndEnd) {
      return now >= dndStart && now <= dndEnd;
    } else {
      return now >= dndStart || now <= dndEnd;
    }
  };

  const refreshOrganizations = async () => {
    const rows = await api.getOrganizations(onUnauthorized || (() => {}));
    setOrganizations(rows);
  };

  const handleCreateOrganization = async () => {
    const name = newOrganizationName.trim();
    const description = newOrganizationDescription.trim();

    if (!name) {
      setOrgError('Name der Community fehlt.');
      return;
    }

    try {
      setOrganizationCreating(true);
      setOrgError(null);
      setOrgSuccess(null);
      setInviteLink('');

      const created = await api.createOrganization(
        {
          name,
          description
        },
        onUnauthorized || (() => {})
      );

      if (created?.id) {
        api.setActiveOrganizationId(created.id);
      }

      await refreshOrganizations();

      if (onOrganizationChanged) {
        await onOrganizationChanged();
      }

      setNewOrganizationName('');
      setNewOrganizationDescription('');
      setOrgSuccess('Community wurde erstellt und als aktiv gesetzt.');
    } catch (err: any) {
      setOrgError(err?.message || 'Community konnte nicht erstellt werden.');
    } finally {
      setOrganizationCreating(false);
    }
  };

  const handleSetActiveOrganization = async (organizationId: number) => {
    try {
      setOrgError(null);
      setOrgSuccess(null);

      api.setActiveOrganizationId(organizationId);

      if (onOrganizationChanged) {
        await onOrganizationChanged();
      }

      setOrgSuccess('Aktive Community wurde gewechselt.');
    } catch (err: any) {
      setOrgError(err?.message || 'Community konnte nicht gewechselt werden.');
    }
  };

  const handleCreateInvite = async () => {
    if (!activeOrganization?.id) {
      setOrgError('Keine aktive Community ausgewählt.');
      return;
    }

    try {
      setInviteCreating(true);
      setOrgError(null);
      setOrgSuccess(null);
      setInviteLink('');

      const response = await api.createOrganizationInvite(
        {
          organization_id: activeOrganization.id,
          role: inviteRole,
          email: inviteEmail.trim() || undefined
        },
        onUnauthorized || (() => {})
      );

      const createdLink = response?.invite_link || '';

      setInviteLink(createdLink);
      setOrgSuccess('Einladungslink wurde erstellt.');
    } catch (err: any) {
      setOrgError(err?.message || 'Einladung konnte nicht erstellt werden.');
    } finally {
      setInviteCreating(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setOrgSuccess('Einladungslink wurde in die Zwischenablage kopiert.');
    } catch {
      setOrgError('Einladungslink konnte nicht kopiert werden.');
    }
  };

  /* =====================================================
     TOGGLE COMPONENT
  ===================================================== */

  const Toggle = ({
    active,
    onToggle,
    label,
    sublabel
  }: {
    active: boolean;
    onToggle: () => void;
    label: string;
    sublabel?: string;
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-col">
        <span className="text-sm font-black uppercase tracking-widest">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] opacity-40 font-bold uppercase mt-0.5 tracking-tight">
            {sublabel}
          </span>
        )}
      </div>

      <button
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out ${
          active
            ? 'bg-[#B5A47A] shadow-lg shadow-[#B5A47A]/20'
            : 'bg-slate-200 dark:bg-white/10'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ease-in-out transform ${
            active ? 'translate-x-7' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-4xl font-black tracking-tighter uppercase">
          Einstellungen
        </h2>
        <div className="h-1.5 w-16 bg-[#B5A47A] mt-3 mb-4 mx-auto sm:mx-0 rounded-full"></div>
        <p className="opacity-50 text-[10px] font-black uppercase tracking-[0.3em]">
          Individualisieren Sie Ihr Portal-Erlebnis
        </p>
      </div>

      <div className="grid gap-6">

        {/* COMMUNITY */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border transition-colors duration-500`}>
          <h3 className="text-lg font-bold uppercase mb-6">
            Community & Einladungen
          </h3>

          {(orgError || orgSuccess) && (
            <div className="mb-6 space-y-2">
              {orgError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {orgError}
                </div>
              )}
              {orgSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  {orgSuccess}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">

            <div className="rounded-2xl border border-black/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] opacity-50">
                Aktive Community
              </div>

              <div className="mt-3 text-xl font-black">
                {activeOrganization?.name || 'Keine aktive Community'}
              </div>

              <div className="mt-2 text-sm opacity-70">
                {activeOrganization?.description || 'Noch keine Beschreibung vorhanden.'}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-wider opacity-50">
                Zugeordnete Communitys: {organizations.length}
              </div>

              {orgLoading ? (
                <div className="mt-4 text-sm font-semibold opacity-60">
                  Communitys werden geladen...
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {organizations.map((org) => {
                    const isActive = org.id === activeOrganizationId;

                    return (
                      <div
                        key={org.id}
                        className={`rounded-xl border px-4 py-3 ${
                          isActive
                            ? 'border-[#B5A47A] bg-[#B5A47A]/10'
                            : 'border-black/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black uppercase tracking-wide">
                              {org.name}
                            </div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-50">
                              Rolle: {org.membership_role || 'member'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetActiveOrganization(org.id)}
                            disabled={isActive}
                            className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wide ${
                              isActive
                                ? 'bg-slate-200 text-slate-500 cursor-default'
                                : 'bg-[#B5A47A] text-black'
                            }`}
                          >
                            {isActive ? 'Aktiv' : 'Aktiv setzen'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] opacity-50">
                Neue Community anlegen
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={newOrganizationName}
                  onChange={(e) => setNewOrganizationName(e.target.value)}
                  placeholder="Name der Community"
                  className="w-full rounded-xl border-2 px-4 py-3 font-semibold focus:border-[#B5A47A] outline-none"
                />

                <textarea
                  value={newOrganizationDescription}
                  onChange={(e) => setNewOrganizationDescription(e.target.value)}
                  placeholder="Kurze Beschreibung"
                  rows={4}
                  className="w-full rounded-xl border-2 px-4 py-3 font-semibold focus:border-[#B5A47A] outline-none resize-none"
                />

                <button
                  type="button"
                  onClick={handleCreateOrganization}
                  disabled={organizationCreating}
                  className="w-full rounded-xl bg-[#B5A47A] px-4 py-3 text-sm font-black uppercase tracking-wide text-black disabled:opacity-50"
                >
                  {organizationCreating ? 'Community wird erstellt...' : 'Community erstellen'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] opacity-50">
              Einladungslink erzeugen
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'vorstand' | 'admin' | 'member' | 'guest')}
                className="rounded-xl border-2 px-4 py-3 font-semibold focus:border-[#B5A47A] outline-none"
              >
                <option value="member">Mitglied</option>
                <option value="guest">Gast</option>
                <option value="admin">Admin</option>
                <option value="vorstand">Vorstand</option>
              </select>

              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Optionale E-Mail-Adresse"
                className="w-full rounded-xl border-2 px-4 py-3 font-semibold focus:border-[#B5A47A] outline-none"
              />

              <button
                type="button"
                onClick={handleCreateInvite}
                disabled={inviteCreating || !activeOrganization?.id}
                className="rounded-xl bg-black px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
              >
                {inviteCreating ? 'Erzeuge...' : 'Link erstellen'}
              </button>
            </div>

            {inviteLink && (
              <div className="mt-4 rounded-2xl border border-[#B5A47A] bg-[#B5A47A]/10 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">
                  Einladungslink
                </div>

                <div className="mt-2 break-all text-sm font-semibold">
                  {inviteLink}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="rounded-xl bg-[#B5A47A] px-4 py-3 text-[11px] font-black uppercase tracking-wide text-black"
                  >
                    Link kopieren
                  </button>

                  <a
                    href={`mailto:?subject=Einladung zur Community&body=${encodeURIComponent(inviteLink)}`}
                    className="rounded-xl bg-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-black"
                  >
                    Per Mail teilen
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(inviteLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-black"
                  >
                    Per WhatsApp teilen
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* APPEARANCE */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border transition-colors duration-500`}>
          <h3 className="text-lg font-bold uppercase mb-6">
            Personalisierung
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <Toggle
              label="Dunkler Modus"
              sublabel="Optimiert für nächtliche Nutzung"
              active={theme === 'dark'}
              onToggle={() =>
                onThemeChange(theme === 'dark' ? 'light' : 'dark')
              }
            />

            <Toggle
              label="Rad-Animation"
              sublabel="Drehanimation im Projekt-Radmenü"
              active={wheelAnimationEnabled}
              onToggle={() => onWheelAnimationChange(!wheelAnimationEnabled)}
            />
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border`}>
          <h3 className="text-lg font-bold uppercase mb-6">
            Benachrichtigungen
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-white/5">

            <Toggle
              label="Chat Benachrichtigungen"
              active={notificationSettings.chatEnabled}
              onToggle={() =>
                setNotificationSettings({
                  ...notificationSettings,
                  chatEnabled: !notificationSettings.chatEnabled
                })
              }
            />

            <Toggle
              label="Chat Vorschau anzeigen"
              active={notificationSettings.chatPreview}
              onToggle={() =>
                setNotificationSettings({
                  ...notificationSettings,
                  chatPreview: !notificationSettings.chatPreview
                })
              }
            />

            <Toggle
              label="Umfrage Benachrichtigungen"
              active={notificationSettings.pollEnabled}
              onToggle={() =>
                setNotificationSettings({
                  ...notificationSettings,
                  pollEnabled: !notificationSettings.pollEnabled
                })
              }
            />

            <Toggle
              label="Umfrage Vorschau anzeigen"
              active={notificationSettings.pollPreview}
              onToggle={() =>
                setNotificationSettings({
                  ...notificationSettings,
                  pollPreview: !notificationSettings.pollPreview
                })
              }
            />

          </div>
        </div>

        {/* DND */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border`}>
          <h3 className="text-lg font-bold uppercase mb-6">
            Nicht stören (DND)
          </h3>

          <Toggle
            label="Funktion Aktivieren"
            sublabel="In eingestellter Zeit keine Popups"
            active={dndActive}
            onToggle={() => setDndActive(!dndActive)}
          />

          {dndActive && (
            <div className="mt-6 flex gap-6 flex-col sm:flex-row">
              <input
                type="time"
                value={dndStart}
                onChange={(e) => setDndStart(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 focus:border-[#B5A47A] font-bold w-full"
              />
              <input
                type="time"
                value={dndEnd}
                onChange={(e) => setDndEnd(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 focus:border-[#B5A47A] font-bold w-full"
              />
            </div>
          )}

          <div className="mt-4 text-[11px] font-bold uppercase tracking-wider opacity-50">
            Status jetzt: {isNowDnd() ? 'DND aktiv' : 'DND inaktiv'}
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="p-10 text-center">
          <p className="text-[10px] opacity-30 font-bold uppercase tracking-[0.2em]">
            GuG Verein Management System v1.0.7
          </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;
