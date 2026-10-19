/**
 * Our own Clerk pages. Set in code (ClerkProvider and clerkMiddleware) rather
 * than through NEXT_PUBLIC_CLERK_* env vars, so builds need no extra config.
 */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_SIGN_OUT_PATH = "/";

export const PROFILE_PATH = "/profile";
export const ACCOUNT_SETTINGS_PATH = "/profile/account";
