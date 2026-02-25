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

        // ✅ FIX: WP liefert oft Strings ("1", "390") → robust normalisieren
        const normalized = (Array.isArray(data) ? data : []).map((a: any) => ({
          ...a,
          id: Number(a.id),
          price_cents: Number(a.price_cents),
          is_active: Number(a.is_active),
          sort_order: Number(a.sort_order)
        })) as PosArticle[];

        setArticles(normalized.filter(a => Number(a.is_active) === 1));
      } catch {}
      finally {
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

  const removeFromCart = (articleId: number) => {
    setCart(prev =>
      prev
        .map(p =>
          p.article.id === articleId
            ? { ...p, qty: p.qty - 1 }
            : p
        )
        .filter(p => p.qty > 0)
    );
  };

  const totalCents = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.article.price_cents * item.qty,
      0
    );
  }, [cart]);

  const receivedCents = Math.round(
    (parseFloat(received || '0') || 0) * 100
  );

  const changeCents = receivedCents - totalCents;

  const addQuickAmount = (amount: number) => {
    const current = parseFloat(received || '0') || 0;
    const newValue = current + amount;
    setReceived(newValue.toFixed(2));
  };

  const setExact = () => {
    setReceived((totalCents / 100).toFixed(2));
  };

  const handleSave = async () => {
    if (cart.length === 0) return;
    if (receivedCents < totalCents) return;

    try {
      await api.createPosOrder(
        {
          items: cart.map(c => ({
            article_id: c.article.id,
            qty: c.qty
          })),
          received_cents: receivedCents
        },
        onUnauthorized
      );

      setCart([]);
      setReceived('');
    } catch {}
  };

  if (loading) {
    return <div className="p-10 font-bold">Lädt...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5E9D0]">

      <div className="bg-black text-white p-4 flex justify-between items-center">
        <div className="font-black uppercase text-sm">Kassa</div>
        <button
          onClick={onExit}
          className="bg-white text-black px-4 py-2 font-black uppercase text-xs"
        >
          Zurück
        </button>
      </div>

      {/* CATEGORY TABS */}
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

      {/* ARTICLES */}
      <div className="flex-1 overflow-y-auto p-4 pb-56">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredArticles.map(article => (
            <button
              key={article.id}
              onClick={() => addToCart(article)}
              className="bg-white border-2 border-black p-6 font-black text-sm active:scale-95"
            >
              <div>{article.name}</div>
              <div className="text-lg">
                {(article.price_cents / 100).toFixed(2)} €
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* STICKY CART */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-4 space-y-3">

        <div className="max-h-28 overflow-y-auto space-y-2">
          {cart.map(item => (
            <div key={item.article.id} className="flex justify-between font-bold text-sm">
              <div>{item.qty} × {item.article.name}</div>
              <button
                onClick={() => removeFromCart(item.article.id)}
                className="border px-2 py-1 text-xs"
              >
                -
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-black text-lg">
          <span>Summe</span>
          <span>{(totalCents / 100).toFixed(2)} €</span>
        </div>

        {/* QUICK AMOUNTS */}
        <div className="grid grid-cols-5 gap-2">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => addQuickAmount(amount)}
              className="bg-black text-white py-2 font-black text-xs"
            >
              +{amount}€
            </button>
          ))}
          <button
            onClick={setExact}
            className="bg-green-600 text-white py-2 font-black text-xs"
          >
            Exact
          </button>
        </div>

        <input
          type="number"
          step="0.01"
          placeholder="Erhalten"
          value={received}
          onChange={e => setReceived(e.target.value)}
          className="w-full border-2 border-black p-3 font-bold text-lg"
        />

        <div className="flex justify-between font-bold">
          <span>Rückgeld</span>
          <span>{(changeCents / 100).toFixed(2)} €</span>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-black text-white py-4 font-black uppercase"
        >
          Bonieren
        </button>

      </div>

    </div>
  );
};

export default PosView;
