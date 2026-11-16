import { BURN_TOLERANCE, bellyFacing } from '../sim/entry';
import type { MiniGameHandle } from './miniGames';
import type { PhaseDone } from './casaGames';

/**
 * Voltereta de inspección (R-bar pitch) y quema de frenado, con arte por capas en canvas (380 × 500).
 * Todo lo numérico es [MODELO]: solo la velocidad del giro real (0,75 °/s) es [REAL] y aquí va ×20 más rápida.
 */
const W = 380;
const H = 500;
const INK = '#0e0b33';
type Lang = 'es' | 'en';
const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
const rnd = (i: number): number => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mk = (root: HTMLElement, label: string): { c: CanvasRenderingContext2D; el: HTMLCanvasElement } => {
  root.innerHTML = `<div style="width:${W}px;height:${H}px"><canvas width="${W}" height="${H}" role="img" aria-label="${label}" style="display:block;border:4px solid ${INK};border-radius:14px;touch-action:none"></canvas></div>`;
  const el = root.querySelector('canvas')!;
  return { c: el.getContext('2d')!, el };
};

/** Capas comunes: fondo, estrellas lejanas y cercanas (parallax), limbo de la Tierra con atmósfera, destello del Sol. */
function backdrop(c: CanvasRenderingContext2D, _t: number, shift: number, sunGlow: number): void {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04031a'); g.addColorStop(1, '#0d0a3a');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(228,227,242,${0.25 + rnd(i) * 0.5})`; c.fillRect(((rnd(i + 1) * W - shift * 0.15) % W + W) % W, rnd(i + 2) * H * 0.8, 1.5, 1.5); }
  for (let i = 0; i < 18; i++) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(((rnd(i + 90) * W - shift * 0.5) % W + W) % W, rnd(i + 91) * H * 0.75, 2.4, 2.4); }
  if (sunGlow > 0) { const sg = c.createRadialGradient(W - 40, 60, 4, W - 40, 60, 170); sg.addColorStop(0, `rgba(255,240,190,${0.8 * sunGlow})`); sg.addColorStop(1, 'rgba(255,203,71,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H); }
  const eg = c.createRadialGradient(W / 2, H + 380, 380, W / 2, H + 380, 440); eg.addColorStop(0, '#2f6fd0'); eg.addColorStop(0.9, '#4cc3f5'); eg.addColorStop(1, 'rgba(76,195,245,0)');
  c.fillStyle = eg; c.beginPath(); c.arc(W / 2, H + 380, 440, 0, 7); c.fill();
  c.strokeStyle = 'rgba(159,224,255,0.5)'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, H + 380, 384, Math.PI * 1.25, Math.PI * 1.75); c.stroke();
}

function orbiterSide(c: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number): void {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'round';
  c.fillStyle = '#f5f5f2'; c.beginPath(); c.moveTo(-70, -6); c.quadraticCurveTo(-76, 0, -70, 8); c.lineTo(50, 12); c.quadraticCurveTo(84, 6, 92, 0); c.quadraticCurveTo(84, -8, 50, -12); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#d7d4ef'; c.beginPath(); c.moveTo(-10, 8); c.lineTo(-62, 34); c.lineTo(-30, 10); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#e8e6f7'; c.beginPath(); c.moveTo(-60, -8); c.lineTo(-86, -34); c.lineTo(-44, -8); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#2b2b3c'; c.beginPath(); c.moveTo(60, 12); c.quadraticCurveTo(90, 8, 92, 0); c.lineTo(80, -6); c.lineTo(52, -12); c.closePath(); c.fill();
  c.fillStyle = '#7fd4ff'; c.fillRect(54, -10, 10, 5);
  c.fillStyle = '#2b2b3c'; c.fillRect(-70, 8, 120, 6);                        // vientre con losetas
  c.restore();
}

// ------------------------------------------------------------------ voltereta: controlas la velocidad del giro; solo se fotografía con giro estable y luz
export function mountRollover(root: HTMLElement, o: { damaged: number; seed: number; hard: boolean; lang: Lang; calm?: boolean; cb: PhaseDone }): MiniGameHandle {
  const es = o.lang === 'es';
  const { c, el } = mk(root, es ? 'Voltereta de inspección' : 'Inspection roll');
  const COLS = 6, ROWS = 4, TOTAL = COLS * ROWS, SECONDS = o.hard ? 40 : 48, IDEAL = 12, TOL = o.hard ? 0.18 : 0.28;
  const cracks = new Set<number>(); let k = 0;
  while (cracks.size < o.damaged) cracks.add(Math.floor(rnd(o.seed + k++) * TOTAL));
  const shot = new Array<boolean>(TOTAL).fill(false);
  const blur = new Array<number>(COLS).fill(0);
  const expo = new Array<number>(COLS).fill(0);
  let theta = 100, omega = IDEAL * 1.6, target = IDEAL, fuel = 100, t = 0, over = false, raf = 0, last = performance.now(), msg = '', msgT = 0;
  const setTarget = (v: number): void => { target = clamp(v, 0, IDEAL * 2.4); };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') { setTarget(target - 1.2); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setTarget(target + 1.2); e.preventDefault(); }
    if (e.key === ' ' || e.key === 'ArrowDown') { setTarget(IDEAL); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  const pt = (e: PointerEvent): void => { const r = el.getBoundingClientRect(); setTarget(((e.clientX - r.left) / r.width) * IDEAL * 2.4); };
  el.addEventListener('pointerdown', pt); el.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') pt(e); });
  const finish = (): void => {
    if (over) return; over = true; cancelAnimationFrame(raf);
    const n = shot.filter(Boolean).length; const unfound = [...cracks].filter((i) => !shot[i]).length;
    o.cb({ score: n / TOTAL, unfound });
  };
  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    // la velocidad real sigue a la pedida; cambiarla gasta combustible
    const dv = clamp(target - omega, -10 * dt, 10 * dt);
    if (fuel > 0 || Math.abs(dv) < 1e-6) { omega += dv; fuel = Math.max(0, fuel - Math.abs(dv) * 0.35); }
    theta = (theta + omega * dt * (1 + 0)) % 360;
    const lit = bellyFacing(theta);
    const stable = Math.abs(omega - IDEAL) <= IDEAL * TOL;
    const col = clamp(Math.floor(((theta - 110) / 140) * COLS), 0, COLS - 1);
    if (lit) {
      if (stable) { expo[col] += dt; if (expo[col] >= 0.4) for (let r = 0; r < ROWS; r++) shot[r * COLS + col] = true; blur[col] = 0; }
      else { expo[col] = 0; blur[col] = 1; msg = omega > IDEAL ? (es ? 'Muy rápido: sale borroso' : 'Too fast: blurry') : (es ? 'Muy lento: se gasta tiempo' : 'Too slow: time is wasted'); msgT = 0.6; }
    }
    msgT -= dt;
    if (t >= SECONDS || shot.every(Boolean)) { setTimeout(finish, 400); over = true; }
    // ---- dibujo por capas
    backdrop(c, theta * 3, theta * 2, lit ? 0.7 : 0.2);
    // mapa de losetas (arriba)
    const mx = 40, my = 54, tw = 50, th = 24;
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
      const i = r * COLS + q; const x = mx + q * (tw + 1), y = my + r * (th + 1);
      c.fillStyle = shot[i] ? (cracks.has(i) ? '#ffb347' : '#5ad6b2') : blur[q] && lit && q === col ? '#7d6a9a' : '#2a2560'; c.fillRect(x, y, tw, th);
      if (q === col && lit) { c.strokeStyle = '#7fd4ff'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, tw - 2, th - 2); }
    }
    c.fillStyle = '#f5f5f2'; c.font = '700 12px Arial'; c.textAlign = 'left'; c.fillText(es ? 'Mapa de losetas' : 'Tile map', mx, my - 8);
    c.textAlign = 'right'; c.fillText(`${shot.filter(Boolean).length}/${TOTAL}`, mx + COLS * (tw + 1), my - 8);
    // nave girando (capa media) con haz del visor cuando hay luz
    if (lit) { c.fillStyle = 'rgba(127,212,255,0.12)'; c.beginPath(); c.moveTo(W - 30, 340); c.lineTo(190, 250); c.lineTo(190, 330); c.closePath(); c.fill(); }
    orbiterSide(c, 190, 290, (theta * Math.PI) / 180, 1.3);
    // marcador de velocidad: banda estable verde
    const bx = 30, bw = W - 60, by = 396;
    c.fillStyle = '#1b1650'; c.fillRect(bx, by, bw, 16);
    c.fillStyle = 'rgba(90,214,178,0.5)'; c.fillRect(bx + bw * ((IDEAL * (1 - TOL)) / (IDEAL * 2.4)), by, bw * ((IDEAL * 2 * TOL) / (IDEAL * 2.4)), 16);
    c.fillStyle = '#ffcb47'; c.fillRect(bx + bw * (omega / (IDEAL * 2.4)) - 3, by - 5, 6, 26);
    c.fillStyle = '#f5f5f2'; c.font = '700 12px Arial'; c.textAlign = 'center';
    c.fillText(es ? 'Giro: arrastra o ← → · Espacio = estable' : 'Spin: drag or ← → · Space = steady', W / 2, by + 36);
    c.fillStyle = '#1b1650'; c.fillRect(bx, 452, bw, 10); c.fillStyle = fuel > 25 ? '#ffb347' : '#ff7a59'; c.fillRect(bx, 452, bw * (fuel / 100), 10);
    c.fillStyle = '#f5f5f2'; c.fillText(`${es ? 'Combustible' : 'Fuel'} · ${Math.max(0, Math.ceil(SECONDS - t))} s`, W / 2, 482);
    if (msgT > 0) { c.fillStyle = '#ffb347'; c.fillText(msg, W / 2, 352); }
    if (!over) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { nudge: (dx) => setTarget(target + dx * 1.2), destroy() { over = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); } };
}

// ------------------------------------------------------------------ quema: alinear la nave con la marca (2 ejes) con cuenta regresiva y empujones
export function mountBurnAlign(root: HTMLElement, o: { hard: boolean; seed: number; lang: Lang; calm?: boolean; cb: PhaseDone }): MiniGameHandle {
  const es = o.lang === 'es';
  const { c, el } = mk(root, es ? 'Quema de frenado' : 'Braking burn');
  const TOL = BURN_TOLERANCE * (o.hard ? 0.8 : 1) * 1.3;
  let x = 0.6, y = 0.4, vx = 0, vy = 0, gauge = 0, aligned = 0, t = 0, over = false, raf = 0, last = performance.now(), px = 0, py = 0, shake = 0;
  const parts: { x: number; y: number; life: number; vx: number; vy: number }[] = [];
  let kx = 0, ky = 0;
  const onKey = (e: KeyboardEvent): void => {
    const d = e.type === 'keydown' ? 1 : 0;
    if (e.key === 'ArrowLeft') kx = -d; else if (e.key === 'ArrowRight') kx = d; else if (e.key === 'ArrowUp') ky = -d; else if (e.key === 'ArrowDown') ky = d; else return;
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const move = (e: PointerEvent): void => { const r = el.getBoundingClientRect(); px = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1); py = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1); x = px; y = py; };
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); move(e); });
  el.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') move(e); });
  const finish = (): void => { if (over) return; over = true; cancelAnimationFrame(raf); o.cb({ score: clamp(aligned / 6) }); };
  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const go = t > 3;                                       // cuenta regresiva 3-2-1
    if (go) {
      x = clamp(x + kx * dt * 1.2, -1, 1); y = clamp(y + ky * dt * 1.2, -1, 1);
      if (!o.calm && Math.floor(t * 0.5) !== Math.floor((t - dt) * 0.5)) { vx = (rnd(o.seed + Math.floor(t)) - 0.5) * 0.9; vy = (rnd(o.seed + Math.floor(t) + 7) - 0.5) * 0.9; shake = 0.4; }
      x = clamp(x + vx * dt, -1, 1); y = clamp(y + vy * dt, -1, 1); vx *= 0.9; vy *= 0.9;
    }
    const cx = 0.5 * Math.sin(t * 0.9), cy = 0.35 * Math.sin(t * 1.3 + 1);
    const err = Math.hypot(x - cx, y - cy); const ok = go && err <= TOL;
    if (ok) { aligned += dt; gauge = Math.min(1, gauge + dt / 6); if (!o.calm) for (let i = 0; i < 2; i++) parts.push({ x: x * 140 + W / 2, y: y * 140 + H / 2 + 54, life: 1, vx: (Math.random() - 0.5) * 40, vy: 90 + Math.random() * 60 }); }
    else gauge = Math.max(0, gauge - dt / 12);
    shake = Math.max(0, shake - dt);
    if (go && (gauge >= 1 || t > 19)) { setTimeout(finish, 500); over = true; }
    c.save(); if (shake > 0 && !o.calm) c.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    backdrop(c, t * 40, t * 30, 0.25);
    // marca verde (capa lejana) y nave (capa cercana) con llama de partículas
    const tx = W / 2 + cx * 140, ty = H / 2 + cy * 140;
    c.strokeStyle = ok ? '#5ad6b2' : 'rgba(90,214,178,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(tx, ty, TOL * 140, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(tx - 12, ty); c.lineTo(tx + 12, ty); c.moveTo(tx, ty - 12); c.lineTo(tx, ty + 12); c.stroke();
    for (const p of parts) { p.life -= dt * 2.2; p.x += p.vx * dt; p.y += p.vy * dt; }
    while (parts.length && parts[0].life <= 0) parts.shift();
    for (const p of parts) { c.fillStyle = `rgba(255,${150 + Math.floor(80 * p.life)},71,${p.life})`; c.beginPath(); c.arc(p.x, p.y, 2 + 5 * p.life, 0, 7); c.fill(); }
    orbiterSide(c, W / 2 + x * 140, H / 2 + y * 140, -Math.PI / 2 * 0 + 0.15, 0.9);
    c.restore();
    c.fillStyle = '#1b1650'; c.fillRect(24, 456, W - 48, 12); c.fillStyle = ok ? '#5ad6b2' : '#ffb347'; c.fillRect(24, 456, (W - 48) * gauge, 12);
    c.fillStyle = '#f5f5f2'; c.font = '700 14px Arial'; c.textAlign = 'center';
    c.fillText(go ? (es ? 'Mantén la nave sobre la marca verde' : 'Keep the ship on the green mark') : `${Math.max(1, Math.ceil(3 - t))}`, W / 2, go ? 36 : 250);
    c.fillText(es ? 'Arrastra o usa las flechas' : 'Drag or use the arrow keys', W / 2, 488);
    if (!over) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { nudge: (dx, dy) => { x = clamp(x + dx * 0.08, -1, 1); y = clamp(y + dy * 0.08, -1, 1); }, destroy() { over = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); } };
}
