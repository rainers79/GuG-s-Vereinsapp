// components/DashboardView.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { User, Poll, ViewType } from '../types';
import { getCroppedImg } from '../utils/cropImage';

interface Props {
  user: User;
  polls: Poll[];
  onNavigate: (view: ViewType) => void;
}

const DashboardView: React.FC<Props> = ({ user, polls, onNavigate }) => {

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcomingPolls = polls.filter(p => p.target_date);

  /* Load existing image */
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
      });
  }, []);

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
  };

  const handleUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setUploading(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);

      const formData = new FormData();
      formData.append('file', croppedBlob, 'profile.jpg');

      const response = await fetch('https://api.gug-verein.at/wp-json/gug/v1/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.message);

      setProfileImage(data.profile_image_url);
      setSelectedImage(null);

    } catch (err: any) {
      setError(err.message || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10">

      {/* ================= PROFIL ================= */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border shadow-xl">

        <div className="flex items-center gap-6">

          {/* Avatar */}
          <div className="relative">

            <label className="cursor-pointer block">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#B5A47A]">

                {profileImage ? (
                  <img src={profileImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] flex items-center justify-center text-3xl font-black text-[#1A1A1A]">
                    {user.displayName.charAt(0)}
                  </div>
                )}

              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </label>

          </div>

          <div>
            <h1 className="text-2xl font-black">{user.displayName}</h1>
            <p className="text-sm text-[#B5A47A] uppercase font-bold">{user.role}</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

        </div>
      </div>

      {/* ================= CROP MODAL ================= */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">

          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl w-[90%] max-w-lg">

            <div className="relative w-full h-80 bg-black rounded-xl overflow-hidden">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-4 flex justify-between items-center">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 rounded-lg bg-gray-400 text-white"
                >
                  Abbrechen
                </button>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-[#B5A47A] text-black font-bold"
                >
                  {uploading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= KACHELN ================= */}
      <div className="grid md:grid-cols-3 gap-6">
        <div onClick={() => onNavigate('calendar')} className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border cursor-pointer">
          <h3 className="font-black">Kalender</h3>
        </div>

        <div onClick={() => onNavigate('polls')} className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border cursor-pointer">
          <h3 className="font-black">Umfragen</h3>
        </div>

        <div onClick={() => onNavigate('tasks')} className="p-6 rounded-2xl bg-white dark:bg-[#1E1E1E] border cursor-pointer">
          <h3 className="font-black">Aufgaben</h3>
        </div>
      </div>

    </div>
  );
};

export default DashboardView;
