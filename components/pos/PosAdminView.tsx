// components/pos/PosAdminView.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface Props {
  onUnauthorized: () => void;
}

const categories: PosCategory[] = ['food', 'drink', 'gug'];

/* =====================================================
   FESTE FARBPALETTE (KEIN HEX)
===================================================== */

const COLOR_PALETTE = [
  { key: 'gold', class: 'bg-brand-gold' },
  { key: 'food', class: 'bg-pos-food' },
  { key: 'drink', class: 'bg-pos-drink' },
  { key: 'gug', class: 'bg-pos-gug' },
  { key: 'dark', class: 'bg-brand-dark' },
];

const getColorClass = (key?: string) => {
  const found = COLOR_PALETTE.find(c => c.key === key);
  return found ? found.class : 'bg-brand-gold';
};

const PosAdminView: React.FC<Props> = ({ onUnauthorized }) => {

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PosCategory>('food');
  const [price, setPrice] = useState('');
  const [colorKey, setColorKey] = useState<string>('gold');
  const [loading, setLoading] = useState(false);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await api.getPosArticles({ all: true }, onUnauthorized);
      setArticles(Array.isArray(data) ? data : []);
    } catch {
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
        bg_color: colorKey
      };

      await api.createPosArticle(payload, onUnauthorized);

      setName('');
      setPrice('');
      setColorKey('gold');
      loadArticles();
    } catch {
      console.error('Fehler beim Anlegen');
    }
  };

  const toggleActive = async (article: PosArticle) => {
    try {
      await api.updatePosArticle(
        article.id,
        { is_active: !article.is_active },
        onUnauthorized
      );
      loadArticles();
    } catch {
      console.error('Fehler beim Aktualisieren');
    }
  };

  const updateColor = async (articleId: number, key: string) => {
    try {
      await api.updatePosArticle(
        articleId,
        { bg_color: key },
        onUnauthorized
      );
      loadArticles();
    } catch {
      console.error('Fehler beim Speichern der Farbe');
    }
  };

  return (
    <div className="bg-pos-surface text-pos-text p-8 rounded-pos border border-pos-border shadow-pos">

      <h2 className="text-2xl font-black mb-8 tracking-tight">
        POS Verwaltung
      </h2>

      {/* CREATE */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Artikelname"
          className="form-input rounded-posSm"
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value as PosCategory)}
          className="form-select rounded-posSm"
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
          className="form-input rounded-posSm"
        />

        {/* PALETTE */}
        <div className="flex items-center gap-3 bg-white rounded-posSm p-3 border border-pos-border">
          {COLOR_PALETTE.map(color => (
            <button
              key={color.key}
              type="button"
              onClick={() => setColorKey(color.key)}
              className={`
                w-10 h-10 rounded-full border-2 transition
                ${color.class}
                ${colorKey === color.key ? 'border-black scale-110' : 'border-transparent'}
              `}
            />
          ))}
        </div>

        <button
          onClick={createArticle}
          disabled={!canCreate}
          className={`btn-primary rounded-posSm ${
            !canCreate ? 'opacity-50 cursor-not-allowed' : ''
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
              className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 border border-pos-border p-5 rounded-pos bg-pos-surface shadow-pos"
            >
              <div className="flex items-start gap-5">

                <div
                  className={`w-14 h-14 rounded-posSm ${getColorClass(a.bg_color)}`}
                />

                <div>
                  <div className="font-bold text-lg">
                    {a.name}
                  </div>

                  <div className="text-sm text-pos-muted">
                    {a.category.toUpperCase()} – {(a.price_cents / 100).toFixed(2)} €
                    <span className="ml-2 text-pos-muted/60">
                      • ID #{a.id}
                    </span>
                  </div>

                  {/* INLINE PALETTE */}
                  <div className="mt-3 flex items-center gap-3">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.key}
                        type="button"
                        onClick={() => updateColor(a.id, color.key)}
                        className={`
                          w-6 h-6 rounded-full border transition
                          ${color.class}
                          ${a.bg_color === color.key ? 'border-black scale-110' : 'border-transparent'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleActive(a)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-posSm transition ${
                  a.is_active
                    ? 'bg-pos-success text-white'
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
