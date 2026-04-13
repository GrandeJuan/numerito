import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'cliente@test.com', rol: 'CLIENTE' },
  }),
}));

import PortalDocumentosPage from './page';

describe('PortalDocumentosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    render(<PortalDocumentosPage />);
    expect(screen.getByText('Mis Documentos')).toBeInTheDocument();
  });

  it('should render grid/list toggle buttons', () => {
    render(<PortalDocumentosPage />);
    expect(screen.getByLabelText('Vista grilla')).toBeInTheDocument();
    expect(screen.getByLabelText('Vista lista')).toBeInTheDocument();
  });

  it('should render filter dropdowns', () => {
    render(<PortalDocumentosPage />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);
    expect(screen.getByText('Todos los tipos')).toBeInTheDocument();
    expect(screen.getByText('Todos los periodos')).toBeInTheDocument();
  });

  it('should render document cards with names', () => {
    render(<PortalDocumentosPage />);
    expect(screen.getByText('Balance General 2025.pdf')).toBeInTheDocument();
    expect(screen.getByText('DDJJ IVA Marzo.pdf')).toBeInTheDocument();
  });

  it('should render download buttons', () => {
    render(<PortalDocumentosPage />);
    const downloadButtons = screen.getAllByLabelText('Descargar');
    expect(downloadButtons.length).toBeGreaterThan(0);
  });

  it('should toggle between grid and list view', () => {
    render(<PortalDocumentosPage />);
    const listButton = screen.getByLabelText('Vista lista');
    fireEvent.click(listButton);
    // After clicking list, the list button should be active
    expect(listButton.className).toContain('bg-gray-200');
  });

  it('should render document type icons', () => {
    render(<PortalDocumentosPage />);
    // PDF documents should show pdf icon
    const icons = screen.getAllByText('picture_as_pdf');
    expect(icons.length).toBeGreaterThan(0);
  });
});
