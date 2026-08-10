/*
 * i18n entry point.
 *
 * `Dict = typeof ru` makes RU the structural source of truth: EN and UZ cannot
 * silently lose a key or change a shape without failing the type check. That
 * guarantee is inherited from the previous site and deliberately kept.
 *
 * Locale-aware path building lives here too — the baseline repeated the
 * BASE_URL dance in five components, which is exactly how a GitHub Pages base
 * path gets broken.
 */

import { ru, type Dict } from './ru';
import { en } from './en';
import { uz } from './uz';

export type Locale = 'ru' | 'en' | 'uz';

export const LOCALES: readonly Locale[] = ['ru', 'en', 'uz'] as const;
export const DEFAULT_LOCALE: Locale = 'ru';

/** Display order in the switcher; RU first because it is the primary market. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'RU',
  uz: 'UZ',
  en: 'EN',
};

/** BCP-47 tags for `lang`, `hreflang` and `og:locale`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  ru: 'ru',
  uz: 'uz',
  en: 'en',
};

export const OG_LOCALES: Record<Locale, string> = {
  ru: 'ru_RU',
  uz: 'uz_UZ',
  en: 'en_US',
};

const dicts: Record<Locale, Dict> = { ru, en, uz };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? ru;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Deployment base without a trailing slash, e.g. `/echelon-site`. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Absolute in-site path for a locale's landing page. */
export function localePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? `${BASE}/` : `${BASE}/${locale}/`;
}

/** Absolute in-site path for a static asset in `public/`. */
export function asset(path: string): string {
  return `${BASE}/${path.replace(/^\//, '')}`;
}

/**
 * Pick the right form for a count. Dictionaries store three forms
 * [one, few, many]; each locale uses as many as its grammar needs.
 *
 *   ru — 1 запись / 2 записи / 5 записей
 *   en — 1 record / 2 records
 *   uz — no numeral agreement, one form
 *
 * This matters: the handover report prints live counts, and "01 записи" is the
 * kind of thing that quietly tells a Russian speaker the page was not written
 * for them.
 */
export function plural(locale: Locale, n: number, forms: readonly string[]): string {
  const [one = '', few = '', many = ''] = forms;
  if (locale === 'uz') return one;
  if (locale === 'en') return n === 1 ? one : few;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export type { Dict };
