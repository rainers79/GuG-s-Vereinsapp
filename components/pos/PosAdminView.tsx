// components/pos/PosAdminView.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface Props {
  onUnauthorized: () => void;
}

const categories: PosCategory[] = ['food', 'drink', 'gug'];

const normalizeHex = (v: string): string => {
  if (!v) return '#ffffff';
  const val = String(v).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(val)) return val;
  if (/^[0-9a-fA-F]{6}$/.test(val)) return `#${val}`;
  return '#ffffff';
};

const PosAdminView: React.FC<Props> = ({ onUnauthorized }) => {

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PosCategory>('food');
  const [price, setPrice] = useState('');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [loading, setLoading] = useState(false);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await api.getPosArticles({ all: true }, onUnauthorized);
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fehler beim Laden der Artikel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = useMemo(() => {
    const p = parseFloat(price);
    return name.trim().length > 0 && Number.isFinite(p) && p > 0;
  }, [name, price]);

  const createArticle = async () => {
    if (!canCreate) return;

    try {
      const p = parseFloat(price);
      const payload: any = {
        name: name.trim(),
        category,
        price_cents: Math.round(p * 100),
        is_active: true,
        sort_order: 0,
        bg_color: normalizeHex(bgColor)
      };

      await api.createPosArticle(payload, onUnauthorized);

      setName('');
      setPrice('');
      setBgColor('#ffffff');
      loadArticles();
    } catch (e) {
      console.error('Fehler beim Anlegen');
    }
  };

  const toggleActive = async (article: PosArticle) => {
    try {
      const payload: any = { is_active: article.is_active ? false : true };
      await api.updatePosArticle(article.id, payload, onUnauthorized);
      loadArticles();
    } catch (e) {
      console.error('Fehler beim Aktualisieren');
    }
  };

  const updateColor = async (articleId: number, color: string) => {
    try {
      const payload: any = { bg_color: normalizeHex(color) };
      await api.updatePosArticle(articleId, payload, onUnauthorized);
      loadArticles();
    } catch (e) {
      console.error('Fehler beim Speichern der Farbe');
    }
  };

  return (
    <div className="bg-white text-black p-8 rounded-xl border border-black shadow-lg">

      <h2 className="text-2xl font-black mb-8 tracking-tight">
        POS Verwaltung
      </h2>

      {/* CREATE */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Artikelname"
          className="border border-black p-3 bg-white text-black font-semibold placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value as PosCategory)}
          className="border border-black p-3 bg-white text-black font-semibold rounded focus:outline-none focus:ring-2 focus:ring-black"
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>

        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Preis €"
          type="number"
          step="0.01"
          className="border border-black p-3 bg-white text-black font-semibold placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-black"
        />

        {/* ✅ NEU: Farbe */}
        <div className="flex items-center gap-3 border border-black p-3 rounded bg-white">
          <input
            type="color"
            value={normalizeHex(bgColor)}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-10 w-12 p-0 border-0 bg-transparent cursor-pointer"
            aria-label="Button Farbe"
          />
          <input
            value={normalizeHex(bgColor)}
            onChange={(e) => setBgColor(e.target.value)}
            placeholder="#ffffff"
            className="flex-1 border border-black px-3 py-2 rounded font-semibold text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button
          onClick={createArticle}
          disabled={!canCreate}
          className={`font-black uppercase tracking-widest rounded transition ${
            canCreate
              ? 'bg-black text-white hover:opacity-90'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          Anlegen
        </button>

      </div>

      {/* LIST */}
      {loading ? (
        <div className="text-center py-10 font-semibold">
          Lädt Artikel...
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(a => (
            <div
              key={a.id}
              className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border border-black p-4 rounded bg-white"
            >
              <div className="flex items-start gap-4">

                {/* ✅ Swatch */}
                <div
                  className="w-12 h-12 border border-black rounded"
                  style={{ backgroundColor: normalizeHex(a.bg_color || '#ffffff') }}
                  title={normalizeHex(a.bg_color || '#ffffff')}
                />

                <div>
                  <div className="font-bold text-lg">
                    {a.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {a.category.toUpperCase()} – {(a.price_cents / 100).toFixed(2)} €
                    {' '}
                    <span className="text-gray-400">
                      • ID #{a.id}
                    </span>
                  </div>

                  {/* ✅ Inline-Farbänderung */}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-600">
                      Farbe
                    </span>
                    <input
                      type="color"
                      value={normalizeHex(a.bg_color || '#ffffff')}
                      onChange={(e) => updateColor(a.id, e.target.value)}
                      className="h-8 w-10 p-0 border-0 bg-transparent cursor-pointer"
                      aria-label="Artikel Farbe"
                    />
                    <span className="text-xs font-mono text-gray-700">
                      {normalizeHex(a.bg_color || '#ffffff')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleActive(a)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded transition ${
                  a.is_active
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-black'
                }`}
              >
                {a.is_active ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default PosAdminView;
