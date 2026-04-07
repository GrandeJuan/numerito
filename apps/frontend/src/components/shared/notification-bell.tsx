'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';

interface NotificacionItem {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

const TIPO_ICONS: Record<string, string> = {
  VENCIMIENTO_PROXIMO: 'event_upcoming',
  TAREA_ASIGNADA: 'assignment',
  PAGO_RECIBIDO: 'payments',
  SISTEMA: 'info',
};

function tipoIcon(tipo: string): string {
  return TIPO_ICONS[tipo] ?? 'notifications';
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD}d`;
}

const POLL_INTERVAL = 60_000; // 1 minute

export function NotificationBell() {
  const { estudioActual } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!estudioActual) return;
    try {
      const res = await apiFetch('/v1/notificaciones/unread-count');
      if (res.ok) {
        const body = await res.json();
        setUnreadCount(body.count ?? 0);
      }
    } catch {
      // silent fail
    }
  }, [estudioActual]);

  const fetchNotifications = useCallback(async () => {
    if (!estudioActual) return;
    setLoading(true);
    try {
      const res = await apiFetch('/v1/notificaciones?limit=10');
      if (res.ok) {
        const body = await res.json();
        setNotifications(body.data ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [estudioActual]);

  // Fetch unread count on mount and when estudio changes
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await apiFetch(`/v1/notificaciones/${id}/leer`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silent fail
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Notificaciones"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#091426]/70 hover:bg-[#091426]/5 hover:text-[#091426] dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white transition-colors w-full"
      >
        <span className="material-symbols-outlined text-lg">notifications</span>
        Notificaciones
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-[#162a4a] rounded-lg shadow-xl border border-[#e2e8f0] dark:border-white/10 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#e2e8f0] dark:border-white/10">
            <h3 className="text-sm font-semibold text-[#091426] dark:text-gray-100">
              Notificaciones
            </h3>
          </div>

          {loading && (
            <div className="px-4 py-6 text-center text-sm text-[#45474c] dark:text-[#a0a3a8]">
              Cargando...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[#45474c] dark:text-[#a0a3a8]">
              Sin notificaciones
            </div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 flex items-start gap-3 hover:bg-[#4edea3]/5 ${
                  n.leida ? 'opacity-60' : ''
                }`}
              >
                <span className="material-symbols-outlined text-lg text-[#45474c] dark:text-[#a0a3a8] mt-0.5">
                  {tipoIcon(n.tipo)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#091426] dark:text-gray-100 leading-snug">
                    {n.mensaje}
                  </p>
                  <p className="text-xs text-[#45474c] dark:text-[#a0a3a8] mt-1">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
                {!n.leida && (
                  <button
                    aria-label="Marcar como leida"
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 p-1 rounded hover:bg-[#4edea3]/10 dark:hover:bg-white/5 transition-colors"
                    title="Marcar como leida"
                  >
                    <span className="material-symbols-outlined text-sm text-[#4edea3]">done</span>
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
