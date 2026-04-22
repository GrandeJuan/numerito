import { Migration } from '@mikro-orm/migrations';

/**
 * Track the external task id (Docker container id in dev, ECS task ARN in prod)
 * so the backend can fetch logs and issue stop/cancel commands against it.
 */
export class Migration20260421010000EjecucionLauncherTaskId extends Migration {
  override up(): void {
    this.addSql(
      `ALTER TABLE "ejecucion_ingesta" ADD COLUMN IF NOT EXISTS "launcher_task_id" varchar(255) NULL;`,
    );
  }

  override down(): void {
    this.addSql(`ALTER TABLE "ejecucion_ingesta" DROP COLUMN IF EXISTS "launcher_task_id";`);
  }
}
