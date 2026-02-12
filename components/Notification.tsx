
import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    error: 'bg-[#1A1A1A] text-white border-l-4 border-red-500',
    success: 'bg-[#1A1A1A] text-white border-l-4 border-[#B5A47A]'
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-500">
      <div className={`${styles[type]} px-8 py-5 rounded-lg shadow-2xl flex items-center gap-6 backdrop-blur-md`}>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{type === 'error' ? 'Fehlermeldung' : 'Erfolg'}</p>
          <span className="font-bold text-sm tracking-tight">{message}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification;
