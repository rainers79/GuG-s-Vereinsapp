
import React, { useState, useEffect } from 'react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onThemeChange }) => {
  const [dndActive, setDndActive] = useState(() => localStorage.getItem('gug_dnd_active') === 'true');
  const [dndStart, setDndStart] = useState(() => localStorage.getItem('gug_dnd_start') || '22:00');
  const [dndEnd, setDndEnd] = useState(() => localStorage.getItem('gug_dnd_end') || '07:00');

  useEffect(() => {
    localStorage.setItem('gug_dnd_active', String(dndActive));
    localStorage.setItem('gug_dnd_start', dndStart);
    localStorage.setItem('gug_dnd_end', dndEnd);
  }, [dndActive, dndStart, dndEnd]);

  const Toggle = ({ active, onToggle, label, sublabel }: { active: boolean, onToggle: () => void, label: string, sublabel?: string }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-col">
        <span className="text-sm font-black uppercase tracking-widest">{label}</span>
        {sublabel && <span className="text-[10px] opacity-40 font-bold uppercase mt-0.5 tracking-tight">{sublabel}</span>}
      </div>
      <button 
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out ${active ? 'bg-[#B5A47A] shadow-lg shadow-[#B5A47A]/20' : 'bg-slate-200 dark:bg-white/10'}`}
      >
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ease-in-out transform ${active ? 'translate-x-7' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-4xl font-black text-inherit tracking-tighter uppercase">Einstellungen</h2>
        <div className="h-1.5 w-16 bg-[#B5A47A] mt-3 mb-4 mx-auto sm:mx-0 rounded-full"></div>
        <p className="opacity-50 text-[10px] font-black uppercase tracking-[0.3em]">Individualisieren Sie Ihr Portal-Erlebnis</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Section */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border transition-colors duration-500`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#B5A47A]/10 text-[#B5A47A] rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-bold tracking-tight uppercase">Personalisierung</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <Toggle 
              label="Dunkler Modus" 
              sublabel="Optimiert für nächtliche Nutzung"
              active={theme === 'dark'} 
              onToggle={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} 
            />
          </div>
        </div>

        {/* DND Section */}
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-2xl p-8 shadow-xl border transition-colors duration-500`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#B5A47A]/10 text-[#B5A47A] rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold tracking-tight uppercase">Nicht stören (DND)</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <Toggle 
              label="Funktion Aktivieren" 
              sublabel="Benachrichtigungen zeitgesteuert pausieren"
              active={dndActive} 
              onToggle={() => setDndActive(!dndActive)} 
            />

            {dndActive && (
              <div className="py-6 animate-in slide-in-from-top-2 duration-500">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Von (Start)</label>
                    <input 
                      type="time" 
                      value={dndStart}
                      onChange={(e) => setDndStart(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none focus:border-[#B5A47A] font-bold ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Bis (Ende)</label>
                    <input 
                      type="time" 
                      value={dndEnd}
                      onChange={(e) => setDndEnd(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none focus:border-[#B5A47A] font-bold ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-10 text-center">
           <p className="text-[10px] opacity-30 font-bold uppercase tracking-[0.2em]">GuG Verein Management System v1.0.4</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
