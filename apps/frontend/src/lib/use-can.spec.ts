import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

let mockPermisos: string[] = [];

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    tienePermiso: (permiso: string) => mockPermisos.includes(permiso),
  }),
}));

import { useCan } from './use-can';

describe('useCan', () => {
  beforeEach(() => {
    mockPermisos = [];
  });

  it('returns true when the user has the permission', () => {
    mockPermisos = ['VER_CLIENTES', 'EDITAR_CLIENTES'];
    const { result } = renderHook(() => useCan('VER_CLIENTES'));
    expect(result.current).toBe(true);
  });

  it('returns false when the user does not have the permission', () => {
    mockPermisos = ['VER_CLIENTES'];
    const { result } = renderHook(() => useCan('EDITAR_CLIENTES'));
    expect(result.current).toBe(false);
  });

  it('returns false when the user has no permissions', () => {
    mockPermisos = [];
    const { result } = renderHook(() => useCan('VER_CLIENTES'));
    expect(result.current).toBe(false);
  });

  it('reacts to permission changes', () => {
    mockPermisos = [];
    const { result, rerender } = renderHook(() => useCan('VER_CLIENTES'));
    expect(result.current).toBe(false);

    mockPermisos = ['VER_CLIENTES'];
    rerender();
    expect(result.current).toBe(true);
  });
});
