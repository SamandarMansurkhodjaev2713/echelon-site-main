/*
 * AMBIENT LIGHT — the page travels through the shift it describes.
 *
 * The copy says the day starts at 08:57 and the machine is still working at
 * 23:00. The design never showed it: fifteen thousand pixels of one unchanging
 * beige. Here the ground itself moves — bright warm paper in the morning, lamp
 * light by evening, and the morning back again at the handover, which is the
 * next day.
 *
 * Deliberately narrow. Only the *ground* moves; ink, signal and every rule stay
 * fixed, so the type never re-tunes itself under the reader. Each stop below is
 * a real hex that `scripts/contrast.mjs` checks against every foreground the
 * page puts on it — the ramp cannot drift into a value that fails AA without
 * the contrast gate failing first.
 */

import { onShift, formatClock } from './shift';

/*
 * paper · paper-deep, at night = 0, 0.5 and 1.
 *
 * Every stop is checked by `npm run contrast`, and checked *composited*: a paper
 * section is 95 % opaque over the attention field, so the value the reader
 * actually sees is the stop mixed 19:1 with the near-black band ground. The first
 * draft of this ramp went considerably deeper toward evening and the gate caught
 * it — ruleStrong, signal and inkSoft all fell under AA on the darker stops. The
 * night therefore arrives as *warmth* rather than as darkness; the actual dark is
 * carried by the vignette and by the bands, which have no text over them.
 */
const RAMP = [
  { paper: [0xf7, 0xf3, 0xe7], deep: [0xef, 0xea, 0xdc] }, //  daylight
  { paper: [0xf3, 0xed, 0xe0], deep: [0xeb, 0xe5, 0xd6] }, //  dusk
  { paper: [0xf0, 0xe9, 0xdb], deep: [0xed, 0xe6, 0xd7] }, //  lamp light
] as const;

const hex = (c: readonly number[]) =>
  `#${c.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;

function sample(night: number): { paper: string; deep: string } {
  const t = (night < 0 ? 0 : night > 1 ? 1 : night) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(t));
  const f = t - i;
  const a = RAMP[i]!;
  const b = RAMP[i + 1]!;
  const mix = (x: readonly number[], y: readonly number[]) =>
    x.map((v, k) => v + (y[k]! - v) * f);
  return { paper: hex(mix(a.paper, b.paper)), deep: hex(mix(a.deep, b.deep)) };
}

export function initLight(): () => void {
  const root = document.documentElement;
  const clock = document.querySelector<HTMLElement>('[data-shift-clock]');
  let lastNight = -1;
  let lastClock = '';

  return onShift(({ night, minutes, progress }) => {
    // A hundredth of a night step is well under a perceptible colour change;
    // skipping below it keeps this off the critical path of a fast scroll.
    if (Math.abs(night - lastNight) > 0.01) {
      lastNight = night;
      const { paper, deep } = sample(night);
      root.style.setProperty('--paper', paper);
      root.style.setProperty('--paper-deep', deep);
      root.style.setProperty('--night', night.toFixed(3));
    }

    // Published for anything that wants the read position declaratively — the
    // masthead's progress hairline is drawn straight from it in CSS.
    root.style.setProperty('--read', progress.toFixed(4));
    root.dataset.shiftMinutes = String(Math.round(minutes));

    if (clock) {
      const text = formatClock(minutes);
      // Writing the same string back would dirty the text node on every scroll
      // frame for nothing.
      if (text !== lastClock) {
        lastClock = text;
        clock.textContent = text;
      }
    }
  });
}
