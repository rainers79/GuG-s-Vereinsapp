import React, { useState, useEffect } from 'react';
import { NotificationSettings } from '../types';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  notificationSettings,
  setNotificationSettings
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

  const isNowDnd = () => {
    if (!dndActive) return false;

    const now = currentTime;

    if (dndStart <= dndEnd) {
      return now >= dndStart && now <= dndEnd;
    } else {
      return now >= dndStart || now <= dndEnd;
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
