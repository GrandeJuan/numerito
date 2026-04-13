import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard icon="group" label="Clientes" value={25} />);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders icon text', () => {
    render(<KpiCard icon="payments" label="Facturacion" value="$100.000" />);
    expect(screen.getByText('payments')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<KpiCard icon="attach_money" label="Total" value="$1.500" />);
    expect(screen.getByText('$1.500')).toBeInTheDocument();
  });
});
