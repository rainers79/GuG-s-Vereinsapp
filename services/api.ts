// services/api.ts 

import {
  AppRole,
  User,
  Poll,
  WPUserResponse,
  ApiError,
  VoteResponse,
  RegistrationData,
  CalendarEvent,
  PosArticle,
  PosOrder,
  PosDailyReport,
  Task,
  ProjectChatGroup,
  ProjectChatGroupMember,
  ProjectChatPermission,
  ProjectChatMessage,
  ProjectCoreTeamMember
} from '../types';


/* =====================================================
   CONFIG
===================================================== */

const API_BASE = 'https://api.gug-verein.at/wp-json';
const TOKEN_KEY = 'gug_token';
const USER_KEY = 'gug_user_data';

/* =====================================================
   ROLE MAPPING
===================================================== */

const mapWPRoleToAppRole = (wpRoles: any = []): AppRole => {
  const roles = Array.isArray(wpRoles) ? wpRoles : [];
  if (roles.includes('administrator')) return AppRole.SUPERADMIN;
  if (roles.includes('vorstand')) return AppRole.VORSTAND;
  return AppRole.USER;
};

/* =====================================================
   TOKEN HANDLING
===================================================== */

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

/* =====================================================
   CORE REQUEST
===================================================== */

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  onUnauthorized?: () => void
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      if (!endpoint.includes('jwt-auth')) {
        clearToken();
        if (onUnauthorized) onUnauthorized();
      }

      const errData = await response.json().catch(() => ({}));
      throw {
        message: errData.message || 'Sitzung abgelaufen.',
        status: response.status
      } as ApiError;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 404) {
        throw {
          message: 'Diese Funktion (API Route) ist aktuell nicht verfügbar.',
          status: 404
        } as ApiError;
      }

      throw {
        message: errorData.message || `Fehler ${response.status}`,
        status: response.status
      } as ApiError;
    }

    return await response.json();
  } catch (error: any) {
    if (error?.status) throw error;
    throw { message: 'Netzwerkfehler. Bitte Verbindung prüfen.' } as ApiError;
  }
}

/* =====================================================
   AUTH
===================================================== */

export async function login(username: string, password: string): Promise<User> {
  const data = await apiRequest<WPUserResponse>('/jwt-auth/v1/token', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  setToken(data.token);
  const user = await getCurrentUser(() => {});
  return user;
}

export async function register(regData: RegistrationData): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>('/gug/v1/register', {
    method: 'POST',
    body: JSON.stringify(regData)
  });
}

export async function verifyEmail(uid: number, token: string): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>(
    `/gug/v1/verify-email?uid=${uid}&token=${encodeURIComponent(token)}`,
    { method: 'GET' }
  );
}

export async function getCurrentUser(onUnauthorized: () => void): Promise<User> {
  const wpUser = await apiRequest<any>('/gug/v1/me', {}, onUnauthorized);

  const user: User = {
    id: wpUser.id || 0,
    email: wpUser.user_email || wpUser.email || '',
    displayName: wpUser.display_name || wpUser.name || 'Mitglied',
    username: wpUser.user_login || wpUser.username || '',
    role: mapWPRoleToAppRole(wpUser.roles)
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/* =====================================================
   CHAT
===================================================== */

export interface ChatMessage {
  id: number;
  user_id: number;
  display_name: string;
  message: string;
  created_at: string;
  profile_image_url?: string;
}

export async function getChatMessages(
  onUnauthorized: () => void
): Promise<ChatMessage[]> {
  return await apiRequest<ChatMessage[]>(
    '/gug/v1/chat',
    {},
    onUnauthorized
  );
}

/* =====================================================
   ÄLTERE CHAT NACHRICHTEN LADEN
===================================================== */

export async function getChatMessagesBefore(
  beforeId: number,
  onUnauthorized: () => void
): Promise<ChatMessage[]> {
  return await apiRequest<ChatMessage[]>(
    `/gug/v1/chat?before=${beforeId}`,
    {},
    onUnauthorized
  );
}

/* =====================================================
   SEND CHAT MESSAGE
===================================================== */

export async function sendChatMessage(
  message: string,
  onUnauthorized: () => void
): Promise<{ success: boolean }> {
  return await apiRequest<{ success: boolean }>(
    '/gug/v1/chat',
    {
      method: 'POST',
      body: JSON.stringify({ message })
    },
    onUnauthorized
  );
}

/* =====================================================
   PROJECT CHAT
===================================================== */

export async function getProjectChatGroups(
  projectId: number,
  onUnauthorized: () => void
): Promise<ProjectChatGroup[]> {
  return await apiRequest<ProjectChatGroup[]>(
    `/gug/v1/project-chat/groups?project_id=${encodeURIComponent(String(projectId))}`,
    {},
    onUnauthorized
  );
}

export async function createProjectChatGroup(
  payload: {
    project_id: number;
    name: string;
    can_write?: boolean;
    can_upload_images?: boolean;
  },
  onUnauthorized: () => void
): Promise<{ success: boolean; id: number }> {
  return await apiRequest<{ success: boolean; id: number }>(
    '/gug/v1/project-chat/groups',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function updateProjectChatGroup(
  groupId: number,
  payload: Partial<{
    project_id: number;
    name: string;
    can_write: boolean;
    can_upload_images: boolean;
  }>,
  onUnauthorized: () => void
): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>(
    `/gug/v1/project-chat/groups/${groupId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function getProjectChatGroupMembers(
  groupId: number,
  onUnauthorized: () => void
): Promise<ProjectChatGroupMember[]> {
  return await apiRequest<ProjectChatGroupMember[]>(
    `/gug/v1/project-chat/group-members?group_id=${encodeURIComponent(String(groupId))}`,
    {},
    onUnauthorized
  );
}

export async function saveProjectChatGroupMembers(
  payload: {
    group_id: number;
    members: number[];
  },
  onUnauthorized: () => void
): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>(
    '/gug/v1/project-chat/group-members',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function getProjectChatPermissions(
  groupId: number,
  onUnauthorized: () => void
): Promise<ProjectChatPermission[]> {
  return await apiRequest<ProjectChatPermission[]>(
    `/gug/v1/project-chat/permissions?group_id=${encodeURIComponent(String(groupId))}`,
    {},
    onUnauthorized
  );
}

export async function saveProjectChatPermission(
  payload: {
    group_id: number;
    user_id: number;
    can_write_override?: boolean | null;
    can_upload_images_override?: boolean | null;
  },
  onUnauthorized: () => void
): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>(
    '/gug/v1/project-chat/permissions',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function getProjectChatMessages(
  params: {
    project_id: number;
    group_id: number;
    before?: number;
    limit?: number;
  },
  onUnauthorized: () => void
): Promise<ProjectChatMessage[]> {
  const q: string[] = [
    `project_id=${encodeURIComponent(String(params.project_id))}`,
    `group_id=${encodeURIComponent(String(params.group_id))}`
  ];

  if (params.before && params.before > 0) {
    q.push(`before=${encodeURIComponent(String(params.before))}`);
  }

  if (params.limit && params.limit > 0) {
    q.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }

  return await apiRequest<ProjectChatMessage[]>(
    `/gug/v1/project-chat/messages?${q.join('&')}`,
    {},
    onUnauthorized
  );
}

export async function sendProjectChatMessage(
  payload: {
    project_id: number;
    group_id: number;
    message: string;
    message_type?: 'text' | 'image';
  },
  onUnauthorized: () => void
): Promise<{ success: boolean; id: number }> {
  return await apiRequest<{ success: boolean; id: number }>(
    '/gug/v1/project-chat/messages',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function uploadProjectChatImage(
  payload: {
    project_id: number;
    group_id: number;
    file: File;
    message?: string;
  },
  onUnauthorized: () => void
): Promise<{
  success: boolean;
  id: number;
  attachment_id: number;
  attachment_url: string;
}> {
  const formData = new FormData();
  formData.append('project_id', String(payload.project_id));
  formData.append('group_id', String(payload.group_id));
  formData.append('file', payload.file);

  if (payload.message && payload.message.trim()) {
    formData.append('message', payload.message.trim());
  }

  return await apiRequest<{
    success: boolean;
    id: number;
    attachment_id: number;
    attachment_url: string;
  }>(
    '/gug/v1/project-chat/upload',
    {
      method: 'POST',
      body: formData
    },
    onUnauthorized
  );
}

/* =====================================================
   PROJECT CORETEAM
===================================================== */
export async function getProjectCoreTeamMembers(
  projectId: number,
  onU

/* =====================================================
   POLLS
===================================================== */

export async function getPolls(
  onUnauthorized: () => void
): Promise<Poll[]> {
  const projectId = localStorage.getItem('gug_active_project');

  let endpoint = '/gug/v1/polls';

  if (projectId) {
    endpoint += '?project_id=' + projectId;
  }

  return await apiRequest<Poll[]>(
    endpoint,
    {},
    onUnauthorized
  );
}

export async function createPoll(payload: any, onUnauth: () => void): Promise<Poll> {
  return await apiRequest<Poll>(
    '/gug/v1/polls',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauth
  );
}

export async function deletePoll(pollId: number, onUnauth: () => void): Promise<any> {
  return await apiRequest<any>(
    `/gug/v1/polls/${pollId}`,
    { method: 'DELETE' },
    onUnauth
  );
}

export async function votePoll(pollId: number, optionIds: string[], onUnauth: () => void): Promise<VoteResponse> {
  return await apiRequest<VoteResponse>(
    `/gug/v1/polls/${pollId}/vote`,
    {
      method: 'POST',
      body: JSON.stringify({ option_ids: optionIds })
    },
    onUnauth
  );
}

/* =====================================================
   EVENTS
===================================================== */

export async function getEvents(onUnauthorized: () => void): Promise<CalendarEvent[]> {
  return await apiRequest<CalendarEvent[]>('/gug/v1/events', {}, onUnauthorized)
    .catch(() => []);
}

export async function createEvent(event: Partial<CalendarEvent>, onUnauth: () => void): Promise<CalendarEvent> {
  return await apiRequest<CalendarEvent>(
    '/gug/v1/events',
    {
      method: 'POST',
      body: JSON.stringify(event)
    },
    onUnauth
  );
}

/* =====================================================
   MEMBERS
===================================================== */

export async function getMembers(onUnauthorized: () => void) {
  return await apiRequest<any[]>(
    '/gug/v1/members',
    {},
    onUnauthorized
  );
}

export async function getMember(id: number, onUnauthorized: () => void) {
  return await apiRequest<any>(
    `/gug/v1/members/${id}`,
    {},
    onUnauthorized
  );
}

export async function updateMember(id: number, payload: any, onUnauthorized: () => void) {
  return await apiRequest<any>(
    `/gug/v1/members/${id}`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

/* =====================================================
   TASKS
===================================================== */

export async function getTasks(
  onUnauthorized: () => void,
  params: {
    project_id?: number;
    scope?: 'project' | 'personal';
  } = {}
): Promise<Task[]> {
  const q: string[] = [];

  if (params.project_id && params.project_id > 0) {
    q.push(`project_id=${encodeURIComponent(String(params.project_id))}`);
  }

  if (params.scope) {
    q.push(`scope=${encodeURIComponent(params.scope)}`);
  }

  const query = q.length ? `?${q.join('&')}` : '';

  return await apiRequest<Task[]>(
    `/gug/v1/tasks${query}`,
    {},
    onUnauthorized
  );
}

export async function createTask(
  payload: Partial<Task>,
  onUnauthorized: () => void
): Promise<{ success: boolean; id: number }> {
  return await apiRequest<{ success: boolean; id: number }>(
    '/gug/v1/tasks',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function updateTask(
  taskId: number,
  payload: Partial<Task>,
  onUnauthorized: () => void
): Promise<{ success: boolean; message?: string }> {
  return await apiRequest<{ success: boolean; message?: string }>(
    `/gug/v1/tasks/${taskId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

/* =====================================================
   POS
===================================================== */

export async function getPosArticles(
  params: { category?: 'food' | 'drink' | 'gug'; all?: boolean } = {},
  onUnauthorized: () => void
): Promise<PosArticle[]> {
  const q: string[] = [];
  if (params.category) q.push(`category=${encodeURIComponent(params.category)}`);
  if (params.all) q.push('all=1');

  const query = q.length ? `?${q.join('&')}` : '';

  return await apiRequest<PosArticle[]>(
    `/gug/v1/pos/articles${query}`,
    {},
    onUnauthorized
  );
}

export async function createPosArticle(
  payload: {
    name: string;
    category: 'food' | 'drink' | 'gug';
    price_cents: number;
    is_active?: boolean;
    sort_order?: number;
    bg_color?: string;
  },
  onUnauthorized: () => void
): Promise<{ success: boolean; id: number }> {
  return await apiRequest<{ success: boolean; id: number }>(
    '/gug/v1/pos/articles',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function updatePosArticle(
  id: number,
  payload: Partial<{
    name: string;
    category: 'food' | 'drink' | 'gug';
    price_cents: number;
    is_active: boolean;
    sort_order: number;
    bg_color: string;
  }>,
  onUnauthorized: () => void
): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>(
    `/gug/v1/pos/articles/${id}`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function createPosOrder(
  payload: {
    items: { article_id: number; qty: number }[];
    received_cents?: number;
    waiter_user_id?: number;
    note?: string;
  },
  onUnauthorized: () => void
): Promise<{
  success: boolean;
  order_id: number;
  order_number: string;
  waiter_user_id: number;
  total_cents: number;
  received_cents: number;
  change_cents: number;
}> {
  return await apiRequest<{
    success: boolean;
    order_id: number;
    order_number: string;
    waiter_user_id: number;
    total_cents: number;
    received_cents: number;
    change_cents: number;
  }>(
    '/gug/v1/pos/orders',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    onUnauthorized
  );
}

export async function getPosOrders(
  params: { date?: string; waiter_user_id?: number } = {},
  onUnauthorized: () => void
): Promise<PosOrder[]> {
  const q: string[] = [];
  if (params.date) q.push(`date=${encodeURIComponent(params.date)}`);
  if (params.waiter_user_id) q.push(`waiter_user_id=${encodeURIComponent(String(params.waiter_user_id))}`);

  const query = q.length ? `?${q.join('&')}` : '';

  return await apiRequest<PosOrder[]>(
    `/gug/v1/pos/orders${query}`,
    {},
    onUnauthorized
  );
}

export async function getPosDailyReport(
  params: { date?: string } = {},
  onUnauthorized: () => void
): Promise<PosDailyReport> {
  const query = params.date ? `?date=${encodeURIComponent(params.date)}` : '';

  return await apiRequest<PosDailyReport>(
    `/gug/v1/pos/reports/daily${query}`,
    {},
    onUnauthorized
  );
}
