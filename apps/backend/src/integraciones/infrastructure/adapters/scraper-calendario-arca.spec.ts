import * as fs from 'fs';
import * as path from 'path';
import { ScraperCalendarioARCA } from './scraper-calendario-arca';
import { TIPO_OBLIGACION, JURISDICCION } from '@numerito/shared';

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf-8');
}

function createMockBrowser(htmlContent: string) {
  const mockPage = {
    setDefaultTimeout: jest.fn(),
    goto: jest.fn().mockResolvedValue(undefined),
    content: jest.fn().mockResolvedValue(htmlContent),
    fill: jest.fn().mockResolvedValue(undefined),
    selectOption: jest.fn().mockResolvedValue(undefined),
    evaluate: jest.fn().mockResolvedValue(undefined),
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
    waitForURL: jest.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return { browser: mockBrowser, page: mockPage };
}

describe('ScraperCalendarioARCA', () => {
  it('fills form + submits + returns parsed reglas from fixture', async () => {
    const html = loadFixture('arca-vencimientos-2026-04.html');
    const { browser, page } = createMockBrowser(html);

    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 0,
      vigenciaDesde: '2026-01-01',
    });

    const result = await scraper.scrapear('ARCA');

    expect(result.fuente).toBe('ARCA');
    expect(result.reglas.length).toBeGreaterThan(0);

    // Verify form was filled with a date range for the current month.
    expect(page.fill).toHaveBeenCalledWith(
      'input[name="fechaVDesde"]',
      expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
    );
    expect(page.fill).toHaveBeenCalledWith(
      'input[name="fechaVHasta"]',
      expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/),
    );
    expect(page.selectOption).toHaveBeenCalledWith('select[name="terminacionCuit"]', 'Todos');

    // Verify form.submit() path was invoked via evaluate.
    expect(page.evaluate).toHaveBeenCalled();
    const evalArg = (page.evaluate.mock.calls[0][0] as string) ?? '';
    expect(evalArg).toContain('consultaVencimientoForm');
    expect(evalArg).toContain('impuestosSeleccionados');
    expect(evalArg).toContain('999');

    // At least one IVA regla should come out of the real fixture.
    const iva = result.reglas.find((r) => r.tipoObligacion === TIPO_OBLIGACION.IVA);
    expect(iva).toBeDefined();
    expect(iva!.jurisdiccion).toBe(JURISDICCION.ARCA);
  });

  it('returns empty reglas for empty fixture', async () => {
    const html = loadFixture('arca-vencimientos-empty.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 0,
    });

    const result = await scraper.scrapear('ARCA');
    expect(result.reglas).toHaveLength(0);
  });

  it('does not crash on malformed page', async () => {
    const html = loadFixture('arca-vencimientos-malformed.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 0,
    });

    const result = await scraper.scrapear('ARCA');
    expect(result.reglas).toHaveLength(0);
  });

  it('reports error and yields empty reglas when browser launch fails', async () => {
    const scraper = new ScraperCalendarioARCA(
      () => Promise.reject(new Error('Chromium not found')),
      { mesesAdelante: 0 },
    );

    const result = await scraper.scrapear('ARCA');
    expect(result.reglas).toHaveLength(0);
    expect(result.errores.length).toBeGreaterThan(0);
    expect(result.errores[0]).toContain('Chromium not found');
  });

  it('closes browser even if page.content() rejects', async () => {
    const html = loadFixture('arca-vencimientos-2026-04.html');
    const { browser, page } = createMockBrowser(html);
    page.content.mockRejectedValue(new Error('Navigation failed'));

    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 0,
    });

    await scraper.scrapear('ARCA');
    expect(browser.close).toHaveBeenCalled();
  });

  it('deduplicates across months by natural key (last month wins)', async () => {
    const html = loadFixture('arca-vencimientos-2026-04.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 1,
      vigenciaDesde: '2026-01-01',
    });

    const result = await scraper.scrapear('ARCA');
    const keys = new Set(
      result.reglas.map(
        (r) => `${r.tipoObligacion}|${r.jurisdiccion}|${r.regimen}|${r.terminacionCuit}`,
      ),
    );
    expect(keys.size).toBe(result.reglas.length);
  });

  it('applies vigenciaDesde from config to every regla', async () => {
    const html = loadFixture('arca-vencimientos-2026-04.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 0,
      vigenciaDesde: '2026-04-01',
    });

    const result = await scraper.scrapear('ARCA');
    for (const regla of result.reglas) {
      expect(regla.vigenciaDesde).toBe('2026-04-01');
    }
  });

  it('reports unmapped impuestos in errores', async () => {
    const html = loadFixture('arca-vencimientos-2026-04.html');
    const { browser } = createMockBrowser(html);
    const scraper = new ScraperCalendarioARCA(() => Promise.resolve(browser as any), {
      mesesAdelante: 0,
      vigenciaDesde: '2026-01-01',
    });

    const result = await scraper.scrapear('ARCA');
    const sinMapeo = result.errores.find((e) => e.startsWith('Conceptos sin mapeo'));
    expect(sinMapeo).toBeDefined();
  });
});
