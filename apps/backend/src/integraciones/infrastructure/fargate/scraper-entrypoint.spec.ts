/**
 * Tests for the Fargate scraper entry point.
 * Tests the config loading, scraper factory, and POST logic without launching Playwright.
 */

import { loadConfig, createScraper, type EntrypointConfig } from './scraper-entrypoint';

describe('scraper-entrypoint config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should require BACKEND_URL', () => {
    delete process.env.BACKEND_URL;
    process.env.INGESTA_SECRET = 'secret';

    expect(() => loadConfig()).toThrow('BACKEND_URL');
  });

  it('should require INGESTA_SECRET', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    delete process.env.INGESTA_SECRET;

    expect(() => loadConfig()).toThrow('INGESTA_SECRET');
  });

  it('should reject unsupported FUENTE', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    process.env.FUENTE = 'INVALID_SOURCE';

    expect(() => loadConfig()).toThrow('Unsupported FUENTE');
  });

  it('should default FUENTE to ARCA', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    delete process.env.FUENTE;

    const config = loadConfig();
    expect(config.fuente).toBe('ARCA');
  });

  it('should accept ARBA as FUENTE', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    process.env.FUENTE = 'ARBA';

    const config = loadConfig();
    expect(config.fuente).toBe('ARBA');
  });

  it('should accept AGIP as FUENTE', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    process.env.FUENTE = 'AGIP';

    const config = loadConfig();
    expect(config.fuente).toBe('AGIP');
  });

  it('should accept BCRA_FERIADOS as FUENTE', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    process.env.FUENTE = 'BCRA_FERIADOS';

    const config = loadConfig();
    expect(config.fuente).toBe('BCRA_FERIADOS');
  });

  it('should default MESES_ADELANTE to 0', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    delete process.env.MESES_ADELANTE;

    const config = loadConfig();
    expect(config.mesesAdelante).toBe(0);
  });

  it('should default DISPARADOR to SCHEDULE', () => {
    process.env.BACKEND_URL = 'https://api.test.com';
    process.env.INGESTA_SECRET = 'secret';
    delete process.env.DISPARADOR;

    const config = loadConfig();
    expect(config.disparador).toBe('SCHEDULE');
  });

  it('should strip trailing slash from BACKEND_URL', () => {
    process.env.BACKEND_URL = 'https://api.test.com/';
    process.env.INGESTA_SECRET = 'secret';

    const config = loadConfig();
    expect(config.backendUrl).toBe('https://api.test.com');
  });
});

describe('createScraper', () => {
  const baseConfig: EntrypointConfig = {
    backendUrl: 'https://api.test.com',
    ingestaSecret: 'secret',
    fuente: 'ARCA',
    mesesAdelante: 2,
    disparador: 'SCHEDULE',
    disparadoPor: null,
    ejecucionId: null,
  };

  it('creates ScraperCalendarioARCA for ARCA', () => {
    const scraper = createScraper({ ...baseConfig, fuente: 'ARCA' });
    expect(scraper).toBeDefined();
    expect(scraper.constructor.name).toBe('ScraperCalendarioARCA');
  });

  it('creates ScraperCalendarioARBA for ARBA', () => {
    const scraper = createScraper({ ...baseConfig, fuente: 'ARBA' });
    expect(scraper).toBeDefined();
    expect(scraper.constructor.name).toBe('ScraperCalendarioARBA');
  });

  it('creates ScraperCalendarioAGIP for AGIP', () => {
    const scraper = createScraper({ ...baseConfig, fuente: 'AGIP' });
    expect(scraper).toBeDefined();
    expect(scraper.constructor.name).toBe('ScraperCalendarioAGIP');
  });

  it('creates ScraperFeriadosBCRA for BCRA_FERIADOS', () => {
    const scraper = createScraper({ ...baseConfig, fuente: 'BCRA_FERIADOS' });
    expect(scraper).toBeDefined();
    expect(scraper.constructor.name).toBe('ScraperFeriadosBCRA');
  });
});
