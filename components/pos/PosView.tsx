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
   Farb-Handling
   - unterstützt HEX (#RRGGBB) ODER Key ("gold", "food"...) aus Admin-UI
   - verhindert dunkle Farben (Schrift soll schwarz bleiben)
========================= */

const COLOR_KEY_MAP: Record<string, string> = {
  gold: '#C9AE6A',
  food: '#F6D58E',
  drink: '#9FD6FF',
  gug: '#BDE7C9'
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const hexToRgb = (hex: string) => {
  const c = hex.replace('#', '').trim();
  if (c.length !== 6) return null;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if ([r, g, b].some(v => Number.isNaN(v))) return null;
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
};

const brightnessOfHex = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 255;
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
};

// Mischt Farbe Richtung Weiß (amount 0..1)
const lightenHex = (hex: string, amount: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = clamp(amount, 0, 1);
  const r = rgb.r + (255 - rgb.r) * a;
  const g = rgb.g + (255 - rgb.g) * a;
  const b = rgb.b + (255 - rgb.b) * a;
  return rgbToHex(r, g, b);
};

// Stellt sicher: nicht zu dunkel (für schwarze Schrift)
const normalizeBgColor = (raw?: string) => {
  if (!raw) return '#FFFFFF';

  const trimmed = String(raw).trim();
  const asHex = trimmed.startsWith('#')
    ? trimmed
    : (COLOR_KEY_MAP[trimmed] || '#FFFFFF');

  // Wenn zu dunkel -> aufhellen bis Mindesthelligkeit erreicht
  const minBrightness = 170; // klare schwarze Schrift
  let bg = asHex;

  let br = brightnessOfHex(bg);
  if (br < minBrightness) {
    // Schrittweise aufhellen
    for (let i = 1; i <= 6; i++) {
      bg = lightenHex(bg, i * 0.12);
      br = brightnessOfHex(bg);
      if (br >= minBrightness) break;
    }
  }

  return bg;
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

  const activeCatLabel = useMemo(() => {
    if (activeCategory === 'food') return 'Food';
    if (activeCategory === 'drink') return 'Drink';
    return 'GuG';
  }, [activeCategory]);

  if (loading) {
    return <div className="p-10 font-bold">Lädt...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E4]">

      {/* HEADER */}
      <div className="px-4 py-4 flex justify-between items-center border-b border-black/10 bg-[#FFFFFF]">
        <div className="flex flex-col">
          <div className="font-black uppercase tracking-wide text-sm text-black">
            Kassa
          </div>
          <div className="text-xs text-black/60 font-semibold">
            Kategorie: {activeCatLabel}
          </div>
        </div>

        <button
          onClick={onExit}
          className="bg-[#C9AE6A] text-black px-4 py-2 font-black uppercase text-xs rounded-lg shadow-sm active:scale-95 transition"
        >
          Zurück
        </button>
      </div>

      {/* CATEGORY */}
      <div className="flex gap-2 px-4 py-3 bg-[#FFFFFF] border-b border-black/10">
        {categories.map(cat => {
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'flex-1 py-3 font-black uppercase text-xs rounded-xl transition active:scale-95',
                isActive
                  ? 'bg-[#C9AE6A] text-black shadow-sm'
                  : 'bg-[#F3F3F3] text-black/80'
              ].join(' ')}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ARTICLES GRID */}
      <div className="flex-1 overflow-y-auto p-4 pb-56">

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          {filteredArticles.map(article => {
            const bg = normalizeBgColor(article.bg_color);

            return (
              <button
                key={article.id}
                onClick={() => addToCart(article)}
                className="rounded-2xl transition active:scale-95 shadow-md border border-black/10 overflow-hidden"
                style={{ backgroundColor: bg }}
              >
                <div className="p-4 flex flex-col items-start justify-between h-full aspect-square">
                  <div className="w-full">
                    <div className="text-[11px] font-black uppercase tracking-wide text-black/60">
                      {article.category}
                    </div>

                    <div className="mt-1 text-left font-black text-base leading-tight text-black">
                      {article.name}
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="mt-3 text-left text-xl font-black text-black">
                      {(article.price_cents / 100).toFixed(2)} €
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-black/60">
                        ID #{article.id}
                      </div>

                      <div className="px-3 py-1 rounded-full bg-white/70 text-[11px] font-black text-black border border-black/10">
                        +1
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

        </div>
      </div>

      {/* CART STICKY */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4">

        <div className="flex justify-between font-black text-lg mb-3">
          <span>Summe</span>
          <span>{(totalCents / 100).toFixed(2)} €</span>
        </div>

        <button
          className="w-full bg-[#C9AE6A] text-black py-4 font-black uppercase rounded-2xl shadow-sm active:scale-[0.99] transition"
        >
          Bonieren
        </button>

      </div>

    </div>
  );
};

export default PosView;
