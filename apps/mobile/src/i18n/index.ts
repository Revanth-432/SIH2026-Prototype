import { useCallback } from 'react';
import { en, hi, te, TranslationKey } from './translations';
import { useLanguageStore, AppLanguage } from '../store/useLanguageStore';

export type { TranslationKey } from './translations';
export type { AppLanguage } from '../store/useLanguageStore';

const DICTIONARIES: Record<AppLanguage, Record<TranslationKey, string>> = { en, hi, te };

/** Native names shown in the language picker (never translated). */
export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; sample: string }[] = [
  { code: 'en', label: 'English', sample: 'A' },
  { code: 'hi', label: 'हिंदी', sample: 'अ' },
  { code: 'te', label: 'తెలుగు', sample: 'అ' },
];

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text = DICTIONARIES[language]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

/** Returns `t()` bound to the current app language; re-renders when the language changes. */
export function useT(): { t: TranslateFn; language: AppLanguage } {
  const language = useLanguageStore((s) => s.language);
  const t = useCallback<TranslateFn>((key, vars) => translate(language, key, vars), [language]);
  return { t, language };
}

/* ------------------------------------------------------------------ */
/* Fonts: Mukta covers Latin + Devanagari; Noto Sans Telugu for Telugu */
/* ------------------------------------------------------------------ */
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const FONT_FAMILIES: Record<'mukta' | 'telugu', Record<FontWeight, string>> = {
  mukta: {
    regular: 'Mukta_400Regular',
    medium: 'Mukta_500Medium',
    semibold: 'Mukta_600SemiBold',
    bold: 'Mukta_700Bold',
  },
  telugu: {
    regular: 'NotoSansTelugu_400Regular',
    medium: 'NotoSansTelugu_500Medium',
    semibold: 'NotoSansTelugu_600SemiBold',
    bold: 'NotoSansTelugu_700Bold',
  },
};

export function fontFor(language: AppLanguage, weight: FontWeight = 'regular'): string {
  return FONT_FAMILIES[language === 'te' ? 'telugu' : 'mukta'][weight];
}

export function weightFromClassName(className?: string): FontWeight {
  if (!className) return 'regular';
  if (/\bfont-(bold|extrabold|black)\b/.test(className)) return 'bold';
  if (/\bfont-semibold\b/.test(className)) return 'semibold';
  if (/\bfont-medium\b/.test(className)) return 'medium';
  return 'regular';
}

/** Font family for the current language (for raw TextInputs / navigator label styles). */
export function useAppFont(weight: FontWeight = 'regular'): string {
  const language = useLanguageStore((s) => s.language);
  return fontFor(language, weight);
}
