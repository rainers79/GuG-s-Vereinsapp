import React, { useEffect, useState } from 'react';
import { Member, AppRole } from '../types';
import * as api from '../services/api';

interface Props {
  currentUserRole: AppRole;
  onUnauthorized: () => void;
}

const MembersView: React.FC<Props> = ({ currentUserRole, onUnauthorized }) => {

  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await api.getMembers(onUnauthorized);
      setMembers(data);
      if (data.length > 0) setSelected(data[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (!selected) return;
    setSelected({
      ...selected,
      meta: {
        ...selected.meta,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);

    await api.updateMember(selected.id, {
      first_name: selected.meta.first_name,
      last_name: selected.meta.last_name,
      birthday: selected.meta.birthday,
      phone: selected.meta.phone,
      address: selected.meta.address,
      title: selected.meta.title,
      email: selected.email,
      role: selected.roles[0]
    }, onUnauthorized);

    setSaving(false);
  };

  if (loading) return <div>Lade Mitglieder...</div>;

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* LEFT LIST */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4">
        <h3 className="font-bold mb-4 text-slate-900 dark:text-white">
          Mitglieder
        </h3>

        {members.map(m => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            className={`p-3 cursor-pointer rounded transition ${
              selected?.id === m.id
                ? 'bg-[#B5A47A] text-black'
                : 'hover:bg-gray-100 dark:hover:bg-white/5 text-slate-800 dark:text-white'
            }`}
          >
            {m.display_name}
          </div>
        ))}
      </div>

      {/* RIGHT DETAIL */}
      {selected && (
        <div className="col-span-2 bg-white dark:bg-[#1E1E1E] rounded-xl p-8 space-y-6">

          <h3 className="font-bold text-xl text-slate-900 dark:text-white">
            Mitglied bearbeiten
          </h3>

          {/* Vorname */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              Vorname
            </label>
            <input
              value={selected.meta.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* Nachname */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              Nachname
            </label>
            <input
              value={selected.meta.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* Geburtstag */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              Geburtstag
            </label>
            <input
              type="date"
              value={selected.meta.birthday}
              onChange={(e) => handleChange('birthday', e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              Telefonnummer
            </label>
            <input
              value={selected.meta.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              Adresse
            </label>
            <input
              value={selected.meta.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* Bezeichnung */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              Bezeichnung / Funktion
            </label>
            <input
              value={selected.meta.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* E-Mail */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
              E-Mail
            </label>
            <input
              value={selected.email}
              onChange={(e) => setSelected({ ...selected, email: e.target.value })}
              className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
            />
          </div>

          {/* Rolle nur für Superadmin */}
          {currentUserRole === AppRole.SUPERADMIN && (
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white">
                Rolle
              </label>
              <select
                value={selected.roles[0]}
                onChange={(e) =>
                  setSelected({ ...selected, roles: [e.target.value] })
                }
                className="w-full p-2 rounded bg-gray-100 dark:bg-[#2A2A2A] text-slate-900 dark:text-white"
              >
                <option value="subscriber">User</option>
                <option value="vorstand">Vorstand</option>
                <option value="administrator">Superadmin</option>
              </select>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#B5A47A] text-black px-6 py-2 rounded font-semibold"
          >
            {saving ? 'Speichert...' : 'Speichern'}
          </button>

        </div>
      )}
    </div>
  );
};

export default MembersView;
