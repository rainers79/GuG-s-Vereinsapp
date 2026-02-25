import React from 'react';
import { AppRole, ViewType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  userRole: AppRole;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onViewChange,
  userRole
}) => {

  const menuItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Home'
    },
    {
      id: 'calendar' as ViewType,
      label: 'Kalender'
    },
    {
      id: 'polls' as ViewType,
      label: 'Umfragen'
    },
    {
      id: 'members' as ViewType,
      label: 'Mitgliederverwaltung',
      roles: [AppRole.SUPERADMIN, AppRole.VORSTAND]
    },
    {
      id: 'tasks' as ViewType,
      label: 'Aufgaben'
    },
    {
      id: 'settings' as ViewType,
      label: 'Einstellungen'
    }
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!('roles' in item)) return true;
    const roles = (item as { roles: AppRole[] }).roles;
    return roles.includes(userRole);
  });

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[#1A1A1A] z-[70] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">

          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div
              onClick={() => {
                onViewChange('dashboard');
                onClose();
              }}
              className="flex items-center gap-4 cursor-pointer"
            >
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
              className="text-white/30 hover:text-white transition-colors px-3 py-2 text-xs font-black uppercase tracking-widest"
            >
              Schließen
            </button>
          </div>

          <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all duration-300 group ${
                  activeView === item.id
                    ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-lg shadow-[#B5A47A]/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-black uppercase tracking-widest text-[11px]">
                  {item.label}
                </span>

                {activeView === item.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-pulse" />
                )}
              </button>
            ))}
          </nav>

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
