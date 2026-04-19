'use client';

import { useState } from 'react';
import { Button } from '../button';
import { Icons } from '../icons';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  detail?: string;
  onRetry?(): void;
}

export function ErrorState({
  title = 'Algo salió mal',
  message = 'No pudimos cargar esta sección. Podés reintentar o contactar soporte.',
  detail,
  onRetry,
}: ErrorStateProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-[14px] bg-[var(--rose-soft)] text-[var(--rose-ink)] flex items-center justify-center mb-4">
        <span style={{ transform: 'scale(1.4)', display: 'inline-flex' }}>{Icons.alert}</span>
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--text)] m-0">{title}</h3>
      <p className="text-[13px] text-[var(--text-3)] mt-1.5 mb-0 max-w-[460px] leading-[1.5]">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button onClick={onRetry} variant="primary">
            Reintentar
          </Button>
        </div>
      )}
      {detail && (
        <div className="mt-6 max-w-[520px] w-full">
          <button
            onClick={() => setOpen(!open)}
            className="text-[11.5px] text-[var(--text-3)] font-mono bg-transparent border-none cursor-pointer hover:text-[var(--text-2)]"
          >
            {open ? 'Ocultar' : 'Mostrar'} detalle técnico
          </button>
          {open && (
            <pre className="mt-2 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-[8px] text-[11px] text-[var(--text-2)] text-left font-mono overflow-auto max-h-[240px]">
              {detail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
