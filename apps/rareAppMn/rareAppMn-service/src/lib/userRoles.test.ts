import { beforeEach, describe, expect, test } from 'bun:test';
import { Database as SQLite } from 'bun:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from '../db';
import * as dbSchema from '../db/schema';
import { users } from '../db/schema';
import { setUserRole } from './userRoles';

const MIGRATIONS_DIR = join(import.meta.dir, '../../d1');

function createTestDb(): Database {
  const sqlite = new SQLite(':memory:');
  const files = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort();
  for (const file of files) {
    for (const statement of readFileSync(join(MIGRATIONS_DIR, file), 'utf8').split(
      '--> statement-breakpoint'
    )) {
      if (statement.trim()) sqlite.exec(statement);
    }
  }
  return drizzle(sqlite, { schema: dbSchema }) as unknown as Database;
}

const ADMIN_CLERK_ID = 'user_admin';

describe('setUserRole', () => {
  let db: Database;
  let studentId: string;
  let adminRowId: string;

  beforeEach(async () => {
    db = createTestDb();
    const [admin] = await db
      .insert(users)
      .values({ clerkUserId: ADMIN_CLERK_ID, email: 'admin@example.mn', role: 'admin' })
      .returning();
    const [student] = await db
      .insert(users)
      .values({ clerkUserId: 'user_student', email: 'bat@example.mn' })
      .returning();
    if (!admin || !student) throw new Error('seed failed');
    adminRowId = admin.id;
    studentId = student.id;
  });

  test('promotes a student to admin and back', async () => {
    const promoted = await setUserRole(db, ADMIN_CLERK_ID, studentId, 'admin');
    expect(promoted.role).toBe('admin');

    const demoted = await setUserRole(db, ADMIN_CLERK_ID, studentId, 'student');
    expect(demoted.role).toBe('student');
    const [row] = await db.select().from(users).where(eq(users.id, studentId));
    expect(row?.role).toBe('student');
  });

  test('refuses to change the acting admin’s own role', async () => {
    await expect(setUserRole(db, ADMIN_CLERK_ID, adminRowId, 'student')).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
    const [row] = await db.select().from(users).where(eq(users.id, adminRowId));
    expect(row?.role).toBe('admin');
  });

  test('throws NOT_FOUND for an unknown user', async () => {
    await expect(setUserRole(db, ADMIN_CLERK_ID, 'missing', 'admin')).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    });
  });
});
