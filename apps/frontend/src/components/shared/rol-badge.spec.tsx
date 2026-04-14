import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RolBadge } from './rol-badge';

describe('RolBadge', () => {
  it('renders rol text by default', () => {
    render(<RolBadge rol="SUPERADMIN" />);
    expect(screen.getByText('SUPERADMIN')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<RolBadge rol="SUPERADMIN" label="Super Admin" />);
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });

  it('applies correct color classes for known rol', () => {
    const { container } = render(<RolBadge rol="SOCIO" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-indigo');
  });

  it('applies fallback classes for unknown rol', () => {
    const { container } = render(<RolBadge rol="UNKNOWN_ROL" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-indigo-100');
    expect(badge?.className).toContain('text-indigo-800');
  });

  it('renders as inline-flex rounded-full badge', () => {
    const { container } = render(<RolBadge rol="EMPLEADO" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('inline-flex');
    expect(badge?.className).toContain('rounded-full');
    expect(badge?.className).toContain('text-xs');
  });
});
