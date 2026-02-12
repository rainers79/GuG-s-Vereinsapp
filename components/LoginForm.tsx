
import React, { useState } from 'react';
import * as api from '../services/api';
import { User } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('test');
  const [password, setPassword] = useState('123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Bitte Benutzername und Passwort eingeben.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await api.login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/5 border border-slate-100 p-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-10">
        {/* Runder Logo Platzhalter */}
        <div className="w-28 h-28 mx-auto mb-8 flex items-center justify-center border-2 border-dashed border-[#B5A47A]/30 rounded-full bg-slate-50 overflow-hidden group shadow-inner">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] text-center px-4 group-hover:text-[#B5A47A] transition-colors">
            Logo .png<br/>Platzhalter
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-1">GuG Verein</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Mitglieder-Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div 
              className="prose-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: error }} 
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="username">
            Benutzername
          </label>
          <input
            id="username"
            type="text"
            className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#B5A47A]/20 focus:border-[#B5A47A] outline-none transition-all font-medium text-[#1A1A1A] bg-slate-50/50"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="password">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#B5A47A]/20 focus:border-[#B5A47A] outline-none transition-all font-medium text-[#1A1A1A] bg-slate-50/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#B5A47A] hover:bg-[#a3936a] text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-[#B5A47A]/20 active:scale-[0.98] disabled:opacity-50 mt-8"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Anmeldung...
            </div>
          ) : (
            'ANMELDEN'
          )}
        </button>
      </form>
      
      <div className="mt-10 pt-6 border-t border-slate-50 text-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} GuG Verein | Secure Access
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
