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
    email: '',
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (value: string) => {
    // Einfacher Check, Backend validiert final
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.birthday || !formData.email || !formData.username || !formData.password) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse an.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.register(formData);
      onSuccess(response.message || 'Registrierung erfolgreich! Bitte bestätigen Sie die E-Mail-Adresse.');
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

  const inputClasses =
    "w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#B5A47A] focus:ring-2 focus:ring-[#B5A47A]/10 outline-none transition-all font-bold text-base bg-white text-[#000000] placeholder:text-slate-400";
  const labelClasses =
    "text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest ml-1 mb-1 block";

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/10 border border-slate-100 p-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tighter mb-1 uppercase">Mitglied werden</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">GuG Verein Registrierung</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 animate-in shake duration-300">
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses} htmlFor="firstName">Vorname</label>
            <input
              id="firstName"
              type="text"
              className={inputClasses}
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
              placeholder="Max"
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="lastName">Nachname</label>
            <input
              id="lastName"
              type="text"
              className={inputClasses}
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
              placeholder="Mustermann"
            />
          </div>
        </div>

        <div>
          <label className={labelClasses} htmlFor="birthday">Geburtstag</label>
          <input
            id="birthday"
            type="date"
            className={inputClasses}
            value={formData.birthday}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="email">E-Mail</label>
          <input
            id="email"
            type="email"
            className={inputClasses}
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            placeholder="name@domain.at"
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="username">Benutzername</label>
          <input
            id="username"
            type="text"
            className={inputClasses}
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            placeholder="Benutzername"
            autoComplete="username"
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            className={inputClasses}
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1A1A1A] hover:bg-[#B5A47A] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-6 tracking-[0.1em] text-xs"
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
