// components/pos/PosAdminView.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface Props {
  onUnauthorized: () => void;
}

const categories: PosCategory[] = ['food', 'drink', 'gug'];

/* =====================================================
   HSL → HEX + Helligkeitskontrolle
   - Keine dunklen Farben
   - Keine schwarzen Töne
   - Immer gute Lesbarkeit für schwarze Schrift
===================================================== */

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);

  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
};

const PosAdminView: React.FC<Props> = ({ onUnauthorized }) => {

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PosCategory>('food');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // HSL STATE
  const [hue, setHue] = useState(40);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(75); // bewusst hell

  const bgHex = useMemo(() => {
    // Begrenzung → keine dunklen Farben
    const safeLightness = clamp(lightness, 60, 92);
    const safeSaturation = clamp(saturation, 50, 95);
    return hslToHex(hue, safeSaturation, safeLightness);
  }, [hue, saturation, lightness]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await api.getPosArticles({ all: true }, onUnauthorized);
      setArticles(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line
  }, []);

  const canCreate = useMemo(() => {
    const p = parseFloat(price);
    return name.trim().length > 0 && Number.isFinite(p) && p > 0;
  }, [name, price]);

  const createArticle = async () => {
    if (!canCreate) return;

    const p = parseFloat(price);

    await api.createPosArticle(
      {
        name: name.trim(),
        category,
        price_cents: Math.round(p * 100),
        is_active: true,
        sort_order: 0,
        bg_color: bgHex
      },
      onUnauthorized
    );

    setName('');
    setPrice('');
    loadArticles();
  };

  const toggleActive = async (article: PosArticle) => {
    await api.updatePosArticle(
      article.id,
      { is_active: !article.is_active },
      onUnauthorized
    );
    loadArticles();
  };

  const updateColor = async (articleId: number) => {
    await api.updatePosArticle(
      articleId,
      { bg_color: bgHex },
      onUnauthorized
    );
    loadArticles();
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-black/10 shadow-sm">

      <h2 className="text-2xl font-black mb-8">
        POS Verwaltung
      </h2>

      {/* CREATE */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Artikelname"
          className="form-input rounded-lg"
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value as PosCategory)}
          className="form-select rounded-lg"
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
          className="form-input rounded-lg"
        />

        {/* COLOR PICKER */}
        <div className="bg-white rounded-lg p-4 border border-black/10 space-y-3">

          <div
            className="w-full h-14 rounded-lg border border-black/10"
            style={{ backgroundColor: bgHex }}
          />

          <div>
            <div className="text-xs font-semibold mb-1">Farbton</div>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={e => setHue(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="text-xs font-semibold mb-1">Sättigung</div>
            <input
              type="range"
              min="50"
              max="95"
              value={saturation}
              onChange={e => setSaturation(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="text-xs font-semibold mb-1">Helligkeit</div>
            <input
              type="range"
              min="60"
              max="92"
              value={lightness}
              onChange={e => setLightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

        </div>

        <button
          onClick={createArticle}
          disabled={!canCreate}
          className={`bg-[#C9AE6A] text-black font-black rounded-lg ${
            !canCreate ? 'opacity-40' : ''
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
        <div className="space-y-4">
          {articles.map(a => (
            <div
              key={a.id}
              className="flex justify-between items-center border border-black/10 p-5 rounded-xl bg-white shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-lg border border-black/10"
                  style={{ backgroundColor: a.bg_color }}
                />
                <div>
                  <div className="font-bold text-lg">{a.name}</div>
                  <div className="text-sm text-black/60">
                    {a.category.toUpperCase()} – {(a.price_cents / 100).toFixed(2)} €
                    <span className="ml-2 text-black/40">• ID #{a.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateColor(a.id)}
                  className="px-3 py-2 text-xs font-black bg-[#F3F3F3] rounded-lg"
                >
                  Neue Farbe
                </button>

                <button
                  onClick={() => toggleActive(a)}
                  className={`px-4 py-2 text-xs font-black rounded-lg ${
                    a.is_active
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-black'
                  }`}
                >
                  {a.is_active ? 'Aktiv' : 'Inaktiv'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default PosAdminView;
