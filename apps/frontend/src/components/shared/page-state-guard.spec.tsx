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

  it('shows loading message when loading is true', () => {
    render(
      <PageStateGuard estudioActual={estudio} loading={true} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows error message when error is present', () => {
    render(
      <PageStateGuard estudioActual={estudio} loading={false} error="Algo salio mal">
        <p>Content</p>
      </PageStateGuard>,
    );
    expect(screen.getByText('Algo salio mal')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('uses custom icon when provided', () => {
    const { container } = render(
      <PageStateGuard estudioActual={null} loading={false} error={null} icon="search">
        <p>Content</p>
      </PageStateGuard>,
    );
    const icon = container.querySelector('.material-symbols-outlined');
    expect(icon?.textContent).toBe('search');
  });

  it('uses default icon when not provided', () => {
    const { container } = render(
      <PageStateGuard estudioActual={null} loading={false} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    const icon = container.querySelector('.material-symbols-outlined');
    expect(icon?.textContent).toBe('hourglass_empty');
  });

  it('prioritizes estudio check over loading state', () => {
    render(
      <PageStateGuard estudioActual={null} loading={true} error={null}>
        <p>Content</p>
      </PageStateGuard>,
    );
    // estudioActual null takes precedence over loading
    expect(screen.getByText('Cargando estudio...')).toBeInTheDocument();
  });

  it('prioritizes loading over error state', () => {
    render(
      <PageStateGuard estudioActual={estudio} loading={true} error="Some error">
        <p>Content</p>
      </PageStateGuard>,
    );
    // loading takes precedence over error
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});
