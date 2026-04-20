import { Migration } from '@mikro-orm/migrations';

export class Migration20260420AddIngestaId extends Migration {
  override up(): void {
    this.addSql(
      `alter table "ejecucion_ingesta" add column "ingesta_id" varchar(255) null default null;`,
    );
    this.addSql(
      `create unique index "ejecucion_ingesta_ingesta_id_unique" on "ejecucion_ingesta" ("ingesta_id") where ingesta_id is not null;`,
    );
  }

  override down(): void {
    this.addSql(`drop index if exists "ejecucion_ingesta_ingesta_id_unique";`);
    this.addSql(`alter table "ejecucion_ingesta" drop column "ingesta_id";`);
  }
}
