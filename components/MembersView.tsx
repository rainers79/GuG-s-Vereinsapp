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
  const [showListMobile, setShowListMobile] = useState(true);

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

  try {
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

    await loadMembers(); // 🔥 LISTE NEU LADEN

  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="app-container">
        Lade Mitglieder...
      </div>
    );
  }

  return (
    <div className="app-container">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MOBILE LIST TOGGLE */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowListMobile(!showListMobile)}
            className="btn-secondary btn-mobile"
          >
            {showListMobile ? 'Mitglieder ausblenden' : 'Mitglieder anzeigen'}
          </button>
        </div>

        {/* LEFT LIST */}
        {(showListMobile || window.innerWidth >= 1024) && (
          <div className="app-card lg:col-span-1 max-h-[70vh] overflow-y-auto">
            <h3 className="font-bold mb-4 text-slate-900 dark:text-white">
              Mitglieder
            </h3>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelected(m);
                    setShowListMobile(false);
                  }}
                  className={`p-3 cursor-pointer rounded transition text-sm ${
                    selected?.id === m.id
                      ? 'bg-[#B5A47A] text-black font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-white/5 text-slate-800 dark:text-white'
                  }`}
                >
                  {m.display_name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT DETAIL */}
        {selected && (
          <div className="app-card lg:col-span-2 space-y-6">

            <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
              Mitglied bearbeiten
            </h3>

            {/* Vorname */}
            <div>
              <label className="form-label">Vorname</label>
              <input
                value={selected.meta.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Nachname */}
            <div>
              <label className="form-label">Nachname</label>
              <input
                value={selected.meta.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Geburtstag */}
            <div>
              <label className="form-label">Geburtstag</label>
              <input
                type="date"
                value={selected.meta.birthday}
                onChange={(e) => handleChange('birthday', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="form-label">Telefonnummer</label>
              <input
                value={selected.meta.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Adresse */}
            <div>
              <label className="form-label">Adresse</label>
              <input
                value={selected.meta.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="form-input"
              />
            </div>

            {/* Bezeichnung */}
            <div>
              <label className="form-label">Bezeichnung / Funktion</label>
              <input
                value={selected.meta.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="form-input"
              />
            </div>

            {/* E-Mail */}
            <div>
              <label className="form-label">E-Mail</label>
              <input
                value={selected.email}
                onChange={(e) =>
                  setSelected({ ...selected, email: e.target.value })
                }
                className="form-input"
              />
            </div>

            {/* Rolle nur für Superadmin */}
            {currentUserRole === AppRole.SUPERADMIN && (
              <div>
                <label className="form-label">Rolle</label>
                <select
                  value={selected.roles[0]}
                  onChange={(e) =>
                    setSelected({ ...selected, roles: [e.target.value] })
                  }
                  className="form-select"
                >
                  <option value="subscriber">User</option>
                  <option value="vorstand">Vorstand</option>
                  <option value="administrator">Superadmin</option>
                </select>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary btn-mobile"
              >
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default MembersView;
