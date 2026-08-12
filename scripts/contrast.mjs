/* WCAG contrast validator for the ECHELON palette. Run: node scripts/contrast.mjs */
const hex = (h) => {
  const n = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* Composite `fg` over `bg` at alpha `a` — how a paper veil actually resolves
   against the attention field behind it (see --paper-veil in tokens.css). */
const over = (fg, bg, a) => {
  const [f, b] = [hex(fg), hex(bg)];
  return (
    '#' +
    f
      .map((c, i) => Math.round((c * a + b[i] * (1 - a)) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
};

const P = {
  paper: '#F4F1E8',
  paperDeep: '#EAE6DA',
  rule: '#CFC9B6', //  decorative hairline
  ruleStrong: '#7A7568', //  functional border (inputs, controls) — needs 3:1
  ink: '#15140F',
  inkMuted: '#403E37',
  inkSoft: '#565348',
  machine: '#55524A', //  system meta on paper
  machineInv: '#A8A496', //  system meta on ink
  signal: '#B0341A',
  signalDeep: '#8E2913',
  signalBright: '#E2673F', //  signal on ink
  // machine world (product) — unchanged in character
  uiBg: '#0E0E0D',
  uiFg: '#F5F4EF',
  uiFgMuted: '#A9A79F',
  uiFgSubtle: '#87847B',
  uiAccent: '#14B8A6',
  uiAccentBright: '#2DD4BF',
};

const checks = [
  ['ink on paper', P.ink, P.paper, 4.5],
  ['ink on paperDeep', P.ink, P.paperDeep, 4.5],
  ['inkMuted on paper', P.inkMuted, P.paper, 4.5],
  ['inkSoft on paper', P.inkSoft, P.paper, 4.5],
  ['machine on paper', P.machine, P.paper, 4.5],
  ['machine on paperDeep', P.machine, P.paperDeep, 4.5],
  ['signal on paper', P.signal, P.paper, 4.5],
  ['signal on paperDeep', P.signal, P.paperDeep, 4.5],
  ['signalDeep on paper', P.signalDeep, P.paper, 4.5],
  ['paper on signal (button)', P.paper, P.signal, 4.5],
  ['paper on ink (inverted)', P.paper, P.ink, 4.5],
  ['machineInv on ink', P.machineInv, P.ink, 4.5],
  ['signalBright on ink', P.signalBright, P.ink, 4.5],
  ['ruleStrong on paper (functional border)', P.ruleStrong, P.paper, 3],
  ['paper on signalDeep (stamp text)', P.paper, P.signalDeep, 4.5],
  ['— product scope —', P.uiFg, P.uiBg, 4.5],
  ['uiFgMuted on uiBg', P.uiFgMuted, P.uiBg, 4.5],
  ['uiFgSubtle on uiBg', P.uiFgSubtle, P.uiBg, 4.5],
  ['uiAccent on uiBg', P.uiAccent, P.uiBg, 4.5],
  ['uiBg on uiAccent (button)', P.uiBg, P.uiAccent, 4.5],
];

/* ---------------------------------------------------------------------------
   The ambient light ramp (motion/light.ts). The ground moves across the shift,
   so every stop it can reach has to clear AA on its own — and it has to clear it
   *composited*, because a paper section is 95 % opaque over the attention field
   and the worst case behind it is the near-black band ground.
   --------------------------------------------------------------------------- */
const RAMP = {
  'day     ': { paper: '#F7F3E7', deep: '#EFEADC' },
  'dusk    ': { paper: '#F3EDE0', deep: '#EBE5D6' },
  'lamp    ': { paper: '#F0E9DB', deep: '#EDE6D7' },
};
const VEIL = 0.95;
const BEHIND = '#15140F'; //  --paper-ink, the darkest thing the veil can sit on

for (const [when, stop] of Object.entries(RAMP)) {
  for (const [which, base] of Object.entries(stop)) {
    const ground = over(base, BEHIND, VEIL);
    checks.push(
      [`ink on ${which} @${when} (veiled ${ground})`, P.ink, ground, 4.5],
      [`inkMuted on ${which} @${when}`, P.inkMuted, ground, 4.5],
      [`inkSoft on ${which} @${when}`, P.inkSoft, ground, 4.5],
      [`machine on ${which} @${when}`, P.machine, ground, 4.5],
      [`signal on ${which} @${when}`, P.signal, ground, 4.5],
      [`ruleStrong on ${which} @${when}`, P.ruleStrong, ground, 3],
    );
  }
}

/* ---------------------------------------------------------------------------
   THE INVERTED BAND (.on-ink — night, voice).

   This scope used to be checked for its type and nothing else, which was enough
   while the only thing in it was type. The voice section now carries the
   product's sphere on its own stage, and around it a row of entity chips with a
   real border — so the functional-border rule has to hold on ink as well, and
   nothing was asking.

   The entity names themselves need no special case any more, and that is the
   point of having moved them. They were painted into the canvas at a computed
   alpha, which is invisible to both this file and axe-core, and PHASE 17 had to
   hand-gate two alpha constants to keep them legible. As markup they are
   `--ink` and `--machine-inv` on `--paper-ink`, which the checks above already
   cover, and axe reads them like any other words.
   --------------------------------------------------------------------------- */
const STAGE_CORE = '#261A0B'; //  the medallion's lit centre
const STAGE_EDGE = '#0C0805'; //  and its darkest edge

checks.push(
  ['ruleStrong on ink (functional border, inverted)', '#6E6A5F', P.ink, 3],
  ['inkMuted-inv on ink', '#C6C2B6', P.ink, 4.5],
  ['inkSoft-inv on ink', '#A9A59A', P.ink, 4.5],
  /* Nothing is set on the stage today — the sphere is aria-hidden and every
     label sits outside it. These two say what the stage would cost if that ever
     changed, so the answer is on record before somebody puts a caption there. */
  ['paper on stage centre (if type ever lands there)', P.paper, STAGE_CORE, 4.5],
  ['machineInv on stage edge (if type ever lands there)', P.machineInv, STAGE_EDGE, 4.5],
);

let fails = 0;
for (const [name, fg, bg, min] of checks) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fails++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)} : 1  (need ${min})  ${name}`,
  );
}
console.log(fails ? `\n${fails} FAILURE(S)` : '\nAll contrast checks pass.');
process.exit(fails ? 1 : 0);
