// components/pos/PosView.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { User, PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface PosViewProps {
  user: User;
  onUnauthorized: () => void;
  onExit: () => void;
}

interface CartItem {
  article: PosArticle;
  qty: number;
}

const categories: PosCategory[] = ['food', 'drink', 'gug'];
const quickAmounts = [5, 10, 20, 50];

/* =========================
   Helper: Textfarbe je nach BG
========================= */
const getTextColor = (hex?: string) => {
  if (!hex) return '#000000';
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
};

const PosView: React.FC<PosViewProps> = ({
  user,
  onUnauthorized,
  onExit
}) => {

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [activeCategory, setActiveCategory] = useState<PosCategory>('food');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [received, setReceived] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPosArticles({}, onUnauthorized);
        setArticles(data.filter(a => a.is_active === 1));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onUnauthorized]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => a.category === activeCategory);
  }, [articles, activeCategory]);

  const addToCart = (article: PosArticle) => {
    setCart(prev => {
      const existing = prev.find(p => p.article.id === article.id);
      if (existing) {
        return prev.map(p =>
          p.article.id === article.id
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }
      return [...prev, { article, qty: 1 }];
    });
  };

  const totalCents = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.article.price_cents * item.qty,
      0
    );
  }, [cart]);

  if (loading) {
    return <div className="p-10 font-bold">Lädt...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5E9D0]">

      {/* HEADER */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <div className="font-black uppercase text-sm">Kassa</div>
        <button
          onClick={onExit}
          className="bg-white text-black px-4 py-2 font-black uppercase text-xs"
        >
          Zurück
        </button>
      </div>

      {/* CATEGORY */}
      <div className="flex border-b-2 border-black">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-3 font-black uppercase text-xs ${
              activeCategory === cat
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ARTICLES GRID */}
      <div className="flex-1 overflow-y-auto p-4 pb-56">

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          {filteredArticles.map(article => {

            const bg = article.bg_color || '#ffffff';
            const textColor = getTextColor(bg);

            return (
              <button
                key={article.id}
                onClick={() => addToCart(article)}
                className="aspect-square rounded-xl font-black text-sm transition active:scale-95 shadow-md flex flex-col justify-center items-center"
                style={{
                  backgroundColor: bg,
                  color: textColor
                }}
              >
                <div className="text-center px-2">
                  {article.name}
                </div>
                <div className="text-lg mt-2">
                  {(article.price_cents / 100).toFixed(2)} €
                </div>
              </button>
            );
          })}

        </div>
      </div>

      {/* CART STICKY */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-4">

        <div className="flex justify-between font-black text-lg mb-3">
          <span>Summe</span>
          <span>{(totalCents / 100).toFixed(2)} €</span>
        </div>

        <button
          className="w-full bg-black text-white py-4 font-black uppercase"
        >
          Bonieren
        </button>

      </div>

    </div>
  );
};

export default PosView;
