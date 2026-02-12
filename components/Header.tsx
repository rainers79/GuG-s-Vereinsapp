
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
            {/* Runder Logo Platzhalter Mini */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1A1A1A] font-bold text-[7px] p-1 text-center border border-white/20 shadow-lg shadow-black/20 leading-none overflow-hidden uppercase tracking-tighter shrink-0">
              Logo<br/>.png
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
