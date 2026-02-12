
import React, { useState, useEffect, useCallback } from 'react';
import { User, Poll, AppRole, ApiError, ViewType } from './types';
import * as api from './services/api';
import LoginForm from './components/LoginForm';
import PollList from './components/PollList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('calendar');

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
      console.error('App loading error:', err);
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

  const renderContent = () => {
    switch (activeView) {
      case 'polls':
        return (
          <PollList 
            polls={polls} 
            user={user!} 
            onRefresh={() => fetchAppData()} 
            onUnauthorized={handleUnauthorized}
          />
        );
      case 'calendar':
      case 'members':
      case 'tasks':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm">
                <div className="text-[#B5A47A] mb-8 flex justify-center">
                   <div className="p-10 bg-[#B5A47A]/5 rounded-full border border-[#B5A47A]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                   </div>
                </div>
                <h3 className="text-2xl font-bold text-[#1A1A1A] uppercase tracking-tighter">In Entwicklung</h3>
                <div className="h-1 w-12 bg-[#B5A47A] mx-auto mt-3 mb-4 rounded-full"></div>
                <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                  Die Komponente <span className="text-[#1A1A1A] font-bold">"{activeView.toUpperCase()}"</span> wird aktuell für den GuG Verein vorbereitet.
                </p>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#B5A47A] mb-6"></div>
          <p className="text-[#1A1A1A] font-black uppercase text-[10px] tracking-widest">Initialisierung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col font-sans text-[#1A1A1A]">
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      
      {!user ? (
        <div className="flex-grow flex items-center justify-center p-4">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
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
          <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
            {renderContent()}
          </main>
          <footer className="bg-white border-t border-slate-100 py-10 text-center">
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
