// components/ProjectsView.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ViewType } from '../types';
import * as api from '../services/api';

interface Props {
  onNavigate: (view: ViewType) => void;
}

type Project = {
  id: number;
  title?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  start_date?: string | null;
  end_date?: string | null;
  next_date?: string | null;
  target_date?: string | null;
};

type LinkType = 'event' | 'task' | 'poll';

type CalendarEventLite = {
  id: string;
  title: string;
  date?: string;
  target_date?: string;
};

type TaskLite = {
  id: number;
  title: string;
  deadline_date?: string | null;
  status?: string;
};

type PollLite = {
  id: number;
  question: string;
  target_date?: string;
  created_at?: string;
};

interface WheelItem {
  label: string;
  view?: ViewType;
  comingSoon?: boolean;
  actionKey:
    | 'calendar'
    | 'tasks'
    | 'polls'
    | 'invoices'
    | 'shopping'
    | 'coreteam'
    | 'chatlog'
    | 'more';
}

const wheelItems: WheelItem[] = [
  { label: 'Kalender', view: 'calendar', actionKey: 'calendar' },
  { label: 'Aufgaben', view: 'tasks', actionKey: 'tasks' },
  { label: 'Umfragen', view: 'polls', actionKey: 'polls' },
  { label: 'Rechnungen', comingSoon: true, actionKey: 'invoices' },
  { label: 'Einkaufsliste (coming soon)', comingSoon: true, actionKey: 'shopping' },
  { label: 'Kernteam (coming soon)', comingSoon: true, actionKey: 'coreteam' },
  { label: 'Chat Verlauf (coming soon)', comingSoon: true, actionKey: 'chatlog' },
  { label: 'Mehr (coming soon)', comingSoon: true, actionKey: 'more' }
];

const center = 200;
const centerRadius = 70;
const buttonThickness = 54;
const buttonRadius = 170;
const labelRadius = 125;
const segmentGapDeg = 10;

const wheelColors = [
  '#2D8CFF',
  '#FF9A2B',
  '#FF4FB3',
  '#E6A61A',
  '#7C3AED',
  '#65C431',
  '#F44336',
  '#53B62C'
];

const safeDate = (raw?: string | null): Date | null => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
};

const formatDate = (raw?: string | null) => {
  const d = safeDate(raw);
  if (!d) return '';
  return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const pickProjectDate = (p: Project): Date | null => {
  return (
    safeDate(p.next_date) ||
    safeDate(p.target_date) ||
    safeDate(p.start_date) ||
    safeDate(p.created_at) ||
    null
  );
};

const wrapLines = (text: string, maxLineLen = 14): string[] => {
  const t = (text || '').trim();
  if (!t) return ['Projekt'];

  const words = t.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxLineLen) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (w.length > maxLineLen) {
      lines.push(w.slice(0, maxLineLen));
      current = w.slice(maxLineLen);
    } else {
      current = w;
    }
  }

  if (current) lines.push(current);

  return lines.slice(0, 3);
};

const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  };
};

const createArcPath = (
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number
) => {
  const start = polarToCartesian(cx, cy, radius, startDeg);
  const end = polarToCartesian(cx, cy, radius, endDeg);
  const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const getSliceLift = (index: number, total: number) => {
  const sliceAngle = 360 / total;
  const midDeg = index * sliceAngle + sliceAngle / 2;
  const midRad = (midDeg - 90) * (Math.PI / 180);
  const lift = 12;

  return {
    dx: Math.cos(midRad) * lift,
    dy: Math.sin(midRad) * lift
  };
};

const ProjectsView: React.FC<Props> = ({ onNavigate }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [events, setEvents] = useState<CalendarEventLite[]>([]);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [polls, setPolls] = useState<PollLite[]>([]);

  const [assignType, setAssignType] = useState<LinkType>('event');
  const [assignId, setAssignId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  const loadedOnce = useRef(false);
  const wheelGroupRef = useRef<SVGGElement | null>(null);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    localStorage.setItem('gug_active_project', String(selectedProjectId));
  }, [selectedProjectId]);

  const sortedProjects = useMemo(() => {
    const now = new Date();
    const list = [...projects];

    list.sort((a, b) => {
      const da = pickProjectDate(a);
      const db = pickProjectDate(b);

      const aIsPast = da ? da.getTime() < now.getTime() : false;
      const bIsPast = db ? db.getTime() < now.getTime() : false;

      if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;

      if (!da && !db) return (b.id || 0) - (a.id || 0);
      if (!da) return 1;
      if (!db) return -1;

      const diff = da.getTime() - db.getTime();
      if (diff !== 0) return diff;

      return (b.id || 0) - (a.id || 0);
    });

    return list;
  }, [projects]);

  const centerTitle = useMemo(() => {
    const title = selectedProject?.title?.trim();
    return title ? title : 'Projekt';
  }, [selectedProject]);

  const centerLines = useMemo(() => wrapLines(centerTitle, 14), [centerTitle]);

  useEffect(() => {
    if (!wheelGroupRef.current) return;

    wheelGroupRef.current.animate(
      [
        { transform: 'rotate(-12deg) scale(0.97)' },
        { transform: 'rotate(0deg) scale(1)' }
      ],
      {
        duration: 280,
        easing: 'ease-out'
      }
    );
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await api.apiRequest<Project[]>('/gug/v1/projects', {}, undefined);
      const list = Array.isArray(data) ? data : [];
      setProjects(list);

      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0].id);
      } else if (selectedProjectId) {
        const stillExists = list.some(p => p.id === selectedProjectId);
        if (!stillExists) setSelectedProjectId(list.length ? list[0].id : null);
      }
    } catch (e: any) {
      setError(e?.message || 'Projekte konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableData = async () => {
    try {
      const [ev, ta, po] = await Promise.all([
        api.apiRequest<CalendarEventLite[]>('/gug/v1/events', {}, undefined).catch(() => []),
        api.apiRequest<TaskLite[]>('/gug/v1/tasks', {}, undefined).catch(() => []),
        api.apiRequest<PollLite[]>('/gug/v1/polls', {}, undefined).catch(() => [])
      ]);

      setEvents(Array.isArray(ev) ? ev : []);
      setTasks(Array.isArray(ta) ? ta : []);
      setPolls(Array.isArray(po) ? po : []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    loadProjects();
    loadAssignableData();
  }, []);

  const handleWheelClick = (item: WheelItem) => {
    if (item.comingSoon) return;
    if (!selectedProjectId) return;

    localStorage.setItem('gug_active_project', String(selectedProjectId));

    if (item.view) onNavigate(item.view);
  };

  const handleCreateProject = async () => {
    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title) {
      setError('Projektname fehlt.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await api.apiRequest<{ success?: boolean; id?: number; project_id?: number }>(
        '/gug/v1/projects',
        {
          method: 'POST',
          body: JSON.stringify({ title, description })
        },
        undefined
      );

      const newId = (res?.id || res?.project_id) as number | undefined;

      setNewTitle('');
      setNewDescription('');
      await loadProjects();

      if (newId) {
        setSelectedProjectId(newId);
        localStorage.setItem('gug_active_project', String(newId));
      }
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht erstellt werden.');
    } finally {
      setCreating(false);
    }
  };

  const optionsForAssign = useMemo(() => {
    if (assignType === 'event') {
      return events.map(e => ({
        id: String(e.id),
        label: `${e.title}${e.date ? ` (${formatDate(e.date)})` : ''}`
      }));
    }
    if (assignType === 'task') {
      return tasks.map(t => ({
        id: String(t.id),
        label: `${t.title}${t.deadline_date ? ` (${formatDate(t.deadline_date)})` : ''}`
      }));
    }
    return polls.map(p => ({
      id: String(p.id),
      label: `${p.question}${p.target_date ? ` (${formatDate(p.target_date)})` : ''}`
    }));
  }, [assignType, events, tasks, polls]);

  useEffect(() => {
    setAssignId('');
    setAssignResult(null);
  }, [assignType, selectedProjectId]);

  const handleAssignToProject = async () => {
    if (!selectedProjectId) {
      setAssignResult('Kein Projekt ausgewählt.');
      return;
    }
    if (!assignId) {
      setAssignResult('Kein Eintrag ausgewählt.');
      return;
    }

    setAssigning(true);
    setAssignResult(null);

    try {
      const payload = {
        project_id: selectedProjectId,
        type: assignType,
        item_id: Number(assignId)
      };

      await api.apiRequest<{ success: boolean; message?: string }>(
        '/gug/v1/projects/link',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        undefined
      );

      setAssignResult('Zuordnung gespeichert.');
      await loadAssignableData();
    } catch (e: any) {
      setAssignResult(e?.message || 'Zuordnung fehlgeschlagen.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-10">

      <div className="app-card">
        <div className="flex flex-col md:flex-row gap-6 md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black">Projekte</h1>
            <p className="text-xs text-white/40 mt-1">
              Projekt auswählen, dann im Rad navigieren. Zuordnungen kommen über Dropdown.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadProjects}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? '...' : 'Aktualisieren'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            {error}
          </div>
        )}
      </div>

<div className="flex justify-center items-center py-10">

  <svg width="400" height="400">

    {wheelItems.map((item, i) => {

      const startAngle = (i / wheelItems.length) * 360
      const endAngle = ((i + 1) / wheelItems.length) * 360

      const start = polarToCartesian(center, center, buttonRadius, startAngle)
      const end = polarToCartesian(center, center, buttonRadius, endAngle)

      const largeArc = endAngle - startAngle <= 180 ? 0 : 1
const innerStart = polarToCartesian(center, center, centerRadius, startAngle)
const innerEnd = polarToCartesian(center, center, centerRadius, endAngle)

const innerStart = polarToCartesian(center, center, centerRadius, startAngle)
const innerEnd = polarToCartesian(center, center, centerRadius, endAngle)

const path = `
M ${start.x} ${start.y}
A ${buttonRadius} ${buttonRadius} 0 ${largeArc} 1 ${end.x} ${end.y}
L ${innerEnd.x} ${innerEnd.y}
A ${centerRadius} ${centerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
Z
`
      `

      const mid = (startAngle + endAngle) / 2
      const label = polarToCartesian(center, center, labelRadius, mid)

      const color = wheelColors[i]

      return (
<g
  key={i}
  onClick={() => handleWheelClick(item)}
  onMouseEnter={() => setHoveredIndex(i)}
  onMouseLeave={() => setHoveredIndex(null)}
  transform={
    hoveredIndex === i
      ? `translate(${getSliceLift(i, wheelItems.length).dx}, ${getSliceLift(i, wheelItems.length).dy}) scale(1.05)`
      : "scale(1)"
  }
  style={{ cursor: item.comingSoon ? "default" : "pointer", transition: "all 0.2s ease" }}
>

<defs>

{wheelColors.map((color, i) => (

<radialGradient
key={i}
id={`grad-${i}`}
cx="50%"
cy="30%"
r="80%"
>

<stop offset="0%" stopColor="#ffffff" />

<stop offset="25%" stopColor={color} />

<stop offset="65%" stopColor={color} />

<stop offset="100%" stopColor="#00000066" />

</radialGradient>

))}

</defs>
          
<path
  d={path}
  fill={`url(#grad-${i})`}
  stroke="none"
  strokeLinecap="round"
  strokeLinejoin="round"
  style={{
    filter:
      hoveredIndex === i
        ? "drop-shadow(0 10px 18px rgba(0,0,0,0.9))"
        : "drop-shadow(0 6px 10px rgba(0,0,0,0.7))"
  }}
/>

<line
  x1={center}
  y1={center}
  x2={start.x}
  y2={start.y}
  stroke="#ffffff"
  strokeWidth="2"
/>
  
          <text
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000"
            fontWeight="900"
            fontSize="13"
          >
            {item.label}
          </text>

        </g>

      )

    })}

    <circle
      cx={center}
      cy={center}
      r={centerRadius}
      fill="#d6c39a"
      stroke="#ffffff"
      strokeWidth="3"
    />

    <text
      x={center}
      y={center}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#000"
      fontWeight="900"
      fontSize="14"
    >
      {centerTitle}
    </text>

  </svg>

</div>

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Projekt erstellen</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-black uppercase tracking-widest">
              Projektname
            </label>
            <input
              className="form-input w-full"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Ostermarkt 2026"
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50 font-black uppercase tracking-widest">
              Beschreibung
            </label>
            <input
              className="form-input w-full"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Kurzbeschreibung"
              disabled={creating}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCreateProject}
            disabled={creating || !newTitle.trim()}
          >
            {creating ? '...' : 'Projekt anlegen'}
          </button>
        </div>
      </div>

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Einträge ins Projekt ziehen</h2>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-black uppercase tracking-widest">
              Typ
            </label>
            <select
              className="form-input w-full"
              value={assignType}
              onChange={(e) => setAssignType(e.target.value as LinkType)}
              disabled={!selectedProjectId || assigning}
            >
              <option value="event">Kalender</option>
              <option value="task">Aufgaben</option>
              <option value="poll">Umfragen</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-white/50 font-black uppercase tracking-widest">
              Eintrag
            </label>
            <select
              className="form-input w-full"
              value={assignId}
              onChange={(e) => setAssignId(e.target.value)}
              disabled={!selectedProjectId || assigning}
            >
              <option value="">Bitte auswählen</option>
              {optionsForAssign.map(o => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-white/40">
            {selectedProject ? (
              <>
                Ziel: <span className="text-white/70 font-bold">{selectedProject.title || `Projekt #${selectedProject.id}`}</span>
              </>
            ) : (
              <>Kein Projekt ausgewählt.</>
            )}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleAssignToProject}
            disabled={!selectedProjectId || assigning || !assignId}
          >
            {assigning ? '...' : 'Zuordnen'}
          </button>
        </div>

        {assignResult && (
          <div className="text-sm text-white/70">
            {assignResult}
          </div>
        )}
      </div>

      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Projektliste</h2>

        {sortedProjects.length === 0 ? (
          <div className="text-sm text-white/50">
            Keine Projekte vorhanden. Lege oben dein erstes Projekt an.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedProjects.map((p) => {
              const d = pickProjectDate(p);
              const dateLabel = d ? d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
              const isActive = p.id === selectedProjectId;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    localStorage.setItem('gug_active_project', String(p.id));
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-lg shadow-[#B5A47A]/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`font-black ${isActive ? 'text-[#1A1A1A]' : 'text-white'}`}>
                        {p.title || `Projekt #${p.id}`}
                      </div>
                      {p.description && (
                        <div className={`text-xs mt-1 ${isActive ? 'text-[#1A1A1A]/70' : 'text-white/40'}`}>
                          {p.description}
                        </div>
                      )}
                    </div>

                    <div className={`text-xs font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-[#1A1A1A]/70' : 'text-white/30'}`}>
                      {dateLabel || 'ohne Datum'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProjectsView;
