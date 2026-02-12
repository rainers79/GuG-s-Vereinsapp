
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeView, onViewChange }) => {
  const menuItems = [
    { id: 'calendar' as ViewType, label: 'Kalender', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'polls' as ViewType, label: 'Umfragen', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'members' as ViewType, label: 'Mitgliederverwaltung', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { id: 'tasks' as ViewType, label: 'Aufgaben', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 left-0 h-full w-80 bg-[#1A1A1A] z-[70] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header in Sidebar */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] rounded-xl flex items-center justify-center shadow-xl shadow-black/40 shrink-0 transform -rotate-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <span className="text-white font-bold block leading-none text-xl tracking-tight">GuG Verein</span>
                <span className="text-[8px] text-[#B5A47A] font-black uppercase tracking-widest">Portal Navigation</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow py-8 px-4 space-y-2">
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
                <span className="text-sm font-bold tracking-tight uppercase tracking-widest text-[11px] font-black">
                  {item.label}
                </span>
                {activeView === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-pulse" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer in Sidebar */}
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
