import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Database as SQLite } from 'bun:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from '../db';
import * as dbSchema from '../db/schema';
import { savedSchools, schools, users } from '../db/schema';
import { handleClerkWebhook } from '../webhooks/clerk';
import { clerkUserExistsIn } from './auth';
import type { Env } from './env';
import { type ClerkUserFields, upsertClerkUser } from './userSync';

const MIGRATIONS_DIR = join(import.meta.dir, '../../d1');

/** In-memory SQLite with the same schema as D1 (all migrations applied). */
function createTestDb(): Database {
  const sqlite = new SQLite(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  const files = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort();
  for (const file of files) {
    const statements = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').split(
      '--> statement-breakpoint'
    );
    for (const statement of statements) {
      if (statement.trim()) sqlite.exec(statement);
    }
  }
  return drizzle(sqlite, { schema: dbSchema }) as unknown as Database;
}

const TEST_ID = 'user_test_old';
const LIVE_ID = 'user_live_new';
const EMAIL = 'bat@example.mn';

const goneFromClerk = async () => false;
const stillInClerk = async () => true;

function liveFields(overrides: Partial<ClerkUserFields> = {}): ClerkUserFields {
  return {
    clerkUserId: LIVE_ID,
    email: EMAIL,
    emailVerified: true,
    name: 'Бат',
    avatarUrl: null,
    role: 'student',
    ...overrides,
  };
}

async function seedTestModeUser(db: Database) {
  const [row] = await db
    .insert(users)
    .values({ clerkUserId: TEST_ID, email: EMAIL, name: 'Old name', scores: { math: 700 } })
    .returning();
  if (!row) throw new Error('seed insert returned no row');
  await db.insert(schools).values({ id: 'sch_muis', name: 'МУИС' });
  await db.insert(savedSchools).values({ userId: row.id, schoolId: 'sch_muis' });
  return row;
}

describe('upsertClerkUser', () => {
  let db: Database;
  beforeEach(() => {
    db = createTestDb();
  });

  test('moves the old test-mode row to the new live Clerk ID and keeps saved data', async () => {
    const old = await seedTestModeUser(db);

    const synced = await upsertClerkUser(db, liveFields(), goneFromClerk);

    expect(synced?.id).toBe(old.id);
    expect(synced?.clerkUserId).toBe(LIVE_ID);
    expect(synced?.name).toBe('Бат');
    expect(synced?.scores).toEqual({ math: 700 });
    expect(await db.select().from(users)).toHaveLength(1);
    const saved = await db.select().from(savedSchools).where(eq(savedSchools.userId, old.id));
    expect(saved.map((row) => row.schoolId)).toEqual(['sch_muis']);
  });

  test('does not move the row while its old Clerk user still exists', async () => {
    await seedTestModeUser(db);
    let asked: string | null = null;
    const exists = async (id: string) => {
      asked = id;
      return true;
    };

    await expect(upsertClerkUser(db, liveFields(), exists)).rejects.toThrow(
      /UNIQUE constraint failed/
    );
    expect(asked).toBe(TEST_ID);
    const [row] = await db.select().from(users);
    expect(row?.clerkUserId).toBe(TEST_ID);
  });

  test('does not move the row when the new email is not verified', async () => {
    await seedTestModeUser(db);
    let asked = false;
    const exists = async () => {
      asked = true;
      return false;
    };

    await expect(
      upsertClerkUser(db, liveFields({ emailVerified: false }), exists)
    ).rejects.toThrow(/UNIQUE constraint failed/);
    expect(asked).toBe(false);
    const [row] = await db.select().from(users);
    expect(row?.clerkUserId).toBe(TEST_ID);
  });

  test('updates the existing row of the same Clerk user without asking Clerk', async () => {
    await upsertClerkUser(db, liveFields({ name: 'First' }), stillInClerk);
    let asked = false;
    const exists = async () => {
      asked = true;
      return false;
    };

    const synced = await upsertClerkUser(
      db,
      liveFields({ name: null, avatarUrl: 'https://img/x.png' }),
      exists
    );

    expect(asked).toBe(false);
    expect(synced?.name).toBe('First');
    expect(synced?.avatarUrl).toBe('https://img/x.png');
    expect(await db.select().from(users)).toHaveLength(1);
  });

  test('a brand-new email gets a new row', async () => {
    await seedTestModeUser(db);

    const synced = await upsertClerkUser(
      db,
      liveFields({ email: 'new@example.mn' }),
      goneFromClerk
    );

    expect(synced?.clerkUserId).toBe(LIVE_ID);
    expect(await db.select().from(users)).toHaveLength(2);
  });

  test('a second sync after the move just updates the moved row', async () => {
    const old = await seedTestModeUser(db);
    await upsertClerkUser(db, liveFields(), goneFromClerk);

    const again = await upsertClerkUser(
      db,
      liveFields({ name: 'Бат-Эрдэнэ' }),
      goneFromClerk
    );

    expect(again?.id).toBe(old.id);
    expect(again?.name).toBe('Бат-Эрдэнэ');
    expect(await db.select().from(users)).toHaveLength(1);
  });
});

/** Stubs Clerk's Backend API: GET /v1/users/<id> answers with `statusFor(id)`. */
function stubClerkApi(statusFor: (clerkUserId: string) => number) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const clerkUserId = url.pathname.split('/').pop() ?? '';
    const status = statusFor(clerkUserId);
    const code = status === 404 ? 'resource_not_found' : 'internal_error';
    const body =
      status === 200
        ? { id: clerkUserId, object: 'user', email_addresses: [], phone_numbers: [] }
        : { errors: [{ code, message: 'x' }] };
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = realFetch;
  };
}

// Not the mock key, so getClerkSecretKey() treats Clerk as configured.
const CLERK_ENV = { ENVIRONMENT: 'development', CLERK_SECRET_KEY: 'sk_test_unit_tests' } as Env;

describe('clerkUserExistsIn', () => {
  let restoreFetch: (() => void) | null = null;
  afterEach(() => restoreFetch?.());

  test('only a 404 from Clerk means the user is gone', async () => {
    restoreFetch = stubClerkApi((id) => ({ user_gone: 404, user_here: 200 })[id] ?? 500);
    const exists = clerkUserExistsIn(CLERK_ENV);

    expect(await exists('user_gone')).toBe(false);
    expect(await exists('user_here')).toBe(true);
    expect(await exists('user_error')).toBe(true);
  });

  test('without a Clerk secret every user counts as existing', async () => {
    expect(await clerkUserExistsIn({ ENVIRONMENT: 'development' } as Env)('user_gone')).toBe(true);
  });
});

describe('Clerk webhook user.created', () => {
  let restoreFetch: (() => void) | null = null;
  afterEach(() => restoreFetch?.());

  function userCreated(verificationStatus: string) {
    // No CLERK_WEBHOOK_SECRET + development + localhost: the signature check is skipped.
    return new Request('http://localhost:8787/webhooks/clerk', {
      method: 'POST',
      body: JSON.stringify({
        type: 'user.created',
        data: {
          id: LIVE_ID,
          primary_email_address_id: 'idn_1',
          email_addresses: [
            { id: 'idn_1', email_address: EMAIL, verification: { status: verificationStatus } },
          ],
          first_name: 'Бат',
        },
      }),
    });
  }

  test('moves the old test-mode row to the new Clerk ID', async () => {
    const db = createTestDb();
    const old = await seedTestModeUser(db);
    restoreFetch = stubClerkApi((id) => (id === TEST_ID ? 404 : 200));

    const response = await handleClerkWebhook(userCreated('verified'), CLERK_ENV, db);

    expect(response.status).toBe(200);
    const [row] = await db.select().from(users);
    expect(row?.id).toBe(old.id);
    expect(row?.clerkUserId).toBe(LIVE_ID);
  });

  test('an unverified email answers 409 and leaves the old row alone', async () => {
    const db = createTestDb();
    await seedTestModeUser(db);
    restoreFetch = stubClerkApi(() => 404);

    const response = await handleClerkWebhook(userCreated('unverified'), CLERK_ENV, db);

    expect(response.status).toBe(409);
    const [row] = await db.select().from(users);
    expect(row?.clerkUserId).toBe(TEST_ID);
  });
});
