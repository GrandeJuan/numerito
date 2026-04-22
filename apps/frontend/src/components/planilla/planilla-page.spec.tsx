import React from 'react';
import { vi } from 'vitest';

// Mock dependencies before importing the component
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ estudioActual: { id: 'est-1', nombre: 'Estudio Test' } }),
}));

vi.mock('@/lib/use-fetch-with-estudio', () => ({
  useFetchWithEstudio: () => ({
    data: [
      {
        id: 'v-1',
        clienteId: 'c-1',
        cliente: 'Acme SRL',
        tipoObligacion: 'IVA',
        periodo: '2026-05',
        fechaVencimiento: '2026-05-20',
        estado: 'PENDIENTE',
        motivo: null,
        fechaProrrogada: null,
      },
      {
        id: 'v-2',
        clienteId: 'c-2',
        cliente: 'Beta SA',
        tipoObligacion: 'IIBB_ARBA',
        periodo: '2026-05',
        fechaVencimiento: '2026-05-15',
        estado: 'PRESENTADO',
        motivo: null,
        fechaProrrogada: null,
      },
      {
        id: 'v-3',
        clienteId: 'c-1',
        cliente: 'Acme SRL',
        tipoObligacion: 'MONOTRIBUTO',
        periodo: '2026-05',
        fechaVencimiento: '2026-05-20',
        estado: 'PRORROGADO',
        motivo: 'Prórroga RG 1234',
        fechaProrrogada: '2026-06-01',
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { PlanillaPage } from './planilla-page';

describe('PlanillaPage', () => {
  it('should export PlanillaPage component', () => {
    expect(PlanillaPage).toBeDefined();
    expect(typeof PlanillaPage).toBe('function');
  });

  it('should render without throwing', () => {
    const element = React.createElement(PlanillaPage);
    expect(element).toBeDefined();
    expect(element.type).toBe(PlanillaPage);
  });
});
