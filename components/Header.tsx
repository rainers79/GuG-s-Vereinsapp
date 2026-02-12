
import React from 'react';
import { User, AppRole } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onOpenMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onOpenMenu }) => {
  return (
    <header className="bg-[#1A1A1A] text-white sticky top-0 z-50 shadow-xl shadow-black/10">
      <div className="container mx-auto px-4 py-4 max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Menu Toggle Button */}
          <button 
            onClick={onOpenMenu}
            className="p-2.5 text-white/70 hover:text-[#B5A47A] hover:bg-white/5 rounded-lg transition-all border border-white/5 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {/* Vereins-Logo Platzhalter */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] rounded-xl flex items-center justify-center shadow-lg shadow-black/20 shrink-0 transform rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.605 3.323A3.323 3.323 0 0110.605 8.906c.443.71.596 1.5.405 2.228a3.323 3.323 0 01-4.708 2.373a3.323 3.323 0 00-3.323 3.323v1.312" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="hidden xs:block">
              <span className="text-lg font-bold block leading-none tracking-tight">GuG Verein</span>
              <span className="text-[9px] font-black text-[#B5A47A] uppercase tracking-widest opacity-80">Member Interface</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden sm:block border-r border-white/10 pr-6 mr-2">
            <p className="text-sm font-bold leading-tight">{user.displayName}</p>
            <p className="text-[9px] text-[#B5A47A] font-black uppercase tracking-widest mt-1">
              {user.role}
            </p>
          </div>
          
          <button
            onClick={onLogout}
            className="p-2.5 text-white/50 hover:text-[#B5A47A] hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10"
            title="Abmelden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
