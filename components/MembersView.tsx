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
      email: selected.email
    }, onUnauthorized);
    setSaving(false);
  };

  if (loading) return <div>Lade Mitglieder...</div>;

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* LEFT LIST */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4">
        <h3 className="font-bold mb-4">Mitglieder</h3>
        {members.map(m => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            className={`p-2 cursor-pointer rounded ${
              selected?.id === m.id ? 'bg-[#B5A47A] text-black' : 'hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {m.display_name}
          </div>
        ))}
      </div>

      {/* RIGHT DETAIL */}
      {selected && (
        <div className="col-span-2 bg-white dark:bg-[#1E1E1E] rounded-xl p-6 space-y-4">

          <h3 className="font-bold text-xl">Details</h3>

          <input
            value={selected.meta.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Vorname"
            className="w-full p-2 border rounded"
          />

          <input
            value={selected.meta.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Nachname"
            className="w-full p-2 border rounded"
          />

          <input
            value={selected.meta.birthday}
            onChange={(e) => handleChange('birthday', e.target.value)}
            placeholder="Geburtstag"
            className="w-full p-2 border rounded"
          />

          <input
            value={selected.meta.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Telefon"
            className="w-full p-2 border rounded"
          />

          <input
            value={selected.meta.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Adresse"
            className="w-full p-2 border rounded"
          />

          <input
            value={selected.meta.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Bezeichnung"
            className="w-full p-2 border rounded"
          />

          <input
            value={selected.email}
            onChange={(e) => setSelected({ ...selected, email: e.target.value })}
            placeholder="E-Mail"
            className="w-full p-2 border rounded"
          />

          {currentUserRole === AppRole.SUPERADMIN && (
            <div>
              <label className="block text-sm mb-1">Rolle</label>
              <select
                value={selected.roles[0]}
                onChange={(e) =>
                  setSelected({ ...selected, roles: [e.target.value] })
                }
                className="w-full p-2 border rounded"
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
            className="bg-[#B5A47A] text-black px-6 py-2 rounded"
          >
            {saving ? 'Speichert...' : 'Speichern'}
          </button>

        </div>
      )}
    </div>
  );
};

export default MembersView;
