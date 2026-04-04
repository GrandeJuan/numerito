import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Can } from './can';

// Mock useAuth
const mockTienePermiso = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    tienePermiso: mockTienePermiso,
  }),
}));

describe('Can', () => {
  beforeEach(() => {
    mockTienePermiso.mockReset();
  });

  it('renders children when user has the permission', () => {
    mockTienePermiso.mockReturnValue(true);

    render(
      <Can permission="VER_CLIENTES">
        <span data-testid="protected">Contenido protegido</span>
      </Can>,
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(mockTienePermiso).toHaveBeenCalledWith('VER_CLIENTES');
  });

  it('renders nothing when user lacks the permission', () => {
    mockTienePermiso.mockReturnValue(false);

    const { container } = render(
      <Can permission="EDITAR_CLIENTES">
        <span data-testid="protected">Contenido protegido</span>
      </Can>,
    );

    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  it('renders fallback when user lacks permission and fallback is provided', () => {
    mockTienePermiso.mockReturnValue(false);

    render(
      <Can permission="EDITAR_CLIENTES" fallback={<span data-testid="fallback">Sin acceso</span>}>
        <span data-testid="protected">Contenido protegido</span>
      </Can>,
    );

    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.getByTestId('fallback').textContent).toBe('Sin acceso');
  });

  it('re-renders when permission check result changes', () => {
    mockTienePermiso.mockReturnValue(false);

    const { rerender } = render(
      <Can permission="VER_CLIENTES">
        <span data-testid="protected">Visible</span>
      </Can>,
    );

    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();

    // Simulate permission change (e.g., after studio switch)
    mockTienePermiso.mockReturnValue(true);

    rerender(
      <Can permission="VER_CLIENTES">
        <span data-testid="protected">Visible</span>
      </Can>,
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
});
