// components/pos/PosView.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { User, PosArticle } from '../../types';
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

const PosView: React.FC<PosViewProps> = ({
  user,
  onUnauthorized,
  onExit
}) => {

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [received, setReceived] = useState<string>('');
  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOAD ARTICLES
  ===================================================== */

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPosArticles({}, onUnauthorized);
        setArticles(data.filter(a => a.is_active === 1));
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [onUnauthorized]);

  /* =====================================================
     CART LOGIC
  ===================================================== */

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

  /* =====================================================
     SAVE ORDER
  ===================================================== */

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

  /* =====================================================
     RENDER
  ===================================================== */

  if (loading) {
    return (
      <div className="p-10 text-black font-bold">
        Lädt Artikel...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5E9D0]">

      {/* HEADER */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <div className="font-black uppercase tracking-widest text-sm">
          Kassa
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs">
            {user.displayName}
          </div>

          <button
            onClick={onExit}
            className="bg-white text-black px-4 py-2 font-black uppercase text-[10px]"
          >
            Zurück
          </button>
        </div>
      </div>

      {/* ARTICLE GRID */}
      <div className="flex-1 overflow-y-auto p-4 pb-40">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {articles.map(article => (
            <button
              key={article.id}
              onClick={() => addToCart(article)}
              className="bg-white border-2 border-black p-6 text-left font-black text-black text-sm active:scale-95 transition"
            >
              <div className="mb-3">
                {article.name}
              </div>

              <div className="text-lg">
                {(article.price_cents / 100).toFixed(2)} €
              </div>
            </button>
          ))}

        </div>

      </div>

      {/* STICKY CART PANEL */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black shadow-2xl p-4 space-y-3">

        {/* Cart Items */}
        <div className="max-h-32 overflow-y-auto space-y-2">
          {cart.map(item => (
            <div key={item.article.id} className="flex justify-between items-center text-sm font-bold">

              <div>
                {item.qty} × {item.article.name}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeFromCart(item.article.id)}
                  className="border px-2 py-1 text-xs"
                >
                  -
                </button>
                <span>
                  {(item.article.price_cents * item.qty / 100).toFixed(2)} €
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between font-black text-lg">
          <span>Summe</span>
          <span>{(totalCents / 100).toFixed(2)} €</span>
        </div>

        {/* Received */}
        <input
          type="number"
          step="0.01"
          placeholder="Erhalten"
          value={received}
          onChange={e => setReceived(e.target.value)}
          className="w-full border-2 border-black p-3 font-bold text-lg"
        />

        {/* Change */}
        <div className="flex justify-between font-bold">
          <span>Rückgeld</span>
          <span>
            {(changeCents / 100).toFixed(2)} €
          </span>
        </div>

        {/* Checkout */}
        <button
          onClick={handleSave}
          className="w-full bg-black text-white py-4 font-black uppercase text-sm active:scale-95 transition"
        >
          Bonieren
        </button>

      </div>

    </div>
  );
};

export default PosView;
