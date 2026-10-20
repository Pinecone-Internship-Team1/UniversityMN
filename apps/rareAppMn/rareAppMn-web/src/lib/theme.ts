/**
 * The site opens in light (white) mode. Dark mode is used only after the
 * visitor presses the theme toggle, which saves that choice under this key.
 *
 * The previous key, "oyutan-theme", was also written automatically from the
 * device's dark-mode setting on first visit, so it is ignored (and removed).
 */
export const THEME_STORAGE_KEY = "oyutan-theme-choice";
export const LEGACY_THEME_STORAGE_KEY = "oyutan-theme";
