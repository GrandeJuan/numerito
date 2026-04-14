import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrioridadBadge } from './prioridad-badge';

describe('PrioridadBadge', () => {
  it('renders prioridad text by default', () => {
    render(<PrioridadBadge prioridad="ALTA" />);
    expect(screen.getByText('ALTA')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<PrioridadBadge prioridad="ALTA" label="Alta Prioridad" />);
    expect(screen.getByText('Alta Prioridad')).toBeInTheDocument();
  });

  it('applies correct color classes for BAJA', () => {
    const { container } = render(<PrioridadBadge prioridad="BAJA" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-gray');
  });

  it('applies correct color classes for MEDIA', () => {
    const { container } = render(<PrioridadBadge prioridad="MEDIA" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-blue');
  });

  it('applies correct color classes for ALTA', () => {
    const { container } = render(<PrioridadBadge prioridad="ALTA" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-amber');
  });

  it('applies correct color classes for URGENTE', () => {
    const { container } = render(<PrioridadBadge prioridad="URGENTE" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-red');
  });

  it('applies fallback classes for unknown prioridad', () => {
    const { container } = render(<PrioridadBadge prioridad="UNKNOWN" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-gray-100');
    expect(badge?.className).toContain('text-gray-700');
  });

  it('renders as inline-flex rounded-full badge', () => {
    const { container } = render(<PrioridadBadge prioridad="MEDIA" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('inline-flex');
    expect(badge?.className).toContain('rounded-full');
    expect(badge?.className).toContain('text-xs');
  });
});
