import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'cliente@test.com', rol: 'CLIENTE' },
  }),
}));

import PortalObligacionesPage from './page';

describe('PortalObligacionesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    render(<PortalObligacionesPage />);
    expect(screen.getByText('Mis Obligaciones')).toBeInTheDocument();
  });

  it('should render 3 KPI cards', () => {
    render(<PortalObligacionesPage />);
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
    expect(screen.getByText('Presentadas')).toBeInTheDocument();
  });

  it('should render timeline with colored dots', () => {
    render(<PortalObligacionesPage />);
    expect(screen.getByTestId('obligaciones-timeline')).toBeInTheDocument();
  });

  it('should render read-only table with obligation data', () => {
    render(<PortalObligacionesPage />);
    expect(screen.getAllByText('IVA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ganancias').length).toBeGreaterThan(0);
    expect(screen.getAllByText('IIBB').length).toBeGreaterThan(0);
  });

  it('should render estado badges', () => {
    render(<PortalObligacionesPage />);
    const pendientes = screen.getAllByText('Pendiente');
    expect(pendientes.length).toBeGreaterThan(0);
  });

  it('should NOT render action buttons (read-only)', () => {
    render(<PortalObligacionesPage />);
    expect(screen.queryByText('Presentar')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  it('should render contact note at bottom', () => {
    render(<PortalObligacionesPage />);
    expect(screen.getByText(/contacte a su estudio contable/)).toBeInTheDocument();
  });

  it('should render table columns', () => {
    render(<PortalObligacionesPage />);
    expect(screen.getByText('Obligacion')).toBeInTheDocument();
    expect(screen.getByText('Periodo')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });
});
