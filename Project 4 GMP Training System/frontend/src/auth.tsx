import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';
import { User, Role, ApiResponse } from './types';

// ADMIN sits outside the training hierarchy (segregation of duties)
export const ROLE_LEVELS: Record<Role, number> = { USER: 1, TRAINER: 2, DTC: 3, STC: 4, ADMIN: 0 };

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasLevel: (min: Role) => boolean;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get<ApiResponse<User>>('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password });
    localStorage.setItem('token', res.data.data.token);
    setUser(res.data.data.user);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* session may already be gone */ }
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasLevel = (min: Role) => !!user && ROLE_LEVELS[user.role] >= ROLE_LEVELS[min] && user.role !== 'ADMIN';

  return <Ctx.Provider value={{ user, loading, login, logout, hasLevel }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
