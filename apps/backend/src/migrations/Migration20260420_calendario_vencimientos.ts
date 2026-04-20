import { Migration } from '@mikro-orm/migrations';

/**
 * Migration for the "Calendario de Vencimientos" feature set.
 *
 * Covers all schema changes from:
 * - #250 — Scraper ARCA: ejecucion_ingesta, configuracion_ingesta tables
 * - #254 — Planilla responsable: motivo, fecha_prorrogada on vencimiento;
 *          PRORROGADO + NO_APLICA estados
 * - #257 ��� Responsable override: overrides_responsable on cliente,
 *          responsable_id on vencimiento
 * - #252 — Recordatorios: recordatorio_enviado table, dias_anticipacion
 *          on cliente
 * - #256 — Import Excel: (no schema changes beyond existing)
 * - Shared: regla_vencimiento extended fields, catalogo_obligacion,
 *           dia_feriado, inscripciones on cliente
 */
export class Migration20260420CalendarioVencimientos extends Migration {
  override up(): void {
    // ── New tables ──

    // catalogo_obligacion (global reference data)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "catalogo_obligacion" (
        "id" uuid NOT NULL,
        "nombre" varchar(255) NOT NULL,
        "tipo_obligacion" varchar(255) NOT NULL,
        "jurisdiccion" varchar(255) NOT NULL,
        "frecuencia" varchar(255) NOT NULL,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);
    this.addSql(`
      ALTER TABLE "catalogo_obligacion"
        ADD CONSTRAINT "uq_catalogo_obligacion_tipo_jurisdiccion"
        UNIQUE ("tipo_obligacion", "jurisdiccion");
    `);

    // dia_feriado (global reference data)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "dia_feriado" (
        "id" uuid NOT NULL,
        "fecha" timestamptz NOT NULL,
        "tipo" varchar(255) NOT NULL,
        "descripcion" varchar(255) NOT NULL,
        "jurisdiccion_afectada" varchar(255) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_dia_feriado_fecha" ON "dia_feriado" ("fecha");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_dia_feriado_tipo" ON "dia_feriado" ("tipo");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_dia_feriado_fecha_tipo" ON "dia_feriado" ("fecha", "tipo");`);
    this.addSql(`
      ALTER TABLE "dia_feriado"
        ADD CONSTRAINT "uq_dia_feriado_fecha_tipo_jurisdiccion"
        UNIQUE ("fecha", "tipo", "jurisdiccion_afectada");
    `);

    // configuracion_ingesta (global admin data)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "configuracion_ingesta" (
        "id" uuid NOT NULL,
        "fuente" varchar(255) NOT NULL,
        "habilitado" boolean NOT NULL DEFAULT false,
        "cadencia_dias" int NOT NULL,
        "proxima_ejecucion" timestamptz NULL,
        "ultima_ejecucion" timestamptz NULL,
        "ultimo_resultado" varchar(255) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);
    this.addSql(`
      ALTER TABLE "configuracion_ingesta"
        ADD CONSTRAINT "configuracion_ingesta_fuente_unique"
        UNIQUE ("fuente");
    `);

    // ejecucion_ingesta (global audit trail)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "ejecucion_ingesta" (
        "id" uuid NOT NULL,
        "fuente" varchar(255) NOT NULL,
        "estado" varchar(255) NOT NULL DEFAULT 'EN_CURSO',
        "disparador" varchar(255) NOT NULL,
        "disparado_por" varchar(255) NULL,
        "inicio" timestamptz NOT NULL,
        "fin" timestamptz NULL,
        "reglas_nuevas" int NOT NULL DEFAULT 0,
        "reglas_modificadas" int NOT NULL DEFAULT 0,
        "errores" jsonb NOT NULL DEFAULT '[]',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_ejecucion_ingesta_fuente" ON "ejecucion_ingesta" ("fuente");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_ejecucion_ingesta_estado" ON "ejecucion_ingesta" ("estado");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_ejecucion_ingesta_inicio" ON "ejecucion_ingesta" ("inicio");`);

    // recordatorio_enviado (global idempotency tracking)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "recordatorio_enviado" (
        "id" uuid NOT NULL,
        "vencimiento_id" uuid NOT NULL,
        "estudio_id" uuid NOT NULL,
        "cliente_id" varchar(255) NOT NULL,
        "tipo_recordatorio" varchar(255) NOT NULL,
        "canal" varchar(255) NOT NULL,
        "destinatario_id" varchar(255) NOT NULL,
        "fecha_envio" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
    `);
    this.addSql(`
      ALTER TABLE "recordatorio_enviado"
        ADD CONSTRAINT "recordatorio_enviado_vencimiento_id_foreign"
        FOREIGN KEY ("vencimiento_id") REFERENCES "vencimiento" ("id") ON DELETE CASCADE;
    `);
    this.addSql(`
      ALTER TABLE "recordatorio_enviado"
        ADD CONSTRAINT "recordatorio_enviado_estudio_id_foreign"
        FOREIGN KEY ("estudio_id") REFERENCES "estudio" ("id") ON DELETE CASCADE;
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_recordatorio_venc_tipo" ON "recordatorio_enviado" ("vencimiento_id", "tipo_recordatorio");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_recordatorio_estudio" ON "recordatorio_enviado" ("estudio_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_recordatorio_fecha_envio" ON "recordatorio_enviado" ("fecha_envio");`);
    this.addSql(`
      ALTER TABLE "recordatorio_enviado"
        ADD CONSTRAINT "uq_recordatorio_idempotent"
        UNIQUE ("vencimiento_id", "tipo_recordatorio", "canal", "destinatario_id");
    `);

    // ── Column additions to existing tables ──

    // regla_vencimiento: extended fields for jurisdiccion, vigencia, etc.
    this.addSql(`
      ALTER TABLE "regla_vencimiento"
        ADD COLUMN IF NOT EXISTS "jurisdiccion" varchar(255) NOT NULL DEFAULT 'ARCA',
        ADD COLUMN IF NOT EXISTS "regimen" varchar(255) NOT NULL DEFAULT 'GENERAL',
        ADD COLUMN IF NOT EXISTS "vigencia_desde" timestamptz NOT NULL DEFAULT '2026-01-01',
        ADD COLUMN IF NOT EXISTS "vigencia_hasta" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "origen" varchar(255) NOT NULL DEFAULT 'MANUAL',
        ADD COLUMN IF NOT EXISTS "estado" varchar(255) NOT NULL DEFAULT 'ACTIVA';
    `);

    // vencimiento: new columns for prorrogas, responsable, nominal date
    this.addSql(`
      ALTER TABLE "vencimiento"
        ADD COLUMN IF NOT EXISTS "fecha_nominal" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "motivo" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "fecha_prorrogada" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "responsable_id" uuid NULL;
    `);
    this.addSql(`
      ALTER TABLE "vencimiento"
        ADD CONSTRAINT "vencimiento_responsable_id_foreign"
        FOREIGN KEY ("responsable_id") REFERENCES "usuario" ("id")
        ON DELETE SET NULL;
    `);

    // cliente: inscripciones, overrides, anticipacion
    this.addSql(`
      ALTER TABLE "cliente"
        ADD COLUMN IF NOT EXISTS "inscripciones" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "overrides_responsable" jsonb NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS "dias_anticipacion" int NULL;
    `);

    // ── Seed data: new estado_vencimiento values ──
    this.addSql(`
      INSERT INTO "estado_vencimiento" ("codigo", "nombre")
      VALUES ('PRORROGADO', 'Prorrogado'), ('NO_APLICA', 'No Aplica')
      ON CONFLICT ("codigo") DO NOTHING;
    `);
  }

  override down(): void {
    // ── Drop seed data ──
    this.addSql(`DELETE FROM "estado_vencimiento" WHERE "codigo" IN ('PRORROGADO', 'NO_APLICA');`);

    // ── Remove column additions ──
    this.addSql(`
      ALTER TABLE "cliente"
        DROP COLUMN IF EXISTS "inscripciones",
        DROP COLUMN IF EXISTS "overrides_responsable",
        DROP COLUMN IF EXISTS "dias_anticipacion";
    `);

    this.addSql(`ALTER TABLE "vencimiento" DROP CONSTRAINT IF EXISTS "vencimiento_responsable_id_foreign";`);
    this.addSql(`
      ALTER TABLE "vencimiento"
        DROP COLUMN IF EXISTS "fecha_nominal",
        DROP COLUMN IF EXISTS "motivo",
        DROP COLUMN IF EXISTS "fecha_prorrogada",
        DROP COLUMN IF EXISTS "responsable_id";
    `);

    this.addSql(`
      ALTER TABLE "regla_vencimiento"
        DROP COLUMN IF EXISTS "jurisdiccion",
        DROP COLUMN IF EXISTS "regimen",
        DROP COLUMN IF EXISTS "vigencia_desde",
        DROP COLUMN IF EXISTS "vigencia_hasta",
        DROP COLUMN IF EXISTS "origen",
        DROP COLUMN IF EXISTS "estado";
    `);

    // ── Drop new tables (reverse order of creation) ──
    this.addSql(`DROP TABLE IF EXISTS "recordatorio_enviado";`);
    this.addSql(`DROP TABLE IF EXISTS "ejecucion_ingesta";`);
    this.addSql(`DROP TABLE IF EXISTS "configuracion_ingesta";`);
    this.addSql(`DROP TABLE IF EXISTS "dia_feriado";`);
    this.addSql(`DROP TABLE IF EXISTS "catalogo_obligacion";`);
  }
}
