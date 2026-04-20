import * as fs from 'fs';
import * as path from 'path';
import { ScraperFeriadosBCRA } from './scraper-feriados-bcra';
import { TIPO_FERIADO } from '@numerito/shared';

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

describe('ScraperFeriadosBCRA', () => {
  it('should extract feriados from fixture HTML', async () => {
    const html = loadFixture('bcra-feriados-2026.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperFeriadosBCRA(
      () => Promise.resolve(browser as any),
      { anio: 2026 },
    );

    const result = await scraper.scrapear('BCRA_FERIADOS');

    expect(result.fuente).toBe('BCRA_FERIADOS');
    expect(result.reglas).toHaveLength(0); // BCRA produces feriados, not reglas
    expect(result.feriados).toBeDefined();
    expect(result.feriados!.length).toBe(19);
    expect(result.ejecutadoEn).toBeDefined();
  });

  it('should classify NACIONAL and BANCARIO feriados correctly', async () => {
    const html = loadFixture('bcra-feriados-2026.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperFeriadosBCRA(
      () => Promise.resolve(browser as any),
      { anio: 2026 },
    );

    const result = await scraper.scrapear('BCRA_FERIADOS');

    const nacionales = result.feriados!.filter((f) => f.tipo === TIPO_FERIADO.NACIONAL);
    const bancarios = result.feriados!.filter((f) => f.tipo === TIPO_FERIADO.BANCARIO);

    expect(nacionales.length).toBe(16);
    expect(bancarios.length).toBe(3);
  });

  it('should return empty feriados for empty page', async () => {
    const html = loadFixture('bcra-feriados-empty.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperFeriadosBCRA(
      () => Promise.resolve(browser as any),
    );

    const result = await scraper.scrapear('BCRA_FERIADOS');

    expect(result.fuente).toBe('BCRA_FERIADOS');
    expect(result.reglas).toHaveLength(0);
    expect(result.feriados).toHaveLength(0);
  });

  it('should handle browser launch failure gracefully', async () => {
    const scraper = new ScraperFeriadosBCRA(
      () => Promise.reject(new Error('Chromium not found')),
    );

    const result = await scraper.scrapear('BCRA_FERIADOS');

    expect(result.fuente).toBe('BCRA_FERIADOS');
    expect(result.reglas).toHaveLength(0);
    expect(result.feriados).toHaveLength(0);
    expect(result.errores.length).toBeGreaterThan(0);
    expect(result.errores[0]).toContain('Chromium not found');
  });

  it('should close browser even on error', async () => {
    const html = loadFixture('bcra-feriados-2026.html');
    const { browser, page } = createMockBrowser(html);
    page.content.mockRejectedValue(new Error('Navigation failed'));

    const scraper = new ScraperFeriadosBCRA(
      () => Promise.resolve(browser as any),
    );

    await scraper.scrapear('BCRA_FERIADOS');

    expect(browser.close).toHaveBeenCalled();
  });

  it('should reject wrong fuente', async () => {
    const html = loadFixture('bcra-feriados-2026.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperFeriadosBCRA(
      () => Promise.resolve(browser as any),
    );

    const result = await scraper.scrapear('ARCA' as any);

    expect(result.reglas).toHaveLength(0);
    expect(result.errores[0]).toContain('solo soporta fuente BCRA_FERIADOS');
  });
});
