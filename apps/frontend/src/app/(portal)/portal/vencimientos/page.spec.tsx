import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortalVencimientosPage from './page';

describe('PortalVencimientosPage', () => {
  it('renders empty state with title', () => {
    render(<PortalVencimientosPage />);
    expect(screen.getByText('Mis vencimientos')).toBeInTheDocument();
  });
});
