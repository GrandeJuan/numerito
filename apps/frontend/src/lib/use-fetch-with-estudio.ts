'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from './api-client';
import { parseApiResponse } from './parse-api-response';
import { useAuth } from './auth-context';

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetchWithEstudio<T>(endpoint: string | null): UseFetchResult<T> {
  const { estudioActual } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!estudioActual || !endpoint) {
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    apiFetch(endpoint, { signal: controller.signal })
      .then((res) => parseApiResponse<T>(res))
      .then(({ data: parsed }) => {
        setData(parsed);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [estudioActual, endpoint, trigger]);

  return { data, loading, error, refetch };
}
