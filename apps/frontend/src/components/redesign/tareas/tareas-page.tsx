'use client';

import { useEffect, useState } from 'react';
import type { Tarea } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { SegmentedControl } from '../segmented-control';
import { Button } from '../button';
import { Icons } from '../icons';

import { TareasKpis } from './tareas-kpis';
import { TareasKanban } from './tareas-kanban';
import { TareasList } from './tareas-list';

type View = 'kanban' | 'list';
const STORAGE = 'tareas:view';

export function TareasPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error } =
    useFetchWithEstudio<{ items: Tarea[] }>('/v1/tareas');
  const items = data?.items ?? [];

  const [view, setView] = useState<View>('kanban');
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE) as View | null;
    if (saved === 'kanban' || saved === 'list') setView(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE, view);
  }, [view]);

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="check">
      <PageHeader
        title="Tareas"
        subtitle="Gestión del equipo del estudio"
        actions={
          <>
            <SegmentedControl<View>
              value={view}
              onChange={setView}
              options={[
                { value: 'kanban', label: 'Kanban' },
                { value: 'list', label: 'Lista' },
              ]}
            />
            <Button variant="brand" icon={Icons.plus}>
              Nueva tarea
            </Button>
          </>
        }
      />

      <TareasKpis items={items} />

      <div className="flex gap-2 mb-3.5 flex-wrap">
        <Button variant="ghost" icon={Icons.filter}>
          Prioridad <span className="text-[var(--text-3)] ml-0.5">Todas</span>
        </Button>
        <Button variant="ghost" icon={Icons.filter}>
          Responsable <span className="text-[var(--text-3)] ml-0.5">Todos</span>
        </Button>
        <Button variant="ghost" icon={Icons.filter}>
          Cliente <span className="text-[var(--text-3)] ml-0.5">Todos</span>
        </Button>
      </div>

      {view === 'kanban' ? <TareasKanban items={items} /> : <TareasList rows={items} />}
    </PageStateGuard>
  );
}
