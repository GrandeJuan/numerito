import { Migration } from '@mikro-orm/migrations';

export class Migration20260414AddAvatarUrl extends Migration {
  override up(): void {
    this.addSql(`alter table "usuario" add column "avatar_url" varchar(500) null default null;`);
  }

  override down(): void {
    this.addSql(`alter table "usuario" drop column "avatar_url";`);
  }
}
