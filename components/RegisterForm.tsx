
import React, { useState } from 'react';
import * as api from '../services/api';

interface RegisterFormProps {
  onBackToLogin: () => void;
  onSuccess: (message: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.birthday || !formData.username || !formData.password) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.register(formData);
      onSuccess(response.message || 'Registrierung erfolgreich! Bitte warten Sie auf die Freischaltung.');
      onBackToLogin();
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/10 border border-slate-100 p-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tighter mb-1 uppercase">Mitglied werden</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">GuG Verein Registrierung</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 animate-in shake duration-300">
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="firstName">Vorname</label>
            <input
              id="firstName"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B5A47A] outline-none transition-all font-medium text-sm bg-slate-50/50"
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="lastName">Nachname</label>
            <input
              id="lastName"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B5A47A] outline-none transition-all font-medium text-sm bg-slate-50/50"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="birthday">Geburtstag</label>
          <input
            id="birthday"
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B5A47A] outline-none transition-all font-medium text-sm bg-slate-50/50"
            value={formData.birthday}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="username">Benutzername</label>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B5A47A] outline-none transition-all font-medium text-sm bg-slate-50/50"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1" htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#B5A47A] outline-none transition-all font-medium text-sm bg-slate-50/50"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1A1A1A] hover:bg-[#B5A47A] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-4 tracking-[0.1em] text-xs"
          disabled={loading}
        >
          {loading ? 'Sende Daten...' : 'JETZT REGISTRIEREN'}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-slate-400 hover:text-[#1A1A1A] font-black py-2 px-6 transition-all text-[10px] uppercase tracking-widest"
        >
          Zurück zum Login
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
