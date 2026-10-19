import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

// School details, comparison and the profile need an account; the home page,
// /schools, /scholarships and /admissions stay public.
const isSignInRequired = createRouteMatcher([
  "/university(.*)",
  "/compare(.*)",
  "/profile(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    // Signed-out visitors are redirected to /sign-in?redirect_url=<this page>,
    // so they land back on the school they clicked.
    if (isSignInRequired(request)) await auth.protect();
  },
  { signInUrl: SIGN_IN_PATH, signUpUrl: SIGN_UP_PATH },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
