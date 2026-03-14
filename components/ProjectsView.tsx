import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppRole, ViewType } from '../types';
import * as api from '../services/api';
import ProjectsWheelMenu, { ProjectsWheelDisplayItem } from './ProjectsWheelMenu';

/* =====================================================
   SECTION 01 - TYPES
===================================================== */

interface Props {
  onNavigate: (view: ViewType) => void;
  userRole: AppRole;
  onProjectContextChange: (context: {
    projectName: string | null;
    moduleLabel: string | null;
  }) => void;
}

type ProjectStatus = 'active' | 'archived' | 'deleted';

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
  status?: ProjectStatus;
  archived_at?: string | null;
  deleted_at?: string | null;
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
  project_id?: number | null;
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

type ProjectChatMessageLite = {
  id: number;
  project_id: number;
  group_id: number;
  user_id: number;
  display_name: string;
  message: string;
  message_type: 'text' | 'image';
  attachment_url?: string | null;
  created_at: string;
  profile_image_url?: string;
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
    | 'pos';
}

type WheelMode = 'project-select' | 'actions' | 'chat-groups';
type InlineProjectModule = null | 'tasks';

/* =====================================================
   SECTION 02 - STATIC CONFIG
===================================================== */

const actionWheelItems: WheelItem[] = [
  { label: 'Kalender', view: 'calendar', actionKey: 'calendar' },
  { label: 'Aufgaben', view: 'tasks', actionKey: 'tasks' },
  { label: 'Umfragen', view: 'polls', actionKey: 'polls' },
  { label: 'Rechnungen', view: 'project-invoices', actionKey: 'invoices' },
  { label: 'Einkaufsliste', view: 'project-shopping', actionKey: 'shopping' },
  { label: 'Kernteam', view: 'project-coreteam' as ViewType, actionKey: 'coreteam' },
  { label: 'Projekt Chat', actionKey: 'chatlog' },
  { label: 'Boniersystem', view: 'pos', actionKey: 'pos' }
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

/* =====================================================
   SECTION 03 - STORAGE KEYS
===================================================== */

const LS_ACTIVE_PROJECT = 'gug_active_project';
const LS_ACTIVE_PROJECT_NAME = 'gug_active_project_name';
const LS_PROJECTS_WHEEL_MODE = 'gug_projects_wheel_mode';
const LS_PROJECTS_PAGE = 'gug_projects_page';
const LS_PROJECT_CHAT_GROUP_ID = 'gug_active_project_chat_group';
const LS_PROJECT_CHAT_GROUP_PAGE = 'gug_project_chat_group_page';
const LS_PROJECT_CHAT_OPEN_GROUP_ID = 'gug_open_project_chat_group';

/* =====================================================
   SECTION 04 - HELPERS
===================================================== */

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

const getStoredOpenChatGroupId = (): number | null => {
  const raw = localStorage.getItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* =====================================================
   SECTION 05 - COMPONENT
===================================================== */

const ProjectsView: React.FC<Props> = ({
  onNavigate,
  userRole,
  onProjectContextChange
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingChatGroups, setLoadingChatGroups] = useState(false);
  const [loadingInlineChat, setLoadingInlineChat] = useState(false);
  const [loadingInlineTasks, setLoadingInlineTasks] = useState(false);
  const [sendingInlineChat, setSendingInlineChat] = useState(false);
  const [uploadingInlineChatImage, setUploadingInlineChatImage] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [changingProjectStatus, setChangingProjectStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectStatus>('active');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => getStoredProjectId());

  const [chatGroups, setChatGroups] = useState<ProjectChatGroupLite[]>([]);
  const [selectedChatGroupId, setSelectedChatGroupId] = useState<number | null>(() => getStoredChatGroupId());
  const [openChatGroupId, setOpenChatGroupId] = useState<number | null>(() => getStoredOpenChatGroupId());
  const [inlineChatMessages, setInlineChatMessages] = useState<ProjectChatMessageLite[]>([]);
  const [inlineChatMessage, setInlineChatMessage] = useState('');

  const [activeInlineModule, setActiveInlineModule] = useState<InlineProjectModule>(null);
  const [inlineTasks, setInlineTasks] = useState<TaskLite[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [events, setEvents] = useState<CalendarEventLite[]>([]);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [polls, setPolls] = useState<PollLite[]>([]);

  const [assignType, setAssignType] = useState<LinkType>('event');
  const [assignId, setAssignId] = useState<string>('');

  const [wheelMode, setWheelMode] = useState<WheelMode>(() => getStoredWheelMode());
  const [projectPage, setProjectPage] = useState<number>(() => getStoredProjectPage());
  const [chatGroupPage, setChatGroupPage] = useState<number>(() => getStoredChatGroupPage());

  const loadedOnce = useRef(false);
  const hasStartedInitialWheelAnimation = useRef(false);
  const [wheelAnimationTick, setWheelAnimationTick] = useState(0);

  const isSuperAdmin = userRole === AppRole.SUPERADMIN;
/* =====================================================
   SECTION 06 - MEMOS
  ===================================================== */

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => Number(p.id) === Number(selectedProjectId)) || null;
  }, [projects, selectedProjectId]);

  const sortedChatGroups = useMemo(() => {
    const list = [...chatGroups];
    list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    return list;
  }, [chatGroups]);

  const openChatGroup = useMemo(() => {
    if (!openChatGroupId) return null;
    return sortedChatGroups.find((group) => Number(group.id) === Number(openChatGroupId)) || null;
  }, [sortedChatGroups, openChatGroupId]);

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

  const sortedInlineTasks = useMemo(() => {
    const list = [...inlineTasks];

    list.sort((a, b) => {
      const da = safeDate(a.deadline_date);
      const db = safeDate(b.deadline_date);

      if (da && db) {
        const diff = da.getTime() - db.getTime();
        if (diff !== 0) return diff;
      }

      if (da && !db) return -1;
      if (!da && db) return 1;

      return Number(b.id) - Number(a.id);
    });

    return list;
  }, [inlineTasks]);

  const projectPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sortedProjects.length / PROJECT_PAGE_SIZE));
  }, [sortedProjects]);

  const chatGroupPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sortedChatGroups.length / CHAT_GROUP_PAGE_SIZE));
  }, [sortedChatGroups]);

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
    if (wheelMode === 'project-select') {
      return 'Projektauswahl';
    }
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
/* =====================================================
     SECTION 07 - CONTEXT EFFECTS
  ===================================================== */

  useEffect(() => {
    if (wheelMode === 'project-select') {
      onProjectContextChange({
        projectName: null,
        moduleLabel: null
      });
      return;
    }

    if (selectedProject) {
      const projectName = selectedProject.title?.trim() || `Projekt #${selectedProject.id}`;
      const moduleLabel = activeInlineModule === 'tasks' ? 'Aufgaben' : null;

      onProjectContextChange({
        projectName,
        moduleLabel
      });
      return;
    }

    onProjectContextChange({
      projectName: null,
      moduleLabel: null
    });
  }, [wheelMode, selectedProject, activeInlineModule, onProjectContextChange]);
  /* =====================================================
     SECTION 08 - STORAGE EFFECTS
  ===================================================== */

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem(LS_ACTIVE_PROJECT, String(selectedProjectId));
    } else {
      localStorage.removeItem(LS_ACTIVE_PROJECT);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProject?.title?.trim()) {
      localStorage.setItem(LS_ACTIVE_PROJECT_NAME, selectedProject.title.trim());
    } else if (!selectedProjectId) {
      localStorage.removeItem(LS_ACTIVE_PROJECT_NAME);
    }
  }, [selectedProject, selectedProjectId]);

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

  useEffect(() => {
    if (openChatGroupId) {
      localStorage.setItem(LS_PROJECT_CHAT_OPEN_GROUP_ID, String(openChatGroupId));
    } else {
      localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
    }
  }, [openChatGroupId]);

  /* =====================================================
     SECTION 09 - PAGING EFFECTS
  ===================================================== */

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

/* =====================================================
     SECTION 10 - LOADERS
  ===================================================== */

  const triggerWheelAnimation = () => {
    setWheelAnimationTick((prev) => prev + 1);
  };

  const loadProjects = async (status: ProjectStatus = projectStatusFilter) => {
    setError(null);
    setLoading(true);

    try {
      const data = await api.getProjects(() => {}, status);
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
        setOpenChatGroupId(null);
        setInlineChatMessages([]);
        setActiveInlineModule(null);
        setInlineTasks([]);
        localStorage.removeItem(LS_ACTIVE_PROJECT);
        localStorage.removeItem(LS_ACTIVE_PROJECT_NAME);
        localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
        localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
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
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
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
      const storedOpenChatGroupId = getStoredOpenChatGroupId();

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

      if (storedOpenChatGroupId && list.some((g) => Number(g.id) === Number(storedOpenChatGroupId))) {
        setOpenChatGroupId(storedOpenChatGroupId);
      } else {
        setOpenChatGroupId(null);
        setInlineChatMessages([]);
        localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
      }
    } catch {
      setChatGroups([]);
      setSelectedChatGroupId(null);
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
      localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
    } finally {
      setLoadingChatGroups(false);
    }
  };

  const loadInlineChatMessages = async (groupId: number) => {
    if (!selectedProjectId) return;

    setLoadingInlineChat(true);

    try {
      const data = await api.getProjectChatMessages(
        {
          project_id: selectedProjectId,
          group_id: groupId,
          limit: 50
        },
        undefined as any
      );

      setInlineChatMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setInlineChatMessages([]);
      setError(e?.message || 'Projekt-Chat konnte nicht geladen werden.');
    } finally {
      setLoadingInlineChat(false);
    }
  };

  const loadInlineTasks = async (projectId: number) => {
    if (!projectId) {
      setInlineTasks([]);
      return;
    }

    setLoadingInlineTasks(true);

    try {
      const data = await api
        .apiRequest<TaskLite[]>(`/gug/v1/tasks?project_id=${projectId}`, {}, undefined)
        .catch(() => api.apiRequest<TaskLite[]>('/gug/v1/tasks', {}, undefined))
        .catch(() => []);

      const list = Array.isArray(data)
        ? data.map((task: any) => ({
            ...task,
            id: Number(task.id),
            project_id:
              task?.project_id !== undefined && task?.project_id !== null
                ? Number(task.project_id)
                : null
          }))
        : [];

      const hasProjectIds = list.some(
        (task) => typeof task.project_id === 'number' && Number(task.project_id) > 0
      );

      const filtered = hasProjectIds
        ? list.filter((task) => Number(task.project_id) === Number(projectId))
        : list;

      setInlineTasks(filtered);
    } catch (e: any) {
      setInlineTasks([]);
      setError(e?.message || 'Aufgaben konnten nicht geladen werden.');
    } finally {
      setLoadingInlineTasks(false);
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
/* =====================================================
     SECTION 11 - LOAD EFFECTS
  ===================================================== */

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    loadProjects(projectStatusFilter);
    loadAssignableData();
  }, []);

  useEffect(() => {
    loadProjects(projectStatusFilter);
  }, [projectStatusFilter]);

  useEffect(() => {
    if (!selectedProjectId) {
      setChatGroups([]);
      setSelectedChatGroupId(null);
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      setActiveInlineModule(null);
      setInlineTasks([]);
      return;
    }

    if (projectStatusFilter !== 'active') {
      setChatGroups([]);
      setSelectedChatGroupId(null);
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      setActiveInlineModule(null);
      setInlineTasks([]);
      return;
    }

    loadChatGroups(selectedProjectId);
  }, [selectedProjectId, projectStatusFilter]);

  useEffect(() => {
    if (wheelMode !== 'chat-groups') return;
    if (!openChatGroupId) {
      setInlineChatMessages([]);
      return;
    }
    loadInlineChatMessages(openChatGroupId);
  }, [wheelMode, openChatGroupId, selectedProjectId]);

  useEffect(() => {
    if (wheelMode !== 'chat-groups') return;
    if (!openChatGroupId || !selectedProjectId) return;

    const interval = setInterval(() => {
      loadInlineChatMessages(openChatGroupId);
    }, 5000);

    return () => clearInterval(interval);
  }, [wheelMode, openChatGroupId, selectedProjectId]);

  useEffect(() => {
    if (wheelMode !== 'actions') {
      setActiveInlineModule(null);
      setInlineTasks([]);
    }
  }, [wheelMode]);

  useEffect(() => {
    if (activeInlineModule !== 'tasks') return;
    if (!selectedProjectId || projectStatusFilter !== 'active') {
      setActiveInlineModule(null);
      setInlineTasks([]);
      return;
    }

    loadInlineTasks(selectedProjectId);
  }, [activeInlineModule, selectedProjectId, projectStatusFilter]);

  useEffect(() => {
    setAssignId('');
    setAssignResult(null);
  }, [assignType, selectedProjectId]);
  /* =====================================================
     SECTION 12 - WHEEL ACTIONS
  ===================================================== */

  const handleCenterClick = () => {
    if (wheelMode === 'project-select') {
      if (selectedProjectId && projectStatusFilter === 'active') {
        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
        setWheelMode('actions');
      }
      return;
    }

    if (wheelMode === 'chat-groups') {
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
      setWheelMode('actions');
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      setActiveInlineModule(null);
      setInlineTasks([]);
      localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
      triggerWheelAnimation();
      return;
    }

    localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
    setWheelMode('project-select');
    setOpenChatGroupId(null);
    setInlineChatMessages([]);
    setActiveInlineModule(null);
    setInlineTasks([]);
    localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
    triggerWheelAnimation();
  };

  const handleWheelClick = (item: ProjectsWheelDisplayItem) => {
    if (wheelMode === 'project-select') {
      if (item.slotType === 'project' && item.projectId) {
        const nextId = Number(item.projectId);
        const clickedProject =
          projects.find((project) => Number(project.id) === nextId) || null;
        const clickedProjectName =
          clickedProject?.title?.trim() || `Projekt #${nextId}`;

        localStorage.setItem(LS_ACTIVE_PROJECT, String(nextId));
        localStorage.setItem(LS_ACTIVE_PROJECT_NAME, clickedProjectName);
        setSelectedProjectId(nextId);
        setActiveInlineModule(null);
        setInlineTasks([]);

        if (projectStatusFilter === 'active') {
          localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
          setWheelMode('actions');
        } else {
          localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
          setWheelMode('project-select');
        }

        setOpenChatGroupId(null);
        setInlineChatMessages([]);
        localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
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
        localStorage.setItem(LS_PROJECT_CHAT_OPEN_GROUP_ID, String(nextGroupId));
        setSelectedChatGroupId(nextGroupId);
        setOpenChatGroupId(nextGroupId);
        setInlineChatMessage('');
        loadInlineChatMessages(nextGroupId);
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
    if (projectStatusFilter !== 'active') return;

    localStorage.setItem(LS_ACTIVE_PROJECT, String(selectedProjectId));
    if (selectedProject?.title?.trim()) {
      localStorage.setItem(LS_ACTIVE_PROJECT_NAME, selectedProject.title.trim());
    }
    localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');

    if (item.actionKey === 'tasks') {
      setActiveInlineModule('tasks');
      loadInlineTasks(selectedProjectId);
      return;
    }

    setActiveInlineModule(null);
    setInlineTasks([]);

    if (item.actionKey === 'chatlog') {
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'chat-groups');
      setWheelMode('chat-groups');
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
      triggerWheelAnimation();
      return;
    }

    if (item.actionKey === 'coreteam') {
      onNavigate('project-coreteam' as ViewType);
      return;
    }

    if (item.view) onNavigate(item.view);
  };

  /* =====================================================
     SECTION 13 - PROJECT ACTIONS
  ===================================================== */

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
      const res = await api.createProject(
        {
          title,
          description
        },
        undefined as any
      );

      const rawNewId = res?.id ?? res?.project_id;
      const newId = rawNewId ? Number(rawNewId) : undefined;

      setNewTitle('');
      setNewDescription('');

      await loadProjects('active');
      setProjectStatusFilter('active');

      if (newId && Number.isFinite(newId)) {
        const refreshedProjects = await api.getProjects(() => {}, 'active').catch(() => []);

        const normalizedProjects = Array.isArray(refreshedProjects)
          ? refreshedProjects.map((p) => ({
              ...p,
              id: Number(p.id)
            }))
          : [];

        setProjects(normalizedProjects);
        setSelectedProjectId(newId);
        setSelectedChatGroupId(null);
        setOpenChatGroupId(null);
        setChatGroups([]);
        setInlineChatMessages([]);
        localStorage.setItem(LS_ACTIVE_PROJECT, String(newId));

        const createdProject =
          normalizedProjects.find((project) => project.id === newId) || null;
        const createdProjectName =
          createdProject?.title?.trim() || `Projekt #${newId}`;

        localStorage.setItem(LS_ACTIVE_PROJECT_NAME, createdProjectName);
        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
        localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
        localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);

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

  const handleArchiveProject = async () => {
    if (!selectedProjectId || !isSuperAdmin) return;

    setChangingProjectStatus(true);
    setError(null);

    try {
      await api.archiveProject(selectedProjectId, undefined as any);
      setWheelMode('project-select');
      setSelectedProjectId(null);
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      localStorage.removeItem(LS_ACTIVE_PROJECT);
      localStorage.removeItem(LS_ACTIVE_PROJECT_NAME);
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
      await loadProjects(projectStatusFilter);
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht archiviert werden.');
    } finally {
      setChangingProjectStatus(false);
    }
  };

  const handleRestoreProject = async () => {
    if (!selectedProjectId || !isSuperAdmin) return;

    setChangingProjectStatus(true);
    setError(null);

    try {
      await api.restoreProject(selectedProjectId, undefined as any);
      setWheelMode('project-select');
      setSelectedProjectId(null);
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      localStorage.removeItem(LS_ACTIVE_PROJECT);
      localStorage.removeItem(LS_ACTIVE_PROJECT_NAME);
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
      await loadProjects(projectStatusFilter);
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht dearchiviert werden.');
    } finally {
      setChangingProjectStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId || !isSuperAdmin) return;

    const confirmed = window.confirm('Projekt wirklich löschen? Das Projekt wird in den Status "deleted" gesetzt.');
    if (!confirmed) return;

    setChangingProjectStatus(true);
    setError(null);

    try {
      await api.deleteProject(selectedProjectId, undefined as any);
      setWheelMode('project-select');
      setSelectedProjectId(null);
      setOpenChatGroupId(null);
      setInlineChatMessages([]);
      localStorage.removeItem(LS_ACTIVE_PROJECT);
      localStorage.removeItem(LS_ACTIVE_PROJECT_NAME);
      localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
      await loadProjects(projectStatusFilter);
    } catch (e: any) {
      setError(e?.message || 'Projekt konnte nicht gelöscht werden.');
    } finally {
      setChangingProjectStatus(false);
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

  /* =====================================================
     SECTION 14 - INLINE CHAT ACTIONS
  ===================================================== */

  const handleSendInlineChatMessage = async () => {
    const message = inlineChatMessage.trim();

    if (!selectedProjectId || !openChatGroupId || !message) return;

    setSendingInlineChat(true);
    setError(null);

    try {
      await api.sendProjectChatMessage(
        {
          project_id: selectedProjectId,
          group_id: openChatGroupId,
          message,
          message_type: 'text'
        },
        undefined as any
      );

      setInlineChatMessage('');
      await loadInlineChatMessages(openChatGroupId);
    } catch (e: any) {
      setError(e?.message || 'Nachricht konnte nicht gesendet werden.');
    } finally {
      setSendingInlineChat(false);
    }
  };

  const handleUploadInlineChatImage = async (file: File) => {
    if (!selectedProjectId || !openChatGroupId) return;

    setUploadingInlineChatImage(true);
    setError(null);

    try {
      await api.uploadProjectChatImage(
        {
          project_id: selectedProjectId,
          group_id: openChatGroupId,
          file,
          message: inlineChatMessage.trim()
        },
        undefined as any
      );

      setInlineChatMessage('');
      await loadInlineChatMessages(openChatGroupId);
    } catch (e: any) {
      setError(e?.message || 'Bild konnte nicht hochgeladen werden.');
    } finally {
      setUploadingInlineChatImage(false);
    }
  };

  /* =====================================================
     SECTION 15 - RENDER CHAT WINDOW
  ===================================================== */

  const renderInlineChatWindow = () => {
    if (wheelMode !== 'chat-groups' || !openChatGroup) return null;

    return (
      <div className="app-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Chat: {openChatGroup.name}</h2>
            <div className="text-xs text-slate-500 dark:text-white/60 mt-1">
              Projekt: {selectedProject?.title || `Projekt #${selectedProjectId}`} · Schreiben: {openChatGroup.can_write ? 'ja' : 'nein'} · Bilder: {openChatGroup.can_upload_images ? 'ja' : 'nein'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openChatGroupId && loadInlineChatMessages(openChatGroupId)}
            disabled={loadingInlineChat}
            className="btn-secondary"
          >
            {loadingInlineChat ? '...' : 'Chat laden'}
          </button>
        </div>

        <div className="h-[420px] overflow-y-auto rounded-xl bg-slate-50 dark:bg-[#121212] p-4 space-y-3">
          {inlineChatMessages.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-white/60">
              Noch keine Nachrichten vorhanden.
            </div>
          ) : (
            inlineChatMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1E1E1E]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#B5A47A] flex-shrink-0">
                    {message.profile_image_url ? (
                      <img
                        src={message.profile_image_url}
                        alt={message.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {message.display_name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-white/40">
                      {new Date(message.created_at).toLocaleString('de-AT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {message.message_type === 'image' && message.attachment_url && (
                  <div className="mb-2">
                    <img
                      src={message.attachment_url}
                      alt="Chat Bild"
                      className="max-w-full rounded-xl border border-black/10 dark:border-white/10"
                    />
                  </div>
                )}

                {message.message && (
                  <div className="text-sm whitespace-pre-wrap break-words text-slate-900 dark:text-white">
                    {message.message}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="form-input flex-1"
              value={inlineChatMessage}
              onChange={(e) => setInlineChatMessage(e.target.value)}
              placeholder="Nachricht schreiben oder Bildtext ergänzen..."
              disabled={sendingInlineChat || uploadingInlineChatImage}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendInlineChatMessage();
                }
              }}
            />

            <button
              type="button"
              onClick={handleSendInlineChatMessage}
              disabled={sendingInlineChat || uploadingInlineChatImage || !inlineChatMessage.trim()}
              className="btn-primary"
            >
              {sendingInlineChat ? '...' : 'Senden'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-secondary cursor-pointer">
              {uploadingInlineChatImage ? 'Upload läuft...' : 'Bild auswählen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingInlineChatImage || sendingInlineChat}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleUploadInlineChatImage(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <label className="btn-secondary cursor-pointer">
              Kamera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={uploadingInlineChatImage || sendingInlineChat}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleUploadInlineChatImage(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <div className="text-xs text-slate-500 dark:text-white/60">
              Bild aus Galerie oder direkt mit Handy-Kamera hochladen.
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     SECTION 16 - RENDER CHAT GROUP LIST
  ===================================================== */

  const renderChatGroups = () => {
    if (wheelMode !== 'chat-groups') return null;

    return (
      <div className="app-card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">Projekt Chat Gruppen</h2>
            <div className="text-xs text-slate-500 dark:text-white/50 mt-1">
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
          <div className="text-sm text-slate-500 dark:text-white/50">
            Keine Chat-Gruppen vorhanden. Lege zuerst im Projekt-Chat eine Gruppe an.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedChatGroups.map((group) => {
              const isSelected = group.id === selectedChatGroupId;
              const isOpen = group.id === openChatGroupId;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setSelectedChatGroupId(group.id);
                    localStorage.setItem(LS_PROJECT_CHAT_GROUP_ID, String(group.id));
                    localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
                    setOpenChatGroupId(null);
                    setInlineChatMessages([]);
                    onNavigate('project-chat');
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#B5A47A] border-[#B5A47A] text-[#1A1A1A] shadow-lg shadow-[#B5A47A]/20'
                      : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 dark:bg-[#121212] dark:border-white/10 dark:text-white dark:hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div
                        className={`font-black ${
                          isSelected ? 'text-[#1A1A1A]' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {group.name}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isSelected ? 'text-[#1A1A1A]/70' : 'text-slate-500 dark:text-white/50'
                        }`}
                      >
                        Schreiben: {group.can_write ? 'ja' : 'nein'} · Bilder: {group.can_upload_images ? 'ja' : 'nein'}
                      </div>
                    </div>

                    <div
                      className={`text-xs font-black uppercase tracking-widest whitespace-nowrap ${
                        isOpen
                          ? isSelected
                            ? 'text-[#1A1A1A]/70'
                            : 'text-[#B5A47A]'
                          : isSelected
                            ? 'text-[#1A1A1A]/70'
                            : 'text-slate-600 dark:text-white/40'
                      }`}
                    >
                      Verwalten
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

 /* =====================================================
     SECTION 17 - RENDER DEFAULT PROJECT BLOCKS
  ===================================================== */

  const renderInlineTasksPanel = () => {
    if (wheelMode !== 'actions') return null;
    if (activeInlineModule !== 'tasks') return null;
    if (!selectedProjectId || projectStatusFilter !== 'active') return null;

    return (
      <div className="app-card space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-black">Aufgaben</h2>
            <div className="text-xs text-white/50 mt-1">
              Projekt: {selectedProject?.title?.trim() || `Projekt #${selectedProjectId}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadInlineTasks(selectedProjectId)}
              disabled={loadingInlineTasks}
            >
              {loadingInlineTasks ? '...' : 'Aktualisieren'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setActiveInlineModule(null);
                setInlineTasks([]);
              }}
            >
              Schließen
            </button>
          </div>
        </div>

        {loadingInlineTasks ? (
          <div className="text-sm text-white/60">Aufgaben werden geladen...</div>
        ) : sortedInlineTasks.length === 0 ? (
          <div className="text-sm text-white/50">
            Keine Aufgaben für dieses Projekt vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedInlineTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-black text-white">
                      {task.title || `Aufgabe #${task.id}`}
                    </div>

                    <div className="text-xs mt-2 text-white/45 uppercase tracking-widest font-black">
                      Status: {task.status || 'offen'}
                    </div>
                  </div>

                  <div className="text-xs font-black uppercase tracking-widest whitespace-nowrap text-white/35">
                    {task.deadline_date ? formatDate(task.deadline_date) : 'ohne Datum'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectAdminActions = () => {
    if (!isSuperAdmin || !selectedProject) return null;

    return (
      <div className="app-card space-y-4">
        <h2 className="text-lg font-black">Projektstatus</h2>

        <div className="text-sm text-white/70">
          Aktueller Status:{' '}
          <span className="font-black uppercase">
            {selectedProject.status || 'active'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedProject.status === 'active' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleArchiveProject}
              disabled={changingProjectStatus}
            >
              {changingProjectStatus ? '...' : 'Archivieren'}
            </button>
          )}

          {selectedProject.status === 'archived' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRestoreProject}
              disabled={changingProjectStatus}
            >
              {changingProjectStatus ? '...' : 'Dearchivieren'}
            </button>
          )}

          {selectedProject.status !== 'deleted' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDeleteProject}
              disabled={changingProjectStatus}
            >
              {changingProjectStatus ? '...' : 'Löschen'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDefaultProjectBlocks = () => {
    if (wheelMode === 'chat-groups') return null;

    return (
      <>
        <div className="app-card space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-black">Projektfilter</h2>

            <select
              className="form-input w-full sm:w-auto"
              value={projectStatusFilter}
              onChange={(e) => {
                const next = e.target.value as ProjectStatus;
                setProjectStatusFilter(next);
                setWheelMode('project-select');
                setSelectedProjectId(null);
                setOpenChatGroupId(null);
                setInlineChatMessages([]);
                setActiveInlineModule(null);
                setInlineTasks([]);
                localStorage.removeItem(LS_ACTIVE_PROJECT);
                localStorage.removeItem(LS_ACTIVE_PROJECT_NAME);
                localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
                localStorage.setItem(LS_PROJECTS_PAGE, '0');
                setProjectPage(0);
                triggerWheelAnimation();
              }}
            >
              <option value="active">Aktive Projekte</option>
              <option value="archived">Archivierte Projekte</option>
              {isSuperAdmin && <option value="deleted">Gelöschte Projekte</option>}
            </select>
          </div>
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

        {projectStatusFilter === 'active' && (
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
        )}

        {renderProjectAdminActions()}

        <div className="app-card space-y-4">
          <h2 className="text-lg font-black">
            {projectStatusFilter === 'active' && 'Projektliste'}
            {projectStatusFilter === 'archived' && 'Archivierte Projekte'}
            {projectStatusFilter === 'deleted' && 'Gelöschte Projekte'}
          </h2>

          {sortedProjects.length === 0 ? (
            <div className="text-sm text-white/50">
              Keine Projekte in diesem Bereich vorhanden.
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
                      const nextProjectName = p.title?.trim() || `Projekt #${nextId}`;

                      localStorage.setItem(LS_ACTIVE_PROJECT, String(nextId));
                      localStorage.setItem(LS_ACTIVE_PROJECT_NAME, nextProjectName);
                      localStorage.removeItem(LS_PROJECT_CHAT_GROUP_ID);
                      localStorage.removeItem(LS_PROJECT_CHAT_OPEN_GROUP_ID);
                      setSelectedProjectId(nextId);
                      setSelectedChatGroupId(null);
                      setOpenChatGroupId(null);
                      setInlineChatMessages([]);
                      setActiveInlineModule(null);
                      setInlineTasks([]);

                      if (projectStatusFilter === 'active') {
                        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'actions');
                        setWheelMode('actions');
                      } else {
                        localStorage.setItem(LS_PROJECTS_WHEEL_MODE, 'project-select');
                        setWheelMode('project-select');
                      }

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
                        <div
                          className={`text-[10px] mt-2 uppercase tracking-widest font-black ${
                            isActive ? 'text-[#1A1A1A]/70' : 'text-white/30'
                          }`}
                        >
                          Status: {p.status || 'active'}
                        </div>
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
      </>
    );
  };
 /* =====================================================
     SECTION 18 - RENDER
  ===================================================== */

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="pt-1">
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
      </div>

      {renderInlineTasksPanel()}
      {renderInlineChatWindow()}
      {renderChatGroups()}
      {renderDefaultProjectBlocks()}
    </div>
  );
};

export default ProjectsView;
