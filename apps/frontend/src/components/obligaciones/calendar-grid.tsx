'use client';

import { Card } from '../card';
import { IconButton } from '../icon-button';
import { Icons } from '../icons';
import type { Obligacion } from '@numerito/shared';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function toneStyle(estado: Obligacion['estado']) {
  if (estado === 'VENCIDO')
    return {
      bg: 'var(--rose-soft)',
      color: 'var(--rose-ink)',
      border: 'var(--rose)',
    };
  if (estado === 'PRESENTADO')
    return {
      bg: 'var(--brand-softer)',
      color: 'var(--brand-ink)',
      border: 'var(--brand)',
    };
  return { bg: 'var(--amber-soft)', color: 'var(--amber-ink)', border: 'var(--amber)' };
}

export interface CalendarGridProps {
  month: Date;
  today?: Date;
  items: Obligacion[];
  onPrev(): void;
  onNext(): void;
  onToday(): void;
}

export function CalendarGrid({
  month,
  today = new Date(),
  items,
  onPrev,
  onNext,
  onToday,
}: CalendarGridProps) {
  const monthName = month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const first = new Date(y, m, 1);
  let startDow = first.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay: Record<number, Obligacion[]> = {};
  for (const o of items) {
    const [oy, om, od] = o.fecha.split('-').map(Number);
    if (oy === y && om - 1 === m) {
      (byDay[od] ??= []).push(o);
    }
  }

  const isTodayMonth = today.getFullYear() === y && today.getMonth() === m;
  const todayDate = today.getDate();

  return (
    <Card
      title="Calendario de Vencimientos"
      subtitle={monthName}
      right={
        <div className="flex items-center gap-1">
          <IconButton onClick={onPrev} label="Mes anterior">
            {Icons.chevL}
          </IconButton>
          <button
            onClick={onToday}
            className="px-2.5 py-1.5 text-[12px] bg-[var(--surface)] border border-[var(--border)] rounded-[8px] text-[var(--text-2)] hover:bg-[var(--surface-2)] cursor-pointer"
          >
            Hoy
          </button>
          <IconButton onClick={onNext} label="Mes siguiente">
            {Icons.chevR}
          </IconButton>
        </div>
      }
      className="mb-4"
    >
      <div className="grid grid-cols-7 border-t border-l border-[var(--border)] rounded-[8px] overflow-hidden">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 px-2.5 bg-[var(--surface-2)] border-r border-b border-[var(--border)] text-[10.5px] font-medium text-[var(--text-3)] uppercase tracking-[0.08em]"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const dayItems = day ? byDay[day] ?? [] : [];
          const isToday = isTodayMonth && day === todayDate;
          return (
            <div
              key={i}
              className="min-h-[86px] p-2 border-r border-b border-[var(--border)] flex flex-col gap-1"
              style={{ background: day ? 'var(--surface)' : 'var(--surface-2)' }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-[11.5px]"
                  style={{
                    fontWeight: isToday ? 600 : 500,
                    color: !day
                      ? 'var(--text-4)'
                      : isToday
                        ? 'var(--brand-on)'
                        : 'var(--text-2)',
                    background: isToday ? 'var(--brand)' : 'transparent',
                    padding: isToday ? '1px 6px' : 0,
                    borderRadius: 4,
                  }}
                >
                  {day ?? ''}
                </span>
                {dayItems.length > 0 && (
                  <span className="font-mono text-[9.5px] text-[var(--text-3)]">
                    {dayItems.length}
                  </span>
                )}
              </div>
              {dayItems.slice(0, 2).map((o) => {
                const s = toneStyle(o.estado);
                return (
                  <div
                    key={o.id}
                    className="text-[10px] px-1.5 py-0.5 rounded-[3px] truncate"
                    style={{
                      background: s.bg,
                      color: s.color,
                      borderLeft: `2px solid ${s.border}`,
                    }}
                    title={`${o.tipo} · ${o.cliente}`}
                  >
                    {o.tipo}
                  </div>
                );
              })}
              {dayItems.length > 2 && (
                <div className="text-[9.5px] text-[var(--text-3)] font-mono">
                  +{dayItems.length - 2} más
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
