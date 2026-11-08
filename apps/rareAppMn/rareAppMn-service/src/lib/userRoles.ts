import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { users, type User } from '../db/schema';
import type { UserRole } from './auth';
import { forbidden, notFound } from './validate';

/**
 * Changes another user's role in D1 (the only place roles live). The acting
 * admin cannot change their own role, so nobody can demote themselves and
 * leave the site without an admin by accident.
 */
export async function setUserRole(
  db: Database,
  actorClerkUserId: string,
  userId: string,
  role: UserRole
): Promise<User> {
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw notFound('User');
  if (target.clerkUserId === actorClerkUserId) {
    throw forbidden('You cannot change your own role.');
  }
  if (target.role === role) return target;

  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))
    .returning();
  if (!updated) throw notFound('User');
  return updated;
}
