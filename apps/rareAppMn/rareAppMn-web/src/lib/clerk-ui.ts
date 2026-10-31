import { mnMN } from "@clerk/localizations";
import type { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type ClerkProviderProps = ComponentProps<typeof ClerkProvider>;
type ClerkAppearance = NonNullable<ClerkProviderProps["appearance"]>;
type ClerkLocalization = NonNullable<ClerkProviderProps["localization"]>;

const SITE_FONT = "var(--font-pt-sans), ui-sans-serif, system-ui, sans-serif";

/**
 * Clerk's sign-in, sign-up, account and avatar-menu screens in the site's
 * look. Colors point at the global.css tokens, so they follow the light/dark
 * toggle on their own. Styles go in the "clerk" CSS layer (ordered before
 * Tailwind's utilities in global.css) so the class names below win.
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "var(--ink)",
    colorPrimaryForeground: "var(--paper)",
    colorDanger: "var(--destructive)",
    colorBackground: "var(--card)",
    colorForeground: "var(--ink)",
    colorMuted: "var(--paper-deep)",
    colorMutedForeground: "var(--ink-soft)",
    colorInput: "var(--card)",
    colorInputForeground: "var(--ink)",
    colorNeutral: "var(--ink)",
    // Clerk applies its own low alpha to this, so pass the solid ink color.
    colorBorder: "var(--ink)",
    colorRing: "var(--accent)",
    fontFamily: SITE_FONT,
    fontFamilyButtons: SITE_FONT,
    fontSize: "0.875rem",
    borderRadius: "0.625rem",
  },
  // On phones: 16px fields so iOS doesn't zoom in on focus (max-sm only, so
  // Clerk's own 14px size and line height stay as they were elsewhere).
  // Below lg: 44px-tall fields and buttons, and invisible 44px tap areas
  // (tap-area/tap-target in global.css) on Clerk's small controls.
  // Buttons match the site's primary button: accent pill, bold sentence case,
  // 48px tall, no Clerk gradient sheen (::after) or arrow icon.
  elements: {
    cardBox: "rounded-2xl border border-ink/10 shadow-none",
    headerTitle: "font-display text-xl font-bold tracking-tight",
    headerSubtitle: "leading-relaxed text-ink-soft",
    formButtonPrimary:
      "min-h-12 rounded-full bg-accent text-base font-bold normal-case tracking-normal text-accent-foreground shadow-none transition-colors duration-200 after:hidden hover:bg-accent-strong focus-visible:shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--accent)] disabled:opacity-50",
    buttonArrowIcon: "hidden",
    socialButtonsBlockButton:
      "min-h-12 rounded-full text-ink shadow-[0_0_0_1px_var(--border-ink)] transition-colors duration-200 hover:bg-ink/[0.04] hover:shadow-[0_0_0_1px_var(--ink)] focus-visible:shadow-[0_0_0_2px_var(--accent)]",
    socialButtonsBlockButtonText: "font-semibold text-ink",
    formFieldInput:
      "min-h-12 rounded-xl text-base focus-visible:shadow-[0_0_0_2px_var(--accent)]",
    formFieldErrorText: "text-destructive",
    // One wide tap area (Clerk's hidden input spans the row), so the boxes
    // can stay 40-44px wide and still fit a 375px screen.
    otpCodeFieldInputs: "gap-2",
    otpCodeFieldInput: "h-12 w-10 rounded-xl text-lg font-semibold sm:w-11",
    otpCodeFieldErrorText: "text-destructive",
    formResendCodeLink:
      "font-semibold text-accent hover:text-accent disabled:font-normal disabled:text-ink-soft disabled:opacity-100 max-lg:tap-target",
    footerActionText: "text-ink-soft",
    footerActionLink: "font-semibold text-accent hover:text-accent max-lg:tap-target",
    formFieldAction: "text-accent hover:text-accent max-lg:tap-target",
    identityPreviewEditButton: "text-accent max-lg:tap-area",
    userButtonTrigger: "max-lg:tap-area",
    navbarMobileMenuButton: "max-lg:tap-area",
    profileSectionPrimaryButton: "max-lg:tap-area",
    menuButton: "max-lg:tap-area",
    // Sits just above "add email"/"connect account": widen it, not taller.
    menuButtonEllipsis: "max-lg:after:absolute max-lg:after:-inset-x-2.5 max-lg:after:inset-y-0",
  },
} satisfies ClerkAppearance;

/**
 * <SignIn /> and <SignUp /> only: one flat card like the site's own (Clerk
 * otherwise raises the form on top of a tinted footer), as wide as the
 * column in AuthPageShell.
 */
export const authCardAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "rounded-none bg-card px-5 py-8 shadow-none sm:px-10",
    footer: "border-t border-ink/10 bg-card",
  },
} satisfies ClerkAppearance;

const APP_NAME = "Oyutan MN";

/**
 * Clerk fills {{applicationName}} from the dashboard's app name; use ours
 * instead ("{{applicationName}} руу нэвтрэх" -> "Oyutan MN-д нэвтрэх").
 */
function withAppName<T>(value: T): T {
  if (typeof value === "string") {
    return value
      .replaceAll("{{applicationName}} руу", `${APP_NAME}-д`)
      .replaceAll("{{applicationName}}", APP_NAME) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, withAppName(entry)]),
    ) as T;
  }
  return value;
}

/** Deep-merges string overrides into a localization object. */
function mergeStrings<T extends object>(base: T, extra: object): T {
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(extra)) {
    const current = merged[key];
    merged[key] =
      value && typeof value === "object" && current && typeof current === "object"
        ? mergeStrings(current, value)
        : value;
  }
  return merged as T;
}

/**
 * The avatar menu's "manage account" item, named like our tab, plus strings
 * mnMN still leaves in English on the sign-in, sign-up and account screens.
 */
const MN_OVERRIDES = {
  userButton: {
    action__manageAccount: "Бүртгэлийн тохиргоо",
    action__openUserMenu: "Хэрэглэгчийн цэс нээх",
    action__closeUserMenu: "Хэрэглэгчийн цэс хаах",
  },
  formFieldInput__emailAddress_format: "Жишээ: name@example.com",
  formFieldLabel__passkeyName: "Passkey-н нэр",
  signIn: {
    start: { titleCombined: "{{applicationName}} руу үргэлжлүүлэх" },
    emailLink: {
      clientMismatch: {
        title: "Энэ төхөөрөмж дээр баталгаажуулах холбоос ажиллахгүй",
        subtitle:
          "Үргэлжлүүлэхийн тулд нэвтэрч эхэлсэн төхөөрөмж, хөтөч дээрээ холбоосыг нээнэ үү.",
      },
      verifiedTransferable: {
        title: "Имэйл баталгаажлаа",
        subtitle: "Үргэлжлүүлэхийн тулд өмнөх цонх руугаа буцна уу.",
      },
    },
  },
  signUp: {
    start: {
      actionLink__use_email: "Имэйл ашиглах",
      actionLink__use_phone: "Утасны дугаар ашиглах",
    },
    emailLink: {
      clientMismatch: {
        title: "Энэ төхөөрөмж дээр баталгаажуулах холбоос ажиллахгүй",
        subtitle:
          "Үргэлжлүүлэхийн тулд бүртгүүлж эхэлсэн төхөөрөмж, хөтөч дээрээ холбоосыг нээнэ үү.",
      },
    },
    legalConsent: {
      continue: {
        title: "Үйлчилгээний нөхцөл",
        subtitle: "Үргэлжлүүлэхийн тулд нөхцөлтэй танилцаж, зөвшөөрнө үү.",
      },
      checkbox: {
        label__onlyTermsOfService:
          'Би {{ termsOfServiceLink || link("Үйлчилгээний нөхцөл") }}-ийг зөвшөөрч байна',
        label__onlyPrivacyPolicy:
          'Би {{ privacyPolicyLink || link("Нууцлалын бодлого") }}-ыг зөвшөөрч байна',
        label__termsOfServiceAndPrivacyPolicy:
          'Би {{ termsOfServiceLink || link("Үйлчилгээний нөхцөл") }} болон {{ privacyPolicyLink || link("Нууцлалын бодлого") }}-ыг зөвшөөрч байна',
      },
    },
  },
  // mnMN's versions read like machine translation ("identifier not found",
  // "the form's code is wrong"); the "exists" one is missing (English).
  unstable__errors: {
    form_identifier_not_found:
      "Энэ имэйл хаягаар бүртгэл олдсонгүй. Доорх «Бүртгүүлэх» холбоосоор бүртгүүлнэ үү.",
    form_identifier_exists__email_address:
      "Энэ имэйл хаяг бүртгэлтэй байна. Доорх «Нэвтрэх» холбоосоор нэвтэрнэ үү.",
    form_code_incorrect: "Код буруу байна. Дахин оролдоно уу.",
  },
  userProfile: {
    emailAddressPage: {
      formHint: "Имэйл хаягийг бүртгэлдээ нэмэхийн өмнө баталгаажуулах шаардлагатай.",
    },
    start: {
      connectedAccountsSection: {
        subtitle__disconnected: "Энэ бүртгэлийн холболт салсан байна.",
      },
      passkeysSection: {
        title: "Passkey",
        primaryButton: "Passkey нэмэх",
        menuAction__rename: "Нэр солих",
        menuAction__destructive: "Устгах",
      },
    },
  },
} satisfies ClerkLocalization;

/** mnMN with our app name and the overrides above. */
export const clerkLocalization = withAppName(
  mergeStrings(mnMN, MN_OVERRIDES),
) satisfies ClerkLocalization;
