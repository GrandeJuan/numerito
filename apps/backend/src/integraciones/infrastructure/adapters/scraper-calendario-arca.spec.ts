import * as fs from 'fs';
import * as path from 'path';
import { ScraperCalendarioARCA } from './scraper-calendario-arca';
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
    selectOption: jest.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return { browser: mockBrowser, page: mockPage };
}

describe('ScraperCalendarioARCA', () => {
  it('should extract reglas from fixture HTML', async () => {
    const html = loadFixture('arca-vencimientos-iva-2026-05.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0, vigenciaDesde: '2026-01-01' },
    );

    const result = await scraper.scrapear('ARCA');

    expect(result.fuente).toBe('ARCA');
    expect(result.reglas.length).toBe(70); // 7 conceptos × 10 terminaciones
    expect(result.ejecutadoEn).toBeDefined();

    // Verify IVA rule
    const ivaT0 = result.reglas.find(
      (r) => r.tipoObligacion === TIPO_OBLIGACION.IVA && r.terminacionCuit === '0',
    );
    expect(ivaT0).toBeDefined();
    expect(ivaT0!.diaVencimiento).toBe(18);
    expect(ivaT0!.jurisdiccion).toBe(JURISDICCION.ARCA);
  });

  it('should return empty reglas for empty page', async () => {
    const html = loadFixture('arca-vencimientos-empty.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('ARCA');

    expect(result.fuente).toBe('ARCA');
    expect(result.reglas).toHaveLength(0);
    expect(result.errores).toHaveLength(0);
  });

  it('should handle malformed page gracefully', async () => {
    const html = loadFixture('arca-vencimientos-malformed.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('ARCA');

    expect(result.fuente).toBe('ARCA');
    expect(result.reglas).toHaveLength(0);
    // Should not crash
  });

  it('should handle browser launch failure gracefully', async () => {
    const scraper = new ScraperCalendarioARCA(
      () => Promise.reject(new Error('Chromium not found')),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('ARCA');

    expect(result.fuente).toBe('ARCA');
    expect(result.reglas).toHaveLength(0);
    expect(result.errores.length).toBeGreaterThan(0);
    expect(result.errores[0]).toContain('Chromium not found');
  });

  it('should close browser even on error', async () => {
    const html = loadFixture('arca-vencimientos-iva-2026-05.html');
    const { browser, page } = createMockBrowser(html);
    page.content.mockRejectedValue(new Error('Navigation failed'));

    const scraper = new ScraperCalendarioARCA(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0 },
    );

    await scraper.scrapear('ARCA');

    expect(browser.close).toHaveBeenCalled();
  });

  it('should deduplicate rules across months with same natural key', async () => {
    // When scraping 2 months, same obligation appears with different dates.
    // The scraper should keep only the latest (last month scraped).
    const html = loadFixture('arca-vencimientos-iva-2026-05.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 1, vigenciaDesde: '2026-01-01' },
    );

    const result = await scraper.scrapear('ARCA');

    // With deduplication, we should have unique (tipo × jurisdiccion × regimen × terminacion)
    const keys = new Set(
      result.reglas.map(
        (r) => `${r.tipoObligacion}|${r.jurisdiccion}|${r.regimen}|${r.terminacionCuit}`,
      ),
    );
    expect(keys.size).toBe(result.reglas.length);
  });

  it('should set vigenciaDesde from config', async () => {
    const html = loadFixture('arca-vencimientos-iva-2026-05.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(
      () => Promise.resolve(browser as any),
      { mesesAdelante: 0, vigenciaDesde: '2026-04-01' },
    );

    const result = await scraper.scrapear('ARCA');

    for (const regla of result.reglas) {
      expect(regla.vigenciaDesde).toBe('2026-04-01');
    }
  });
});
