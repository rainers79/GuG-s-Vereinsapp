// components/DashboardView.tsx

import React, { useState, useEffect } from 'react';
import { User, Poll, ViewType } from '../types';

interface Props {
  user: User;
  polls: Poll[];
  onNavigate: (view: ViewType) => void;
}

const DashboardView: React.FC<Props> = ({ user, polls, onNavigate }) => {

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcomingPolls = polls.filter(p => p.target_date);

  /* ================= LOAD PROFILE IMAGE ================= */
  useEffect(() => {
    fetch('https://api.gug-verein.at/wp-json/gug/v1/profile-image', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.profile_image_url) {
          setProfileImage(data.profile_image_url);
        }
      })
      .catch(() => {});
  }, []);

  /* ================= HANDLE UPLOAD ================= */
  const handleImageUpload = async (file: File) => {

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Nur Bilddateien erlaubt.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await fetch('https://api.gug-verein.at/wp-json/gug/v1/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Upload fehlgeschlagen.');
      }

      setProfileImage(data.profile_image_url);

    } catch (err: any) {
      setError(err.message || 'Fehler beim Upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10">

      {/* ================= PROFIL BEREICH ================= */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-xl">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

          {/* Profil Links */}
          <div className="flex items-center gap-6">

            {/* Rundes Profilbild */}
            <div className="relative">

              <label className="cursor-pointer block">
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg shadow-black/20 border-2 border-[#B5A47A]">

                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] flex items-center justify-center text-3xl font-black text-[#1A1A1A]">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {uploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  Upload...
                </div>
              )}

            </div>

            {/* Name & Rolle */}
            <div>
              <h1 className="text-3xl font-black leading-tight">
                {user.displayName}
              </h1>
              <p className="text-sm text-[#B5A47A] font-bold uppercase tracking-widest mt-2">
                {user.role}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Willkommen im Vereins-Dashboard
              </p>

              {error && (
                <p className="text-red-500 text-sm mt-3">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Logo Platzhalter Rechts */}
          <div className="flex items-center justify-center">

            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[#B5A47A]/40 flex items-center justify-center text-[#B5A47A] text-xs font-black uppercase tracking-widest text-center p-4">
              Vereins<br />Logo
            </div>

          </div>

        </div>

      </div>

      {/* ================= DASHBOARD KACHELN ================= */}
      <div className="grid md:grid-cols-3 gap-6">

        <div
          onClick={() => onNavigate('calendar')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition shadow-lg"
        >
          <h3 className="font-black text-lg mb-2">Kalender</h3>
          <p className="text-sm text-slate-500">
            Termine & Events verwalten
          </p>
        </div>

        <div
          onClick={() => onNavigate('polls')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition shadow-lg"
        >
          <h3 className="font-black text-lg mb-2">Umfragen</h3>
          <p className="text-sm text-slate-500">
            {polls.length} aktive Umfragen
          </p>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border hover:border-[#B5A47A] transition shadow-lg"
        >
          <h3 className="font-black text-lg mb-2">Aufgaben</h3>
          <p className="text-sm text-slate-500">
            Deine Aufgaben verwalten
          </p>
        </div>

      </div>

      {/* ================= ANSTEHENDE UMFRAGEN ================= */}
      {upcomingPolls.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 border shadow-lg">
          <h3 className="font-black mb-4">Anstehende Umfragen</h3>
          <div className="space-y-2">
            {upcomingPolls.slice(0, 5).map(p => (
              <div key={p.id} className="text-sm">
                {p.question}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;
