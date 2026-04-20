import { Migration } from '@mikro-orm/migrations';

/**
 * Migration for #253 — Resumen mensual (PDF consolidado + feed del portal).
 *
 * Creates the resumen_mensual table with unique constraint on
 * (estudio_id, cliente_id, periodo) for idempotent upserts.
 */
export class Migration20260420ResumenMensual extends Migration {
  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "resumen_mensual" (
        "id" uuid NOT NULL,
        "estudio_id" uuid NOT NULL,
        "cliente_id" uuid NOT NULL,
        "cliente_nombre" varchar(255) NOT NULL,
        "periodo" varchar(7) NOT NULL,
        "total_vencimientos" int NOT NULL DEFAULT 0,
        "estado" varchar(20) NOT NULL DEFAULT 'GENERANDO',
        "pdf_buffer" bytea NULL,
        "email_enviado" boolean NOT NULL DEFAULT false,
        "error_mensaje" varchar(1000) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);

    // Unique constraint for idempotent upserts (one resumen per client per period)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_resumen_mensual_estudio_cliente_periodo"
        ON "resumen_mensual" ("estudio_id", "cliente_id", "periodo");
    `);

    // Indexes for common query patterns
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_resumen_mensual_estudio" ON "resumen_mensual" ("estudio_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_resumen_mensual_cliente" ON "resumen_mensual" ("cliente_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_resumen_mensual_periodo" ON "resumen_mensual" ("periodo");`);
  }

  override down(): void {
    this.addSql(`DROP TABLE IF EXISTS "resumen_mensual";`);
  }
}
