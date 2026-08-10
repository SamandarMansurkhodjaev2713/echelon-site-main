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

const P = {
  paper: '#F4F1E8',
  paperDeep: '#EAE6DA',
  rule: '#CFC9B6', //  decorative hairline
  ruleStrong: '#8C8779', //  functional border (inputs, controls) — needs 3:1
  ink: '#15140F',
  inkMuted: '#403E37',
  inkSoft: '#5C594F',
  machine: '#636057', //  system meta on paper
  machineInv: '#9E9A8E', //  system meta on ink
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
