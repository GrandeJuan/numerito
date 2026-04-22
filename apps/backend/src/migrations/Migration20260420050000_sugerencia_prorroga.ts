import { Migration } from '@mikro-orm/migrations';

/**
 * Migration for #260 — Sugerencia automática de prórrogas desde scraping.
 *
 * Creates the sugerencia_prorroga table with foreign keys to vencimiento
 * and estudio, plus indexes for tenant-scoped queries and dedup checks.
 */
export class Migration20260420SugerenciaProrroga extends Migration {
  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "sugerencia_prorroga" (
        "id" uuid NOT NULL,
        "vencimiento_id" uuid NOT NULL,
        "estudio_id" uuid NOT NULL,
        "cliente_id" varchar(255) NOT NULL,
        "tipo_obligacion" varchar(255) NOT NULL,
        "periodo" varchar(7) NOT NULL,
        "fecha_original" timestamptz NOT NULL,
        "fecha_sugerida" timestamptz NOT NULL,
        "motivo" varchar(255) NOT NULL,
        "estado" varchar(20) NOT NULL DEFAULT 'ABIERTA',
        "regla_activa_id" varchar(255) NULL,
        "ejecucion_ingesta_id" varchar(255) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);

    // Foreign keys
    this.addSql(`
      ALTER TABLE "sugerencia_prorroga"
        ADD CONSTRAINT "sugerencia_prorroga_vencimiento_id_foreign"
        FOREIGN KEY ("vencimiento_id") REFERENCES "vencimiento" ("id") ON DELETE CASCADE;
    `);
    this.addSql(`
      ALTER TABLE "sugerencia_prorroga"
        ADD CONSTRAINT "sugerencia_prorroga_estudio_id_foreign"
        FOREIGN KEY ("estudio_id") REFERENCES "estudio" ("id") ON DELETE CASCADE;
    `);

    // Indexes matching the MikroORM schema definition
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "idx_sugerencia_prorroga_estudio" ON "sugerencia_prorroga" ("estudio_id");`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "idx_sugerencia_prorroga_vencimiento" ON "sugerencia_prorroga" ("vencimiento_id");`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "idx_sugerencia_prorroga_estudio_estado" ON "sugerencia_prorroga" ("estudio_id", "estado");`,
    );
  }

  override down(): void {
    this.addSql(`DROP TABLE IF EXISTS "sugerencia_prorroga";`);
  }
}
