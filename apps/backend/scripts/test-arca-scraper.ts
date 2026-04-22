/**
 * Manual run of the ARCA scraper against the live site.
 * Usage: pnpm tsx scripts/test-arca-scraper.ts
 */

import { ScraperCalendarioARCA } from '../src/integraciones/infrastructure/adapters/scraper-calendario-arca';

async function main() {
  const scraper = new ScraperCalendarioARCA(ScraperCalendarioARCA.defaultBrowserFactory(), {
    mesesAdelante: 0,
    vigenciaDesde: new Date().toISOString().slice(0, 10),
  });

  console.log('[arca-test] scraping live site...');
  const t0 = Date.now();
  const result = await scraper.scrapear('ARCA');
  const ms = Date.now() - t0;

  console.log(`[arca-test] done in ${ms}ms`);
  console.log(`  fuente:         ${result.fuente}`);
  console.log(`  ejecutadoEn:    ${result.ejecutadoEn}`);
  console.log(`  reglas totales: ${result.reglas.length}`);
  console.log(`  errores:        ${result.errores.length}`);

  if (result.errores.length > 0) {
    console.log('\n[arca-test] errores (primeros 10):');
    for (const e of result.errores.slice(0, 10)) console.log(`  - ${e}`);
  }

  // Group reglas by tipoObligacion for visibility
  const byTipo = new Map<string, number>();
  for (const r of result.reglas)
    byTipo.set(r.tipoObligacion, (byTipo.get(r.tipoObligacion) ?? 0) + 1);

  console.log('\n[arca-test] reglas por tipoObligacion:');
  for (const [tipo, count] of Array.from(byTipo.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tipo.padEnd(30)} ${count}`);
  }

  console.log('\n[arca-test] primeras 5 reglas:');
  for (const r of result.reglas.slice(0, 5)) {
    console.log(`  ${JSON.stringify(r)}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[arca-test] failed:', err);
    process.exit(1);
  });
