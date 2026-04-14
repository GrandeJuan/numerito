import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock recharts to avoid canvas issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
}));

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

  it('renders delta when provided', () => {
    render(<KpiCard icon="group" label="Test" value={10} delta="+5%" deltaUp={true} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('vs mes ant.')).toBeInTheDocument();
  });

  it('applies correct color class for positive delta', () => {
    render(<KpiCard icon="group" label="Test" value={10} delta="+5%" deltaUp={true} />);
    const delta = screen.getByText('+5%');
    expect(delta.className).toContain('text-[#00a472]');
  });

  it('applies correct color class for negative delta', () => {
    render(<KpiCard icon="group" label="Test" value={10} delta="-3%" deltaUp={false} />);
    const delta = screen.getByText('-3%');
    expect(delta.className).toContain('text-[#93000a]');
  });

  it('renders sparkline chart when data is provided', () => {
    render(<KpiCard icon="group" label="Test" value={10} sparkline={[1, 2, 3, 4, 5]} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('does not render sparkline when no data', () => {
    render(<KpiCard icon="group" label="Test" value={10} />);
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
  });

  it('does not render delta when not provided', () => {
    render(<KpiCard icon="group" label="Test" value={10} />);
    expect(screen.queryByText('vs mes ant.')).not.toBeInTheDocument();
  });
});
