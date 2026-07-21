import { sanitizeError } from './errors';

const API_BASE = '/api/v1';
const TOKEN_KEY = 'admin_session_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getAdminToken();
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const body = await response.json();

    if (response.status === 401) {
      clearAdminToken();
      throw new Error(body?.error || 'Admin session expired. Please sign in again.');
    }

    if (!response.ok) {
      throw new Error(body?.error || body?.message || `Server responded with status ${response.status}`);
    }

    return { success: true, data: body.data ?? body, message: body.message };
  } catch (err: any) {
    throw sanitizeError(err);
  }
}

export const adminApi = {
  async login(username: string, password: string) {
    return adminRequest<{ token: string; username: string; expiresAt: string }>(`/admin/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async me() {
    return adminRequest<{ username: string }>(`/admin/me`);
  },

  async logout() {
    return adminRequest<any>(`/admin/logout`, { method: 'POST' });
  },
};
