'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { hasAnyRole } from '@/lib/rbac';

export type AuthUser = {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  roles: string[];
  accountStatus?: 'PENDING_APPROVAL' | 'APPROVED_2FA_PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  latestDecision?: {
    type: 'APPROVED' | 'REJECTED';
    reason: string;
    createdAt: string | Date;
  } | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

export type RegisterData = {
  firstname: string;
  surname: string;
  email: string;
  country_code: string;
  mobile_number: string;
  password: string;
  date_of_birth: string;
  referral_code?: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  const setAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const clearStoredAuth = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    };

    const resolveUnauthenticated = () => {
      if (!active) return;
      setState({ user: null, token: null, loading: false });
    };

    let stored: string | null = null;
    let storedUser: AuthUser | null = null;
    try {
      stored = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
      if (rawUser) {
        storedUser = JSON.parse(rawUser) as AuthUser;
      }
    } catch {
      resolveUnauthenticated();
      return () => {
        active = false;
      };
    }

    if (!stored) {
      resolveUnauthenticated();
      return () => {
        active = false;
      };
    }

    if (storedUser) {
      setState({ user: storedUser, token: stored, loading: false });
    }

    const timeoutId = setTimeout(() => controller.abort(), 12000);

    apiFetch<MeResponse>('/api/v1/auth/me', { token: stored, signal: controller.signal })
      .then((res) => {
        if (!active) return;
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
        setState({ user: res.user, token: stored, loading: false });
      })
      .catch(() => {
        clearStoredAuth();
        resolveUnauthenticated();
      })
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });

    return () => {
      active = false;
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
    setAuth(res.user, res.token);
    return res.user;
  }, [setAuth]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await apiFetch<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: data,
    });
    setAuth(res.user, res.token);
    return res.user;
  }, [setAuth]);

  const hasRole = useCallback((role: string) => {
    return hasAnyRole(state.user?.roles, [role]);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
