import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './breadcrumbs';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

describe('Breadcrumbs', () => {
  it('renders nothing for root path', () => {
    mockPathname.mockReturnValue('/');
    const { container } = render(<Breadcrumbs />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders single segment as plain text (no link)', () => {
    mockPathname.mockReturnValue('/clientes');
    render(<Breadcrumbs />);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Clientes' })).toBeNull();
  });

  it('renders parent segments as links', () => {
    mockPathname.mockReturnValue('/clientes/123');
    render(<Breadcrumbs />);

    const clientesLink = screen.getByRole('link', { name: 'Clientes' });
    expect(clientesLink).toHaveAttribute('href', '/clientes');
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '123' })).toBeNull();
  });

  it('formats segments: capitalizes and replaces hyphens with spaces', () => {
    mockPathname.mockReturnValue('/mis-obligaciones');
    render(<Breadcrumbs />);
    expect(screen.getByText('Mis obligaciones')).toBeInTheDocument();
  });

  it('renders deep paths correctly', () => {
    mockPathname.mockReturnValue('/admin/estudios/123');
    render(<Breadcrumbs />);

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Estudios' })).toHaveAttribute('href', '/admin/estudios');
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders separator icons between segments', () => {
    mockPathname.mockReturnValue('/clientes/123');
    render(<Breadcrumbs />);

    const separators = screen.getAllByText('chevron_right');
    expect(separators).toHaveLength(1);
  });
});
