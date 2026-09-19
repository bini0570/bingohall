import React from 'react';

/* ============ icons ============ */
export const ICONS = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tasks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".6" fill="currentColor"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  cog: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
  up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'
};

export function Icon({ name, size }) {
  const s = size || 20;
  return (
    <svg 
      className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" 
      aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} 
    />
  );
}

/* ============ helpers ============ */
export const cx = (...a) => a.filter(Boolean).join(' ');
export const fmt = (n) => Number(n || 0).toLocaleString('en-US');
export const initials = (name) => (name ? name.split(' ').map((s) => s[0]).slice(0, 2).join('') : '?');
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const BALLS = ['b', 'i', 'n', 'g', 'o'];
export const fmtPhone = (p) => (p || '').replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

export const TYPES = [
  { v: 'Telegram', btn: 'Join', ph: 'Join GameZoneETH', icon: 'send' },
  { v: 'Invite', btn: 'Invite', ph: 'Invite 3 friends', icon: 'users' },
  { v: 'Game Played', btn: 'Play Now', ph: 'Play Bingo 3 Rounds', icon: 'play' }
];
export const TARGETS = ['All Players', 'New Players', 'Active Players', 'VIP Depositors'];

/* chart series */
export function seeded(n, seed) { let s = seed; const o = []; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; o.push(s / 233280); } return o; }
export const RANGES = {
  '24h': { n: 12, base: 5200, seed: 7, label: (i) => String(i * 2).padStart(2, '0') + ':00', when: (l) => 'Today, ' + l },
  '7D': { n: 7, base: 58000, seed: 21, label: (i, n) => (i === n - 1 ? 'Today' : new Date(Date.now() - (n - 1 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), when: (l) => l },
  '30D': { n: 30, base: 52000, seed: 33, label: (i, n) => (i === n - 1 ? 'Today' : new Date(Date.now() - (n - 1 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), when: (l) => l },
  '90D': { n: 13, base: 370000, seed: 45, label: (i, n) => new Date(Date.now() - 7 * (n - 1 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), when: (l) => 'Week ending ' + l }
};
export function series(key) {
  const c = RANGES[key]; const r = seeded(c.n, c.seed);
  const data = r.map((x, i) => Math.round((c.base * (0.6 + 0.8 * x) * (0.9 + 0.2 * (i / (c.n - 1)))) / 10) * 10);
  const labels = data.map((_, i) => c.label(i, c.n));
  return { data, labels, when: c.when };
}
export function smoothPath(p) {
  let d = 'M' + p[0][0].toFixed(2) + ',' + p[0][1].toFixed(2);
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, t = 0.17;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ' C' + c1[0].toFixed(2) + ',' + c1[1].toFixed(2) + ' ' + c2[0].toFixed(2) + ',' + c2[1].toFixed(2) + ' ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2);
  }
  return d;
}
