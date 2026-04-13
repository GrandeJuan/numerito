import type { ReactNode } from 'react';
import { CARD_CLASSES } from '@/lib/design-tokens';

const INPUT_CLASSES =
  'px-3 py-2 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-lg bg-white dark:bg-[#162a4a] text-[#091426] dark:text-white placeholder-gray-400 dark:placeholder-[#75777d] focus:ring-2 focus:ring-[#00a472] focus:border-transparent';

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className={`${CARD_CLASSES.full} p-4`}>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: SearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex-1 min-w-[200px] ${INPUT_CLASSES}`}
    />
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'Todos',
}: FilterSelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASSES}>
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
