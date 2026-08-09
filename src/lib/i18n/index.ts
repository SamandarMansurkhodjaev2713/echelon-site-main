import { ru, type Dict } from './ru';
import { en } from './en';

export type Locale = 'ru' | 'en' | 'uz';

const dicts: Partial<Record<Locale, Dict>> = { ru, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? ru;
}

export type { Dict };
