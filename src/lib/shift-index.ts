import type { Dict } from '../i18n';

/*
 * The shift, as a list — one definition, used by the header panel and by the
 * footer sitemap, because two copies of a navigation list are two lists that
 * drift.
 *
 * Not one new string. Every name is the section's own kicker, already written
 * and already proofread in all three locales, so the index cannot fall out of
 * step with the section it points at and nothing had to be invented in a
 * language nobody here writes. Two entries are not kickers because they could
 * not be: `hero` has none, and `night`'s reads "23:00", which beside the hour
 * the row already carries would say the same thing twice.
 *
 * Hours are deliberately not here. They live on the sections as `data-shift` —
 * the same value the ambient light and the header clock run on — and are read
 * off the document at runtime. A second copy typed into a list is a copy that
 * can be wrong, and this page has already spent one phase unpicking a clock
 * that disagreed with itself.
 */
export interface ShiftEntry {
  id: string;
  name: string;
}

export function shiftIndex(dict: Dict): ShiftEntry[] {
  return [
    { id: 'top', name: dict.intro.label },
    { id: 'load', name: dict.load.label },
    { id: 'teach', name: dict.teach.label },
    { id: 'pillars', name: dict.pillars.label },
    { id: 'day', name: dict.day.label },
    { id: 'product', name: dict.product.label },
    { id: 'memory', name: dict.memory.label },
    { id: 'automate', name: dict.automate.label },
    { id: 'client', name: dict.client.label },
    { id: 'boundary', name: dict.boundary.label },
    { id: 'night', name: dict.night.title },
    { id: 'voice', name: dict.voice.label },
    { id: 'ledger', name: dict.ledger.label },
    { id: 'handover', name: dict.handover.label },
  ];
}
