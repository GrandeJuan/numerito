import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import ConfiguracionIndex from './page';
import { redirect } from 'next/navigation';

describe('ConfiguracionIndex', () => {
  it('redirects to /configuracion/estudio', () => {
    try {
      ConfiguracionIndex();
    } catch {
      // redirect() throws per next/navigation contract
    }
    expect(redirect).toHaveBeenCalledWith('/configuracion/estudio');
  });
});
