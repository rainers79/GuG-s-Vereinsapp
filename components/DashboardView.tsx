import React, { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { User, Poll, ViewType } from '../types';
import { getCroppedImg } from '../utils/cropImage';
import * as api from '../services/api';

interface Props {
  user: User;
  polls: Poll[];
  onNavigate: (view: ViewType) => void;
  onUnauthorized: () => void;
}

const DashboardView: React.FC<Props> = ({
  user,
  polls,
  onNavigate,
  onUnauthorized
}) => {

  /* =====================================================
     PROFILE IMAGE STATE
  ===================================================== */

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =====================================================
     CHAT STATE
  ===================================================== */

  const [messages, setMessages] = useState<api.ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /* =====================================================
     LOAD PROFILE IMAGE
  ===================================================== */

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

  /* =====================================================
     CHAT LOGIC
  ===================================================== */

  const loadChat = async () => {
    try {
      const data = await api.getChatMessages(onUnauthorized);
      setMessages(data);
    } catch {}
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = newMessage.trim();
    if (!msg) return;
    if (loadingChat) return;

    setLoadingChat(true);
    try {
      await api.sendChatMessage(msg, onUnauthorized);
      setNewMessage('');
      await loadChat();
    } finally {
      setLoadingChat(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  /* =====================================================
     IMAGE CROP
  ===================================================== */

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

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="space-y-10">

      {/* ================= PROFIL ================= */}
      <div className="app-card">

        <div className="flex items-center gap-6 flex-col sm:flex-row">

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

          <div>
            <h1 className="text-2xl font-black">{user.displayName}</h1>
            <p className="text-sm text-[#B5A47A] uppercase font-bold">{user.role}</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

        </div>
      </div>

      {/* ================= CHAT ================= */}
      <div className="app-card space-y-4">

        <h2 className="text-lg font-black">Globaler Chat</h2>

        <div className="h-80 overflow-y-auto bg-slate-50 dark:bg-[#121212] rounded-xl p-4 space-y-3 text-sm">

          {messages.map(msg => (
            <div key={msg.id}>
              <span className="text-xs font-bold text-[#B5A47A]">
                {msg.display_name}
              </span>
              <div className="text-slate-800 dark:text-white">
                {msg.message}
              </div>
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleChatKeyDown}
            className="form-input flex-1"
            placeholder="Nachricht schreiben..."
            disabled={loadingChat}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={loadingChat || !newMessage.trim()}
            className="btn-primary"
          >
            Senden
          </button>
        </div>

      </div>

      {/* ================= NAVIGATION ================= */}
      <div className="grid md:grid-cols-3 gap-6">

        <div onClick={() => onNavigate('calendar')} className="app-card cursor-pointer">
          <h3 className="font-black">Kalender</h3>
        </div>

        <div onClick={() => onNavigate('polls')} className="app-card cursor-pointer">
          <h3 className="font-black">Umfragen</h3>
        </div>

        <div onClick={() => onNavigate('tasks')} className="app-card cursor-pointer">
          <h3 className="font-black">Aufgaben</h3>
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
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="btn-secondary"
                >
                  Abbrechen
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;
