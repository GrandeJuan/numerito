'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch, setOnUnauthorized, setEstudioId } from './api-client';
import { parseApiResponse } from './parse-api-response';

export interface AuthUser {
  id: string;
  email: string;
  rol: string;
  nombre?: string;
  apellido?: string;
  avatarUrl?: string | null;
  createdAt?: string;
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
  estudios: EstudioInfo[];
  permisos: string[];
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  switchEstudio: (estudio: EstudioInfo) => void;
  tienePermiso: (permiso: string) => boolean;
  updateUserProfile: (
    updates: Partial<Pick<AuthUser, 'nombre' | 'apellido' | 'avatarUrl'>>,
  ) => void;
  refreshUser: () => Promise<void>;
}

const ESTUDIO_STORAGE_KEY = 'numerito_estudio_actual';
const USER_PROFILE_KEY = 'numerito_user_profile';

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
  const [estudios, setEstudios] = useState<EstudioInfo[]>([]);
  const [permisos, setPermisos] = useState<string[]>([]);

  const loadPermisos = useCallback(async (estudioId: string) => {
    try {
      const res = await apiFetch(`/v1/usuarios/me/permisos?estudioId=${estudioId}`);
      if (res.ok) {
        const { data } = await parseApiResponse<string[]>(res);
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
        // Restore profile data from localStorage (nombre, apellido, avatarUrl)
        let profile: Partial<AuthUser> = {};
        try {
          const stored = localStorage.getItem(USER_PROFILE_KEY);
          if (stored) profile = JSON.parse(stored);
        } catch {
          /* ignore */
        }

        setUser({
          id: payload.sub as string,
          email: payload.email as string,
          rol: payload.rol as string,
          nombre: profile.nombre,
          apellido: profile.apellido,
          avatarUrl: profile.avatarUrl,
        });

        // Restore estudio from localStorage, or lazy-load on first hydration
        const savedEstudio = loadEstudioFromStorage();
        if (savedEstudio) {
          setEstudioActual(savedEstudio);
          setEstudioId(savedEstudio.id);
          loadPermisos(savedEstudio.id);
        }
        if (payload.rol !== 'SUPERADMIN') {
          apiFetch('/v1/usuarios/me/estudios')
            .then((r) => (r.ok ? parseApiResponse<EstudioInfo[]>(r) : null))
            .then((parsed) => {
              const list = parsed?.data;
              if (Array.isArray(list) && list.length > 0) {
                setEstudios(list);
                if (!savedEstudio) {
                  const primary = list[0];
                  setEstudioActual(primary);
                  setEstudioId(primary.id);
                  localStorage.setItem(ESTUDIO_STORAGE_KEY, JSON.stringify(primary));
                  loadPermisos(primary.id);
                }
              }
            })
            .catch(() => {});
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const res = await apiFetch('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        const message = body?.error?.message || body?.message || 'Error al iniciar sesión';
        throw new Error(message);
      }

      const { data } = await parseApiResponse<{
        accessToken: string;
        refreshToken: string;
        usuario: {
          id: string;
          email: string;
          nombre: string;
          apellido: string;
          rol: string;
          themePreference?: string;
          avatarUrl?: string | null;
        };
      }>(res);
      setCookie('access_token', data.accessToken, 900);
      setCookie('refresh_token', data.refreshToken, 604800);

      const authUser: AuthUser = {
        id: data.usuario.id,
        email: data.usuario.email,
        rol: data.usuario.rol,
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        avatarUrl: data.usuario.avatarUrl,
      };
      setUser(authUser);

      // Persist profile data for hydration (JWT doesn't carry these)
      localStorage.setItem(
        USER_PROFILE_KEY,
        JSON.stringify({
          nombre: data.usuario.nombre,
          apellido: data.usuario.apellido,
          avatarUrl: data.usuario.avatarUrl,
        }),
      );

      // Apply theme preference from server
      if (data.usuario.themePreference) {
        localStorage.setItem('numerito_dark_mode', String(data.usuario.themePreference === 'dark'));
      }

      if (authUser.rol !== 'SUPERADMIN') {
        try {
          const estRes = await apiFetch('/v1/usuarios/me/estudios');
          if (estRes.ok) {
            const { data: list } = await parseApiResponse<EstudioInfo[]>(estRes);
            if (Array.isArray(list) && list.length > 0) {
              setEstudios(list);
              const primary = list[0];
              setEstudioActual(primary);
              setEstudioId(primary.id);
              localStorage.setItem(ESTUDIO_STORAGE_KEY, JSON.stringify(primary));
              loadPermisos(primary.id);
            }
          }
        } catch {
          // best-effort: dashboard guard shows a clear state if no estudio loaded
        }
      }

      return authUser;
    },
    [loadPermisos],
  );

  const updateUserProfile = useCallback(
    (updates: Partial<Pick<AuthUser, 'nombre' | 'apellido' | 'avatarUrl'>>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...updates };
        localStorage.setItem(
          USER_PROFILE_KEY,
          JSON.stringify({
            nombre: updated.nombre,
            apellido: updated.apellido,
            avatarUrl: updated.avatarUrl,
          }),
        );
        return updated;
      });
    },
    [],
  );

  const logout = useCallback(() => {
    apiFetch('/v1/auth/logout', { method: 'POST' }).catch(() => {});
    deleteCookie('access_token');
    deleteCookie('refresh_token');
    localStorage.removeItem(ESTUDIO_STORAGE_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    setUser(null);
    setEstudioActual(null);
    setEstudios([]);
    setEstudioId(null);
    setPermisos([]);
    window.location.href = '/login';
  }, []);

  const switchEstudio = useCallback(
    (estudio: EstudioInfo) => {
      setEstudioActual(estudio);
      setEstudioId(estudio.id);
      localStorage.setItem(ESTUDIO_STORAGE_KEY, JSON.stringify(estudio));
      loadPermisos(estudio.id);
    },
    [loadPermisos],
  );

  const tienePermiso = useCallback((permiso: string) => permisos.includes(permiso), [permisos]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch('/v1/usuarios/me');
      if (!res.ok) return;
      const { data } = await parseApiResponse<{
        id: string;
        email: string;
        nombre: string;
        apellido: string;
        rol: string;
        avatarUrl: string | null;
        createdAt?: string;
      }>(res);
      setUser((prev) => {
        const next: AuthUser = {
          id: data.id,
          email: data.email,
          rol: data.rol,
          nombre: data.nombre,
          apellido: data.apellido,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt ?? prev?.createdAt,
        };
        localStorage.setItem(
          USER_PROFILE_KEY,
          JSON.stringify({
            nombre: next.nombre,
            apellido: next.apellido,
            avatarUrl: next.avatarUrl,
          }),
        );
        return next;
      });
    } catch {
      // best-effort
    }
  }, []);

  // Wire up auto-logout on refresh failure
  useEffect(() => {
    setOnUnauthorized(() => {
      deleteCookie('access_token');
      deleteCookie('refresh_token');
      localStorage.removeItem(ESTUDIO_STORAGE_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
      setUser(null);
      setEstudioActual(null);
      setEstudios([]);
      setEstudioId(null);
      setPermisos([]);
      window.location.href = '/login';
    });
    return () => setOnUnauthorized(null);
  }, []);

  return (
    <AuthContext
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        estudioActual,
        estudios,
        permisos,
        login,
        logout,
        switchEstudio,
        tienePermiso,
        updateUserProfile,
        refreshUser,
      }}
    >
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
