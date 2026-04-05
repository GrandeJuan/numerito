'use client';

import { useState, useEffect } from 'react';
import { useAuth, type EstudioInfo } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';

export function EstudioSelector() {
  const { estudioActual, switchEstudio, isAuthenticated } = useAuth();
  const [estudios, setEstudios] = useState<EstudioInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiFetch('/v1/usuarios/me/estudios')
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json();
          const data = body.data ?? body;
          setEstudios(Array.isArray(data) ? data : []);

          // Auto-select if only one estudio and none selected
          if (data.length === 1 && !estudioActual) {
            switchEstudio(data[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [isAuthenticated]);

  if (!loaded) return null;

  if (estudios.length === 0) {
    return (
      <div data-testid="estudio-selector-empty" className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="material-symbols-outlined text-red-400 text-lg">warning</span>
          <p className="text-xs text-white/50">Sin estudios asignados</p>
        </div>
      </div>
    );
  }

  const selected = estudioActual || estudios[0];

  return (
    <div data-testid="estudio-selector" className="px-3 py-3 border-b border-white/10">
      {estudios.length === 1 ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="material-symbols-outlined text-[#4edea3] text-lg">business</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{selected.nombre}</p>
            <p className="text-xs text-white/50">{selected.rol}</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[#4edea3] text-lg">business</span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-white truncate">{selected.nombre}</p>
              <p className="text-xs text-white/50">{selected.rol}</p>
            </div>
            <span className="material-symbols-outlined text-white/50 text-lg">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-[#0d1f3c] rounded-lg border border-white/10 shadow-xl z-50">
              {estudios.map((est) => (
                <button
                  key={est.id}
                  onClick={() => {
                    switchEstudio(est);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    est.id === selected.id ? 'bg-[#4edea3]/10' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-white truncate">{est.nombre}</p>
                  <p className="text-xs text-white/50">{est.rol}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
