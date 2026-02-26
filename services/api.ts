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
  PosDailyReport
} from '../types';

import type { Task } from '../types';

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
}

export async function getChatMessages(onUnauthorized: () => void): Promise<ChatMessage[]> {
  return await apiRequest<ChatMessage[]>(
    '/gug/v1/chat',
    {},
    onUnauthorized
  );
}

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
   POLLS
===================================================== */

export async function getPolls(onUnauthorized: () => void): Promise<Poll[]> {
  return await apiRequest<Poll[]>('/gug/v1/polls', {}, onUnauthorized);
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

export async function getTasks(onUnauthorized: () => void): Promise<Task[]> {
  return await apiRequest<Task[]>(
    '/gug/v1/tasks',
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
  if (params.all) q.push(`all=1`);

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
    bg_color?: string; // ✅ HINZUGEFÜGT
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
    bg_color: string; // ✅ HINZUGEFÜGT
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
