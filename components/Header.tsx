import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onOpenMenu: () => void;
  onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenMenu,
  onGoHome
}) => {
  return (
    <header className="bg-[#1A1A1A] text-white sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">

          {/* Sidebar Toggle */}
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-lg text-white/60 hover:text-[#B5A47A] hover:bg-white/5 transition-all border border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo = Home Button */}
          <button
            onClick={onGoHome}
            className="flex items-center gap-3 hover:opacity-80 transition-all"
          >
            <div className="h-10 flex items-center">
              <img
                src="/logo.png"
                alt="GuG Logo"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="hidden sm:block leading-tight text-left">
              <div className="text-base font-semibold tracking-tight">
                GuG Verein
              </div>
              <div className="text-[10px] text-[#B5A47A] uppercase tracking-widest font-bold">
                Member Portal
              </div>
            </div>
          </button>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-5">

          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold leading-none">
              {user.displayName}
            </div>
            <div className="text-[10px] text-[#B5A47A] uppercase tracking-widest mt-1">
              {user.role}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Abmelden"
            className="p-2 rounded-lg text-white/50 hover:text-[#B5A47A] hover:bg-white/5 transition-all"
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
