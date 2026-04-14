'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';

interface SearchResultEstudio {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  isActive: boolean;
}

interface SearchResultUsuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  isActive: boolean;
}

interface SearchResults {
  estudios: SearchResultEstudio[];
  usuarios: SearchResultUsuario[];
}

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const fetchResults = useCallback(async (q: string) => {
    abortRef.current?.abort();

    if (!q.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await apiFetch(
        `/v1/admin/search?q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal },
      );
      const { data } = await parseApiResponse<SearchResults>(res);
      setResults(data);
      setOpen(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setResults(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function navigate(path: string) {
    setOpen(false);
    setQuery('');
    setResults(null);
    router.push(path);
  }

  const hasResults =
    results && (results.estudios.length > 0 || results.usuarios.length > 0);
  const isEmpty = results && !hasResults;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#75777d] dark:text-[#a0a3a8] text-lg">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Buscar estudios, usuarios..."
          className="w-56 lg:w-72 pl-10 pr-3 py-2 text-sm rounded-lg bg-[#091426]/5 dark:bg-white/5 border border-[#e2e8f0] dark:border-white/10 text-[#091426] dark:text-white placeholder-[#75777d] dark:placeholder-[#a0a3a8] focus:outline-none focus:ring-2 focus:ring-[#00a472] focus:border-transparent transition-colors"
          aria-label="Buscar estudios y usuarios"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        {loading && (
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#75777d] dark:text-[#a0a3a8] text-sm animate-spin">
            progress_activity
          </span>
        )}
      </div>

      {open && (hasResults || isEmpty) && (
        <div
          className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-[#162a4a] rounded-xl shadow-xl border border-[#e2e8f0] dark:border-white/10 z-50 overflow-hidden"
          role="listbox"
        >
          {isEmpty && (
            <div className="px-4 py-6 text-center">
              <span className="material-symbols-outlined text-3xl text-[#75777d] dark:text-[#a0a3a8] mb-1 block">
                search_off
              </span>
              <p className="text-sm text-[#75777d] dark:text-[#a0a3a8]">
                No se encontraron resultados
              </p>
            </div>
          )}

          {results && results.estudios.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-[#f0f4f8] dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#75777d] dark:text-[#a0a3a8]">
                  Estudios
                </p>
              </div>
              {results.estudios.map((est) => (
                <button
                  key={est.id}
                  onClick={() => navigate(`/admin/estudios`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f0f4f8] dark:hover:bg-white/5 transition-colors text-left"
                  role="option"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#4edea3]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#00a472] text-base">
                      business
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#091426] dark:text-white truncate">
                      {est.nombre}
                    </p>
                    <p className="text-xs text-[#75777d] dark:text-[#a0a3a8] truncate">
                      CUIT: {est.cuit} · {est.plan}
                    </p>
                  </div>
                  {!est.isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                      Inactivo
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results && results.usuarios.length > 0 && (
            <div>
              <div className="px-3 py-2 bg-[#f0f4f8] dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#75777d] dark:text-[#a0a3a8]">
                  Usuarios
                </p>
              </div>
              {results.usuarios.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => navigate(`/admin/usuarios`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f0f4f8] dark:hover:bg-white/5 transition-colors text-left"
                  role="option"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#091426]/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#45474c] dark:text-[#a0a3a8] text-base">
                      person
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#091426] dark:text-white truncate">
                      {usr.nombre} {usr.apellido}
                    </p>
                    <p className="text-xs text-[#75777d] dark:text-[#a0a3a8] truncate">
                      {usr.email} · {usr.rol}
                    </p>
                  </div>
                  {!usr.isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                      Inactivo
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
