/**
 * Our own Clerk pages. Set in code (ClerkProvider and clerkMiddleware) rather
 * than through NEXT_PUBLIC_CLERK_* env vars, so builds need no extra config.
 */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_SIGN_OUT_PATH = "/";
/**
 * Where sign-in/sign-up lands when the page has no redirect_url (the navbar
 * buttons, a direct visit). The sign-in button on a school's preview carries
 * redirect_url, so it returns to that school instead.
 */
export const AFTER_SIGN_IN_PATH = "/schools";

export const PROFILE_PATH = "/profile";
export const ACCOUNT_SETTINGS_PATH = "/profile/account";
