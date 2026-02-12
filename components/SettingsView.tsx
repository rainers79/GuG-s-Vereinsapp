
import React from 'react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onThemeChange }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-4xl font-black text-inherit tracking-tighter uppercase">Einstellungen</h2>
        <div className="h-1.5 w-16 bg-[#B5A47A] mt-3 mb-4 mx-auto sm:mx-0 rounded-full"></div>
        <p className="opacity-50 text-[10px] font-black uppercase tracking-[0.3em]">Individualisieren Sie Ihr Portal-Erlebnis</p>
      </div>

      <div className="grid gap-8">
        {/* Appearance Section */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border transition-colors duration-500`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-[#B5A47A]/10 text-[#B5A47A] rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Erscheinungsbild</h3>
              <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-0.5">Wählen Sie Ihr bevorzugtes Design</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Light Mode Option */}
            <button
              onClick={() => onThemeChange('light')}
              className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all group ${
                theme === 'light' 
                  ? 'border-[#B5A47A] bg-[#B5A47A]/5' 
                  : 'border-transparent bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="w-full aspect-video bg-white rounded-lg shadow-sm mb-4 border border-slate-200 overflow-hidden flex flex-col">
                <div className="h-3 w-full bg-slate-100 border-b border-slate-200" />
                <div className="flex-grow p-2 space-y-2">
                  <div className="h-2 w-1/2 bg-slate-100 rounded" />
                  <div className="h-10 w-full bg-[#B5A47A]/10 rounded border border-[#B5A47A]/20" />
                </div>
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-[#B5A47A]' : 'text-slate-400'}`}>Heller Modus</span>
              {theme === 'light' && (
                <div className="absolute top-3 right-3 w-4 h-4 bg-[#B5A47A] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            {/* Dark Mode Option */}
            <button
              onClick={() => onThemeChange('dark')}
              className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all group ${
                theme === 'dark' 
                  ? 'border-[#B5A47A] bg-[#B5A47A]/5' 
                  : 'border-transparent bg-[#1A1A1A] hover:bg-black/40'
              }`}
            >
              <div className="w-full aspect-video bg-[#121212] rounded-lg shadow-sm mb-4 border border-white/5 overflow-hidden flex flex-col">
                <div className="h-3 w-full bg-[#1A1A1A] border-b border-white/5" />
                <div className="flex-grow p-2 space-y-2">
                  <div className="h-2 w-1/2 bg-[#1A1A1A] rounded" />
                  <div className="h-10 w-full bg-[#B5A47A]/20 rounded border border-[#B5A47A]/30" />
                </div>
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-[#B5A47A]' : 'text-slate-500'}`}>Dunkler Modus</span>
              {theme === 'dark' && (
                <div className="absolute top-3 right-3 w-4 h-4 bg-[#B5A47A] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="p-10 text-center">
           <p className="text-[10px] opacity-30 font-bold uppercase tracking-[0.2em]">Weitere Einstellungen werden in Kürze verfügbar sein.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
