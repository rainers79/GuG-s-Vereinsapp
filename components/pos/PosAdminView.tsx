// components/pos/PosAdminView.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppRole, PosArticle, PosCategory } from '../../types';
import * as api from '../../services/api';

interface Props {
  onUnauthorized: () => void;
}

const LS_ACTIVE_PROJECT = 'gug_active_project';

const categories: PosCategory[] = ['food', 'drink', 'gug'];
const drinkServingOptions = ['2cl', '4cl', '0,3l', '0,5l'];

/* =====================================================
   HSL → HEX + Helligkeitskontrolle
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

const hexToRgb = (hex: string) => {
  const c = hex.replace('#', '').trim();
  if (c.length !== 6) return null;

  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;

  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rr:
        h = 60 * (((gg - bb) / delta) % 6);
        break;
      case gg:
        h = 60 * ((bb - rr) / delta + 2);
        break;
      default:
        h = 60 * ((rr - gg) / delta + 4);
        break;
    }
  }

  if (h < 0) h += 360;

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

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

const PosAdminView: React.FC<Props> = ({ onUnauthorized }) => {
  const currentUser = api.getStoredUser();
  const isSuperadmin = currentUser?.role === AppRole.SUPERADMIN;

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => getActiveProjectId());

  const [articles, setArticles] = useState<PosArticle[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PosCategory>('food');
  const [servingLabel, setServingLabel] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hue, setHue] = useState(40);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(75);

  const bgHex = useMemo(() => {
    const safeLightness = clamp(lightness, 60, 92);
    const safeSaturation = clamp(saturation, 50, 95);
    return hslToHex(hue, safeSaturation, safeLightness);
  }, [hue, saturation, lightness]);

  const isEditMode = editingArticleId !== null;

  const canSave = useMemo(() => {
    const p = parseFloat(price);

    if (!selectedProjectId) return false;
    if (!name.trim()) return false;
    if (!Number.isFinite(p) || p <= 0) return false;
    if (category === 'drink' && !servingLabel.trim()) return false;

    return true;
  }, [selectedProjectId, name, price, category, servingLabel]);

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }

      if ((a.sort_order || 0) !== (b.sort_order || 0)) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }

      return a.name.localeCompare(b.name, 'de');
    });
  }, [articles]);

  const loadArticles = useCallback(async () => {
    const projectId = getActiveProjectId();
    setSelectedProjectId(projectId);

    if (!projectId) {
      setArticles([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await api.getPosArticles(
        {
          project_id: projectId,
          all: true
        },
        onUnauthorized
      );

      setArticles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Artikel konnten nicht geladen werden.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (category !== 'drink') {
      setServingLabel('');
    }
  }, [category]);

  const resetColorPickerToDefault = () => {
    setHue(40);
    setSaturation(70);
    setLightness(75);
  };

  const resetForm = () => {
    setEditingArticleId(null);
    setName('');
    setCategory('food');
    setPrice('');
    setServingLabel('');
    resetColorPickerToDefault();
  };

  const startEditArticle = (article: PosArticle) => {
    setError(null);
    setEditingArticleId(article.id);
    setName(article.name || '');
    setCategory(article.category);
    setServingLabel(article.serving_label || '');
    setPrice((article.price_cents / 100).toFixed(2));

    const color = article.bg_color || '#C9AE6A';
    const rgb = hexToRgb(color);

    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setHue(clamp(hsl.h, 0, 360));
      setSaturation(clamp(hsl.s, 50, 95));
      setLightness(clamp(hsl.l, 60, 92));
    } else {
      resetColorPickerToDefault();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createArticle = async () => {
    if (!canSave || !selectedProjectId) return;

    try {
      setSaving(true);
      setError(null);

      const parsedPrice = parseFloat(price);

      await api.createPosArticle(
        {
          project_id: selectedProjectId,
          name: name.trim(),
          category,
          serving_label: category === 'drink' ? servingLabel.trim() : '',
          price_cents: Math.round(parsedPrice * 100),
          is_active: true,
          sort_order: 0,
          bg_color: bgHex
        },
        onUnauthorized
      );

      resetForm();
      await loadArticles();
    } catch (e: any) {
      setError(e?.message || 'Artikel konnte nicht angelegt werden.');
    } finally {
      setSaving(false);
    }
  };

  const saveEditedArticle = async () => {
    if (!canSave || !selectedProjectId || !editingArticleId) return;

    try {
      setSaving(true);
      setError(null);

      const parsedPrice = parseFloat(price);

      await api.updatePosArticle(
        editingArticleId,
        {
          project_id: selectedProjectId,
          name: name.trim(),
          category,
          serving_label: category === 'drink' ? servingLabel.trim() : '',
          price_cents: Math.round(parsedPrice * 100),
          bg_color: bgHex
        },
        onUnauthorized
      );

      resetForm();
      await loadArticles();
    } catch (e: any) {
      setError(e?.message || 'Artikel konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      await saveEditedArticle();
      return;
    }

    await createArticle();
  };

  const toggleActive = async (article: PosArticle) => {
    try {
      setError(null);

      await api.updatePosArticle(
        article.id,
        { is_active: !article.is_active },
        onUnauthorized
      );

      await loadArticles();
    } catch (e: any) {
      setError(e?.message || 'Artikelstatus konnte nicht geändert werden.');
    }
  };

  const updateColor = async (articleId: number) => {
    try {
      setError(null);

      await api.updatePosArticle(
        articleId,
        { bg_color: bgHex },
        onUnauthorized
      );

      await loadArticles();
    } catch (e: any) {
      setError(e?.message || 'Farbe konnte nicht gespeichert werden.');
    }
  };

  const deleteArticle = async (articleId: number) => {
    if (!isSuperadmin) return;

    const confirmed = window.confirm('Diesen Artikel wirklich dauerhaft löschen?');
    if (!confirmed) return;

    try {
      setError(null);

      await api.deletePosArticle(articleId, onUnauthorized);

      if (editingArticleId === articleId) {
        resetForm();
      }

      await loadArticles();
    } catch (e: any) {
      setError(e?.message || 'Artikel konnte nicht gelöscht werden.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-black/10 shadow-sm space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black">
            POS Verwaltung
          </h2>
          <div className="text-sm text-black/60 mt-1">
            {selectedProjectId
              ? `Aktives Projekt: ID ${selectedProjectId}`
              : 'Kein aktives Projekt ausgewählt.'}
          </div>
          {isEditMode && (
            <div className="text-sm text-[#8E7340] mt-1 font-bold">
              Bearbeitungsmodus aktiv · Artikel ID {editingArticleId}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={loadArticles}
          className="px-4 py-3 rounded-lg bg-[#F3F3F3] text-black font-black text-xs uppercase tracking-widest"
        >
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {!selectedProjectId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-4 text-sm font-semibold">
          Bitte zuerst im Projektrad ein Projekt auswählen. Die Artikelverwaltung ist projektbezogen.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Artikelname"
          className="form-input rounded-lg"
          disabled={!selectedProjectId || saving}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PosCategory)}
          className="form-select rounded-lg"
          disabled={!selectedProjectId || saving}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {getCategoryLabel(c)}
            </option>
          ))}
        </select>

        {category === 'drink' ? (
          <select
            value={servingLabel}
            onChange={(e) => setServingLabel(e.target.value)}
            className="form-select rounded-lg"
            disabled={!selectedProjectId || saving}
          >
            <option value="">Größe wählen</option>
            {drinkServingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            value=""
            readOnly
            placeholder="Keine Zusatzgröße"
            className="form-input rounded-lg opacity-50"
            disabled
          />
        )}

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preis €"
          type="number"
          step="0.01"
          min="0"
          className="form-input rounded-lg"
          disabled={!selectedProjectId || saving}
        />

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
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full"
              disabled={!selectedProjectId || saving}
            />
          </div>

          <div>
            <div className="text-xs font-semibold mb-1">Sättigung</div>
            <input
              type="range"
              min="50"
              max="95"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full"
              disabled={!selectedProjectId || saving}
            />
          </div>

          <div>
            <div className="text-xs font-semibold mb-1">Helligkeit</div>
            <input
              type="range"
              min="60"
              max="92"
              value={lightness}
              onChange={(e) => setLightness(Number(e.target.value))}
              className="w-full"
              disabled={!selectedProjectId || saving}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canSave || saving}
            className={`font-black rounded-lg px-4 py-3 ${
              !canSave || saving ? 'bg-[#C9AE6A]/50 text-black/60' : 'bg-[#C9AE6A] text-black'
            }`}
          >
            {saving ? 'Speichert...' : isEditMode ? 'Speichern' : 'Anlegen'}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="font-black rounded-lg px-4 py-3 bg-[#F3F3F3] text-black"
            >
              Abbrechen
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 font-semibold">
          Lädt Artikel...
        </div>
      ) : sortedArticles.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-[#FAFAFA] p-6 text-sm text-black/60 font-semibold">
          Keine Artikel vorhanden.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedArticles.map((article) => (
            <div
              key={article.id}
              className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border border-black/10 p-5 rounded-xl bg-white shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-14 h-14 rounded-lg border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: article.bg_color || '#FFFFFF' }}
                />

                <div className="min-w-0">
                  <div className="font-bold text-lg break-words">
                    {article.name}
                  </div>

                  <div className="text-sm text-black/60 break-words">
                    {getCategoryLabel(article.category)}
                    {article.serving_label ? ` · ${article.serving_label}` : ''}
                    {' · '}
                    {(article.price_cents / 100).toFixed(2)} €
                    <span className="ml-2 text-black/40">• ID #{article.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => startEditArticle(article)}
                  className="px-4 py-2 text-xs font-black rounded-lg bg-[#DDEAFE] text-black"
                >
                  Bearbeiten
                </button>

                <button
                  onClick={() => updateColor(article.id)}
                  className="px-3 py-2 text-xs font-black bg-[#F3F3F3] rounded-lg"
                >
                  Neue Farbe
                </button>

                <button
                  onClick={() => toggleActive(article)}
                  className={`px-4 py-2 text-xs font-black rounded-lg ${
                    article.is_active
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-black'
                  }`}
                >
                  {article.is_active ? 'Aktiv' : 'Inaktiv'}
                </button>

                {isSuperadmin && (
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="px-4 py-2 text-xs font-black rounded-lg bg-red-600 text-white"
                  >
                    Löschen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PosAdminView;
