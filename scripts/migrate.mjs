#!/usr/bin/env node
// Applies Prisma-style SQL migrations using @libsql/client directly.
// Replaces `prisma migrate deploy` to avoid needing @prisma/engines native binaries.
import { createClient } from "@libsql/client";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const DB_URL = process.env.DATABASE_URL ?? "file:/data/nexus.db";
const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

async function main() {
  const client = createClient({ url: DB_URL });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      id                   TEXT    NOT NULL PRIMARY KEY,
      checksum             TEXT    NOT NULL,
      finished_at          TEXT,
      migration_name       TEXT    NOT NULL,
      logs                 TEXT,
      rolled_back_at       TEXT,
      started_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      applied_steps_count  INTEGER NOT NULL DEFAULT 0
    )
  `);

  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const migrationDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const dir of migrationDirs) {
    const { rows } = await client.execute({
      sql: 'SELECT id FROM "_prisma_migrations" WHERE migration_name = ?',
      args: [dir],
    });

    if (rows.length > 0) {
      console.log(`[migrate] skip (already applied): ${dir}`);
      continue;
    }

    const sqlPath = join(MIGRATIONS_DIR, dir, "migration.sql");
    const sql = await readFile(sqlPath, "utf8");

    console.log(`[migrate] applying: ${dir}`);

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    await client.execute({
      sql: `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES (?, '', ?, datetime('now'), 1)`,
      args: [randomUUID(), dir],
    });

    console.log(`[migrate] applied: ${dir}`);
  }

  console.log("[migrate] done");
  client.close();
}

main().catch((err) => {
  console.error("[migrate] fatal:", err);
  process.exit(1);
});
