import React, { useState, useEffect, useCallback } from 'react';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('gug_theme') as 'light' | 'dark') || 'light'
  );

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

      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      {success && <Notification message={success} type="success" onClose={() => setSuccess(null)} />}

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
