'use client';

import { useState } from 'react';
import { formatFecha } from '@/lib/formatters';
import { CARD_CLASSES } from '@/lib/design-tokens';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterBar, FilterSelect } from '@/components/shared/filter-bar';

interface Documento {
  id: string;
  nombre: string;
  tipo: 'PDF' | 'imagen' | 'planilla' | 'otro';
  fecha: string;
  tamano: string;
}

const MOCK_DOCUMENTOS: Documento[] = [
  {
    id: '1',
    nombre: 'Balance General 2025.pdf',
    tipo: 'PDF',
    fecha: '2026-03-15',
    tamano: '2.4 MB',
  },
  { id: '2', nombre: 'DDJJ IVA Marzo.pdf', tipo: 'PDF', fecha: '2026-03-20', tamano: '1.1 MB' },
  {
    id: '3',
    nombre: 'Recibo Honorarios Febrero.pdf',
    tipo: 'PDF',
    fecha: '2026-02-28',
    tamano: '340 KB',
  },
  {
    id: '4',
    nombre: 'Constancia Inscripcion ARCA.pdf',
    tipo: 'PDF',
    fecha: '2026-01-10',
    tamano: '520 KB',
  },
  {
    id: '5',
    nombre: 'Libro IVA Compras Q1.xlsx',
    tipo: 'planilla',
    fecha: '2026-03-31',
    tamano: '890 KB',
  },
  {
    id: '6',
    nombre: 'Comprobante Pago IIBB.png',
    tipo: 'imagen',
    fecha: '2026-03-05',
    tamano: '1.8 MB',
  },
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
  otro: 'text-gray-500 dark:text-[#a0a3a8]',
};

export default function PortalDocumentosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<string>('todos');

  const docListColumns: Column<Documento>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (doc) => (
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-lg ${TIPO_COLORS[doc.tipo]}`}>
            {TIPO_ICONS[doc.tipo]}
          </span>
          <span className="text-[#091426] dark:text-white">{doc.nombre}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (doc) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd] capitalize">{doc.tipo}</span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (doc) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd]">{formatFecha(doc.fecha)}</span>
      ),
    },
    {
      key: 'tamano',
      header: 'Tamano',
      render: (doc) => <span className="text-[#45474c] dark:text-[#c5c6cd]">{doc.tamano}</span>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right' as const,
      render: () => (
        <button
          aria-label="Descargar"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="material-symbols-outlined text-gray-600 dark:text-[#c5c6cd] text-lg">
            download
          </span>
        </button>
      ),
    },
  ];

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
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Mis Documentos</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
            Documentos compartidos por su estudio contable.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#162a4a] shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Vista grilla"
          >
            <span className="material-symbols-outlined text-sm text-gray-600 dark:text-[#c5c6cd]">
              grid_view
            </span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-200 dark:bg-[#162a4a] shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Vista lista"
          >
            <span className="material-symbols-outlined text-sm text-gray-600 dark:text-[#c5c6cd]">
              view_list
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar>
        <FilterSelect
          value={tipoFilter === 'todos' ? '' : tipoFilter}
          onChange={(v) => setTipoFilter(v || 'todos')}
          placeholder="Todos los tipos"
          options={[
            { value: 'PDF', label: 'PDF' },
            { value: 'imagen', label: 'Imagen' },
            { value: 'planilla', label: 'Planilla' },
            { value: 'otro', label: 'Otro' },
          ]}
        />
        <FilterSelect
          value={periodoFilter === 'todos' ? '' : periodoFilter}
          onChange={(v) => setPeriodoFilter(v || 'todos')}
          placeholder="Todos los periodos"
          options={[
            { value: '2026-03', label: 'Marzo 2026' },
            { value: '2026-02', label: 'Febrero 2026' },
            { value: '2026-01', label: 'Enero 2026' },
          ]}
        />
      </FilterBar>

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-[#75777d]">
            folder_off
          </span>
          <p className="mt-2 text-[#45474c] dark:text-[#a0a3a8]">
            No se encontraron documentos con los filtros seleccionados.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className={`${CARD_CLASSES.full} p-4 hover:bg-[#4edea3]/5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-[#f0f4f8] dark:bg-[#162a4a] rounded-lg p-3">
                  <span className={`material-symbols-outlined text-2xl ${TIPO_COLORS[doc.tipo]}`}>
                    {TIPO_ICONS[doc.tipo]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#091426] dark:text-white truncate">
                    {doc.nombre}
                  </p>
                  <p className="text-xs text-[#45474c] dark:text-[#a0a3a8] mt-1">
                    {formatFecha(doc.fecha)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#75777d]">{doc.tamano}</p>
                </div>
                <button
                  aria-label="Descargar"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-gray-600 dark:text-[#c5c6cd] text-lg">
                    download
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={docListColumns}
          data={filtered}
          rowKey={(doc) => doc.id}
          emptyMessage="No se encontraron documentos."
        />
      )}
    </div>
  );
}
