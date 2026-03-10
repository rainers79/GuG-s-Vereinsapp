import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Poll, ViewType, NotificationSettings } from './types';
import * as api from './services/api';
import ProjectFlags from './components/ProjectFlags';
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
import ProjectsView from './components/ProjectsView';
import ProjectChatView from './components/ProjectChatView';
import ProjectCoreTeamView from './components/ProjectCoreTeamView';
import ProjectShoppingView from './components/ProjectShoppingView';
import ProjectInvoicesView from './components/ProjectInvoicesView';
import PosView from './components/pos/PosView';
import PosAdminView from './components/pos/PosAdminView';

/* =====================================================
   SECTION 01 - TYPES
===================================================== */

type ToastType = 'error' | 'success';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallEnvironment {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isSamsung: boolean;
  isFirefox: boolean;
  browserLabel: string;
}

/* =====================================================
   SECTION 02 - STORAGE KEYS
===================================================== */

const LS_NOTIFICATION_SETTINGS = 'gug_notification_settings';
const LS_LAST_CHAT_ID = 'gug_last_chat_id';
const LS_LAST_POLL_ID = 'gug_last_poll_id';
const LS_ACTIVE_PROJECT = 'gug_active_project';
const LS_PROJECTS_WHEEL_MODE = 'gug_projects_wheel_mode';
const LS_ACTIVE_VIEW = 'gug_active_view';
const LS_PRELOGIN_LANDING_DISMISSED = 'gug_prelogin_landing_dismissed';

/* =====================================================
   SECTION 03 - DEFAULT SETTINGS
===================================================== */

const defaultNotificationSettings: NotificationSettings = {
  chatEnabled: true,
  pollEnabled: true,
  chatPreview: true,
  pollPreview: true
};

/* =====================================================
   SECTION 04 - HELPERS
===================================================== */

 const getStoredActiveView = (): ViewType => {
  const raw = localStorage.getItem(LS_ACTIVE_VIEW) as ViewType | null;

  const allowedViews: ViewType[] = [
    'dashboard',
    'projects',
    'polls',
    'calendar',
    'members',
    'tasks',
    'settings',
    'pos',
    'pos-admin',
    'project-chat',
    'project-coreteam',
    'project-shopping',
    'project-invoices'
  ];

  if (raw && allowedViews.includes(raw)) {
    return raw;
  }

  return 'dashboard';
};

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') return false;

  const byMatchMedia = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const byNavigator = 'standalone' in window.navigator && (window.navigator as any).standalone === true;

  return byMatchMedia || byNavigator;
};

const getInstallEnvironment = (): InstallEnvironment => {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isEdge: false,
      isSamsung: false,
      isFirefox: false,
      browserLabel: 'Browser'
    };
  }

  const ua = window.navigator.userAgent || '';
  const lower = ua.toLowerCase();

  const isIOS =
    /iphone|ipad|ipod/.test(lower) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

  const isAndroid = /android/.test(lower);
  const isEdge = /edg\//.test(lower);
  const isSamsung = /samsungbrowser/.test(lower);
  const isFirefox = /firefox|fxios/.test(lower);
  const isChrome =
    (/chrome|crios/.test(lower) || isEdge || isSamsung) &&
    !isFirefox;
  const isSafari =
    /safari/.test(lower) &&
    !isChrome &&
    !isEdge &&
    !isSamsung &&
    !isFirefox;

  let browserLabel = 'Browser';

  if (isEdge) browserLabel = 'Edge';
  else if (isSamsung) browserLabel = 'Samsung Internet';
  else if (isChrome) browserLabel = 'Chrome';
  else if (isSafari) browserLabel = 'Safari';
  else if (isFirefox) browserLabel = 'Firefox';

  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isEdge,
    isSamsung,
    isFirefox,
    browserLabel
  };
};

const getManualInstallTitle = (env: InstallEnvironment) => {
  if (env.isIOS && env.isSafari) {
    return 'Installation in Safari';
  }

  if (env.isIOS) {
    return 'Für iPhone bitte Safari verwenden';
  }

  if (env.isAndroid && (env.isChrome || env.isEdge || env.isSamsung)) {
    return `Installation in ${env.browserLabel}`;
  }

  if (env.isAndroid && env.isFirefox) {
    return 'Installation in Firefox';
  }

  if (env.isAndroid) {
    return 'Installation auf Android';
  }

  return 'Installation im Browser';
};

const getManualInstallSteps = (env: InstallEnvironment): string[] => {
  if (env.isIOS && env.isSafari) {
    return [
      'Unten oder oben auf Teilen tippen.',
      '„Zum Home-Bildschirm“ auswählen.',
      'Mit „Hinzufügen“ bestätigen.'
    ];
  }

  if (env.isIOS) {
    return [
      'Die Seite in Safari öffnen.',
      'Dort auf Teilen tippen.',
      'Dann „Zum Home-Bildschirm“ auswählen.'
    ];
  }

  if (env.isAndroid && (env.isChrome || env.isEdge || env.isSamsung)) {
    return [
      `Oben rechts das Menü in ${env.browserLabel} öffnen.`,
      '„App installieren“ oder „Zum Startbildschirm hinzufügen“ auswählen.',
      'Die Installation bestätigen.'
    ];
  }

  if (env.isAndroid && env.isFirefox) {
    return [
      'Oben rechts das Browser-Menü öffnen.',
      '„Zum Startbildschirm hinzufügen“ auswählen.',
      'Den Vorgang bestätigen.'
    ];
  }

  if (env.isAndroid) {
    return [
      'Das Browser-Menü öffnen.',
      'Nach „App installieren“ oder „Zum Startbildschirm hinzufügen“ suchen.',
      'Die Installation bestätigen.'
    ];
  }

  return [
    'Im Browser nach „Installieren“ oder „Als App installieren“ suchen.',
    'Alternativ das Browser-Menü öffnen.',
    'Die Installation bestätigen.'
  ];
};

const getPrimaryInstallButtonLabel = (
  isInstallable: boolean,
  installingApp: boolean,
  env: InstallEnvironment
) => {
  if (installingApp) {
    return 'Installation startet...';
  }

  if (isInstallable) {
    return 'App installieren';
  }

  if (env.isIOS && env.isSafari) {
    return 'Safari-Schritte anzeigen';
  }

  if (env.isIOS) {
    return 'In Safari öffnen';
  }

  if (env.isAndroid) {
    return 'Installationshilfe anzeigen';
  }

  return 'Installationshilfe anzeigen';
};

/* =====================================================
   SECTION 05 - COMPONENT
===================================================== */

const App: React.FC = () => {

  /* =====================================================
     SECTION 06 - STATE
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
  const [activeView, setActiveView] = useState<ViewType>(() => getStoredActiveView());
  const [viewHistory, setViewHistory] = useState<ViewType[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('gug_theme') as 'light' | 'dark') || 'light'
  );
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<DeferredInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneDisplay());
  const [showPreLoginLanding, setShowPreLoginLanding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (isStandaloneDisplay()) return false;
    return localStorage.getItem(LS_PRELOGIN_LANDING_DISMISSED) !== '1';
  });
  const [installingApp, setInstallingApp] = useState(false);

  const userRef = useRef<User | null>(user);

  const installEnvironment = getInstallEnvironment();
  const manualInstallTitle = getManualInstallTitle(installEnvironment);
  const manualInstallSteps = getManualInstallSteps(installEnvironment);
  const primaryInstallButtonLabel = getPrimaryInstallButtonLabel(
    isInstallable,
    installingApp,
    installEnvironment
  );

  /* =====================================================
     SECTION 07 - BASIC EFFECTS
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

  useEffect(() => {
    localStorage.setItem(LS_ACTIVE_VIEW, activeView);
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'pos') {
      setIsSidebarOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as DeferredInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredInstallPrompt(null);
      setShowPreLoginLanding(false);
      localStorage.setItem(LS_PRELOGIN_LANDING_DISMISSED, '1');
      setSuccess('App wurde installiert.');
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowPreLoginLanding(false);
        localStorage.setItem(LS_PRELOGIN_LANDING_DISMISSED, '1');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  /* =====================================================
     SECTION 08 - NAVIGATION HELPERS
  ===================================================== */

  const enforceProjectsActionState = useCallback(() => {
    const activeProject = localStorage.getItem(LS_ACTIVE_PROJECT);
    if (activeProject) {
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
    }
  }, []);

  const navigateTo = useCallback((view: ViewType) => {
    setActiveView((prev) => {
      if (prev === view) return prev;

      if (prev === 'projects' && view !== 'projects') {
        enforceProjectsActionState();
      }

      setViewHistory((history) => [...history, prev]);
      return view;
    });
  }, [enforceProjectsActionState]);

  const navigateToRoot = useCallback((view: ViewType) => {
    if (view === 'dashboard') {
      localStorage.removeItem(LS_PROJECTS_WHEEL_MODE);
    }
    setViewHistory([]);
    setActiveView(view);
  }, []);

  const goBack = useCallback(() => {
    setViewHistory((history) => {
      if (history.length === 0) return history;

      const previousView = history[history.length - 1];

      if (previousView === 'projects') {
        enforceProjectsActionState();
      }

      setActiveView(previousView);

      return history.slice(0, -1);
    });
  }, [enforceProjectsActionState]);

  const canGoBack = viewHistory.length > 0;

  const handleInstallApp = useCallback(async () => {
    if (!deferredInstallPrompt) {
      if (installEnvironment.isIOS && !installEnvironment.isSafari) {
        setError('Bitte öffne die App auf iPhone oder iPad in Safari und wähle dort „Zum Home-Bildschirm“.');
        return;
      }

      if (installEnvironment.isIOS && installEnvironment.isSafari) {
        setError('Öffne in Safari das Teilen-Menü und wähle „Zum Home-Bildschirm“.');
        return;
      }

      if (installEnvironment.isAndroid) {
        setError(`Öffne das Menü in ${installEnvironment.browserLabel} und wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“.`);
        return;
      }

      setError('Nutze im Browser das Menü oder das Installieren-Symbol, um die App zu installieren.');
      return;
    }

    try {
      setInstallingApp(true);
      setError(null);

      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setShowPreLoginLanding(false);
        localStorage.setItem(LS_PRELOGIN_LANDING_DISMISSED, '1');
      }

      setDeferredInstallPrompt(null);
      setIsInstallable(false);
    } catch (err: any) {
      setError(err?.message || 'Installation konnte nicht gestartet werden.');
    } finally {
      setInstallingApp(false);
    }
  }, [deferredInstallPrompt, installEnvironment]);

  const handleContinueInBrowser = useCallback(() => {
    setShowPreLoginLanding(false);
    localStorage.setItem(LS_PRELOGIN_LANDING_DISMISSED, '1');
  }, []);

  /* =====================================================
     SECTION 09 - TOAST HELPERS
  ===================================================== */

  const pushToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* =====================================================
     SECTION 10 - AUTH / LOADING
  ===================================================== */

  const handleUnauthorized = useCallback(() => {
    api.clearToken();
    setUser(null);
    setPolls([]);
    setError('Ihre Sitzung ist abgelaufen.');
    setIsSidebarOpen(false);
    setViewHistory([]);
    setActiveView('dashboard');
    localStorage.removeItem(LS_PROJECTS_WHEEL_MODE);
    localStorage.removeItem(LS_ACTIVE_VIEW);
  }, []);

  const fetchAppData = useCallback(async () => {
    try {
      const currentUser = await api.getCurrentUser(handleUnauthorized);
      setUser(currentUser);

      const pollData = await api.getPolls(handleUnauthorized);
      setPolls(pollData);

      const storedView = getStoredActiveView();
      setActiveView(storedView || 'dashboard');
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (api.getToken()) {
      fetchAppData();
    } else {
      setLoading(false);
      setActiveView('dashboard');
      localStorage.removeItem(LS_ACTIVE_VIEW);
    }
  }, [fetchAppData]);

  useEffect(() => {
    if (!user) return;

    const storedView = getStoredActiveView();

    if (storedView !== activeView) {
      setActiveView(storedView);
    }
  }, [user, activeView]);

  /* =====================================================
     SECTION 11 - STORAGE HELPERS
  ===================================================== */

  const getStoredNumber = (key: string): number => {
    const raw = localStorage.getItem(key);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  };

  const setStoredNumber = (key: string, value: number) => {
    localStorage.setItem(key, String(value));
  };

  /* =====================================================
     SECTION 12 - GLOBAL UPDATE CHECKS
  ===================================================== */

  const checkGlobalUpdates = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;

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
     SECTION 13 - VIEW RENDERING
  ===================================================== */

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            user={user!}
            polls={polls}
            onNavigate={navigateTo}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'projects':
        return (
          <ProjectsView
            onNavigate={navigateTo}
            userRole={user!.role}
          />
        );

      case 'project-chat':
        return (
          <ProjectChatView
            user={user!}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'project-coreteam':
        return (
          <ProjectCoreTeamView
            user={user!}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'project-shopping':
        return (
          <ProjectShoppingView
            user={user!}
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'project-invoices':
        return (
          <ProjectInvoicesView
            user={user!}
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
              navigateTo('polls');
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

      case 'pos-admin':
        return (
          <PosAdminView
            onUnauthorized={handleUnauthorized}
          />
        );

      case 'pos':
        return (
          <PosView
            user={user!}
            onUnauthorized={handleUnauthorized}
            onExit={() => {
              navigateToRoot('dashboard');
              setIsSidebarOpen(false);
            }}
          />
        );

      default:
        return null;
    }
  };

  /* =====================================================
     SECTION 14 - EARLY RETURN LOADING
  ===================================================== */

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Lädt...
      </div>
    );
  }

  /* =====================================================
     SECTION 15 - PRE LOGIN LANDING
  ===================================================== */
 if (!user && showPreLoginLanding && !isInstalled) {
    return (
      <div className="min-h-screen bg-[#F6F1E4] text-black flex flex-col">
        {error && (
          <Notification message={error} type="error" onClose={() => setError(null)} />
        )}

        {success && (
          <Notification message={success} type="success" onClose={() => setSuccess(null)} />
        )}

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md bg-white border border-black/10 rounded-3xl shadow-xl p-6">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="CoreV Logo"
                className="h-20 w-auto object-contain"
              />
            </div>

            <div className="mt-6 text-center">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#C9AE6A]">
                CoreV
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Vereinsplattform
              </h1>
              <p className="mt-4 text-sm leading-6 text-black/70 font-medium">
                Installiere die App direkt auf deinem Handy für schnelleren Zugriff,
                einen appähnlichen Start und eine sauberere Nutzung im Alltag.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleInstallApp}
                disabled={installingApp}
                className="w-full rounded-2xl bg-[#C9AE6A] px-4 py-4 text-[12px] font-black uppercase tracking-wide text-black shadow-sm disabled:opacity-50"
              >
                {primaryInstallButtonLabel}
              </button>

              <button
                type="button"
                onClick={handleContinueInBrowser}
                className="w-full rounded-2xl bg-[#F3F3F3] px-4 py-4 text-[12px] font-black uppercase tracking-wide text-black"
              >
                Im Browser fortfahren
              </button>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left">
                <div className="text-xs font-black uppercase tracking-wide text-amber-900">
                  {manualInstallTitle}
                </div>

                <ol className="mt-3 space-y-2 pl-4 text-xs font-semibold text-amber-900 list-decimal">
                  {manualInstallSteps.map((step, index) => (
                    <li key={`install_step_${index}`}>{step}</li>
                  ))}
                </ol>

                {isInstallable && (
                  <div className="mt-3 text-xs font-semibold text-amber-900">
                    In diesem Browser ist zusätzlich ein direkter Installationsdialog verfügbar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     SECTION 16 - POS MODE
  ===================================================== */

  const isPosMode = !!user && activeView === 'pos';

  if (isPosMode) {
    return (
      <div className="min-h-screen w-full bg-[#F5E9D0]">
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

        <div className="min-h-screen w-full">
          {renderContent()}
        </div>
      </div>
    );
  }

  /* =====================================================
     SECTION 17 - DEFAULT LAYOUT
  ===================================================== */

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
            onViewChange={navigateTo}
            userRole={user.role}
          />

          <Header
            user={user}
            onLogout={() => {
              api.clearToken();
              setUser(null);
              setViewHistory([]);
              setActiveView('dashboard');
              localStorage.removeItem(LS_PROJECTS_WHEEL_MODE);
              localStorage.removeItem(LS_ACTIVE_VIEW);
            }}
            onOpenMenu={() => setIsSidebarOpen(true)}
            onGoHome={() => navigateToRoot('dashboard')}
          />

          <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
            {canGoBack && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-secondary"
                >
                  Zurück
                </button>
              </div>
            )}

            {renderContent()}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
