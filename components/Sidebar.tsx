import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onViewChange
}) => {

  const menuItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Home',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1h-5.25a.75.75 0 01-.75-.75V15h-4v5.25a.75.75 0 01-.75.75H4a1 1 0 01-1-1V9.75z" />
        </svg>
      )
    },
    {
      id: 'calendar' as ViewType,
      label: 'Kalender',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'polls' as ViewType,
      label: 'Umfragen',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'members' as ViewType,
      label: 'Mitgliederverwaltung',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'tasks' as ViewType,
      label: 'Aufgaben',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'settings' as ViewType,
      label: 'Einstellungen',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[#1A1A1A] z-[70] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">

            <div
              onClick={() => {
                onViewChange('dashboard');
                onClose();
              }}
              className="flex items-center gap-4 cursor-pointer"
            >
              {/* Vereinslogo */}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
  <img
    src="/logo.png"
    alt="Vereinslogo"
    className="w-8 h-8 object-contain"
  />
</div>

              <div>
                <span className="text-white font-bold block leading-none text-xl tracking-tight">
                  GuG Verein
                </span>
                <span className="text-[8px] text-[#B5A47A] font-black uppercase tracking-widest">
                  Portal Navigation
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/30 hover:text-white transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${
                  activeView === item.id
                    ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-lg shadow-[#B5A47A]/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`${activeView === item.id ? 'text-[#1A1A1A]' : 'text-[#B5A47A] group-hover:text-white'} transition-colors`}>
                  {item.icon}
                </span>

                <span className="text-sm font-black uppercase tracking-widest text-[11px]">
                  {item.label}
                </span>

                {activeView === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-8 border-t border-white/5">
            <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] text-center">
              GuG Verein Management Systems
            </p>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
