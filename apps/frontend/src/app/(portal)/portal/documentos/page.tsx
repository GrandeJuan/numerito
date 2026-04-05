'use client';

import { useState } from 'react';

interface Documento {
  id: string;
  nombre: string;
  tipo: 'PDF' | 'imagen' | 'planilla' | 'otro';
  fecha: string;
  tamano: string;
}

const MOCK_DOCUMENTOS: Documento[] = [
  { id: '1', nombre: 'Balance General 2025.pdf', tipo: 'PDF', fecha: '2026-03-15', tamano: '2.4 MB' },
  { id: '2', nombre: 'DDJJ IVA Marzo.pdf', tipo: 'PDF', fecha: '2026-03-20', tamano: '1.1 MB' },
  { id: '3', nombre: 'Recibo Honorarios Febrero.pdf', tipo: 'PDF', fecha: '2026-02-28', tamano: '340 KB' },
  { id: '4', nombre: 'Constancia Inscripcion ARCA.pdf', tipo: 'PDF', fecha: '2026-01-10', tamano: '520 KB' },
  { id: '5', nombre: 'Libro IVA Compras Q1.xlsx', tipo: 'planilla', fecha: '2026-03-31', tamano: '890 KB' },
  { id: '6', nombre: 'Comprobante Pago IIBB.png', tipo: 'imagen', fecha: '2026-03-05', tamano: '1.8 MB' },
];

const TIPO_ICONS: Record<string, string> = {
  PDF: 'picture_as_pdf',
  imagen: 'image',
  planilla: 'table_chart',
  otro: 'description',
};

const TIPO_COLORS: Record<string, string> = {
  PDF: 'text-red-500 dark:text-red-400',
  imagen: 'text-blue-500 dark:text-blue-400',
  planilla: 'text-green-500 dark:text-green-400',
  otro: 'text-gray-500 dark:text-gray-400',
};

function formatFecha(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return fecha;
  }
}

export default function PortalDocumentosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<string>('todos');

  const filtered = MOCK_DOCUMENTOS.filter((d) => {
    if (tipoFilter !== 'todos' && d.tipo !== tipoFilter) return false;
    if (periodoFilter !== 'todos') {
      const month = d.fecha.substring(0, 7);
      if (month !== periodoFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Documentos</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Documentos compartidos por su estudio contable.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Vista grilla"
          >
            <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-300">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-200 dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Vista lista"
          >
            <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-300">view_list</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          aria-label="Filtrar por tipo"
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los tipos</option>
          <option value="PDF">PDF</option>
          <option value="imagen">Imagen</option>
          <option value="planilla">Planilla</option>
          <option value="otro">Otro</option>
        </select>

        <select
          value={periodoFilter}
          onChange={(e) => setPeriodoFilter(e.target.value)}
          aria-label="Filtrar por periodo"
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los periodos</option>
          <option value="2026-03">Marzo 2026</option>
          <option value="2026-02">Febrero 2026</option>
          <option value="2026-01">Enero 2026</option>
        </select>
      </div>

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">folder_off</span>
          <p className="mt-2 text-gray-500 dark:text-gray-400">No se encontraron documentos con los filtros seleccionados.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <span className={`material-symbols-outlined text-2xl ${TIPO_COLORS[doc.tipo]}`}>
                    {TIPO_ICONS[doc.tipo]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatFecha(doc.fecha)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{doc.tamano}</p>
                </div>
                <button
                  aria-label="Descargar"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-lg">download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tamano</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-lg ${TIPO_COLORS[doc.tipo]}`}>
                        {TIPO_ICONS[doc.tipo]}
                      </span>
                      <span className="text-gray-900 dark:text-white">{doc.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 capitalize">{doc.tipo}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{formatFecha(doc.fecha)}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{doc.tamano}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      aria-label="Descargar"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-lg">download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
