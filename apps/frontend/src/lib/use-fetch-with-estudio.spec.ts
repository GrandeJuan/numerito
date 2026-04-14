import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

let mockEstudioActual: any = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    get estudioActual() {
      return mockEstudioActual;
    },
  }),
}));

const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const mockParseApiResponse = vi.fn();
vi.mock('@/lib/parse-api-response', () => ({
  parseApiResponse: (...args: unknown[]) => mockParseApiResponse(...args),
}));

import { useFetchWithEstudio } from './use-fetch-with-estudio';

describe('useFetchWithEstudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEstudioActual = { id: 'est-1', nombre: 'Estudio Test', rol: 'SOCIO' };
  });

  it('returns loading=true initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useFetchWithEstudio('/v1/clientes'));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns data after successful fetch', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    const mockResponse = {} as Response;
    mockApiFetch.mockResolvedValue(mockResponse);
    mockParseApiResponse.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useFetchWithEstudio<typeof mockData>('/v1/clientes'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('returns error on fetch failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFetchWithEstudio('/v1/clientes'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  it('does not fetch when estudioActual is null', async () => {
    mockEstudioActual = null;

    const { result } = renderHook(() => useFetchWithEstudio('/v1/clientes'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('does not fetch when endpoint is null', async () => {
    const { result } = renderHook(() => useFetchWithEstudio(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('refetch triggers a new fetch', async () => {
    const mockResponse = {} as Response;
    mockApiFetch.mockResolvedValue(mockResponse);
    mockParseApiResponse.mockResolvedValue({ data: 'first' });

    const { result } = renderHook(() => useFetchWithEstudio('/v1/clientes'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(1);

    mockParseApiResponse.mockResolvedValue({ data: 'second' });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('ignores AbortError when component unmounts', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockApiFetch.mockRejectedValue(abortError);

    const { result, unmount } = renderHook(() => useFetchWithEstudio('/v1/clientes'));

    unmount();

    // Should not set error for abort
    expect(result.current.error).toBeNull();
  });

  it('passes signal to apiFetch', async () => {
    const mockResponse = {} as Response;
    mockApiFetch.mockResolvedValue(mockResponse);
    mockParseApiResponse.mockResolvedValue({ data: null });

    renderHook(() => useFetchWithEstudio('/v1/clientes'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });

    const callArgs = mockApiFetch.mock.calls[0];
    expect(callArgs[0]).toBe('/v1/clientes');
    expect(callArgs[1]).toHaveProperty('signal');
    expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
  });
});
