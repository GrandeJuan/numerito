import { Migration } from '@mikro-orm/migrations';

/**
 * Creates the admin_dashboard_snapshot table — a denormalized read model
 * owned by the administracion bounded context.
 *
 * This table stores pre-computed dashboard stats that are materialized
 * by domain event listeners, replacing the pattern of querying across
 * other contexts' tables on every request.
 *
 * Single-row table: only one snapshot exists, upserted on refresh.
 */
export class Migration20260414AddDashboardSnapshot extends Migration {
  override up(): void {
    this.addSql(`
      CREATE TABLE "admin_dashboard_snapshot" (
        "id" SERIAL PRIMARY KEY,

        -- Current KPI values
        "estudios_activos" INT NOT NULL DEFAULT 0,
        "total_usuarios" INT NOT NULL DEFAULT 0,
        "subscripciones_activas" INT NOT NULL DEFAULT 0,
        "mrr" NUMERIC(12,2) NOT NULL DEFAULT 0,
        "churn_mensual" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "uptime" NUMERIC(5,2) NOT NULL DEFAULT 99.98,

        -- 12-month sparkline arrays (one number per month)
        "estudios_sparkline" JSONB NOT NULL DEFAULT '[]',
        "usuarios_sparkline" JSONB NOT NULL DEFAULT '[]',
        "subscripciones_sparkline" JSONB NOT NULL DEFAULT '[]',
        "mrr_sparkline" JSONB NOT NULL DEFAULT '[]',
        "churn_sparkline" JSONB NOT NULL DEFAULT '[]',

        -- Chart data (arrays of objects)
        "growth_data" JSONB NOT NULL DEFAULT '[]',
        "revenue_data" JSONB NOT NULL DEFAULT '[]',
        "registros_mensuales" JSONB NOT NULL DEFAULT '[]',
        "distribucion_planes" JSONB NOT NULL DEFAULT '[]',

        -- Dynamic lists
        "alertas" JSONB NOT NULL DEFAULT '[]',
        "estudios_recientes" JSONB NOT NULL DEFAULT '[]',
        "top_tenants" JSONB NOT NULL DEFAULT '[]',
        "registros_recientes" JSONB NOT NULL DEFAULT '[]',

        -- Metadata
        "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "stale" BOOLEAN NOT NULL DEFAULT true
      );
    `);

    // Seed with a single empty row so upserts work
    this.addSql(`
      INSERT INTO "admin_dashboard_snapshot" ("id") VALUES (1);
    `);
  }

  override down(): void {
    this.addSql(`DROP TABLE IF EXISTS "admin_dashboard_snapshot";`);
  }
}
