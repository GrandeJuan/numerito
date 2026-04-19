'use client';

import { Button } from '../button';
import { Icons } from '../icons';

export interface ClientesFilterBarProps {
  search: string;
  onSearch(s: string): void;
  total: number;
  filtered: number;
}

export function ClientesFilterBar({
  search,
  onSearch,
  total,
  filtered,
}: ClientesFilterBarProps) {
  return (
    <div className="flex gap-2 mb-3 items-center flex-wrap">
      <div className="flex items-center gap-2 px-3 py-1.5 w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-[8px] text-[var(--text-3)] focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand-softer)]">
        {Icons.search}
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por razón social o CUIT…"
          className="border-none bg-transparent outline-none flex-1 text-[12.5px] text-[var(--text)] placeholder:text-[var(--text-4)]"
        />
      </div>
      <Button variant="ghost" icon={Icons.filter}>
        Tipo <span className="text-[var(--text-3)] ml-0.5">Todos</span>
      </Button>
      <Button variant="ghost" icon={Icons.filter}>
        Condición IVA <span className="text-[var(--text-3)] ml-0.5">Todas</span>
      </Button>
      <Button variant="ghost" icon={Icons.filter}>
        Responsable <span className="text-[var(--text-3)] ml-0.5">Todos</span>
      </Button>
      <div className="ml-auto text-[11.5px] text-[var(--text-3)]">
        {filtered} de {total}
      </div>
    </div>
  );
}
