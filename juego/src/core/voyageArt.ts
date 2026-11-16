/** Escenas ilustradas del regreso, en capas SVG (fondo, estrellas, astros, ventana de la cabina, viñeta). Todo [DIBUJO] procedural. */
export type ArtKind = 'cabin' | 'view' | 'storm' | 'orbit';

const rnd = (i: number): number => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function starsLayer(n: number, seed: number, w: number, h: number, big: number): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rnd(i + seed) * w, y = rnd(i * 3 + seed + 9) * h, r = 0.6 + rnd(i * 5 + seed) * big;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#e4e3f2" opacity="${(0.35 + rnd(i + 4) * 0.65).toFixed(2)}"/>`;
  }
  return s;
}
const moon = (x: number, y: number, r: number): string => `
  <circle cx="${x}" cy="${y}" r="${r}" fill="#b9b7cf"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.2}" r="${r * 0.18}" fill="#8d8aa8"/>
  <circle cx="${x + r * 0.25}" cy="${y + r * 0.3}" r="${r * 0.24}" fill="#8d8aa8"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.1}" fill="#a09db9"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#shadeMoon)"/>`;
const earth = (x: number, y: number, r: number): string => `
  <circle cx="${x}" cy="${y}" r="${r + 6}" fill="#4cc3f5" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="#2f6fd0"/>
  <path d="M${x - r * 0.6} ${y - r * 0.2} q ${r * 0.3} -${r * 0.4} ${r * 0.6} -${r * 0.1} q ${r * 0.2} ${r * 0.3} ${-r * 0.1} ${r * 0.5} q ${-r * 0.4} ${r * 0.1} ${-r * 0.5} ${-r * 0.4}z" fill="#5ad66b" opacity=".85"/>
  <path d="M${x + r * 0.1} ${y + r * 0.3} q ${r * 0.3} -${r * 0.1} ${r * 0.4} ${r * 0.2} q ${-r * 0.2} ${r * 0.3} ${-r * 0.4} ${r * 0.1}z" fill="#5ad66b" opacity=".85"/>
  <ellipse cx="${x - r * 0.2}" cy="${y - r * 0.5}" rx="${r * 0.5}" ry="${r * 0.12}" fill="#fff" opacity=".55"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#shadeEarth)"/>`;

export function voyageArt(kind: ArtKind): string {
  const W = 800, H = 350;
  const defs = `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05041a"/><stop offset=".6" stop-color="#0b0830"/><stop offset="1" stop-color="#1a1050"/></linearGradient>
    <radialGradient id="shadeMoon" cx=".3" cy=".3" r=".9"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
    <radialGradient id="shadeEarth" cx=".3" cy=".3" r=".9"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
    <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8"/><stop offset=".4" stop-color="#ffcb47" stop-opacity=".55"/><stop offset="1" stop-color="#ffcb47" stop-opacity="0"/></radialGradient>
  </defs>`;
  let body = `<rect width="${W}" height="${H}" fill="url(#bg)"/><g>${starsLayer(90, 1, W, H, 1.2)}</g><g opacity=".7">${starsLayer(40, 77, W, H, 2)}</g>`;
  // capa lejana: nebulosa suave (Vía Láctea, «río del cielo»)
  body += `<path d="M-20 260 C 180 150, 360 300, 560 160 S 800 90, 840 120" stroke="#9b7bff" stroke-opacity=".12" stroke-width="70" fill="none"/>
           <path d="M-20 270 C 200 170, 380 310, 580 180 S 800 110, 840 140" stroke="#4cc3f5" stroke-opacity=".1" stroke-width="30" fill="none"/>`;
  if (kind === 'cabin' || kind === 'view') body += moon(kind === 'view' ? 120 : 170, kind === 'view' ? 200 : 150, kind === 'view' ? 28 : 46) + earth(kind === 'view' ? 600 : 560, 170, kind === 'view' ? 90 : 60);
  if (kind === 'storm') {
    body += `<circle cx="640" cy="70" r="180" fill="url(#sun)"/>`;
    for (let i = 0; i < 9; i++) body += `<path d="M640 70 L ${rnd(i) * 800} ${H}" stroke="#ffcb47" stroke-opacity=".08" stroke-width="${6 + rnd(i + 5) * 14}"/>`;
    for (let i = 0; i < 14; i++) body += `<rect x="0" y="${rnd(i + 30) * H}" width="${W}" height="1.5" fill="#e4e3f2" opacity="${0.04 + rnd(i) * 0.1}"/>`;
    body += earth(250, 240, 54);
  }
  if (kind === 'orbit') body += `<ellipse cx="400" cy="560" rx="620" ry="330" fill="#2f6fd0"/><ellipse cx="400" cy="560" rx="620" ry="330" fill="none" stroke="#9fe0ff" stroke-width="8" opacity=".55"/><ellipse cx="400" cy="520" rx="380" ry="40" fill="#fff" opacity=".18"/>`;
  // capa cercana: marco de la ventana de la cabina
  body += `<path d="M0 0H${W}V${H}H0Z M46 36 H${W - 46} Q ${W - 20} 36 ${W - 20} 66 V ${H - 66} Q ${W - 20} ${H - 36} ${W - 46} ${H - 36} H46 Q20 ${H - 36} 20 ${H - 66} V66 Q20 36 46 36Z" fill="#15112f" fill-rule="evenodd"/>
           <path d="M46 36 H${W - 46} Q ${W - 20} 36 ${W - 20} 66 V ${H - 66} Q ${W - 20} ${H - 36} ${W - 46} ${H - 36} H46 Q20 ${H - 36} 20 ${H - 66} V66 Q20 36 46 36Z" fill="none" stroke="#3a3470" stroke-width="6"/>`;
  for (const [x, y] of [[30, 20], [W - 30, 20], [30, H - 20], [W - 30, H - 20]]) body += `<circle cx="${x}" cy="${y}" r="5" fill="#6b64a8"/>`;
  body += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  // luz ámbar de alarma en la tormenta (nunca rojo continuo)
  if (kind === 'storm') body += `<rect width="${W}" height="${H}" fill="#ffb347" opacity=".06"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${kind}" preserveAspectRatio="xMidYMid slice">${defs}${body}</svg>`;
}
