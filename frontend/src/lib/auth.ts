/**
 * Netrasaathi Authentication & Session Helper
 * Centralizes JWT token storage and authenticated user state.
 * Never stores plain-text passwords or secret keys.
 */

import { User } from './types';

const TOKEN_KEY = 'netrasaathi_jwt_token';
const USER_KEY = 'netrasaathi_user_session';

const listeners = new Set<() => void>();

function notifyAuthChange(): void {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('Auth listener error:', err);
    }
  });
}

export function subscribeAuth(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', callback);
    }
  };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    notifyAuthChange();
  } catch (err) {
    console.error('Failed to save session token:', err);
  }
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifyAuthChange();
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    notifyAuthChange();
  } catch (err) {
    console.error('Failed to save user session:', err);
  }
}

export function clearSession(): void {
  removeToken();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}
