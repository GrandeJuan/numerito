import { Migration } from '@mikro-orm/migrations';

/**
 * Migration for:
 * - #250: ejecucion_ingesta + configuracion_ingesta tables
 * - #250: regla_vencimiento new columns (jurisdiccion, regimen, vigencia, origen, estado)
 * - #252: recordatorio_enviado table + cliente.dias_anticipacion
 * - #254: vencimiento.motivo + vencimiento.fecha_prorrogada + PRORROGADO/NO_APLICA estados
 * - #257: vencimiento.responsable_id + cliente.overrides_responsable
 */
export class Migration20260420ScraperArcaAndRecentFeatures extends Migration {
  override up(): void {
    // ─── #250: Configuración Ingesta (global, cross-tenant) ───
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "configuracion_ingesta" (
        "id" UUID PRIMARY KEY,
        "fuente" VARCHAR(50) NOT NULL UNIQUE,
        "habilitado" BOOLEAN NOT NULL DEFAULT false,
        "cadencia_dias" INT NOT NULL DEFAULT 7,
        "proxima_ejecucion" TIMESTAMPTZ,
        "ultima_ejecucion" TIMESTAMPTZ,
        "ultimo_resultado" VARCHAR(20),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default configurations for each scraping source
    this.addSql(`
      INSERT INTO "configuracion_ingesta" ("id", "fuente", "habilitado", "cadencia_dias")
      VALUES
        (gen_random_uuid(), 'ARCA', false, 7),
        (gen_random_uuid(), 'ARBA', false, 7),
        (gen_random_uuid(), 'AGIP', false, 7),
        (gen_random_uuid(), 'BCRA_FERIADOS', false, 30)
      ON CONFLICT ("fuente") DO NOTHING;
    `);

    // ─── #250: Ejecución Ingesta (audit trail, global) ───
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "ejecucion_ingesta" (
        "id" UUID PRIMARY KEY,
        "fuente" VARCHAR(50) NOT NULL,
        "estado" VARCHAR(20) NOT NULL DEFAULT 'EN_CURSO',
        "disparador" VARCHAR(20) NOT NULL,
        "disparado_por" UUID,
        "inicio" TIMESTAMPTZ NOT NULL,
        "fin" TIMESTAMPTZ,
        "reglas_nuevas" INT NOT NULL DEFAULT 0,
        "reglas_modificadas" INT NOT NULL DEFAULT 0,
        "errores" JSONB NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "idx_ejecucion_ingesta_fuente" ON "ejecucion_ingesta" ("fuente");
      CREATE INDEX IF NOT EXISTS "idx_ejecucion_ingesta_estado" ON "ejecucion_ingesta" ("estado");
      CREATE INDEX IF NOT EXISTS "idx_ejecucion_ingesta_inicio" ON "ejecucion_ingesta" ("inicio");
    `);

    // ─── #250: regla_vencimiento — extend with jurisdiccion, regimen, vigencia, origen, estado ───
    this.addSql(`
      ALTER TABLE "regla_vencimiento"
        ADD COLUMN IF NOT EXISTS "jurisdiccion" VARCHAR(30) NOT NULL DEFAULT 'ARCA',
        ADD COLUMN IF NOT EXISTS "regimen" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
        ADD COLUMN IF NOT EXISTS "vigencia_desde" DATE NOT NULL DEFAULT '2026-01-01',
        ADD COLUMN IF NOT EXISTS "vigencia_hasta" DATE,
        ADD COLUMN IF NOT EXISTS "origen" VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
        ADD COLUMN IF NOT EXISTS "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVA';

      CREATE INDEX IF NOT EXISTS "idx_regla_vencimiento_estado" ON "regla_vencimiento" ("estado");
      CREATE INDEX IF NOT EXISTS "idx_regla_vencimiento_jurisdiccion" ON "regla_vencimiento" ("jurisdiccion");
    `);

    // ─── #252: Recordatorio Enviado (idempotency tracking, global) ───
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "recordatorio_enviado" (
        "id" UUID PRIMARY KEY,
        "vencimiento_id" UUID NOT NULL REFERENCES "vencimiento" ("id"),
        "estudio_id" UUID NOT NULL REFERENCES "estudio" ("id"),
        "cliente_id" UUID NOT NULL,
        "tipo_recordatorio" VARCHAR(30) NOT NULL,
        "canal" VARCHAR(20) NOT NULL,
        "destinatario_id" UUID NOT NULL,
        "fecha_envio" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "idx_recordatorio_venc_tipo"
        ON "recordatorio_enviado" ("vencimiento_id", "tipo_recordatorio");
      CREATE INDEX IF NOT EXISTS "idx_recordatorio_estudio"
        ON "recordatorio_enviado" ("estudio_id");
      CREATE INDEX IF NOT EXISTS "idx_recordatorio_fecha_envio"
        ON "recordatorio_enviado" ("fecha_envio");
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_recordatorio_idempotent"
        ON "recordatorio_enviado" ("vencimiento_id", "tipo_recordatorio", "canal", "destinatario_id");
    `);

    // ─── #252: cliente.dias_anticipacion ───
    this.addSql(`
      ALTER TABLE "cliente"
        ADD COLUMN IF NOT EXISTS "dias_anticipacion" INT;
    `);

    // ─── #254: vencimiento.motivo + vencimiento.fecha_prorrogada ───
    this.addSql(`
      ALTER TABLE "vencimiento"
        ADD COLUMN IF NOT EXISTS "motivo" TEXT,
        ADD COLUMN IF NOT EXISTS "fecha_prorrogada" DATE;
    `);

    // ─── #254: PRORROGADO and NO_APLICA estado seeds ───
    this.addSql(`
      INSERT INTO "estado_vencimiento" ("id", "nombre", "label")
      VALUES
        ('PRORROGADO', 'PRORROGADO', 'Prorrogado'),
        ('NO_APLICA', 'NO_APLICA', 'No aplica')
      ON CONFLICT ("id") DO NOTHING;
    `);

    // ─── #257: vencimiento.responsable_id ───
    this.addSql(`
      ALTER TABLE "vencimiento"
        ADD COLUMN IF NOT EXISTS "responsable_id" UUID REFERENCES "usuario" ("id");

      CREATE INDEX IF NOT EXISTS "idx_vencimiento_responsable" ON "vencimiento" ("responsable_id");
    `);

    // ─── #257: cliente.overrides_responsable ───
    this.addSql(`
      ALTER TABLE "cliente"
        ADD COLUMN IF NOT EXISTS "overrides_responsable" JSONB NOT NULL DEFAULT '{}';
    `);
  }

  override down(): void {
    // Reverse in opposite order
    this.addSql(`ALTER TABLE "cliente" DROP COLUMN IF EXISTS "overrides_responsable";`);
    this.addSql(`ALTER TABLE "vencimiento" DROP COLUMN IF EXISTS "responsable_id";`);
    this.addSql(`DELETE FROM "estado_vencimiento" WHERE "id" IN ('PRORROGADO', 'NO_APLICA');`);
    this.addSql(`ALTER TABLE "vencimiento" DROP COLUMN IF EXISTS "motivo", DROP COLUMN IF EXISTS "fecha_prorrogada";`);
    this.addSql(`ALTER TABLE "cliente" DROP COLUMN IF EXISTS "dias_anticipacion";`);
    this.addSql(`DROP TABLE IF EXISTS "recordatorio_enviado";`);
    this.addSql(`
      ALTER TABLE "regla_vencimiento"
        DROP COLUMN IF EXISTS "jurisdiccion",
        DROP COLUMN IF EXISTS "regimen",
        DROP COLUMN IF EXISTS "vigencia_desde",
        DROP COLUMN IF EXISTS "vigencia_hasta",
        DROP COLUMN IF EXISTS "origen",
        DROP COLUMN IF EXISTS "estado";
    `);
    this.addSql(`DROP TABLE IF EXISTS "ejecucion_ingesta";`);
    this.addSql(`DROP TABLE IF EXISTS "configuracion_ingesta";`);
  }
}
