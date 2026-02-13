
import { AppRole, User, Poll, WPUserResponse, ApiError, VoteResponse, RegistrationData } from '../types';

const API_BASE = 'https://api.gug-verein.at/wp-json';
const TOKEN_KEY = 'gug_token';
const USER_KEY = 'gug_user_data';

const mapWPRoleToAppRole = (wpRoles: any = []): AppRole => {
  const roles = Array.isArray(wpRoles) ? wpRoles : [];
  if (roles.includes('administrator')) return AppRole.SUPERADMIN;
  if (roles.includes('vorstand')) return AppRole.VORSTAND;
  return AppRole.USER;
};

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

// Fix: Exported apiRequest to allow direct usage in components for specialized API requests
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
        message: errData.message || 'Sitzung abgelaufen oder Zugriff verweigert.', 
        status: response.status 
      } as ApiError;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { 
        message: errorData.message || `Server Error ${response.status}`, 
        status: response.status 
      } as ApiError;
    }

    return await response.json();
  } catch (error: any) {
    if (error.status) throw error;
    throw { message: 'Verbindung zum API-Backend fehlgeschlagen. Bitte Internetverbindung prüfen.' } as ApiError;
  }
}

export async function login(username: string, password: string): Promise<User> {
  const data = await apiRequest<WPUserResponse>('/jwt-auth/v1/token', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  setToken(data.token);
  
  const user: User = {
    id: 0,
    email: data.user_email,
    displayName: data.user_display_name,
    username: data.user_nicename,
    role: AppRole.USER 
  };
  
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function register(regData: RegistrationData): Promise<{success: boolean, message: string}> {
  // Hinweis: Der Backend-Endpunkt muss die E-Mail an rainer@schmidt-kottingbrunn.at auslösen
  return await apiRequest<{success: boolean, message: string}>('/gug/v1/register', {
    method: 'POST',
    body: JSON.stringify({
      ...regData,
      admin_notification_email: 'rainer@schmidt-kottingbrunn.at'
    })
  });
}

export async function getCurrentUser(onUnauthorized: () => void): Promise<User> {
  const wpUser = await apiRequest<any>('/gug/v1/me', {}, onUnauthorized);
  
  const user: User = {
    id: wpUser.id || 0,
    email: wpUser.user_email || wpUser.email || '',
    displayName: wpUser.display_name || wpUser.name || wpUser.user_login || 'Mitglied',
    username: wpUser.user_login || wpUser.username || '',
    role: mapWPRoleToAppRole(wpUser.roles)
  };
  
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function getPolls(onUnauthorized: () => void): Promise<Poll[]> {
  return await apiRequest<Poll[]>('/gug/v1/polls', {}, onUnauthorized);
}

export async function createPoll(question: string, options: string[], onUnauth: () => void): Promise<Poll> {
  return await apiRequest<Poll>('/gug/v1/polls', { 
    method: 'POST', 
    body: JSON.stringify({ question, options }) 
  }, onUnauth);
}

export async function votePoll(pollId: number, optionId: string, onUnauth: () => void): Promise<VoteResponse> {
  return await apiRequest<VoteResponse>(`/gug/v1/polls/${pollId}/vote`, { 
    method: 'POST', 
    body: JSON.stringify({ option_id: optionId }) 
  }, onUnauth);
}
