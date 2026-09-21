import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

/**
 * Superadmin access is gated on Clerk's publicMetadata.role, set manually
 * via the Clerk Dashboard (Users -> a user -> Metadata -> Public):
 *   { "role": "superadmin" }
 * There is no self-service way to grant this from the app.
 */
export async function requireSuperAdmin(): Promise<User | null> {
  const user = await currentUser();
  if (!user) return null;
  if (user.publicMetadata?.["role"] !== "superadmin") return null;
  return user;
}
