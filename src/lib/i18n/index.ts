import { ru, type Dict } from './ru';
import { en } from './en';
import { uz } from './uz';

export type Locale = 'ru' | 'en' | 'uz';

const dicts: Partial<Record<Locale, Dict>> = { ru, en, uz };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? ru;
}

export type { Dict };
