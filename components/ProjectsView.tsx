import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ViewType } from '../types';
import * as api from '../services/api';
import ProjectsWheelMenu, { ProjectsWheelDisplayItem } from './ProjectsWheelMenu';

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

type ProjectChatGroupLite = {
  id: number;
  project_id: number;
  name: string;
  can_write: boolean;
  can_upload_images: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string | null;
};

export interface WheelItem {
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

type WheelMode = 'project-select' | 'actions' | 'chat-groups';

const actionWheelItems: WheelItem[] = [
  { label: 'Kalender', view: 'calendar', actionKey: 'calendar' },
  { label: 'Aufgaben', view: 'tasks', actionKey: 'tasks' },
  { label: 'Umfragen', view: 'polls', actionKey: 'polls' },
  { label: 'Rechnungen', comingSoon: true, actionKey: 'invoices' },
  { label: 'Einkaufsliste', comingSoon: true, actionKey: 'shopping' },
  { label: 'Kernteam', comingSoon: true, actionKey: 'coreteam' },
  { label: 'Projekt Chat', actionKey: 'chatlog' },
  { label: 'comming soon', comingSoon: true, actionKey: 'more' }
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

const PROJECT_PAGE_SIZE = 6;
const CHAT_GROUP_PAGE_SIZE = 6;
const WHEEL_SLOT_COUNT = 8;

const LS_ACTIVE_PROJECT = 'gug_active_project';
const LS_PROJECTS_WHEEL_MODE = 'gug_projects_wheel_mode';
const LS_PROJECTS_PAGE = 'gug_projects_page';
const LS_PROJECT_CHAT_GROUP_ID = 'gug_active_project_chat_group';
const LS_PROJECT_CHAT_GROUP_PAGE = 'gug_project_chat_group_page';
const LS_PROJECT_CHAT_ENTRY_MODE = 'gug_project_chat_entry_mode';

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

export const polarToCartesian = (
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

export const getSliceLift = (index: number, total: number) => {
  const sliceAngle = 360 / total;
  const midDeg = index * sliceAngle + sliceAngle / 2;
  const midRad = (midDeg - 90) * (Math.PI / 180);
  const lift = 12;

  return {
    dx: Math.cos(midRad) * lift,
    dy: Math.sin(midRad) * lift
  };
};

const getStoredProjectId = (): number | null => {
  const raw = localStorage.getItem(LS_ACTIVE_PROJECT);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getStoredWheelMode = (): WheelMode => {
  const raw = localStorage.getItem(LS_PROJECTS_WHEEL_MODE);
  if (raw === 'actions') return 'actions';
  if (raw === 'chat-groups') return 'chat-groups';
  return 'project-select';
};

const getStoredProjectPage = (): number => {
  const raw = localStorage.getItem(LS_PROJECTS_PAGE);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const getStoredChatGroupId = (): number | null => {
  const raw = localStorage.getItem(LS_PROJECT_CHAT_GROUP_ID);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getStoredChatGroupPage = (): number => {
  const raw = localStorage.getItem(LS_PROJECT_CHAT_GROUP_PAGE);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const ProjectsView: React.FC<Props> = ({ onNavigate }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingChatGroups, setLoadingChatGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => getStoredProjectId());

  const [chatGroups, setChatGroups] = useState<ProjectChatGroupLite[]>([]);
  const [selectedChatGroupId, setSelectedChatGroupId] = useState<number | null>(() => getStoredChatGroupId());

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

  const [wheelMode, setWheelMode] = useState<WheelMode>(() => getStoredWheelMode());
  const [projectPage, setProjectPage] = useState<number>(() => getStoredProjectPage());
  const [chatGroupPage, setChatGroupPage] = useState<number>(() => getStoredChatGroupPage());

  const loadedOnce = useRef(false);
  const hasStartedInitialWheelAnimation = useRef(false);
  const [wheelAnimationTick, setWheelAnimationTick] = useState(0);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => Number(p.id) === Number(selectedProjectId)) || null;
  }, [projects, selectedProjectId]);

  const sortedChatGroups = useMemo(() => {
    const list = [...chatGroups];
    list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    return list;
  }, [chatGroups]);

  const selectedChatGroup = useMemo(() => {
    if (!selectedChatGroupId) return null;
    return sortedChatGroups.find((group) => Number(group.id) === Number(selectedChatGroupId)) || null;
  }, [sortedChatGroups, selectedChatGroupId]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(LS_ACTIVE_PROJECT, String(selectedProjectId));
    } else {
      localStorage.removeItem(LS_ACTIVE_PROJECT);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    localStorage.setItem(LS_PROJECTS_WHEEL_MODE, wheelMode);
  }, [wheelMode]);

  useEffect(() => {
    localStorage.setItem(LS_PROJECTS_PAGE, String(projectPage));
  }, [projectPage]);

  useEffect(() => {
    localStorage.setItem(LS_PROJECT_CHAT_GROUP_PAGE, String(chatGroupPage));
  }, [chatGroupPage]);

  useEffect(() => {
    if (selectedChatGroupId) {
      localStorage.setItem(LS_PROJECT_CHAT_GROUP_ID, String(selectedChatGroupId));
    } else {
      localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
    }
  }, [selectedChatGroupId]);

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

  const projectPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sortedProjects.length / PROJECT_PAGE_SIZE));
  }, [sortedProjects]);

  const chatGroupPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sortedChatGroups.length / CHAT_GROUP_PAGE_SIZE));
  }, [sortedChatGroups]);

  useEffect(() => {
    if (projectPage > projectPageCount - 1) {
      setProjectPage(Math.max(0, projectPageCount - 1));
    }
  }, [projectPage, projectPageCount]);

  useEffect(() => {
    if (chatGroupPage > chatGroupPageCount - 1) {
      setChatGroupPage(Math.max(0, chatGroupPageCount - 1));
    }
  }, [chatGroupPage, chatGroupPageCount]);

  useEffect(() => {
    if (!selectedProjectId || sortedProjects.length === 0) return;

    const selectedIndex = sortedProjects.findIndex((p) => Number(p.id) === Number(selectedProjectId));
    if (selectedIndex < 0) return;

    const targetPage = Math.floor(selectedIndex / PROJECT_PAGE_SIZE);
    if (targetPage !== projectPage) {
      setProjectPage(targetPage);
    }
  }, [selectedProjectId, sortedProjects, projectPage]);

  useEffect(() => {
    if (!selectedChatGroupId || sortedChatGroups.length === 0) return;

    const selectedIndex = sortedChatGroups.findIndex((g) => Number(g.id) === Number(selectedChatGroupId));
    if (selectedIndex < 0) return;

    const targetPage = Math.floor(selectedIndex / CHAT_GROUP_PAGE_SIZE);
    if (targetPage !== chatGroupPage) {
      setChatGroupPage(targetPage);
    }
  }, [selectedChatGroupId, sortedChatGroups, chatGroupPage]);

  const currentProjectPageItems = useMemo(() => {
    const start = projectPage * PROJECT_PAGE_SIZE;
    return sortedProjects.slice(start, start + PROJECT_PAGE_SIZE);
  }, [sortedProjects, projectPage]);

  const currentChatGroupPageItems = useMemo(() => {
    const start = chatGroupPage * CHAT_GROUP_PAGE_SIZE;
    return sortedChatGroups.slice(start, start + CHAT_GROUP_PAGE_SIZE);
  }, [sortedChatGroups, chatGroupPage]);

  const wheelDisplayItems = useMemo<ProjectsWheelDisplayItem[]>(() => {
    if (wheelMode === 'actions') {
      return actionWheelItems.map((item) => ({
        label: item.label,
        actionKey: item.actionKey,
        view: item.view,
        comingSoon: item.comingSoon,
        slotType: item.comingSoon ? 'locked' : 'action'
      }));
    }

    if (wheelMode === 'chat-groups') {
      const items: ProjectsWheelDisplayItem[] = currentChatGroupPageItems.map((group) => ({
        label: group.name?.trim() || `Chat #${group.id}`,
        actionKey: 'chat-group',
        slotType: 'project',
        projectId: Number(group.id)
      }));

      if (chatGroupPage > 0) {
        items.push({
          label: 'Zurück',
          actionKey: 'chat-prev',
          slotType: 'prev'
        });
      }

      if (chatGroupPage < chatGroupPageCount - 1) {
        items.push({
          label: 'Weiter',
          actionKey: 'chat-next',
          slotType: 'next'
        });
      }

      while (items.length < WHEEL_SLOT_COUNT) {
        items.push({
          label: sortedChatGroups.length === 0 ? 'Keine Gruppe' : 'Freier Slot',
          actionKey: 'empty',
          slotType: 'empty'
        });
      }

      return items.slice(0, WHEEL_SLOT_COUNT);
    }

    const items: ProjectsWheelDisplayItem[] = currentProjectPageItems.map((project) => ({
      label: project.title?.trim() || `Projekt #${project.id}`,
      actionKey: 'project',
      slotType: 'project',
      projectId: Number(project.id)
    }));

    if (projectPage > 0) {
      items.push({
        label: 'Zurück',
        actionKey: 'prev',
        slotType: 'prev'
      });
    }

    if (projectPage < projectPageCount - 1) {
      items.push({
        label: 'Weiter',
        actionKey: 'next',
        slotType: 'next'
      });
    }

    while (items.length < WHEEL_SLOT_COUNT) {
      items.push({
        label: 'Freier Slot',
        actionKey: 'empty',
        slotType: 'empty'
      });
    }

    return items.slice(0, WHEEL_SLOT_COUNT);
  }, [
    wheelMode,
    currentProjectPageItems,
    currentChatGroupPageItems,
    projectPage,
    projectPageCount,
    chatGroupPage,
    chatGroupPageCount,
    sortedChatGroups.length
  ]);

  const centerTitle = useMemo(() => {
    if (wheelMode === 'project-select') return 'Projektauswahl';
    if (wheelMode === 'chat-groups') {
      const title = selectedProject?.title?.trim();
      return title ? `${title} Chat` : 'Projekt Chat';
    }
    const title = selectedProject?.title?.trim();
    return title ? title : 'Projekt';
  }, [wheelMode, selectedProject]);

  const centerLines = useMemo(() => wrapLines(centerTitle, 14), [centerTitle]);

  const centerSubLabel = useMemo(() => {
    if (wheelMode === 'project-select') {
      return `${projectPage + 1}/${projectPageCount}`;
    }

    if (wheelMode === 'chat-groups') {
      if (sortedChatGroups.length === 0) {
        return '0/0';
      }
      return `${chatGroupPage + 1}/${chatGroupPageCount}`;
    }

    return '';
  }, [wheelMode, projectPage, projectPageCount, chatGroupPage, chatGroupPageCount, sortedChatGroups.length]);

  const triggerWheelAnimation = () => {
    setWheelAnimationTick((prev) => prev + 1);
  };

  const loadProjects = async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await api.apiRequest<Project[]>('/gug/v1/projects', {}, undefined);
      const list = Array.isArray(data)
        ? data.map((p) => ({
            ...p,
            id: Number(p.id)
          }))
        : [];

      setProjects(list);

      const storedId = getStoredProjectId();
      const storedMode = getStoredWheelMode();
      const storedPage = getStoredProjectPage();

      if (Number.isFinite(storedPage) && storedPage >= 0) {
        setProjectPage(storedPage);
      }

      if (storedId && list.some((p) => Number(p.id) === Number(storedId))) {
        setSelectedProjectId(storedId);
        setWheelMode(storedMode);
      } else if (selectedProjectId && list.some((p) => Number(p.id) === Number(selectedProjectId))) {
        setWheelMode(getStoredWheelMode());
      } else {
        setSelectedProjectId(null);
        setWheelMode('project-select');
        setSelectedChatGroupId(null);
        localStorage.removeItem(LS_ACTIVE_PROJECT);
        localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
        localStorage.removeItem(LS_PROJECT_CHAT_ENTRY_MODE);
        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
      }

      if (list.length > 0 && !hasStartedInitialWheelAnimation.current) {
        hasStartedInitialWheelAnimation.current = true;
        triggerWheelAnimation();
      }
    } catch (e: any) {
      setError(e?.message || 'Projekte konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatGroups = async (projectId: number) => {
    if (!projectId) {
      setChatGroups([]);
      setSelectedChatGroupId(null);
      return;
    }

    setLoadingChatGroups(true);

    try {
      const data = await api.getProjectChatGroups(projectId, undefined as any);
      const list = Array.isArray(data)
        ? data.map((g) => ({
            ...g,
            id: Number(g.id),
            project_id: Number(g.project_id)
          }))
        : [];

      setChatGroups(list);

      const storedChatGroupId = getStoredChatGroupId();
      const storedChatGroupPage = getStoredChatGroupPage();

      if (Number.isFinite(storedChatGroupPage) && storedChatGroupPage >= 0) {
        setChatGroupPage(storedChatGroupPage);
      }

      if (storedChatGroupId && list.some((g) => Number(g.id) === Number(storedChatGroupId))) {
        setSelectedChatGroupId(storedChatGroupId);
      } else if (list.length > 0) {
        setSelectedChatGroupId(list[0].id);
      } else {
        setSelectedChatGroupId(null);
        localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
      }
    } catch {
      setChatGroups([]);
      setSelectedChatGroupId(null);
      localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
    } finally {
      setLoadingChatGroups(false);
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

  useEffect(() => {
    if (!selectedProjectId) {
      setChatGroups([]);
      setSelectedChatGroupId(null);
      return;
    }

    loadChatGroups(selectedProjectId);
  }, [selectedProjectId]);

  const handleCenterClick = () => {
    if (wheelMode === 'project-select') {
      if (selectedProjectId) {
        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
        setWheelMode('actions');
      }
      return;
    }

    if (wheelMode === 'chat-groups') {
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
      setWheelMode('actions');
      triggerWheelAnimation();
      return;
    }

    localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
    setWheelMode('project-select');
    triggerWheelAnimation();
  };

  const handleWheelClick = (item: ProjectsWheelDisplayItem) => {
    if (wheelMode === 'project-select') {
      if (item.slotType === 'project' && item.projectId) {
        const nextId = Number(item.projectId);
        localStorage.setItem(LS_ACTIVE_PROJECT, String(nextId));
        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
        setSelectedProjectId(nextId);
        setWheelMode('actions');
        triggerWheelAnimation();
        return;
      }

      if (item.slotType === 'next') {
        const nextPage = Math.min(projectPage + 1, projectPageCount - 1);
        localStorage.setItem(LS_PROJECTS_PAGE, String(nextPage));
        setProjectPage(nextPage);
        triggerWheelAnimation();
        return;
      }

      if (item.slotType === 'prev') {
        const prevPage = Math.max(projectPage - 1, 0);
        localStorage.setItem(LS_PROJECTS_PAGE, String(prevPage));
        setProjectPage(prevPage);
        triggerWheelAnimation();
      }

      return;
    }

    if (wheelMode === 'chat-groups') {
      if (item.slotType === 'project' && item.projectId) {
        const nextGroupId = Number(item.projectId);
        localStorage.setItem(LS_PROJECT_CHAT_GROUP_ID, String(nextGroupId));
        localStorage.setItem(LS_PROJECT_CHAT_ENTRY_MODE, 'chat');
        setSelectedChatGroupId(nextGroupId);
        onNavigate('project-chat');
        return;
      }

      if (item.slotType === 'next') {
        const nextPage = Math.min(chatGroupPage + 1, chatGroupPageCount - 1);
        localStorage.setItem(LS_PROJECT_CHAT_GROUP_PAGE, String(nextPage));
        setChatGroupPage(nextPage);
        triggerWheelAnimation();
        return;
      }

      if (item.slotType === 'prev') {
        const prevPage = Math.max(chatGroupPage - 1, 0);
        localStorage.setItem(LS_PROJECT_CHAT_GROUP_PAGE, String(prevPage));
        setChatGroupPage(prevPage);
        triggerWheelAnimation();
        return;
      }

      return;
    }

    if (item.slotType !== 'action') return;
    if (!selectedProjectId) return;

    localStorage.setItem(LS_ACTIVE_PROJECT, String(selectedProjectId));
    localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');

    if (item.actionKey === 'chatlog') {
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'chat-groups');
      setWheelMode('chat-groups');
      triggerWheelAnimation();
      return;
    }

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
      const res = await api.apiRequest<{ success?: boolean; id?: number | string; project_id?: number | string }>(
        '/gug/v1/projects',
        {
          method: 'POST',
          body: JSON.stringify({ title, description })
        },
        undefined
      );

      const rawNewId = res?.id ?? res?.project_id;
      const newId = rawNewId ? Number(rawNewId) : undefined;

      setNewTitle('');
      setNewDescription('');

      await loadProjects();

      if (newId && Number.isFinite(newId)) {
        const refreshedProjects = await api
          .apiRequest<Project[]>('/gug/v1/projects', {}, undefined)
          .catch(() => []);

        const normalizedProjects = Array.isArray(refreshedProjects)
          ? refreshedProjects.map((p) => ({
              ...p,
              id: Number(p.id)
            }))
          : [];

        setProjects(normalizedProjects);
        setSelectedProjectId(newId);
        setSelectedChatGroupId(null);
        setChatGroups([]);
        localStorage.setItem(LS_ACTIVE_PROJECT, String(newId));
        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
        localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
        localStorage.removeItem(LS_PROJECT_CHAT_ENTRY_MODE);

        const newIndex = normalizedProjects.findIndex((p) => p.id === newId);
        if (newIndex >= 0) {
          const page = Math.floor(newIndex / PROJECT_PAGE_SIZE);
          localStorage.setItem(LS_PROJECTS_PAGE, String(page));
          setProjectPage(page);
        } else {
          localStorage.setItem(LS_PROJECTS_PAGE, '0');
          setProjectPage(0);
        }

        setWheelMode('actions');
        triggerWheelAnimation();
      }
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht erstellt werden.');
    } finally {
      setCreating(false);
    }
  };

  const optionsForAssign = useMemo(() => {
    if (assignType === 'event') {
      return events.map((e) => ({
        id: String(e.id),
        label: `${e.title}${e.date ? ` (${formatDate(e.date)})` : ''}`
      }));
    }

    if (assignType === 'task') {
      return tasks.map((t) => ({
        id: String(t.id),
        label: `${t.title}${t.deadline_date ? ` (${formatDate(t.deadline_date)})` : ''}`
      }));
    }

    return polls.map((p) => ({
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
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}

      <ProjectsWheelMenu
        wheelItems={wheelDisplayItems}
        hoveredIndex={hoveredIndex}
        setHoveredIndex={setHoveredIndex}
        handleWheelClick={handleWheelClick}
        wheelColors={wheelColors}
        center={center}
        centerRadius={centerRadius}
        buttonRadius={buttonRadius}
        labelRadius={labelRadius}
        polarToCartesian={polarToCartesian}
        getSliceLift={getSliceLift}
        centerLines={centerLines}
        centerSubLabel={centerSubLabel}
        onCenterClick={handleCenterClick}
        animationKey={wheelAnimationTick}
      />

      {wheelMode === 'chat-groups' && (
        <div className="app-card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">Projekt Chat Gruppen</h2>
              <div className="text-xs text-white/50 mt-1">
                {selectedProject ? selectedProject.title || `Projekt #${selectedProject.id}` : 'Kein Projekt gewählt'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => selectedProjectId && loadChatGroups(selectedProjectId)}
              disabled={loadingChatGroups || !selectedProjectId}
              className="btn-secondary"
            >
              {loadingChatGroups ? '...' : 'Aktualisieren'}
            </button>
          </div>

          {sortedChatGroups.length === 0 ? (
            <div className="text-sm text-white/50">
              Keine Chat-Gruppen vorhanden. Lege zuerst im Projekt-Chat eine Gruppe an.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedChatGroups.map((group) => {
                const isActive = group.id === selectedChatGroupId;

                return (
                  <div
                    key={group.id}
                    className={`w-full px-5 py-4 rounded-xl transition-all duration-300 border ${
                      isActive
                        ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-lg shadow-[#B5A47A]/20 border-[#B5A47A]'
                        : 'bg-white dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChatGroupId(group.id);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className={`font-black ${isActive ? 'text-[#1A1A1A]' : 'text-slate-900 dark:text-white'}`}>
                          {group.name}
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            isActive ? 'text-[#1A1A1A]/70' : 'text-slate-500 dark:text-white/40'
                          }`}
                        >
                          Schreiben: {group.can_write ? 'ja' : 'nein'} · Bilder: {group.can_upload_images ? 'ja' : 'nein'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChatGroupId(group.id);
                          localStorage.setItem(LS_PROJECT_CHAT_GROUP_ID, String(group.id));
                          localStorage.setItem(LS_PROJECT_CHAT_ENTRY_MODE, 'admin');
                          onNavigate('project-chat');
                        }}
                        className={`text-xs font-black uppercase tracking-widest ${
                          isActive ? 'text-[#1A1A1A]/70' : 'text-slate-700 dark:text-white/70'
                        }`}
                      >
                        Verwalten
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
              {optionsForAssign.map((o) => (
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
                Ziel:{' '}
                <span className="text-white/70 font-bold">
                  {selectedProject.title || `Projekt #${selectedProject.id}`}
                </span>
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

        {assignResult && <div className="text-sm text-white/70">{assignResult}</div>}
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
              const dateLabel = d
                ? d.toLocaleDateString('de-AT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : '';
              const isActive = p.id === selectedProjectId;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const nextId = Number(p.id);
                    localStorage.setItem(LS_ACTIVE_PROJECT, String(nextId));
                    localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
                    localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
                    localStorage.removeItem(LS_PROJECT_CHAT_ENTRY_MODE);
                    setSelectedProjectId(nextId);
                    setSelectedChatGroupId(null);
                    setWheelMode('actions');
                    triggerWheelAnimation();
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
                        <div
                          className={`text-xs mt-1 ${
                            isActive ? 'text-[#1A1A1A]/70' : 'text-white/40'
                          }`}
                        >
                          {p.description}
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-xs font-black uppercase tracking-widest whitespace-nowrap ${
                        isActive ? 'text-[#1A1A1A]/70' : 'text-white/30'
                      }`}
                    >
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
