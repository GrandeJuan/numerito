import { Migration } from '@mikro-orm/migrations';

/**
 * Reshape admin_dashboard_snapshot to match the redesigned admin dashboard.
 *
 * Drops unused pre-redesign columns and adds the new JSON columns that back
 * the new UI shape (growth, plan_distribution, top_studios). The snapshot is
 * reset (stale = true) so the next read re-materializes with the new shape.
 *
 * Fresh-on-read fields (services, uptime details, dauMau, moduleUsage,
 * activity) are composed at query time and not cached here.
 */
export class Migration20260419ReshapeDashboardSnapshot extends Migration {
  override up(): void {
    this.addSql(`
      ALTER TABLE "admin_dashboard_snapshot"
        DROP COLUMN IF EXISTS "total_usuarios",
        DROP COLUMN IF EXISTS "subscripciones_activas",
        DROP COLUMN IF EXISTS "churn_mensual",
        DROP COLUMN IF EXISTS "uptime",
        DROP COLUMN IF EXISTS "usuarios_sparkline",
        DROP COLUMN IF EXISTS "subscripciones_sparkline",
        DROP COLUMN IF EXISTS "churn_sparkline",
        DROP COLUMN IF EXISTS "growth_data",
        DROP COLUMN IF EXISTS "revenue_data",
        DROP COLUMN IF EXISTS "registros_mensuales",
        DROP COLUMN IF EXISTS "distribucion_planes",
        DROP COLUMN IF EXISTS "alertas",
        DROP COLUMN IF EXISTS "estudios_recientes",
        DROP COLUMN IF EXISTS "top_tenants",
        DROP COLUMN IF EXISTS "registros_recientes";
    `);

    this.addSql(`
      ALTER TABLE "admin_dashboard_snapshot"
        ADD COLUMN IF NOT EXISTS "growth" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "plan_distribution" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "top_studios" JSONB NOT NULL DEFAULT '[]';
    `);

    // Force re-materialization on next read.
    this.addSql(`
      UPDATE "admin_dashboard_snapshot"
      SET "stale" = true,
          "mrr" = 0,
          "estudios_activos" = 0,
          "mrr_sparkline" = '[]',
          "estudios_sparkline" = '[]',
          "growth" = '[]',
          "plan_distribution" = '[]',
          "top_studios" = '[]'
      WHERE id = 1;
    `);
  }

  override down(): void {
    this.addSql(`
      ALTER TABLE "admin_dashboard_snapshot"
        DROP COLUMN IF EXISTS "growth",
        DROP COLUMN IF EXISTS "plan_distribution",
        DROP COLUMN IF EXISTS "top_studios";
    `);

    this.addSql(`
      ALTER TABLE "admin_dashboard_snapshot"
        ADD COLUMN IF NOT EXISTS "total_usuarios" INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "subscripciones_activas" INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "churn_mensual" NUMERIC(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "uptime" NUMERIC(5,2) NOT NULL DEFAULT 99.98,
        ADD COLUMN IF NOT EXISTS "usuarios_sparkline" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "subscripciones_sparkline" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "churn_sparkline" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "growth_data" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "revenue_data" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "registros_mensuales" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "distribucion_planes" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "alertas" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "estudios_recientes" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "top_tenants" JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "registros_recientes" JSONB NOT NULL DEFAULT '[]';
    `);
  }
}
