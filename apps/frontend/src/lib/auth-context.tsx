'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch, setOnUnauthorized, setEstudioId } from './api-client';

export interface AuthUser {
  id: string;
  email: string;
  rol: string;
}

export interface EstudioInfo {
  id: string;
  nombre: string;
  rol: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  estudioActual: EstudioInfo | null;
  permisos: string[];
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  switchEstudio: (estudio: EstudioInfo) => void;
  tienePermiso: (permiso: string) => boolean;
}

const ESTUDIO_STORAGE_KEY = 'numerito_estudio_actual';

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? match[1] : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function loadEstudioFromStorage(): EstudioInfo | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ESTUDIO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estudioActual, setEstudioActual] = useState<EstudioInfo | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);

  const loadPermisos = useCallback(async (estudioId: string) => {
    try {
      const res = await apiFetch(`/v1/usuarios/me/permisos?estudioId=${estudioId}`);
      if (res.ok) {
        const body = await res.json();
        const data = body.data ?? body;
        setPermisos(Array.isArray(data) ? data : []);
      } else {
        setPermisos([]);
      }
    } catch {
      setPermisos([]);
    }
  }, []);

  // Hydrate from cookie on mount
  useEffect(() => {
    const token = getTokenFromCookie();
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && payload.exp && Date.now() < (payload.exp as number) * 1000) {
        setUser({
          id: payload.sub as string,
          email: payload.email as string,
          rol: payload.rol as string,
        });

        // Restore estudio from localStorage
        const savedEstudio = loadEstudioFromStorage();
        if (savedEstudio) {
          setEstudioActual(savedEstudio);
          setEstudioId(savedEstudio.id);
          loadPermisos(savedEstudio.id);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiFetch('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json();
      const message = body?.error?.message || body?.message || 'Error al iniciar sesión';
      throw new Error(message);
    }

    const body = await res.json();
    // Backend wraps responses in { data: { ... } }
    const data = body.data ?? body;
    setCookie('access_token', data.accessToken, 900);
    setCookie('refresh_token', data.refreshToken, 604800);

    const authUser: AuthUser = {
      id: data.usuario.id,
      email: data.usuario.email,
      rol: data.usuario.rol,
    };
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(() => {
    apiFetch('/v1/auth/logout', { method: 'POST' }).catch(() => {});
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    localStorage.removeItem(ESTUDIO_STORAGE_KEY);
    setUser(null);
    setEstudioActual(null);
    setEstudioId(null);
    setPermisos([]);
    window.location.href = '/login';
  }, []);

  const switchEstudio = useCallback((estudio: EstudioInfo) => {
    setEstudioActual(estudio);
    setEstudioId(estudio.id);
    localStorage.setItem(ESTUDIO_STORAGE_KEY, JSON.stringify(estudio));
    loadPermisos(estudio.id);
  }, [loadPermisos]);

  const tienePermiso = useCallback((permiso: string) => permisos.includes(permiso), [permisos]);

  // Wire up auto-logout on refresh failure
  useEffect(() => {
    setOnUnauthorized(() => {
      deleteCookie('access_token');
      deleteCookie('refresh_token');
      localStorage.removeItem(ESTUDIO_STORAGE_KEY);
      setUser(null);
      setEstudioActual(null);
      setEstudioId(null);
      setPermisos([]);
      window.location.href = '/login';
    });
    return () => setOnUnauthorized(null);
  }, []);

  return (
    <AuthContext value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      estudioActual,
      permisos,
      login,
      logout,
      switchEstudio,
      tienePermiso,
    }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
