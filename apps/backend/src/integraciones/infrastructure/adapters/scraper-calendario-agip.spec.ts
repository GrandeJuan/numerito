import * as fs from 'fs';
import * as path from 'path';
import { ScraperCalendarioAGIP } from './scraper-calendario-agip';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', name),
    'utf-8',
  );
}

function createMockBrowser(htmlContent: string) {
  const mockPage = {
    setDefaultTimeout: jest.fn(),
    goto: jest.fn().mockResolvedValue(undefined),
    content: jest.fn().mockResolvedValue(htmlContent),
    locator: jest.fn().mockReturnValue({ count: jest.fn().mockResolvedValue(0) }),
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return { browser: mockBrowser, page: mockPage };
}

describe('ScraperCalendarioAGIP', () => {
  it('should extract reglas from fixture HTML', async () => {
    const html = loadFixture('agip-vencimientos-2026-05.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioAGIP(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0, vigenciaDesde: '2026-01-01' },
    );

    const result = await scraper.scrapear('AGIP');

    expect(result.fuente).toBe('AGIP');
    expect(result.reglas.length).toBe(50); // 5 IIBB concepts × 10 terminaciones
    expect(result.ejecutadoEn).toBeDefined();

    const iibbT0 = result.reglas.find(
      (r) => r.tipoObligacion === TIPO_OBLIGACION.IIBB_AGIP && r.terminacionCuit === '0',
    );
    expect(iibbT0).toBeDefined();
    expect(iibbT0!.jurisdiccion).toBe(JURISDICCION.AGIP);
  });

  it('should return empty reglas for empty page', async () => {
    const html = loadFixture('agip-vencimientos-empty.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioAGIP(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('AGIP');

    expect(result.fuente).toBe('AGIP');
    expect(result.reglas).toHaveLength(0);
  });

  it('should handle malformed page gracefully', async () => {
    const html = loadFixture('agip-vencimientos-malformed.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioAGIP(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('AGIP');

    expect(result.fuente).toBe('AGIP');
    expect(result.reglas).toHaveLength(0);
  });

  it('should handle browser launch failure gracefully', async () => {
    const scraper = new ScraperCalendarioAGIP(
      () => Promise.reject(new Error('Chromium not found')),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('AGIP');

    expect(result.fuente).toBe('AGIP');
    expect(result.reglas).toHaveLength(0);
    expect(result.errores.length).toBeGreaterThan(0);
    expect(result.errores[0]).toContain('Chromium not found');
  });

  it('should close browser even on error', async () => {
    const html = loadFixture('agip-vencimientos-2026-05.html');
    const { browser, page } = createMockBrowser(html);
    page.content.mockRejectedValue(new Error('Navigation failed'));

    const scraper = new ScraperCalendarioAGIP(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0 },
    );

    await scraper.scrapear('AGIP');

    expect(browser.close).toHaveBeenCalled();
  });

  it('should deduplicate rules across months with same natural key', async () => {
    const html = loadFixture('agip-vencimientos-2026-05.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioAGIP(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 1, vigenciaDesde: '2026-01-01' },
    );

    const result = await scraper.scrapear('AGIP');

    const keys = new Set(
      result.reglas.map(
        (r) => `${r.tipoObligacion}|${r.jurisdiccion}|${r.regimen}|${r.terminacionCuit}`,
      ),
    );
    expect(keys.size).toBe(result.reglas.length);
  });

  it('should reject wrong fuente', async () => {
    const html = loadFixture('agip-vencimientos-2026-05.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioAGIP(
      () => Promise.resolve(browser as any),
    );

    const result = await scraper.scrapear('ARCA' as any);

    expect(result.reglas).toHaveLength(0);
    expect(result.errores[0]).toContain('solo soporta fuente AGIP');
  });
});
