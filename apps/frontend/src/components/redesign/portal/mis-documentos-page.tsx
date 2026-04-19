'use client';

import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { Card } from '../card';
import { DataTable } from '../data-table';
import { Button } from '../button';
import { Pill } from '../pill';
import { Icons } from '../icons';
import { formatFecha } from '@/lib/formatters';

interface Documento {
  id: string;
  tipo: string;
  periodo?: string;
  fecha: string;
  tamano?: number;
  url?: string;
}

export function MisDocumentosPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error } =
    useFetchWithEstudio<{ items: Documento[] }>('/v1/portal/documentos');
  const rows = data?.items ?? [];

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="file">
      <PageHeader
        title="Mis documentos"
        subtitle="Documentos compartidos por el estudio"
        actions={
          <Button variant="ghost" icon={Icons.filter}>
            Tipo <span className="text-[var(--text-3)] ml-0.5">Todos</span>
          </Button>
        }
      />

      <Card padding={0}>
        <DataTable<Documento>
          rows={rows}
          columns={[
            { header: 'Tipo', render: (d) => <Pill tone="indigo">{d.tipo}</Pill> },
            {
              header: 'Período',
              render: (d) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                  {d.periodo ?? '—'}
                </span>
              ),
            },
            {
              header: 'Fecha',
              render: (d) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                  {formatFecha(d.fecha)}
                </span>
              ),
            },
            {
              header: '',
              align: 'right',
              render: (d) => (
                <div className="flex gap-1 justify-end">
                  {d.url && (
                    <>
                      <Button size="sm" variant="ghost" as="a" href={d.url} target="_blank">
                        Ver
                      </Button>
                      <Button size="sm" variant="primary" as="a" href={d.url} download>
                        Descargar
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </PageStateGuard>
  );
}
