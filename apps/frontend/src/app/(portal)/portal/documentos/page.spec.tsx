import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortalDocumentosPage from './page';

describe('PortalDocumentosPage', () => {
  it('renders empty state with title', () => {
    render(<PortalDocumentosPage />);
    expect(screen.getByText('Mis documentos')).toBeInTheDocument();
  });
});
