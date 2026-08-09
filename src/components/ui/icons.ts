// Minimal lucide-style stroke icon paths (24×24 viewBox), inlined for zero deps.
export const icons: Record<string, string> = {
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  graph:
    '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M10.8 6.9 6.2 16m7-9.1 4.6 9.1M7.2 18h9.6"/>',
  vault:
    '<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5V18.5c0 1.55 3.58 2.8 8 2.8s8-1.25 8-2.8V5.5"/><path d="M4 12c0 1.55 3.58 2.8 8 2.8s8-1.25 8-2.8"/>',
  sessions: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  kanban:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v12"/>',
  zap: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
  sparkles:
    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>',
  monitor:
    '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  plug: '<path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7zM12 16v5"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  reply: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v4"/>',
  check: '<path d="M4 12.5 9.5 18 20 6.5"/>',
  x: '<path d="M5 5l14 14M19 5 5 19"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/>',
  clip: '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17.4a1.7 1.7 0 0 1-2.4-2.4L16 6.6"/>',
};

export function icon(name: string): string {
  const body = icons[name] ?? '';
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
