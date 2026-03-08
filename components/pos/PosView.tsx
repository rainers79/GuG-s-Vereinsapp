// components/pos/PosView.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface PosViewProps {
  user: User;
  onUnauthorized: () => void;
  onExit: () => void;
}

interface CartItem {
  article: PosArticleRow;
  qty: number;
}

type PosArticleRow = PosArticle;

interface PosOrderRowItem {
  id?: number;
  order_id?: number;
  article_id: number;
  article_name_snapshot: string;
  category_snapshot: PosCategory;
  serving_label_snapshot?: string;
  price_cents_snapshot: number;
  qty: number;
  line_total_cents: number;
}

interface PosOrderRow {
  id: number;
  project_id: number;
  local_uuid?: string;
  order_number: string;
  waiter_user_id: number;
  waiter_user_name?: string | null;
  status: 'paid' | 'canceled';
  total_cents: number;
  received_cents: number;
  change_cents: number;
  note: string;
  created_at: string;
  paid_at?: string | null;
  canceled_at?: string | null;
  canceled_by?: number | null;
  canceled_by_name?: string | null;
  cancel_reason?: string;
  items: PosOrderRowItem[];
}

interface PendingPosOrder {
  local_uuid: string;
  project_id: number;
  waiter_user_id: number;
  created_at: string;
  received_cents: number;
  note: string;
  items: PosOrderRowItem[];
}

const LS_ACTIVE_PROJECT = 'gug_active_project';
const LS_POS_PENDING_ORDERS = 'gug_pos_pending_orders';

const categories: PosCategory[] = ['food', 'drink', 'gug'];
const quickAmounts = [5, 10, 20, 50, 100];

/* =========================
   Farb-Handling
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

const lightenHex = (hex: string, amount: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = clamp(amount, 0, 1);
  const r = rgb.r + (255 - rgb.r) * a;
  const g = rgb.g + (255 - rgb.g) * a;
  const b = rgb.b + (255 - rgb.b) * a;
  return rgbToHex(r, g, b);
};

const normalizeBgColor = (raw?: string) => {
  if (!raw) return '#FFFFFF';

  const trimmed = String(raw).trim();
  const asHex = trimmed.startsWith('#')
    ? trimmed
    : (COLOR_KEY_MAP[trimmed] || '#FFFFFF');

  const minBrightness = 170;
  let bg = asHex;
  let br = brightnessOfHex(bg);

  if (br < minBrightness) {
    for (let i = 1; i <= 6; i++) {
      bg = lightenHex(bg, i * 0.12);
      br = brightnessOfHex(bg);
      if (br >= minBrightness) break;
    }
  }

  return bg;
};

/* =========================
   Helper
========================= */

const getActiveProjectId = (): number | null => {
  const raw = localStorage.getItem(LS_ACTIVE_PROJECT);
  if (!raw) return null;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getCategoryLabel = (category: PosCategory) => {
  if (category === 'food') return 'Essen';
  if (category === 'drink') return 'Getränke';
  return 'Sonstige';
};

const formatMoney = (cents: number) => `${(cents / 100).toFixed(2)} €`;

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  return date.toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isOnlineNow = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

const readPendingOrders = (): PendingPosOrder[] => {
  try {
    const raw = localStorage.getItem(LS_POS_PENDING_ORDERS);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writePendingOrders = (orders: PendingPosOrder[]) => {
  localStorage.setItem(LS_POS_PENDING_ORDERS, JSON.stringify(orders));
};

const buildLocalUuid = () => {
  if (typeof window !== 'undefined' && window.crypto && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `pos_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const PosView: React.FC<PosViewProps> = ({
  user,
  onUnauthorized,
  onExit
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => getActiveProjectId());

  const [articles, setArticles] = useState<PosArticleRow[]>([]);
  const [orders, setOrders] = useState<PosOrderRow[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingPosOrder[]>([]);

  const [activeCategory, setActiveCategory] = useState<PosCategory>('food');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [received, setReceived] = useState('');
  const [note, setNote] = useState('');
  const [cartPanelOpen, setCartPanelOpen] = useState(false);

  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [booking, setBooking] = useState(false);
  const [syncingQueue, setSyncingQueue] = useState(false);

  const [isOnline, setIsOnline] = useState<boolean>(isOnlineNow());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refreshProjectId = useCallback(() => {
    setSelectedProjectId(getActiveProjectId());
  }, []);

  const loadArticles = useCallback(async (projectId: number) => {
    try {
      setLoadingArticles(true);

      const data = await api.apiRequest<PosArticleRow[]>(
        `/gug/v1/pos/articles?project_id=${encodeURIComponent(String(projectId))}`,
        {},
        onUnauthorized
      );

      setArticles(Array.isArray(data) ? data.filter((a) => Number(a.is_active) === 1) : []);
    } catch (e: any) {
      setError(e?.message || 'Artikel konnten nicht geladen werden.');
      setArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  }, [onUnauthorized]);

  const loadOrders = useCallback(async (projectId: number) => {
    try {
      setLoadingOrders(true);

      const data = await api.apiRequest<PosOrderRow[]>(
        `/gug/v1/pos/orders?project_id=${encodeURIComponent(String(projectId))}&date=today`,
        {},
        onUnauthorized
      );

      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.message !== 'Netzwerkfehler. Bitte Verbindung prüfen.') {
        setError(e?.message || 'Bons konnten nicht geladen werden.');
      }
    } finally {
      setLoadingOrders(false);
    }
  }, [onUnauthorized]);

  const syncPendingOrders = useCallback(async (projectId?: number) => {
    const currentProjectId = projectId ?? getActiveProjectId();
    const queue = readPendingOrders();

    setPendingOrders(
      currentProjectId
        ? queue.filter((item) => item.project_id === currentProjectId)
        : []
    );

    if (!isOnlineNow() || queue.length === 0) {
      return;
    }

    try {
      setSyncingQueue(true);

      let remaining = [...queue];

      for (const pending of queue) {
        await api.apiRequest(
          '/gug/v1/pos/orders',
          {
            method: 'POST',
            body: JSON.stringify({
              project_id: pending.project_id,
              local_uuid: pending.local_uuid,
              received_cents: pending.received_cents,
              note: pending.note,
              items: pending.items.map((item) => ({
                article_id: item.article_id,
                qty: item.qty
              }))
            })
          },
          onUnauthorized
        );

        remaining = remaining.filter((item) => item.local_uuid !== pending.local_uuid);
        writePendingOrders(remaining);
      }

      if (currentProjectId) {
        setPendingOrders(remaining.filter((item) => item.project_id === currentProjectId));
        await loadOrders(currentProjectId);
      }

      if (queue.length > 0) {
        setInfo('Offline-Bons wurden synchronisiert.');
      }
    } catch (e: any) {
      if (e?.message && e.message !== 'Netzwerkfehler. Bitte Verbindung prüfen.') {
        setError(e.message);
      }
    } finally {
      setSyncingQueue(false);
    }
  }, [loadOrders, onUnauthorized]);

  useEffect(() => {
    refreshProjectId();

    const handleFocus = () => refreshProjectId();
    const handleStorage = () => refreshProjectId();
    const handleOnline = () => {
      setIsOnline(true);
      const projectId = getActiveProjectId();
      if (projectId) {
        syncPendingOrders(projectId);
        loadOrders(projectId);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadOrders, refreshProjectId, syncPendingOrders]);

  useEffect(() => {
    if (!selectedProjectId) {
      setArticles([]);
      setOrders([]);
      setPendingOrders([]);
      setLoadingArticles(false);
      setLoadingOrders(false);
      return;
    }

    setError(null);
    setInfo(null);
    loadArticles(selectedProjectId);
    loadOrders(selectedProjectId);
    setPendingOrders(readPendingOrders().filter((item) => item.project_id === selectedProjectId));
    syncPendingOrders(selectedProjectId);
  }, [selectedProjectId, loadArticles, loadOrders, syncPendingOrders]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => a.category === activeCategory);
  }, [articles, activeCategory]);

  const addToCart = (article: PosArticleRow) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.article.id === article.id);

      if (existing) {
        return prev.map((p) =>
          p.article.id === article.id
            ? { ...p, qty: p.qty + 1 }
            : p
        );
      }

      return [...prev, { article, qty: 1 }];
    });
  };

  const changeCartQty = (articleId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.article.id === articleId
            ? { ...item, qty: item.qty + delta }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (articleId: number) => {
    setCart((prev) => prev.filter((item) => item.article.id !== articleId));
  };

  const clearCart = () => {
    setCart([]);
    setReceived('');
    setNote('');
    setCartPanelOpen(false);
  };

  const totalCents = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.article.price_cents * item.qty,
      0
    );
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const receivedCents = useMemo(() => {
    const parsed = parseFloat(received.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [received]);

  const changeCents = receivedCents - totalCents;

  const pendingOrdersForProject = useMemo(() => {
    if (!selectedProjectId) return [];
    return pendingOrders.filter((item) => item.project_id === selectedProjectId);
  }, [pendingOrders, selectedProjectId]);

  const bookOrder = async () => {
    if (!selectedProjectId || cart.length === 0) return;

    setBooking(true);
    setError(null);
    setInfo(null);

    const localUuid = buildLocalUuid();
    const payloadItems = cart.map((item) => ({
      article_id: item.article.id,
      qty: item.qty
    }));

    try {
      if (!isOnlineNow()) {
        const pendingOrder: PendingPosOrder = {
          local_uuid: localUuid,
          project_id: selectedProjectId,
          waiter_user_id: user.id,
          created_at: new Date().toISOString(),
          received_cents: receivedCents,
          note: note.trim(),
          items: cart.map((item) => ({
            article_id: item.article.id,
            article_name_snapshot: item.article.name,
            category_snapshot: item.article.category,
            serving_label_snapshot: item.article.serving_label || '',
            price_cents_snapshot: item.article.price_cents,
            qty: item.qty,
            line_total_cents: item.article.price_cents * item.qty
          }))
        };

        const nextQueue = [...readPendingOrders(), pendingOrder];
        writePendingOrders(nextQueue);
        setPendingOrders(nextQueue.filter((item) => item.project_id === selectedProjectId));
        clearCart();
        setInfo('Offline gespeichert. Der Bon wird automatisch synchronisiert.');
        return;
      }

      await api.apiRequest(
        '/gug/v1/pos/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            project_id: selectedProjectId,
            local_uuid: localUuid,
            items: payloadItems,
            received_cents: receivedCents,
            note: note.trim()
          })
        },
        onUnauthorized
      );

      clearCart();
      setInfo('Bon wurde gespeichert.');
      await loadOrders(selectedProjectId);
      await syncPendingOrders(selectedProjectId);
    } catch (e: any) {
      if (e?.message === 'Netzwerkfehler. Bitte Verbindung prüfen.') {
        const pendingOrder: PendingPosOrder = {
          local_uuid: localUuid,
          project_id: selectedProjectId,
          waiter_user_id: user.id,
          created_at: new Date().toISOString(),
          received_cents: receivedCents,
          note: note.trim(),
          items: cart.map((item) => ({
            article_id: item.article.id,
            article_name_snapshot: item.article.name,
            category_snapshot: item.article.category,
            serving_label_snapshot: item.article.serving_label || '',
            price_cents_snapshot: item.article.price_cents,
            qty: item.qty,
            line_total_cents: item.article.price_cents * item.qty
          }))
        };

        const nextQueue = [...readPendingOrders(), pendingOrder];
        writePendingOrders(nextQueue);
        setPendingOrders(nextQueue.filter((item) => item.project_id === selectedProjectId));
        clearCart();
        setInfo('Keine Verbindung. Bon wurde offline vorgemerkt.');
      } else {
        setError(e?.message || 'Bon konnte nicht gespeichert werden.');
      }
    } finally {
      setBooking(false);
    }
  };

  const cancelOrder = async (order: PosOrderRow) => {
    const confirmed = window.confirm(`Bestellung ${order.order_number} wirklich stornieren?`);
    if (!confirmed) return;

    const cancelReason = window.prompt('Grund für die Stornierung:', '') || '';

    try {
      setError(null);
      setInfo(null);

      await api.apiRequest(
        `/gug/v1/pos/orders/${order.id}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({
            cancel_reason: cancelReason.trim()
          })
        },
        onUnauthorized
      );

      if (selectedProjectId) {
        await loadOrders(selectedProjectId);
      }

      setInfo('Bestellung wurde storniert.');
    } catch (e: any) {
      setError(e?.message || 'Stornierung fehlgeschlagen.');
    }
  };

  const activeCatLabel = useMemo(() => {
    return getCategoryLabel(activeCategory);
  }, [activeCategory]);

  if (loadingArticles && !selectedProjectId) {
    return <div className="p-10 font-bold">Lädt...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E4]">
      <div className="px-4 py-4 flex justify-between items-center border-b border-black/10 bg-[#FFFFFF]">
        <div className="flex flex-col">
          <div className="font-black uppercase tracking-wide text-sm text-black">
            Kassa
          </div>
          <div className="text-xs text-black/60 font-semibold">
            {selectedProjectId ? `Projekt ID ${selectedProjectId}` : 'Kein Projekt aktiv'}
          </div>
          <div className="text-xs text-black/50 font-semibold">
            Kategorie: {activeCatLabel} · Bediener: {user.displayName}
          </div>
        </div>

        <button
          onClick={onExit}
          className="bg-[#C9AE6A] text-black px-4 py-2 font-black uppercase text-xs rounded-lg shadow-sm active:scale-95 transition"
        >
          Zurück
        </button>
      </div>

      {!isOnline && (
        <div className="px-4 py-3 bg-amber-100 text-amber-900 text-sm font-bold border-b border-amber-300">
          Offline-Modus aktiv. Neue Bons werden lokal gespeichert.
        </div>
      )}

      {syncingQueue && (
        <div className="px-4 py-3 bg-blue-100 text-blue-900 text-sm font-bold border-b border-blue-300">
          Offline-Bons werden synchronisiert...
        </div>
      )}

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {info && (
        <div className="mx-4 mt-4 rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm font-semibold">
          {info}
        </div>
      )}

      {!selectedProjectId ? (
        <div className="p-6">
          <div className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 px-5 py-5 text-sm font-bold">
            Bitte zuerst ein Projekt im Projektrad auswählen. Das Boniersystem arbeitet projektbezogen.
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 px-4 py-3 bg-[#FFFFFF] border-b border-black/10">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={[
                    'flex-1 py-2.5 font-black uppercase text-[11px] rounded-xl transition active:scale-95',
                    isActive
                      ? 'bg-[#C9AE6A] text-black shadow-sm'
                      : 'bg-[#F3F3F3] text-black/80'
                  ].join(' ')}
                >
                  {getCategoryLabel(cat)}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3 pb-[170px] space-y-6">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {loadingArticles ? (
                <div className="col-span-full text-center py-10 font-semibold">
                  Lädt Artikel...
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="col-span-full rounded-2xl bg-white border border-black/10 p-6 text-sm text-black/60 font-semibold">
                  Keine Artikel in dieser Kategorie vorhanden.
                </div>
              ) : (
                filteredArticles.map((article) => {
                  const bg = normalizeBgColor(article.bg_color);

                  return (
                    <button
                      key={article.id}
                      onClick={() => addToCart(article)}
                      className="rounded-xl transition active:scale-95 shadow-sm border border-black/10 overflow-hidden"
                      style={{ backgroundColor: bg }}
                    >
                      <div className="p-2.5 flex flex-col justify-between h-full aspect-square">
                        <div className="w-full min-h-0">
                          <div className="text-[9px] font-black uppercase tracking-wide text-black/55 truncate">
                            {getCategoryLabel(article.category)}
                          </div>

                          <div className="mt-1 text-left font-black text-[12px] leading-[1.1] text-black line-clamp-2 min-h-[28px]">
                            {article.name}
                          </div>

                          {article.serving_label && (
                            <div className="mt-1 text-[10px] font-bold text-black/60 truncate">
                              {article.serving_label}
                            </div>
                          )}
                        </div>

                        <div className="w-full mt-2">
                          <div className="text-left text-[13px] font-black text-black">
                            {formatMoney(article.price_cents)}
                          </div>

                          <div className="mt-1 flex items-center justify-end">
                            <div className="px-2 py-0.5 rounded-full bg-white/75 text-[10px] font-black text-black border border-black/10">
                              +1
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="font-black text-lg">Heutige Bons</div>
                  <div className="text-xs text-black/50 font-semibold">
                    Bereits bonierte und stornierte Datensätze
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectedProjectId && loadOrders(selectedProjectId)}
                  className="px-4 py-2 rounded-lg bg-[#F3F3F3] text-black text-xs font-black uppercase"
                >
                  Aktualisieren
                </button>
              </div>

              {pendingOrdersForProject.length > 0 && (
                <div className="mb-5 space-y-3">
                  <div className="text-sm font-black text-amber-900">
                    Offline vorgemerkt ({pendingOrdersForProject.length})
                  </div>

                  {pendingOrdersForProject.map((pending) => {
                    const pendingTotal = pending.items.reduce((sum, item) => sum + item.line_total_cents, 0);

                    return (
                      <div
                        key={pending.local_uuid}
                        className="rounded-xl border border-amber-300 bg-amber-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-black text-amber-900">
                              Offline-Bon
                            </div>
                            <div className="text-xs text-amber-800 font-semibold mt-1">
                              {formatDateTime(pending.created_at)}
                            </div>
                          </div>

                          <div className="text-sm font-black text-amber-900">
                            {formatMoney(pendingTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {loadingOrders ? (
                <div className="text-center py-8 font-semibold text-black/60">
                  Lädt Bons...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-sm text-black/60 font-semibold">
                  Noch keine Bons vorhanden.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-black/10 p-4 bg-[#FAFAFA]"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-black text-base">
                            {order.order_number}
                          </div>
                          <div className="text-xs text-black/50 font-semibold mt-1">
                            {formatDateTime(order.created_at)}
                            {order.waiter_user_name ? ` · ${order.waiter_user_name}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                              order.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status === 'paid' ? 'Bezahlt' : 'Storniert'}
                          </div>

                          <div className="font-black text-base">
                            {formatMoney(order.total_cents)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order.id}_${item.article_id}_${index}`}
                            className="flex items-center justify-between text-sm gap-4"
                          >
                            <div className="text-black/80 min-w-0 break-words">
                              {item.qty}x {item.article_name_snapshot}
                              {item.serving_label_snapshot ? ` · ${item.serving_label_snapshot}` : ''}
                            </div>
                            <div className="font-bold text-black whitespace-nowrap">
                              {formatMoney(item.line_total_cents)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-black/60 font-semibold">
                        <div>Erhalten: {formatMoney(order.received_cents)}</div>
                        <div>Retourgeld: {formatMoney(order.change_cents)}</div>
                        <div>Status: {order.status === 'paid' ? 'aktiv' : 'storniert'}</div>
                      </div>

                      {order.note ? (
                        <div className="mt-3 text-xs text-black/60 font-semibold">
                          Notiz: {order.note}
                        </div>
                      ) : null}

                      {order.status === 'canceled' && order.cancel_reason ? (
                        <div className="mt-3 text-xs text-red-700 font-semibold">
                          Stornogrund: {order.cancel_reason}
                        </div>
                      ) : null}

                      {order.status === 'paid' && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => cancelOrder(order)}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-black uppercase"
                          >
                            Stornieren
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {cartPanelOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/35 z-40"
                onClick={() => setCartPanelOpen(false)}
              />

              <div className="fixed left-0 right-0 bottom-[72px] z-50 px-3">
                <div className="max-w-5xl mx-auto rounded-t-3xl rounded-b-2xl bg-white border border-black/10 shadow-[0_-12px_36px_rgba(0,0,0,0.14)] p-4 max-h-[72vh] overflow-y-auto">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="font-black text-lg">Warenkorb</div>
                      <div className="text-xs text-black/50 font-semibold">
                        {cartItemsCount} Artikel · {formatMoney(totalCents)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCartPanelOpen(false)}
                      className="px-4 py-2 rounded-lg bg-[#F3F3F3] text-black text-xs font-black uppercase"
                    >
                      Schließen
                    </button>
                  </div>

                  <div className="space-y-2">
                    {cart.length === 0 ? (
                      <div className="text-sm text-black/50 font-semibold">
                        Noch keine Artikel gewählt.
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.article.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-3 py-3 bg-[#FAFAFA]"
                        >
                          <div className="min-w-0">
                            <div className="font-black text-sm text-black break-words">
                              {item.article.name}
                              {item.article.serving_label ? ` · ${item.article.serving_label}` : ''}
                            </div>
                            <div className="text-xs text-black/50 font-semibold">
                              {formatMoney(item.article.price_cents)} pro Stück
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => changeCartQty(item.article.id, -1)}
                              className="w-8 h-8 rounded-lg bg-[#EAEAEA] text-black font-black"
                            >
                              -
                            </button>

                            <div className="min-w-[24px] text-center font-black text-black text-sm">
                              {item.qty}
                            </div>

                            <button
                              type="button"
                              onClick={() => changeCartQty(item.article.id, 1)}
                              className="w-8 h-8 rounded-lg bg-[#C9AE6A] text-black font-black"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.article.id)}
                              className="px-3 h-8 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Notiz zur Bestellung"
                      className="form-input rounded-xl"
                    />

                    <input
                      value={received}
                      onChange={(e) => setReceived(e.target.value)}
                      placeholder="Erhalten €"
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input rounded-xl"
                    />

                    <div className="grid grid-cols-5 gap-2">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setReceived(String(amount))}
                          className="py-3 rounded-xl bg-[#F3F3F3] text-black text-xs font-black"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-black text-lg mt-4">
                    <span>Summe</span>
                    <span>{formatMoney(totalCents)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-black/70 mt-2">
                    <span>Retourgeld</span>
                    <span className={changeCents < 0 ? 'text-red-700' : 'text-green-700'}>
                      {formatMoney(changeCents)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      type="button"
                      onClick={clearCart}
                      disabled={cart.length === 0 || booking}
                      className="w-full bg-[#EAEAEA] text-black py-4 font-black uppercase rounded-2xl shadow-sm disabled:opacity-50"
                    >
                      Zurücksetzen
                    </button>

                    <button
                      type="button"
                      onClick={bookOrder}
                      disabled={cart.length === 0 || booking}
                      className="w-full bg-[#C9AE6A] text-black py-4 font-black uppercase rounded-2xl shadow-sm active:scale-[0.99] transition disabled:opacity-50"
                    >
                      {booking ? 'Speichert...' : 'Bonieren'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
            <div className="max-w-5xl mx-auto px-3 py-3">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCartPanelOpen((prev) => !prev)}
                  className="min-w-0 flex items-center justify-between gap-3 rounded-2xl bg-[#F3F3F3] px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase text-black/50">
                      Warenkorb
                    </div>
                    <div className="font-black text-sm text-black truncate">
                      {cartItemsCount} Artikel · {formatMoney(totalCents)}
                    </div>
                  </div>

                  <div className="text-xs font-black uppercase text-black/60 whitespace-nowrap">
                    {cartPanelOpen ? 'Zuklappen' : 'Öffnen'}
                  </div>
                </button>

                <div className="hidden sm:flex flex-col items-end px-1">
                  <div className="text-[11px] font-black uppercase text-black/50">
                    Retour
                  </div>
                  <div className={`text-sm font-black ${changeCents < 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatMoney(changeCents)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={bookOrder}
                  disabled={cart.length === 0 || booking}
                  className="rounded-2xl bg-[#C9AE6A] text-black px-5 py-3 font-black uppercase text-sm shadow-sm active:scale-[0.99] transition disabled:opacity-50"
                >
                  {booking ? '...' : 'Bonieren'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PosView;
