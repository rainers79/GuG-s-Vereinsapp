import React, { useState } from 'react';
import { CalendarEvent, User } from '../types';
import * as api from '../services/api';

interface Props {
  user: User;
  onClose: () => void;
  onCreated: () => void;
}

const EventCreateModal: React.FC<Props> = ({ user, onClose, onCreated }) => {

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      setError('Titel und Datum sind erforderlich.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.createEvent({
        title,
        description,
        date,
        type: 'event',
        status: 'green',
        author: user.displayName,
        author_id: user.id,
        is_private: false
      }, () => {});

      onCreated();
      onClose();

    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-lg rounded-2xl p-8 border border-slate-200 dark:border-white/5">

        <h2 className="text-xl font-black mb-6">Neuen Termin erstellen</h2>

        {error && (
          <div className="mb-4 text-red-500 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Titel"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent"
          />

          <textarea
            placeholder="Beschreibung"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent"
          />

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-white/10 bg-transparent"
          />

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-500"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#B5A47A] text-black font-bold rounded-lg"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default EventCreateModal;
