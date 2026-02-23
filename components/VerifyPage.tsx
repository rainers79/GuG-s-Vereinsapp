import React, { useEffect, useState } from 'react';
import * as api from '../services/api';

interface VerifyPageProps {
  uid: number;
  token: string;
  onDone: () => void;
}

const VerifyPage: React.FC<VerifyPageProps> = ({ uid, token, onDone }) => {

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Bestätigung wird durchgeführt...');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.verifyEmail(uid, token);
        setStatus('success');
        setMessage(response.message || 'E-Mail erfolgreich bestätigt.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Bestätigung fehlgeschlagen.');
      }
    };

    verify();
  }, [uid, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">

        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#B5A47A] mx-auto mb-6"></div>
            <h2 className="text-lg font-black uppercase tracking-wider">
              E-Mail wird bestätigt...
            </h2>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-2xl font-black text-green-600 uppercase tracking-wide mb-4">
              Erfolgreich bestätigt
            </h2>
            <p className="text-sm mb-6">{message}</p>
            <button
              onClick={onDone}
              className="w-full bg-[#1A1A1A] hover:bg-[#B5A47A] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl tracking-[0.1em] text-xs"
            >
              ZUM LOGIN
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-2xl font-black text-red-600 uppercase tracking-wide mb-4">
              Fehler
            </h2>
            <p className="text-sm mb-6">{message}</p>
            <button
              onClick={onDone}
              className="w-full bg-[#1A1A1A] hover:bg-[#B5A47A] text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl tracking-[0.1em] text-xs"
            >
              ZURÜCK
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyPage;
