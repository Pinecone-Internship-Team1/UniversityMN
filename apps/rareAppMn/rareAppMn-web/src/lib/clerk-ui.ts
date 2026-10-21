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
  elements: {
    cardBox: "rounded-2xl border border-ink/10 shadow-none",
    headerTitle: "font-bold tracking-tight",
    formButtonPrimary:
      "rounded-full font-semibold uppercase tracking-wider shadow-none transition-colors duration-200 hover:bg-accent max-lg:min-h-11",
    socialButtonsBlockButton: "rounded-full max-lg:min-h-11",
    formFieldInput: "rounded-xl max-sm:text-base max-lg:min-h-11",
    otpCodeFieldInput: "rounded-xl max-sm:text-base",
    formFieldInputShowPasswordButton: "max-lg:tap-area",
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
  formFieldInputPlaceholder__signUpPassword: "Нууц үг үүсгэх",
  formFieldInput__emailAddress_format: "Жишээ: name@example.com",
  formFieldLabel__passkeyName: "Passkey-н нэр",
  signIn: {
    start: { titleCombined: "{{applicationName}} руу үргэлжлүүлэх" },
    passwordPwned: { title: "Нууц үг алдагдсан байна" },
    passwordCompromised: { title: "Нууц үг алдагдсан байна" },
    passwordUntrusted: { title: "Нууц үг найдваргүй байна" },
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
  unstable__errors: {
    form_password_matches_identifier:
      "Нууц үг таны имэйл, утасны дугаар эсвэл хэрэглэгчийн нэртэй адил байж болохгүй. Өөр нууц үг сонгоно уу.",
    form_password_pwned__sign_in:
      "Энэ нууц үг алдагдсан нууц үгсийн жагсаалтад байгаа тул ашиглах боломжгүй. Нууц үгээ сэргээнэ үү.",
    form_password_untrusted__sign_in:
      "Таны нууц үг алдагдсан байж болзошгүй. Өөр аргаар нэвтэрнэ үү; нэвтэрсний дараа нууц үгээ солих шаардлагатай.",
  },
} satisfies ClerkLocalization;

/** mnMN with our app name and the overrides above. */
export const clerkLocalization = withAppName(
  mergeStrings(mnMN, MN_OVERRIDES),
) satisfies ClerkLocalization;
