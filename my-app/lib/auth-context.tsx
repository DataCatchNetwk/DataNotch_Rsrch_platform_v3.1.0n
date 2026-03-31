'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  const setAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    apiFetch<MeResponse>('/auth/me', { token: stored })
      .then((res) => setState({ user: res.user, token: stored, loading: false }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, loading: false });
      });
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
    setAuth(res.user, res.token);
    return res.user;
  }, [setAuth]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: data,
    });
    setAuth(res.user, res.token);
    return res.user;
  }, [setAuth]);

  const hasRole = useCallback((role: string) => {
    return state.user?.roles.includes(role) ?? false;
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
