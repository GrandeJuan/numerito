/**
 * Shared formatting utilities for Argentine locale.
 */

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

export function formatFecha(fecha: string): string {
  try {
    // Append T00:00:00 to date-only strings to avoid timezone shifts
    const input = fecha.includes('T') ? fecha : fecha + 'T00:00:00';
    const d = new Date(input);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

export function relativeTime(dateStr: string): string {
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
