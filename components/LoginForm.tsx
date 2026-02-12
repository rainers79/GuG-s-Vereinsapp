
import React, { useState } from 'react';
import * as api from '../services/api';
import { User } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onShowRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onShowRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Bitte geben Sie Ihren Benutzernamen und Ihr Passwort ein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await api.login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-4 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-[#B5A47A]/10 focus:border-[#B5A47A] outline-none transition-all font-bold text-base text-[#000000] bg-white placeholder:text-slate-300";

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/10 border border-slate-100 p-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-10">
        <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] rounded-2xl shadow-2xl shadow-[#B5A47A]/30 transform -rotate-3">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
           </svg>
        </div>
        
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tighter mb-1 uppercase">GuG Verein</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Secure Member Access</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-in shake duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="username">
            Benutzername
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={inputClasses}
            placeholder="Ihr Benutzername"
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
            autoComplete="current-password"
            className={inputClasses}
            placeholder="Ihr Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1A1A1A] hover:bg-[#B5A47A] text-white font-black py-5 px-6 rounded-2xl transition-all flex items-center justify-center shadow-xl active:scale-[0.98] disabled:opacity-50 mt-8 tracking-[0.1em] text-xs"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>AUTH...</span>
            </div>
          ) : (
            'LOGIN PORTAL'
          )}
        </button>

        <div className="text-center mt-6">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Noch kein Konto?</p>
          <button
            type="button"
            onClick={onShowRegister}
            className="text-[#B5A47A] hover:text-[#1A1A1A] font-black text-xs uppercase tracking-widest transition-all"
          >
            Jetzt Registrieren
          </button>
        </div>
      </form>
      
      <div className="mt-12 pt-6 border-t border-slate-50 text-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">
          &copy; {new Date().getFullYear()} GuG VEREIN | PRODUCTION
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
