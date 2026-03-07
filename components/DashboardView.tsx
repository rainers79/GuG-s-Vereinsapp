import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import { User, Poll, ViewType, Task } from '../types';
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

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<api.ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [dashboardTasks, setDashboardTasks] = useState<Task[]>([]);
  const [loadingDashboardTasks, setLoadingDashboardTasks] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const firstChatLoad = useRef(true);
  const loadingOlderMessages = useRef(false);
  const [privateReceiver, setPrivateReceiver] = useState<{ id:number,name:string } | null>(null);

  const formatChatDate = (dateString: string) => {

    const messageDate = new Date(dateString);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate >= today) return "Heute";
    if (messageDate >= yesterday) return "Gestern";

    return messageDate.toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  };

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

  const loadDashboardTasks = async () => {
    setLoadingDashboardTasks(true);
    try {
      const data = await api.getTasks(onUnauthorized, { scope: 'personal' });
      setDashboardTasks(Array.isArray(data) ? data : []);
    } catch {
      setDashboardTasks([]);
    } finally {
      setLoadingDashboardTasks(false);
    }
  };

  const loadChat = async () => {
    try {

      const data = await api.getChatMessages(onUnauthorized);

      setMessages(prev => {

        if (prev.length === 0) {
          return data;
        }

        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = data.filter(m => !existingIds.has(m.id));

        const merged = [...prev, ...newMessages];
        merged.sort((a, b) => a.id - b.id);
        return merged;

      });

    } catch (e: any) {
      setChatError(e?.message || 'Chat konnte nicht geladen werden.');
    }
  };

  useEffect(() => {
    loadChat();
    loadDashboardTasks();

    const interval = setInterval(() => {
      loadChat();
      loadDashboardTasks();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    const container = chatContainerRef.current;
    if (!container) return;

    if (firstChatLoad.current) {
      firstChatLoad.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }

    const threshold = 80;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }

  }, [messages]);

  const loadOlderMessages = async () => {

    if (!messages.length) return;
    if (loadingOlderMessages.current) return;

    const container = chatContainerRef.current;
    const oldHeight = container?.scrollHeight || 0;

    loadingOlderMessages.current = true;

    try {

      const oldestId = Math.min(...messages.map(m => m.id));

      const older = await api.getChatMessagesBefore(
        oldestId,
        onUnauthorized
      );

      if (older.length > 0) {

        setMessages(prev => {
          const merged = [...older, ...prev];
          merged.sort((a,b)=>a.id-b.id);
          return merged;
        });

        requestAnimationFrame(() => {
          if (!container) return;
          const newHeight = container.scrollHeight;
          container.scrollTop = newHeight - oldHeight;
        });

      }

    } catch (e) {
      console.error("Could not load older messages", e);
    }

    loadingOlderMessages.current = false;

  };

  const handleSend = async () => {

    const msg = newMessage.trim();
    if (!msg) return;
    if (loadingChat) return;

    setChatError(null);
    setLoadingChat(true);

    try {

      if (privateReceiver) {

        await api.apiRequest(
          '/gug/v1/chat',
          {
            method: 'POST',
            body: JSON.stringify({
              message: msg,
              receiver_id: privateReceiver.id
            })
          },
          onUnauthorized
        );

      } else {

        await api.sendChatMessage(msg, onUnauthorized);

      }

      setPrivateReceiver(null);
      setNewMessage('');
      await loadChat();

    } catch (e: any) {

      setChatError(e?.message || 'Senden fehlgeschlagen.');

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

      const response = await fetch(
        'https://api.gug-verein.at/wp-json/gug/v1/profile-image',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('gug_token')
          },
          body: formData
        }
      );

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

  const openTasks = useMemo(
    () => dashboardTasks.filter(task => !task.completed).slice(0, 5),
    [dashboardTasks]
  );

  const relevantPolls = useMemo(
    () => polls.slice(0, 5),
    [polls]
  );

  return (
    <div className="space-y-10">

      <div className="app-card">
        <div className="flex items-center gap-6 flex-col sm:flex-row">

          <label className="cursor-pointer block">

            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#B5A47A]">

              {profileImage ? (

                <img
                  src={profileImage}
                  className="w-full h-full object-cover"
                />

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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="app-card cursor-pointer" onClick={() => onNavigate('tasks')}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black">Offene Aufgaben</h2>
            <span className="text-xs font-black uppercase tracking-widest text-[#B5A47A]">
              {loadingDashboardTasks ? '...' : `${openTasks.length}`}
            </span>
          </div>

          {loadingDashboardTasks ? (
            <div className="text-sm text-slate-500 dark:text-white/60">Lädt…</div>
          ) : openTasks.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-white/60">
              Keine offenen Aufgaben.
            </div>
          ) : (
            <div className="space-y-2">
              {openTasks.map(task => (
                <div key={task.id} className="rounded-lg bg-slate-50 dark:bg-[#121212] p-3">
                  <div className="font-black text-sm text-slate-900 dark:text-white">
                    {task.title}
                  </div>
                  {task.deadline_date && (
                    <div className="text-xs text-slate-500 dark:text-white/60 mt-1">
                      Fällig: {task.deadline_date}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="app-card cursor-pointer" onClick={() => onNavigate('polls')}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black">Umfragen</h2>
            <span className="text-xs font-black uppercase tracking-widest text-[#B5A47A]">
              {relevantPolls.length}
            </span>
          </div>

          {relevantPolls.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-white/60">
              Keine Umfragen vorhanden.
            </div>
          ) : (
            <div className="space-y-2">
              {relevantPolls.map(poll => (
                <div key={poll.id} className="rounded-lg bg-slate-50 dark:bg-[#121212] p-3">
                  <div className="font-black text-sm text-slate-900 dark:text-white">
                    {poll.question}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/60 mt-1">
                    Stimmen: {poll.total_votes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="app-card space-y-4">

        <h2 className="text-lg font-black">Globaler Chat</h2>

        {privateReceiver && (
          <div className="text-sm bg-yellow-100 text-black p-2 rounded">
            Private Nachricht an <b>{privateReceiver.name}</b>
            <button
              className="ml-3 text-red-600"
              onClick={() => setPrivateReceiver(null)}
            >
              abbrechen
            </button>
          </div>
        )}

        {chatError && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            {chatError}
          </div>
        )}

        <button
          onClick={loadOlderMessages}
          className="text-xs text-gray-400 hover:text-white mb-2"
        >
          ältere Nachrichten laden
        </button>

        <div
          ref={chatContainerRef}
          className="h-80 overflow-y-auto overscroll-contain bg-slate-50 dark:bg-[#121212] rounded-xl p-4 space-y-3 text-sm"
        >

          {messages.map((msg, index) => {

            const time = new Date(msg.created_at).toLocaleTimeString(
              'de-AT',
              { hour: '2-digit', minute: '2-digit' }
            );

            const currentDate = formatChatDate(msg.created_at);
            const prevDate =
              index > 0 ? formatChatDate(messages[index - 1].created_at) : null;

            const showDivider = currentDate !== prevDate;

            return (
              <React.Fragment key={msg.id}>

                {showDivider && (
                  <div className="text-center text-xs text-gray-400 my-3">
                    {currentDate}
                  </div>
                )}

                <div className="flex items-start gap-3">

                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#B5A47A] flex-shrink-0">

                    {(msg as any).profile_image_url ? (

                      <img
                        src={(msg as any).profile_image_url}
                        className="w-full h-full object-cover"
                      />

                    ) : (

                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                        {msg.display_name.charAt(0)}
                      </div>

                    )}

                  </div>

                  <div className="flex-1">

                    <div className="flex justify-between items-center">

                      <span className="text-xs font-bold text-[#B5A47A]">
                        {msg.display_name}
                      </span>

                      <span className="text-xs text-gray-400">
                        {time}
                      </span>

                    </div>

                    <div className="text-slate-800 dark:text-white">
                      {msg.message}
                    </div>

                    {msg.user_id !== user.id && (
                      <button
                        className="text-xs text-blue-500 mt-1"
                        onClick={() =>
                          setPrivateReceiver({
                            id: msg.user_id,
                            name: msg.display_name
                          })
                        }
                      >
                        PN
                      </button>
                    )}

                  </div>

                </div>

              </React.Fragment>
            );

          })}

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
            {loadingChat ? '...' : 'Senden'}
          </button>

        </div>

      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div
          onClick={() => onNavigate('calendar')}
          className="app-card cursor-pointer"
        >
          <h3 className="font-black">Kalender</h3>
        </div>

        <div
          onClick={() => onNavigate('polls')}
          className="app-card cursor-pointer"
        >
          <h3 className="font-black">Umfragen</h3>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="app-card cursor-pointer"
        >
          <h3 className="font-black">Aufgaben</h3>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
