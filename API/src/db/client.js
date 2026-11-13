import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

/**
 * Published form versions must never change. The route only ever inserts
 * them, and these triggers make that true of the database as well - so a
 * future query, a migration or a mistake at the console cannot quietly
 * rewrite a version a partner's website is pinned to.
 */
const IMMUTABILITY_TRIGGERS = `
  CREATE TRIGGER IF NOT EXISTS form_versions_no_update
  BEFORE UPDATE ON form_versions
  BEGIN
    SELECT RAISE(ABORT, 'A published form version cannot be changed.');
  END;

  CREATE TRIGGER IF NOT EXISTS form_versions_no_delete
  BEFORE DELETE ON form_versions
  BEGIN
    SELECT RAISE(ABORT, 'A published form version cannot be deleted.');
  END;
`;

export function createDatabase(url) {
  if (url !== ':memory:') {
    mkdirSync(dirname(url), { recursive: true });
  }

  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });
  sqlite.exec(IMMUTABILITY_TRIGGERS);

  return { db, sqlite };
}
