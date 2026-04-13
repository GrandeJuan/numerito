import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, type Column } from './data-table';

interface TestRow {
  id: string;
  name: string;
  value: number;
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Nombre', render: (r) => r.name },
  { key: 'value', header: 'Valor', align: 'right', render: (r) => `$${r.value}` },
];

const data: TestRow[] = [
  { id: '1', name: 'Alpha', value: 100 },
  { id: '2', name: 'Beta', value: 200 },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('renders empty message when no data', () => {
    render(
      <DataTable columns={columns} data={[]} rowKey={(r) => r.id} emptyMessage="Sin datos." />,
    );
    expect(screen.getByText('Sin datos.')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        footer={<span>2 resultados</span>}
      />,
    );
    expect(screen.getByText('2 resultados')).toBeInTheDocument();
  });
});
