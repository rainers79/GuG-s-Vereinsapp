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
        const data = await api.getPosArticles(onUnauthorized);
        setArticles(data.filter(a => a.is_active === 1));
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    <div className="min-h-screen flex flex-col">

      {/* HEADER */}
      <div className="bg-black text-white p-6 flex justify-between items-center">
        <div className="font-black text-lg uppercase tracking-widest">
          Kassa
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm">
            {user.displayName}
          </div>

          <button
            onClick={onExit}
            className="bg-white text-black px-6 py-3 font-black uppercase text-xs"
          >
            Zurück
          </button>
        </div>
      </div>

      <div className="flex flex-1">

        {/* ARTICLE GRID */}
        <div className="flex-1 p-8 overflow-y-auto grid grid-cols-4 gap-6">

          {articles.map(article => (
            <button
              key={article.id}
              onClick={() => addToCart(article)}
              className="bg-white border-2 border-black p-6 text-left font-black text-black text-sm"
            >
              <div className="mb-4">
                {article.name}
              </div>

              <div className="text-lg">
                {(article.price_cents / 100).toFixed(2)} €
              </div>
            </button>
          ))}

        </div>

        {/* ORDER PANEL */}
        <div className="w-96 bg-white border-l-4 border-black p-6 flex flex-col">

          <div className="font-black uppercase text-xs mb-4">
            Bestellung
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">

            {cart.map(item => (
              <div key={item.article.id} className="flex justify-between items-center">

                <div>
                  <div className="font-bold text-sm">
                    {item.article.name}
                  </div>
                  <div className="text-xs">
                    {item.qty} × {(item.article.price_cents / 100).toFixed(2)} €
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(item.article.id)}
                    className="border px-3 py-1 text-xs"
                  >
                    -
                  </button>
                  <div className="font-bold">
                    {item.qty}
                  </div>
                </div>

              </div>
            ))}

          </div>

          {/* TOTAL */}
          <div className="border-t-4 border-black pt-6 mt-6 space-y-4">

            <div className="flex justify-between font-black text-lg">
              <span>Summe</span>
              <span>{(totalCents / 100).toFixed(2)} €</span>
            </div>

            <div>
              <input
                type="number"
                step="0.01"
                placeholder="Erhalten"
                value={received}
                onChange={e => setReceived(e.target.value)}
                className="w-full border-2 border-black p-3 font-bold"
              />
            </div>

            <div className="flex justify-between font-bold">
              <span>Rückgeld</span>
              <span>
                {(changeCents / 100).toFixed(2)} €
              </span>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-black text-white py-4 font-black uppercase text-sm"
            >
              Bonieren
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PosView;
