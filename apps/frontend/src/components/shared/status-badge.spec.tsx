import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders status text by default', () => {
    render(<StatusBadge status="PENDIENTE" />);
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<StatusBadge status="PENDIENTE" label="Pendiente" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('applies correct color classes for known status', () => {
    const { container } = render(<StatusBadge status="PENDIENTE" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-amber');
  });

  it('applies fallback classes for unknown status', () => {
    const { container } = render(<StatusBadge status="UNKNOWN" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-gray');
  });
});
