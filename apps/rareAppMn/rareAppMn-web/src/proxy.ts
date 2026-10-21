import type { NextFetchEvent, NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

const SITE_HOST = "oyutanmn.site";
// Other addresses that serve the same Worker; visitors are sent to SITE_HOST.
const REDIRECTED_HOSTS = [
  "www.oyutanmn.site",
  "oyutan-mn-web.zelmeganbayr0408.workers.dev",
];

/**
 * 301 to https://oyutanmn.site (same path and query) for www, workers.dev and
 * plain http://. Other hosts (localhost) are left alone.
 */
function canonicalRedirect(request: NextRequest): Response | null {
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? url.host).toLowerCase();
  const proto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const isOtherHost = REDIRECTED_HOSTS.includes(host);
  if (!isOtherHost && !(host === SITE_HOST && proto === "http")) return null;
  return Response.redirect(
    `https://${SITE_HOST}${url.pathname}${url.search}`,
    301,
  );
}

// Comparison and the profile need an account. The home page, /schools,
// /scholarships, /admissions and the school pages stay public; a school page
// shows signed-out visitors a preview (see app/university/[id]/page.tsx).
const isSignInRequired = createRouteMatcher(["/compare(.*)", "/profile(.*)"]);

const clerkProxy = clerkMiddleware(
  async (auth, request) => {
    // Signed-out visitors are redirected to /sign-in?redirect_url=<this page>,
    // so they land back on the page they opened.
    if (isSignInRequired(request)) await auth.protect();
  },
  { signInUrl: SIGN_IN_PATH, signUpUrl: SIGN_UP_PATH },
);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return canonicalRedirect(request) ?? clerkProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
