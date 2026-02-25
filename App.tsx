// src/App.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Poll, ViewType } from './types';
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

type ToastType = 'error' | 'success';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

const LS_LAST_CHAT_ID = 'gug_last_chat_id';
const LS_LAST_POLL_ID = 'gug_last_poll_id';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // bestehend (bleibt)
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // NEU: Toast Queue (mehrere Popups möglich)
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('gug_theme') as 'light' | 'dark') || 'light'
  );

  const userRef = useRef<User | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const pushToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gug_theme', theme);
  }, [theme]);

  const params = new URLSearchParams(window.location.search);
  const verifyUid = params.get('uid');
  const verifyToken = params.get('token');
  const isVerifyMode = !!verifyUid && !!verifyToken;

  const handleUnauthorized = useCallback(() => {
    api.clearToken();
    setUser(null);
    setPolls([]);
    setError('Ihre Sitzung ist abgelaufen.');
    setIsSidebarOpen(false);
  }, []);

  const fetchAppData = useCallback(async () => {
    setError(null);
    try {
      const currentUser = await api.getCurrentUser(handleUnauthorized);
      setUser(currentUser);

      const pollData = await api.getPolls(handleUnauthorized);
      setPolls(pollData);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        handleUnauthorized();
      } else {
        setError(err?.message || 'Fehler beim Laden der Daten.');
      }
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (api.getToken()) {
      fetchAppData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = async (loggedUser: User) => {
    setUser(loggedUser);
    await fetchAppData();
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    setPolls([]);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  /* =====================================================
     NEU: GLOBAL WATCHER (CHAT + POLLS) -> Popups
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

    // ---- CHAT ----
    try {
      const msgs = await api.getChatMessages(handleUnauthorized);

      if (Array.isArray(msgs) && msgs.length > 0) {
        const maxId = Math.max(...msgs.map(m => m.id || 0));
        let lastSeen = getStoredNumber(LS_LAST_CHAT_ID);

        // beim ersten Lauf: nicht alles spammen -> nur "merken"
        if (lastSeen === 0) {
          setStoredNumber(LS_LAST_CHAT_ID, maxId);
        } else if (maxId > lastSeen) {
          const newOnes = msgs
            .filter(m => (m.id || 0) > lastSeen)
            .filter(m => (m.user_id || 0) !== u.id);

          if (newOnes.length > 0) {
            const latest = newOnes[newOnes.length - 1];
            const preview =
              (latest.message || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 80) + ((latest.message || '').length > 80 ? '…' : '');

            pushToast(`Neue Chat-Nachricht von ${latest.display_name}: ${preview}`, 'success');
          }

          setStoredNumber(LS_LAST_CHAT_ID, maxId);
        }
      }
    } catch {
      // bewusst still -> keine Toast-Spam bei Netz-Problem
    }

    // ---- POLLS ----
    try {
      const p = await api.getPolls(handleUnauthorized);

      if (Array.isArray(p) && p.length > 0) {
        const maxPollId = Math.max(...p.map(x => x.id || 0));
        let lastPoll = getStoredNumber(LS_LAST_POLL_ID);

        // beim ersten Lauf: nicht alles spammen -> nur "merken"
        if (lastPoll === 0) {
          setStoredNumber(LS_LAST_POLL_ID, maxPollId);
        } else if (maxPollId > lastPoll) {
          // neueste Umfrage suchen
          const newest = [...p].sort((a, b) => (a.id || 0) - (b.id || 0)).pop();
          if (newest) {
            const q =
              (newest.question || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 90) + ((newest.question || '').length > 90 ? '…' : '');
            pushToast(`Neue Umfrage verfügbar: ${q}`, 'success');
          }
          setStoredNumber(LS_LAST_POLL_ID, maxPollId);
        }
      }

      // sync App-State (optional, aber praktisch)
      setPolls(p);
    } catch {
      // still
    }
  }, [handleUnauthorized, pushToast]);

  useEffect(() => {
    if (!user) return;

    // sofort einmal prüfen (aber initial nur "merken", siehe Logic)
    checkGlobalUpdates();

    // alle 5 Sekunden prüfen
    const interval = setInterval(() => {
      checkGlobalUpdates();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, checkGlobalUpdates]);

  /* =====================================================
     RENDER
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
          <SettingsView theme={theme} onThemeChange={setTheme} />
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

      default:
        return null;
    }
  };

  if (isVerifyMode) {
    return (
      <VerifyPage
        uid={parseInt(verifyUid!)}
        token={verifyToken!}
        onDone={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        }}
      />
    );
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#B5A47A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8F8F8] dark:bg-[#121212] dark:text-white">

      {/* bestehende single notifications */}
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      {success && <Notification message={success} type="success" onClose={() => setSuccess(null)} />}

      {/* NEU: Queue Notifications */}
      {toasts.map(t => (
        <Notification
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}

      {!user ? (
        <div className="flex-grow flex items-center justify-center p-4">
          {isRegistering ? (
            <RegisterForm
              onBackToLogin={() => setIsRegistering(false)}
              onSuccess={(msg) => setSuccess(msg)}
            />
          ) : (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onShowRegister={() => setIsRegistering(true)}
            />
          )}
        </div>
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
            onLogout={handleLogout}
            onOpenMenu={toggleSidebar}
            onGoHome={() => setActiveView('dashboard')}
          />

          <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
            {renderContent()}
          </main>

          <footer className="py-6 text-center border-t bg-white dark:bg-[#1A1A1A] border-slate-100 dark:border-white/5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              GuG Verein | Member Portal v1.0
            </p>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
