import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    estudioActual: { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' },
    user: {
      id: 'u-1',
      email: 'admin@test.com',
      rol: 'SOCIO',
      nombre: 'Admin',
      apellido: 'Demo',
      avatarUrl: null,
    },
    refreshUser: vi.fn(),
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
  setEstudioId: vi.fn(),
  setOnUnauthorized: vi.fn(),
}));

import PerfilPage from './page';

describe('PerfilPage', () => {
  it('renders profile title', () => {
    render(<PerfilPage />);
    expect(screen.getByText('Mi perfil')).toBeInTheDocument();
  });

  it('renders nombre and apellido fields with current values', () => {
    render(<PerfilPage />);
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Admin');
    expect((screen.getByLabelText('Apellido') as HTMLInputElement).value).toBe('Demo');
  });

  it('renders read-only account info', () => {
    render(<PerfilPage />);
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SOCIO').length).toBeGreaterThan(0);
  });
});
