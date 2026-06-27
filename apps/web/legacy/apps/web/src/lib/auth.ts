// Token management utilities
const TOKEN_KEY = 'healthPlatformToken';
const USER_KEY = 'healthPlatformUser';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  firstname: string;
  surname: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export const tokenStorage = {
  setAuth: (data: AuthResponse) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(TOKEN_KEY);
    }
    return false;
  },
};

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  firstname: string;
  surname: string;
  email: string;
  country_code: string;
  mobile_number: string;
  password: string;
  date_of_birth: string;
  referral_code?: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = tokenStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {
      // Could not parse error response
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return data;
  },

  register: async (input: RegisterRequest): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; reset_token?: string }> => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, new_password: string): Promise<{ message: string }> => {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  },

  getMe: async (): Promise<{ user: User }> => {
    return apiFetch('/auth/me');
  },

  logout: async (): Promise<void> => {
    tokenStorage.clearTokens();
  },
};
