// components/pos/PosAdminView.tsx

import React, { useEffect, useState } from 'react';
import { PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface Props {
  onUnauthorized: () => void;
}

const categories: PosCategory[] = ['food', 'drink', 'gug'];

const PosAdminView: React.FC<Props> = ({ onUnauthorized }) => {

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PosCategory>('food');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await api.getPosArticles({ all: true }, onUnauthorized);
      setArticles(data);
    } catch (e) {
      console.error('Fehler beim Laden der Artikel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const createArticle = async () => {
    if (!name || !price) return;

    try {
      await api.createPosArticle(
        {
          name,
          category,
          price_cents: Math.round(parseFloat(price) * 100),
          is_active: true,
          sort_order: 0
        },
        onUnauthorized
      );

      setName('');
      setPrice('');
      loadArticles();
    } catch (e) {
      console.error('Fehler beim Anlegen');
    }
  };

  const toggleActive = async (article: PosArticle) => {
    try {
      await api.updatePosArticle(
        article.id,
        { is_active: article.is_active ? false : true },
        onUnauthorized
      );
      loadArticles();
    } catch (e) {
      console.error('Fehler beim Aktualisieren');
    }
  };

  return (
    <div className="bg-white text-black p-8 rounded-xl border border-black shadow-lg">

      <h2 className="text-2xl font-black mb-8 tracking-tight">
        POS Verwaltung
      </h2>

      {/* CREATE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">

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

        <button
          onClick={createArticle}
          className="bg-black text-white font-black uppercase tracking-widest rounded hover:opacity-90 transition"
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
              className="flex justify-between items-center border border-black p-4 rounded bg-white"
            >
              <div>
                <div className="font-bold text-lg">
                  {a.name}
                </div>
                <div className="text-sm text-gray-600">
                  {a.category.toUpperCase()} – {(a.price_cents / 100).toFixed(2)} €
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
