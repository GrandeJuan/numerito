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
    mockPathname.mockReturnValue('/dashboard');
    render(<Breadcrumbs />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Single segment should not be a link
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders parent segments as links', () => {
    mockPathname.mockReturnValue('/dashboard/clientes');
    render(<Breadcrumbs />);

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    // Last segment is plain text
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Clientes' })).toBeNull();
  });

  it('formats segments: capitalizes and replaces hyphens with spaces', () => {
    mockPathname.mockReturnValue('/dashboard/mis-obligaciones');
    render(<Breadcrumbs />);
    expect(screen.getByText('Mis obligaciones')).toBeInTheDocument();
  });

  it('renders deep paths correctly', () => {
    mockPathname.mockReturnValue('/dashboard/clientes/123');
    render(<Breadcrumbs />);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('href', '/dashboard/clientes');
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '123' })).toBeNull();
  });

  it('renders separator icons between segments', () => {
    mockPathname.mockReturnValue('/dashboard/clientes/123');
    render(<Breadcrumbs />);

    const separators = screen.getAllByText('chevron_right');
    expect(separators).toHaveLength(2);
  });
});
