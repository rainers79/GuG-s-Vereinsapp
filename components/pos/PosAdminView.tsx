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
    const data = await api.getPosArticles({ all: true }, onUnauthorized);
    setArticles(data);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const createArticle = async () => {
    if (!name || !price) return;

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
  };

  const toggleActive = async (article: PosArticle) => {
    await api.updatePosArticle(
      article.id,
      { is_active: article.is_active ? false : true },
      onUnauthorized
    );
    loadArticles();
  };

  return (
    <div className="bg-white p-6 rounded-xl border">

      <h2 className="text-xl font-black mb-6">POS Verwaltung</h2>

      {/* CREATE */}
      <div className="grid grid-cols-4 gap-4 mb-8">

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Artikelname"
          className="border p-2"
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value as PosCategory)}
          className="border p-2"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Preis €"
          type="number"
          step="0.01"
          className="border p-2"
        />

        <button
          onClick={createArticle}
          className="bg-black text-white font-bold"
        >
          Anlegen
        </button>

      </div>

      {/* LIST */}
      <div className="space-y-2">
        {articles.map(a => (
          <div
            key={a.id}
            className="flex justify-between items-center border p-3 rounded"
          >
            <div>
              <div className="font-bold">{a.name}</div>
              <div className="text-sm text-gray-500">
                {a.category} – {(a.price_cents / 100).toFixed(2)} €
              </div>
            </div>

            <button
              onClick={() => toggleActive(a)}
              className={`px-4 py-2 text-xs font-bold ${
                a.is_active
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300'
              }`}
            >
              {a.is_active ? 'Aktiv' : 'Inaktiv'}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PosAdminView;
