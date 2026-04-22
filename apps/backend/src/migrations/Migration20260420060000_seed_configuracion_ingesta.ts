import { Migration } from '@mikro-orm/migrations';

/**
 * Seed default scraping sources in `configuracion_ingesta`.
 *
 * Split into its own migration (not embedded in the table-creation migration)
 * because seed data tends to evolve independently of DDL and benefits from
 * a standalone audit trail.
 */
export class Migration20260420SeedConfiguracionIngesta extends Migration {
  override up(): void {
    this.addSql(`
      INSERT INTO "configuracion_ingesta" ("id", "fuente", "habilitado", "cadencia_dias")
      VALUES
        (gen_random_uuid(), 'ARCA',          false, 7),
        (gen_random_uuid(), 'ARBA',          false, 7),
        (gen_random_uuid(), 'AGIP',          false, 7),
        (gen_random_uuid(), 'BCRA_FERIADOS', false, 30)
      ON CONFLICT ("fuente") DO NOTHING;
    `);
  }

  override down(): void {
    this.addSql(
      `DELETE FROM "configuracion_ingesta" WHERE "fuente" IN ('ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS');`,
    );
  }
}
