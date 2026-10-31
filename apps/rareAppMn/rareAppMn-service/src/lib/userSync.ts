import { and, eq } from 'drizzle-orm';
import type { Database } from '../db';
import { users, type User } from '../db/schema';

export interface ClerkUserFields {
  clerkUserId: string;
  email: string;
  /** True when Clerk has verified that this user owns `email`. */
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}

/** Whether a Clerk user ID exists in the Clerk instance the service uses now. */
export type ClerkUserExists = (clerkUserId: string) => Promise<boolean>;

/**
 * Mirrors a Clerk user into `users` (used by `syncClerkUser` and the Clerk
 * webhook). Only profile fields are written: `role` is never part of the
 * payload, so a new row gets the column default (`student`) and an existing
 * row keeps whatever role D1 already has.
 *
 * `users.email` is unique, so a person who signs up again in Clerk's live
 * instance with the email of their old test-instance account would collide
 * with their old row. When the new Clerk user has no row yet, its email is
 * verified, and the row holding that email belongs to a Clerk user that no
 * longer exists, that row moves to the new Clerk user ID; saved schools,
 * majors, scores and preferences stay attached to it.
 */
export async function upsertClerkUser(
  db: Database,
  fields: ClerkUserFields,
  clerkUserExists: ClerkUserExists
): Promise<User | undefined> {
  const { clerkUserId, email, name, avatarUrl } = fields;
  const changes = {
    email,
    ...(name !== null ? { name } : {}),
    ...(avatarUrl !== null ? { avatarUrl } : {}),
  };

  if (fields.emailVerified) {
    const moved = await moveRowWithSameEmail(db, clerkUserId, changes, clerkUserExists);
    if (moved) return moved;
  }

  const [synced] = await db
    .insert(users)
    .values({ clerkUserId, email, name, avatarUrl })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { ...changes, updatedAt: new Date().toISOString() },
    })
    .returning();
  return synced;
}

async function moveRowWithSameEmail(
  db: Database,
  clerkUserId: string,
  changes: Pick<User, 'email'> & Partial<Pick<User, 'name' | 'avatarUrl'>>,
  clerkUserExists: ClerkUserExists
): Promise<User | null> {
  const [own] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (own) return null;

  const [previous] = await db
    .select({ id: users.id, clerkUserId: users.clerkUserId })
    .from(users)
    .where(eq(users.email, changes.email))
    .limit(1);
  if (!previous || (await clerkUserExists(previous.clerkUserId))) return null;

  // Matching the old Clerk ID as well keeps two concurrent syncs from both
  // moving the row; the loser falls through to the regular upsert.
  const [moved] = await db
    .update(users)
    .set({ ...changes, clerkUserId, updatedAt: new Date().toISOString() })
    .where(and(eq(users.id, previous.id), eq(users.clerkUserId, previous.clerkUserId)))
    .returning();
  return moved ?? null;
}
