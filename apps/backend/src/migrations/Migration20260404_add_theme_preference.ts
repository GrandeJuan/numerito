import { Migration } from '@mikro-orm/migrations';

export class Migration20260404AddThemePreference extends Migration {
  override up(): void {
    this.addSql(`alter table "usuario" add column "theme_preference" varchar(10) not null default 'light';`);
  }

  override down(): void {
    this.addSql(`alter table "usuario" drop column "theme_preference";`);
  }
}
