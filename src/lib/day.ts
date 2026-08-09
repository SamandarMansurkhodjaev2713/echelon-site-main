/*
 * Desktop pinned choreography for the "one day" scene.
 * Scroll drives a clock from 07:00 to 23:00; scenes crossfade at their hour.
 * Loaded only on >=1000px without reduced-motion; the DOM works without it.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SCENE_MINUTES = [9 * 60, 10 * 60, 14 * 60, 19 * 60, 23 * 60];

export function initDay() {
  const root = document.querySelector<HTMLElement>('[data-day]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('[data-day-stage]');
  const clock = root.querySelector<HTMLElement>('[data-day-clock]');
  const bar = root.querySelector<HTMLElement>('[data-day-bar]');
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-day-scene]'));
  if (!stage || !clock || !bar || scenes.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('day--pinned');

  const n = scenes.length;
  const first = SCENE_MINUTES[0]!;
  const last = SCENE_MINUTES[n - 1]!;

  gsap.set(scenes[0]!, { opacity: 1 });
  gsap.set(scenes[0]!.querySelector('.day__fragment'), { y: 0, opacity: 1 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.7,
      onUpdate(self) {
        // Clock catches up to a scene's time during the transition into it,
        // then holds — so the time on screen always matches the scene.
        const p = Math.min(self.progress, 0.9999);
        const slotW = 1 / SCENE_MINUTES.length;
        const i = Math.floor(p / slotW);
        const local = (p - i * slotW) / slotW;
        const cur = SCENE_MINUTES[i]!;
        const prev = i > 0 ? SCENE_MINUTES[i - 1]! : cur;
        const minutes = local < 0.3 ? prev + (cur - prev) * (local / 0.3) : cur;
        const snapped = Math.round(minutes / 5) * 5;
        const hh = String(Math.floor(snapped / 60)).padStart(2, '0');
        const mm = String(snapped % 60).padStart(2, '0');
        clock.textContent = `${hh}:${mm}`;
        bar.style.height = `${self.progress * 100}%`;
      },
    },
  });

  // Each scene owns one equal slot of the timeline; crossfades at boundaries.
  const slot = 1 / n;
  for (let i = 0; i < n; i++) {
    const scene = scenes[i]!;
    const frag = scene.querySelector('.day__fragment');
    const at = i * slot;
    if (i > 0) {
      tl.to(scenes[i - 1]!, { opacity: 0, y: -26, duration: slot * 0.22 }, at);
      tl.fromTo(
        scene,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: slot * 0.26 },
        at + slot * 0.1,
      );
      if (frag) {
        tl.fromTo(
          frag,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: slot * 0.24 },
          at + slot * 0.22,
        );
      }
    }
    // gentle idle drift so held scenes feel alive under scrub
    tl.to(scene, { duration: slot * 0.5 }, at + slot * 0.4);
  }

  ScrollTrigger.refresh();
}
