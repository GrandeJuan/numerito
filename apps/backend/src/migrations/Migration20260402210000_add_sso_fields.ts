import { Migration } from '@mikro-orm/migrations';

export class Migration20260402210000AddSsoFields extends Migration {
  override up(): void {
    this.addSql(`alter table "usuario" add column "provider" varchar(255) null default null;`);
    this.addSql(`alter table "usuario" add column "provider_id" varchar(255) null default null;`);
  }

  override down(): void {
    this.addSql(`alter table "usuario" drop column "provider";`);
    this.addSql(`alter table "usuario" drop column "provider_id";`);
  }
}
