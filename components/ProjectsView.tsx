import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ViewType } from '../types';
import * as api from '../services/api';
import ProjectWheelMenu from './projects/ProjectWheelMenu';

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
const buttonRadius = 170;
const labelRadius = 125;

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
  return d.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
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
    current = w;
  }

  if (current) lines.push(current);

  return lines.slice(0, 3);
};

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
) => {
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  };
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
  const [assignId, setAssignId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  const loadedOnce = useRef(false);
  const wheelGroupRef = useRef<SVGGElement | null>(null);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const sortedProjects = useMemo(() => {
    const now = new Date();
    const list = [...projects];

    list.sort((a, b) => {
      const da = pickProjectDate(a);
      const db = pickProjectDate(b);

      if (!da && !db) return b.id - a.id;
      if (!da) return 1;
      if (!db) return -1;

      return da.getTime() - db.getTime();
    });

    return list;
  }, [projects]);

  const centerTitle = useMemo(() => {
    const title = selectedProject?.title?.trim();
    return title ? title : 'Projekt';
  }, [selectedProject]);

  const centerLines = useMemo(() => wrapLines(centerTitle, 14), [centerTitle]);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    loadProjects();
    loadAssignableData();
  }, []);

  const loadProjects = async () => {

    setError(null);
    setLoading(true);

    try {

      const data = await api.apiRequest<Project[]>('/gug/v1/projects', {}, undefined);

      const list = Array.isArray(data) ? data : [];
      setProjects(list);

      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0].id);
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
        api.apiRequest('/gug/v1/events', {}, undefined).catch(() => []),
        api.apiRequest('/gug/v1/tasks', {}, undefined).catch(() => []),
        api.apiRequest('/gug/v1/polls', {}, undefined).catch(() => [])
      ]);

      setEvents(ev || []);
      setTasks(ta || []);
      setPolls(po || []);

    } catch {}

  };

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

      const res = await api.apiRequest(
        '/gug/v1/projects',
        {
          method: 'POST',
          body: JSON.stringify({ title, description })
        },
        undefined
      );

      setNewTitle('');
      setNewDescription('');

      await loadProjects();

    } catch (e: any) {

      setError(e?.message || 'Projekt konnte nicht erstellt werden.');

    } finally {

      setCreating(false);

    }

  };

  return (
    <div className="space-y-10">

      <div className="app-card">
        <h1 className="text-2xl font-black">Projekte</h1>
      </div>

      <ProjectWheelMenu
        wheelItems={wheelItems}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        handleWheelClick={handleWheelClick}
        wheelColors={wheelColors}
        wheelGroupRef={wheelGroupRef}
        center={center}
        centerRadius={centerRadius}
        buttonRadius={buttonRadius}
        labelRadius={labelRadius}
        polarToCartesian={polarToCartesian}
        getSliceLift={getSliceLift}
        centerLines={centerLines}
      />

      {/* Projekt erstellen */}

      <div className="app-card space-y-4">

        <h2 className="text-lg font-black">Projekt erstellen</h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            className="form-input"
            placeholder="Projektname"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <input
            className="form-input"
            placeholder="Beschreibung"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

        </div>

        <div className="flex justify-end">

          <button
            className="btn-primary"
            onClick={handleCreateProject}
            disabled={creating}
          >
            {creating ? '...' : 'Projekt anlegen'}
          </button>

        </div>

      </div>

      {/* Projektliste */}

      <div className="app-card space-y-4">

        <h2 className="text-lg font-black">Projektliste</h2>

        {sortedProjects.map((p) => {

          const isActive = p.id === selectedProjectId;

          return (

            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`w-full text-left px-5 py-4 rounded-xl ${
                isActive
                  ? 'bg-[#B5A47A] text-[#1A1A1A]'
                  : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >

              <div className="font-black">
                {p.title || `Projekt #${p.id}`}
              </div>

              {p.description && (
                <div className="text-xs opacity-70">
                  {p.description}
                </div>
              )}

            </button>

          );

        })}

      </div>

    </div>
  );

};

export default ProjectsView;
