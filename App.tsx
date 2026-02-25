import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Poll, ViewType, NotificationSettings } from './types';
import * as api from './services/api';

import MembersView from './components/MembersView';
import TasksView from './components/TasksView';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PollList from './components/PollList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import VerifyPage from './components/VerifyPage';
import DashboardView from './components/DashboardView';

type PosViewProps = {
  user: User;
  onUnauthorized: () => void;
};

const PosView: React.FC<PosViewProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-white font-black uppercase tracking-widest text-sm">
          POS
        </div>
        <div className="text-white/70 mt-2 text-sm leading-relaxed">
          Modul ist aktiv eingebunden. Nächster Schritt: echte POS-Oberfläche (Artikel-Kacheln, Zwischensumme, Zahlung, Speichern).
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-white font-black uppercase tracking-widest text-[11px]">
          Angemeldet als
        </div>
        <div className="text-white mt-2 font-bold">
          {user.displayName}
        </div>
        <div className="text-white/50 text-sm">
          {user.username}
        </div>
      </div>
    </div>
  );
};

type ToastType = 'error' | 'success';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

/* =====================================================
   STORAGE KEYS
===================================================== */

const LS_NOTIFICATION_SETTINGS = 'gug_notification_settings';
const LS_LAST_CHAT_ID = 'gug_last_chat_id';
const LS_LAST_POLL_ID = 'gug_last_poll_id';

/* =====================================================
   DEFAULT SETTINGS
===================================================== */

const defaultNotificationSettings: NotificationSettings = {
  chatEnabled: true,
  pollEnabled: true,
  chatPreview: true,
  pollPreview: true
};

const App: React.FC = () => {

  /* =====================================================
     CORE STATE
  ===================================================== */

  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(() => {
      const stored = localStorage.getItem(LS_NOTIFICATION_SETTINGS);
      return stored ? JSON.parse(stored) : defaultNotificationSettings;
    });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('gug_theme') as 'light' | 'dark') || 'light'
  );

  const userRef = useRef<User | null>(user);

  /* =====================================================
     EFFECTS
  ===================================================== */

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    localStorage.setItem(
      LS_NOTIFICATION_SETTINGS,
      JSON.stringify(notificationSettings)
    );
  }, [notificationSettings]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('gug_theme', theme);
  }, [theme]);

  /* =====================================================
     TOAST HELPERS
  ===================================================== */

  const pushToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* =====================================================
     AUTH + DATA LOAD
  ===================================================== */

  const handleUnauthorized = useCallback(() => {
    api.clearToken();
    setUser(null);
    setPolls([]);
    setError('Ihre Sitzung ist abgelaufen.');
    setIsSidebarOpen(false);
  }, []);

  const fetchAppData = useCallback(async () => {
    try {
      const currentUser = await api.getCurrentUser(handleUnauthorized);
      setUser(currentUser);

      const pollData = await api.getPolls(handleUnauthorized);
      setPolls(pollData);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (api.getToken()) fetchAppData();
    else setLoading(false);
  }, []);

  /* =====================================================
     GLOBAL WATCHER (CHAT + POLLS)
  ===================================================== */

  const getStoredNumber = (key: string): number => {
    const raw = localStorage.getItem(key);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  };

  const setStoredNumber = (key: string, value: number) => {
    localStorage.setItem(key, String(value));
  };

  const checkGlobalUpdates = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;

    /* ---------- CHAT ---------- */
    if (notificationSettings.chatEnabled) {
      try {
        const msgs = await api.getChatMessages(handleUnauthorized);

        if (msgs.length > 0) {
          const maxId = Math.max(...msgs.map(m => m.id || 0));
          const lastSeen = getStoredNumber(LS_LAST_CHAT_ID);

          if (lastSeen === 0) {
            setStoredNumber(LS_LAST_CHAT_ID, maxId);
          } else if (maxId > lastSeen) {

            const newMsgs = msgs.filter(
              m => m.id > lastSeen && m.user_id !== u.id
            );

            if (newMsgs.length > 0) {
              const latest = newMsgs[newMsgs.length - 1];

              if (notificationSettings.chatPreview) {
                const preview =
                  latest.message.slice(0, 80) +
                  (latest.message.length > 80 ? '…' : '');
                pushToast(
                  `Neue Nachricht von ${latest.display_name}: ${preview}`
                );
              } else {
                pushToast(
                  `Neue Nachricht von ${latest.display_name}`
                );
              }
            }

            setStoredNumber(LS_LAST_CHAT_ID, maxId);
          }
        }
      } catch {}
    }

    /* ---------- POLLS ---------- */
    if (notificationSettings.pollEnabled) {
      try {
        const p = await api.getPolls(handleUnauthorized);

        if (p.length > 0) {
          const maxPollId = Math.max(...p.map(x => x.id || 0));
          const lastPoll = getStoredNumber(LS_LAST_POLL_ID);

          if (lastPoll === 0) {
            setStoredNumber(LS_LAST_POLL_ID, maxPollId);
          } else if (maxPollId > lastPoll) {

            const newest = p.find(x => x.id === maxPollId);

            if (newest) {
              if (notificationSettings.pollPreview) {
                const preview =
                  newest.question.slice(0, 90) +
                  (newest.question.length > 90 ? '…' : '');
                pushToast(`Neue Umfrage: ${preview}`);
              } else {
                pushToast(`Eine neue Umfrage wurde erstellt`);
              }
            }

            setStoredNumber(LS_LAST_POLL_ID, maxPollId);
          }

          setPolls(p);
        }
      } catch {}
    }

  }, [notificationSettings, handleUnauthorized, pushToast]);

  useEffect(() => {
    if (!user) return;

    checkGlobalUpdates();
    const interval = setInterval(checkGlobalUpdates, 5000);
    return () => clearInterval(interval);

  }, [user, checkGlobalUpdates]);

  /* =====================================================
     RENDER LOGIC
  ===================================================== */

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            user={user!}
            polls={polls}
            onNavigate={setActiveView}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            polls={polls}
            user={user!}
            onRefresh={fetchAppData}
            onOpenPoll={(pollId) => {
              setSelectedPollId(pollId);
              setActiveView('polls');
            }}
          />
        );

      case 'polls':
        return (
          <PollList
            polls={polls}
            user={user!}
            selectedPollId={selectedPollId}
            onRefresh={fetchAppData}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'settings':
        return (
          <SettingsView
            theme={theme}
            onThemeChange={setTheme}
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
          />
        );

      case 'members':
        return (
          <MembersView
            currentUserRole={user!.role}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'tasks':
        return (
          <TasksView
            userId={user!.id}
            userRole={user!.role}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'pos':
        return (
          <PosView
            user={user!}
            onUnauthorized={handleUnauthorized}
          />
        );

      default:
        return null;
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Lädt...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      {error && (
        <Notification message={error} type="error" onClose={() => setError(null)} />
      )}

      {success && (
        <Notification message={success} type="success" onClose={() => setSuccess(null)} />
      )}

      {toasts.map(t => (
        <Notification
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}

      {!user ? (
        isRegistering
          ? <RegisterForm onBackToLogin={() => setIsRegistering(false)} onSuccess={setSuccess} />
          : <LoginForm onLoginSuccess={setUser} onShowRegister={() => setIsRegistering(true)} />
      ) : (
        <>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeView={activeView}
            onViewChange={setActiveView}
            userRole={user.role}
          />

          <Header
            user={user}
            onLogout={() => {
              api.clearToken();
              setUser(null);
            }}
            onOpenMenu={() => setIsSidebarOpen(true)}
            onGoHome={() => setActiveView('dashboard')}
          />

          <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
