import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageStateGuard } from './page-state-guard';

const estudio = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };

describe('PageStateGuard', () => {
  it('renders children when estudio is present, not loading, no error', () => {
    render(
      <PageStateGuard estudioActual={estudio} loading={false} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows estudio loading message when estudioActual is null', () => {
    render(
      <PageStateGuard estudioActual={null} loading={false} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders skeleton when loading is true', () => {
    const { container } = render(
      <PageStateGuard estudioActual={estudio} loading={true} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders error state when error is present', () => {
    render(
      <PageStateGuard estudioActual={estudio} loading={false} error="Algo salio mal">
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('prioritizes estudio check over loading state', () => {
    render(
      <PageStateGuard estudioActual={null} loading={true} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });

  it('prioritizes loading over error state', () => {
    const { container } = render(
      <PageStateGuard estudioActual={estudio} loading={true} error="Some error">
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('works without estudioActual prop (profile/admin pages)', () => {
    render(
      <PageStateGuard loading={false} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
