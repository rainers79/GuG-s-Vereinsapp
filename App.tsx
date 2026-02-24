import React, { useState, useEffect, useCallback } from 'react';
import { User, Poll, AppRole, ApiError, ViewType } from './types';
import * as api from './services/api';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PollList from './components/PollList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import VerifyPage from './components/VerifyPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('calendar');
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
    if (!user) setLoading(true);
    setError(null);
    try {
      const currentUser = await api.getCurrentUser(handleUnauthorized);
      setUser(currentUser);
      const pollData = await api.getPolls(handleUnauthorized);
      setPolls(pollData);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        handleUnauthorized();
      } else {
        setError(err.message || 'Fehler beim Laden der Daten.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, handleUnauthorized]);

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

  const renderContent = () => {
    switch (activeView) {
    case 'polls':
  return (
    <PollList 
      polls={polls} 
      user={user!} 
      selectedPollId={selectedPollId}
      onRefresh={() => fetchAppData()} 
      onUnauthorized={handleUnauthorized}
    />
  );
      case 'calendar':
        return (
          <CalendarView 
            polls={polls} 
            user={user!} 
            onRefresh={() => fetchAppData()} 
          />
        );
      case 'settings':
        return (
          <SettingsView theme={theme} onThemeChange={setTheme} />
        );
      case 'members':
      case 'tasks':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-xl p-20 text-center shadow-sm transition-colors duration-500">
                <div className="text-[#B5A47A] mb-8 flex justify-center">
                   <div className="p-10 bg-[#B5A47A]/5 rounded-full border border-[#B5A47A]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                   </div>
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tighter text-slate-900 dark:text-white">
                  In Entwicklung
                </h3>
                <div className="h-1 w-12 bg-[#B5A47A] mx-auto mt-3 mb-4 rounded-full"></div>
                <p className="text-slate-500 dark:text-slate-300 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                  Die Komponente <span className="font-bold">"{activeView.toUpperCase()}"</span> wird aktuell vorbereitet.
                </p>
             </div>
          </div>
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] dark:bg-[#121212] transition-colors duration-500">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#B5A47A] mb-6"></div>
          <p className="font-black uppercase text-[10px] tracking-widest text-slate-900 dark:text-white">
            Initialisierung...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8F8F8] text-[#1A1A1A] dark:bg-[#121212] dark:text-white transition-colors duration-500">
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      {success && <Notification message={success} type="success" onClose={() => setSuccess(null)} />}
      
      {!user ? (
        <div className="flex-grow flex items-center justify-center p-4">
          {isRegistering ? (
            <RegisterForm onBackToLogin={() => setIsRegistering(false)} onSuccess={(msg) => setSuccess(msg)} />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} onShowRegister={() => setIsRegistering(true)} />
          )}
        </div>
      ) : (
        <>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            activeView={activeView}
            onViewChange={setActiveView}
          />
          <Header 
            user={user} 
            onLogout={handleLogout} 
            onOpenMenu={() => setIsSidebarOpen(true)}
          />
          <main className="flex-grow container mx-auto px-0 sm:px-4 py-12 max-w-4xl">
            {renderContent()}
          </main>
          <footer className="py-10 text-center border-t bg-white dark:bg-[#1A1A1A] border-slate-100 dark:border-white/5 transition-colors duration-500">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-2">
              GuG Verein | Member Portal v1.0
            </p>
            <div className="h-0.5 w-8 bg-[#B5A47A]/30 mx-auto rounded-full"></div>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
