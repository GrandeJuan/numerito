/**
 * Standalone migration runner.
 *
 * Used by:
 * - docker-compose `migrate` service (dev): runs once before `backend` starts.
 * - ECS pre-deploy task (prod): dispatched from the pipeline before updating the API service.
 *
 * Never call this from `main.ts`. Running migrations at API boot races across instances.
 */
import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import config from './mikro-orm.config';

async function run(): Promise<void> {
  const orm = await MikroORM.init(config);
  try {
    const migrator = orm.migrator;
    const pending = await migrator.getPending();
    if (pending.length === 0) {
      console.log('[migrate] No pending migrations');
      return;
    }
    console.log(`[migrate] Running ${pending.length} pending migration(s)...`);
    const executed = await migrator.up();
    for (const m of executed) {
      console.log(`[migrate] ✓ ${m.name}`);
    }
    console.log('[migrate] Done');
  } finally {
    await orm.close(true);
  }
}

run().catch((err: unknown) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
