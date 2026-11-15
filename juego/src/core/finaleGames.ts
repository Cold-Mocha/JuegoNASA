import { t } from './i18n';
import {
  BELT_H, BELT_SECONDS, BELT_SHIP_Y, CRATER_W, ROCKS, ROVER_LEN, beltDone, beltScore, createBelt, createRover, craters, hintSeconds,
  moveBelt, roverDone, roverScore, stepBelt, stepRover, terrainY, type BeltState, type RoverState,
} from '../sim/finale';
import type { MiniGameHandle } from './miniGames';
/**
 * Fase E (la sonda): el cinturón de asteroides y el rover lunar, en canvas de 380 × 500 (sin Phaser).
 * La lógica vive en `sim/finale.ts`; aquí solo se dibuja y se leen los controles (teclado, ratón o dedo).
 */
const W = 380;
const H = BELT_H;
const LANE_X = [W * 0.2, W * 0.5, W * 0.8];
const INK = '#0e0b33';

export interface BeltResult { score: number; batteries: number; chips: number; algae: number; hull: number; }
export interface RoverResult { score: number; rocks: number; flips: number; }

interface Loop { destroy(): void; }

/** Bucle de animación con límite de dt; `step` devuelve true al terminar (la llamada de cierre se guarda para que `destroy` la cancele). */
function runLoop(step: (dt: number) => boolean, draw: () => void, finish: () => void): Loop {
  let raf = 0;
  let timer = 0;
  let dead = false;
  let last = performance.now();
  const frame = (now: number): void => {
    if (dead) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const over = step(dt);
    draw();
    if (over) { timer = window.setTimeout(() => { if (!dead) finish(); }, 900); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { destroy() { dead = true; cancelAnimationFrame(raf); clearTimeout(timer); } };
}

function makeCanvas(root: HTMLElement, label: string, extra = ''): { c: CanvasRenderingContext2D; el: HTMLCanvasElement; box: HTMLElement } {
  root.innerHTML = `<div class="finale" style="position:relative;width:${W}px;height:${H}px"><canvas width="${W}" height="${H}" role="img" aria-label="${label}" style="display:block;border:4px solid ${INK};border-radius:14px;touch-action:none"></canvas>${extra}</div>`;
  const el = root.querySelector('canvas')!;
  return { c: el.getContext('2d')!, el, box: root.querySelector<HTMLElement>('.finale')! };
}

const text = (c: CanvasRenderingContext2D, s: string, x: number, y: number, size = 15, align: CanvasTextAlign = 'left'): void => {
  c.font = `700 ${size}px Arial, Helvetica, sans-serif`;
  c.textAlign = align;
  c.fillStyle = '#f5f5f2';
  c.fillText(s, x, y);
};

const stars = (c: CanvasRenderingContext2D, t0: number): void => {
  c.fillStyle = '#0b0830';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#e4e3f2';
  for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, (i * 53 + t0 * 40 * (1 + (i % 3))) % H, 2, 2);
};

// ------------------------------------------------------------------ la sonda (dibujo compartido)
const smooth = (a: number, b: number, x: number): number => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
interface ProbeLook { scale?: number; legs?: number; flame?: number; tilt?: number; sink?: number; panels?: boolean; t: number; }

/** [DIBUJO] Sonda propia y sin logo: cuerpo dorado, ojo-cámara, antena, paneles y cuatro patas que se despliegan. Origen = centro del cuerpo. */
function drawProbe(c: CanvasRenderingContext2D, x: number, y: number, o: ProbeLook): void {
  const d = o.legs ?? 0;
  const sink = o.sink ?? 0;
  c.save();
  c.translate(x, y);
  c.rotate(o.tilt ?? 0);
  c.scale(o.scale ?? 1, o.scale ?? 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // llama del motor central (violeta por fuera, naranja y núcleo claro)
  const f = o.flame ?? 0;
  if (f > 0.02) {
    const fl = Math.sin(o.t * 52) * 2.2 + Math.sin(o.t * 31) * 1.4;
    const flame = (len: number, w: number, col: string, a: number): void => {
      c.globalAlpha = a; c.fillStyle = col;
      c.beginPath(); c.moveTo(-w, 22); c.quadraticCurveTo(-w * 0.9, 22 + len * 0.55, 0, 22 + len); c.quadraticCurveTo(w * 0.9, 22 + len * 0.55, w, 22); c.closePath(); c.fill();
    };
    flame((20 + 40 * f) + fl, 8 + 4 * f, '#9b5cff', 0.75);
    flame((14 + 28 * f) + fl * 0.8, 5.5 + 3 * f, '#ff9a2e', 0.95);
    flame((8 + 14 * f) + fl * 0.5, 3 + 1.5 * f, '#fff1c9', 1);
    c.globalAlpha = 1;
  }
  const ink = (w: number, col: string): void => { c.lineWidth = w; c.strokeStyle = col; };
  // patas (4 en total: se ven 2 de frente, las otras 2 detrás y más cortas)
  for (const sg of [-1, 1]) {
    const hx = sg * 14, hy = 10;
    const fx = sg * (17 + 19 * d), fy = 30 + 11 * d - sink;
    ink(5.5, INK); c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
    ink(2.4, '#cfcde6'); c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
    ink(4, INK); c.beginPath(); c.moveTo(fx - 7, fy + 2); c.lineTo(fx + 7, fy + 2); c.stroke();
    ink(1.8, '#8d8aa8'); c.beginPath(); c.moveTo(fx - 6, fy + 2); c.lineTo(fx + 6, fy + 2); c.stroke();
  }
  // paneles solares con su puntal
  if (o.panels !== false) {
    for (const sg of [-1, 1]) {
      ink(3, INK); c.beginPath(); c.moveTo(sg * 15, -4); c.lineTo(sg * 24, -4); c.stroke();
      c.fillStyle = '#3b5bd9'; ink(3, INK);
      c.beginPath(); c.rect(sg > 0 ? 24 : -46, -11, 22, 15); c.fill(); c.stroke();
      ink(1.2, '#9fb3ff');
      const x0 = sg > 0 ? 24 : -46;
      c.beginPath(); c.moveTo(x0 + 7.3, -11); c.lineTo(x0 + 7.3, 4); c.moveTo(x0 + 14.6, -11); c.lineTo(x0 + 14.6, 4); c.moveTo(x0, -3.5); c.lineTo(x0 + 22, -3.5); c.stroke();
    }
  }
  // tobera
  c.fillStyle = '#6f6c8c'; ink(3, INK);
  c.beginPath(); c.moveTo(-6, 14); c.lineTo(6, 14); c.lineTo(9, 23); c.lineTo(-9, 23); c.closePath(); c.fill(); c.stroke();
  // antena parabólica
  ink(3, INK); c.beginPath(); c.moveTo(7, -20); c.lineTo(13, -33); c.stroke();
  c.fillStyle = '#f5f5f2'; c.beginPath(); c.ellipse(13, -35, 8, 3.6, -0.5, 0, 7); c.fill(); c.stroke();
  // cuerpo dorado (trapecio redondeado) y cubierta plateada
  c.translate(0, sink * 0.0);
  c.fillStyle = '#e9b949'; ink(3, INK);
  c.beginPath(); c.moveTo(-16, -20); c.lineTo(16, -20); c.lineTo(21, 14); c.lineTo(-21, 14); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#f6d77a'; c.beginPath(); c.moveTo(-12, -16); c.lineTo(-4, -16); c.lineTo(-8, 10); c.lineTo(-17, 10); c.closePath(); c.fill();
  c.fillStyle = '#cfcde6'; ink(3, INK);
  c.beginPath(); c.rect(-16, -25, 32, 8); c.fill(); c.stroke();
  // ojo-cámara
  c.fillStyle = '#2a2570'; ink(2.6, INK); c.beginPath(); c.arc(0, -3, 10, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#7fe3ff'; c.beginPath(); c.arc(0, -3, 6.2, 0, 7); c.fill();
  c.fillStyle = '#0e0b33'; c.beginPath(); c.ellipse(0, -3, 2.2, 5.6, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(2.6, -6, 2, 0, 7); c.fill(); c.beginPath(); c.arc(-2.4, -0.4, 1, 0, 7); c.fill();
  c.restore();
}

/** Rover pequeño que asoma de detrás de la sonda y rueda hacia la derecha. */
function drawRoverSmall(c: CanvasRenderingContext2D, x: number, groundY: number): void {
  c.save(); c.translate(x, groundY); c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = INK; c.lineWidth = 3;
  c.fillStyle = '#3b5bd9'; c.beginPath(); c.rect(-12, -27, 24, 6); c.fill(); c.stroke();
  c.fillStyle = '#f5f5f2'; c.beginPath(); c.rect(-14, -21, 28, 11); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(8, -21); c.lineTo(8, -32); c.stroke();
  c.fillStyle = '#7fe3ff'; c.beginPath(); c.arc(8, -33, 3.2, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#6f6c8c';
  for (const dx of [-9, 0, 9]) { c.beginPath(); c.arc(dx, -5, 5.4, 0, 7); c.fill(); c.stroke(); }
  c.restore();
}

// ------------------------------------------------------------------ cinturón
export function mountBelt(root: HTMLElement, opts: { hard: boolean; seed: number; calm?: boolean; onDone(r: BeltResult): void }): MiniGameHandle {
  const { c, el } = makeCanvas(root, t('Cinturón de asteroides: esquiva las rocas y recoge baterías, chips y algas'));
  const s: BeltState = createBelt(opts.seed, opts.hard);
  const onKey = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { moveBelt(s, -1); e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { moveBelt(s, 1); e.preventDefault(); }
  };
  const onPointer = (e: PointerEvent): void => {
    const r = el.getBoundingClientRect();
    moveBelt(s, e.clientX - r.left < r.width / 2 ? -1 : 1);
  };
  window.addEventListener('keydown', onKey);
  el.addEventListener('pointerdown', onPointer);
  let sx = LANE_X[s.lane];
  let lastDraw = performance.now();
  const shapes = new WeakMap<object, number[]>();
  const shapeOf = (th: object, lane: number): number[] => {   // contorno irregular estable por roca
    let v = shapes.get(th);
    if (!v) { v = Array.from({ length: 9 }, (_, i) => 0.78 + 0.3 * Math.abs(Math.sin((lane + 1.7) * (i + 2.3) * 12.9898))); shapes.set(th, v); }
    return v;
  };
  const draw = (): void => {
    const now = performance.now(); const dt = Math.min(0.05, (now - lastDraw) / 1000); lastDraw = now;
    stars(c, s.t);
    for (const th of s.things) {
      const x = LANE_X[th.lane];
      c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'round';
      if (th.kind === 'rock') {
        const sh = shapeOf(th, th.lane); const rot = th.y * 0.012 + th.lane;
        c.fillStyle = '#8d8aa8'; c.beginPath();
        sh.forEach((k, i) => { const an = rot + (i / sh.length) * Math.PI * 2; const px = x + Math.cos(an) * 24 * k, py = th.y + Math.sin(an) * 22 * k; if (i) c.lineTo(px, py); else c.moveTo(px, py); });
        c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#6f6c8c'; c.beginPath(); c.arc(x + Math.cos(rot + 1) * 8, th.y + Math.sin(rot + 1) * 7, 5, 0, 7); c.fill();
        c.fillStyle = '#a9a6c4'; c.beginPath(); c.arc(x + Math.cos(rot + 3.6) * 9, th.y + Math.sin(rot + 3.6) * 8, 3, 0, 7); c.fill();
      }
      else if (th.kind === 'battery') { c.fillStyle = '#ffcb47'; c.fillRect(x - 11, th.y - 14, 22, 28); c.strokeRect(x - 11, th.y - 14, 22, 28); }
      else if (th.kind === 'chip') { c.fillStyle = '#5ad6b2'; c.fillRect(x - 13, th.y - 13, 26, 26); c.strokeRect(x - 13, th.y - 13, 26, 26); }
      else { c.fillStyle = '#7ed957'; c.beginPath(); c.arc(x, th.y, 13, 0, 7); c.fill(); c.stroke(); }
    }
    // la sonda se desliza entre carriles (amortiguado) e inclina un poco hacia donde va
    const target = LANE_X[s.lane];
    const err = target - sx;
    sx += err * (1 - Math.exp(-dt * 11));
    if (Math.abs(err) > 7) {   // chorritos de gas frío del lado contrario
      const side = err > 0 ? -1 : 1;
      c.fillStyle = '#e9d6ff';
      for (let i = 0; i < 3; i++) { c.globalAlpha = 0.8 - i * 0.25; c.beginPath(); c.arc(sx + side * (22 + i * 7), BELT_SHIP_Y - 4 + (i % 2) * 3, 4 - i, 0, 7); c.fill(); }
      c.globalAlpha = 1;
    }
    c.globalAlpha = s.invuln > 0 && Math.floor(s.t * 10) % 2 ? 0.4 : 1;
    drawProbe(c, sx, BELT_SHIP_Y + 4 + Math.sin(s.t * 3) * 1.5, { scale: 0.8, legs: 0, flame: 0.0, tilt: Math.max(-0.22, Math.min(0.22, err / 260)), t: s.t });
    c.globalAlpha = 1;
    text(c, `${Math.max(0, Math.ceil(BELT_SECONDS - s.t))} s`, 14, 28);
    text(c, '♥'.repeat(s.hull) + '·'.repeat(3 - s.hull), W - 14, 28, 18, 'right');
    text(c, `▮ ${s.got.battery}  ▪ ${s.got.chip}  ● ${s.got.algae}`, W / 2, 28, 14, 'center');
  };
  const loop = runLoop((dt) => { stepBelt(s, dt * (opts.calm ? 0.8 : 1)); return beltDone(s); }, draw, () =>
    opts.onDone({ score: beltScore(s), batteries: s.got.battery, chips: s.got.chip, algae: s.got.algae, hull: s.hull }));
  return { destroy() { loop.destroy(); window.removeEventListener('keydown', onKey); el.removeEventListener('pointerdown', onPointer); } };
}

// ------------------------------------------------------------------ rover lunar
export function mountRover(root: HTMLElement, opts: { hard: boolean; batteries: number; chips: number; onDone(r: RoverResult): void }): MiniGameHandle {
  const btn = (id: string, label: string, side: string): string => `<button class="mn-btn mn-btn--sm" data-rv="${id}" aria-label="${label}" style="position:absolute;bottom:12px;${side};min-width:96px;min-height:56px;touch-action:none">${label}</button>`;
  const { c, box } = makeCanvas(root, t('Rover lunar: salta los cráteres y recoge las rocas que brillan'),
    btn('brake', t('Freno'), 'left:12px') + btn('jump', t('Salto'), 'right:12px'));
  const s: RoverState = createRover(opts.batteries, opts.chips, opts.hard);
  const input = { brake: false, jump: false };
  let hint = hintSeconds(s.chips);
  const keyMap = (k: string): 'brake' | 'jump' | null => (k === 'arrowup' || k === 'w' || k === ' ' ? 'jump' : k === 'arrowdown' || k === 's' || k === 'arrowleft' ? 'brake' : null);
  const onKey = (down: boolean) => (e: KeyboardEvent): void => {
    const m = keyMap(e.key.toLowerCase());
    if (!m) return;
    input[m] = down;
    e.preventDefault();
  };
  const kd = onKey(true);
  const ku = onKey(false);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  const bind = (id: 'brake' | 'jump'): void => {
    const b = box.querySelector<HTMLElement>(`[data-rv="${id}"]`)!;
    b.addEventListener('pointerdown', (e) => { input[id] = true; e.preventDefault(); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { input[id] = false; });
  };
  bind('brake'); bind('jump');
  const craterList = craters(opts.hard);
  const draw = (): void => {
    const cam = s.x - 90;
    c.fillStyle = '#0b0830'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e4e3f2';
    for (let i = 0; i < 30; i++) c.fillRect(((i * 131 - cam * 0.1) % W + W) % W, (i * 37) % 200, 2, 2);
    // suelo gris con cráteres
    c.fillStyle = '#8d8aa8'; c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, H);
    for (let px = 0; px <= W; px += 4) {
      const wx = cam + px;
      const inCrater = craterList.some((cr) => wx > cr && wx < cr + CRATER_W);
      c.lineTo(px, inCrater ? terrainY(wx) + 40 : terrainY(wx));
    }
    c.lineTo(W, H); c.closePath(); c.fill(); c.stroke();
    ROCKS.forEach((rx, i) => {
      if (s.rocks.has(i) || rx < cam - 20 || rx > cam + W + 20) return;
      const px = rx - cam, py = terrainY(rx) - 12;
      c.fillStyle = '#ffe9a0'; c.globalAlpha = 0.35; c.beginPath(); c.arc(px, py, 20 + 3 * Math.sin(s.x / 15), 0, 7); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#b9b5d0'; c.beginPath(); c.arc(px, py, 10, 0, 7); c.fill(); c.stroke();
    });
    const rx = 90, ry = terrainY(s.x) - s.h;
    c.fillStyle = '#f5f5f2'; c.fillRect(rx - 22, ry - 28, 44, 16); c.strokeRect(rx - 22, ry - 28, 44, 16);
    c.fillStyle = '#5ad6b2'; c.fillRect(rx - 8, ry - 40, 16, 12); c.strokeRect(rx - 8, ry - 40, 16, 12);
    c.fillStyle = '#3b3b4f'; for (const dx of [-16, 16]) { c.beginPath(); c.arc(rx + dx, ry - 8, 9, 0, 7); c.fill(); c.stroke(); }
    if (hint > 0) {
      const next = ROCKS.findIndex((_, i) => !s.rocks.has(i));
      if (next >= 0) text(c, '→', W - 20, 70, 28, 'right');
    }
    text(c, `${Math.max(0, Math.ceil(s.left))} s`, 14, 28);
    text(c, `◆ ${s.rocks.size}/${ROCKS.length}`, W - 14, 28, 15, 'right');
    text(c, `${Math.min(100, Math.round((s.x / ROVER_LEN) * 100))} %`, W / 2, 28, 14, 'center');
  };
  const loop = runLoop((dt) => { stepRover(s, dt, { brake: input.brake, jump: input.jump }); hint = Math.max(0, hint - dt); return roverDone(s); }, draw, () =>
    opts.onDone({ score: roverScore(s), rocks: s.rocks.size, flips: s.flips }));
  return { destroy() { loop.destroy(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); } };
}

/**
 * Alunizaje breve (4,2 s) y suave: la sonda baja frenando con su motor (en la Luna no hay aire: no hay paracaídas),
 * despliega las patas, toca el suelo sin rebotar y suelta el rover. El polvo vuela en arcos bajos y no se queda flotando (sin aire).
 */
export function mountDelivery(root: HTMLElement, onDone: () => void): MiniGameHandle {
  const { c } = makeCanvas(root, t('La sonda frena con cohetes y suelta el rover'));
  const TOTAL = 4.2, DESC = 2.6, GROUND = 430, REST_Y = GROUND - 42 - 2;
  let tt = 0;
  const craters: [number, number, number][] = [[60, 452, 38], [300, 468, 46], [190, 488, 30], [345, 440, 20]];
  const loop = runLoop((dt) => { tt += dt; return tt >= TOTAL; }, () => {
    stars(c, tt * 0.25);
    // Tierra pequeña en el cielo
    c.fillStyle = '#3d7bd9'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(318, 78, 22, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#7ed957'; c.beginPath(); c.arc(311, 74, 7, 0, 7); c.fill(); c.beginPath(); c.arc(325, 86, 5, 0, 7); c.fill();
    // suelo lunar con cráteres
    c.fillStyle = '#9a98c8'; c.fillRect(0, GROUND, W, H - GROUND);
    c.fillStyle = '#8280b0'; for (const [cx, cy, r] of craters) { c.beginPath(); c.ellipse(cx, cy, r, r * 0.22, 0, 0, 7); c.fill(); }
    c.fillStyle = '#b4b2dc'; c.fillRect(0, GROUND, W, 3);

    const p = Math.min(1, tt / DESC);
    const y = -50 + (REST_Y + 50) * (1 - Math.pow(1 - p, 2.4));      // frena hasta velocidad cero al tocar
    const landed = tt >= DESC;
    const k = tt - DESC;
    const sink = landed ? 4 * Math.exp(-7 * k) * Math.cos(15 * k) : 0; // las patas amortiguan el toque
    const flame = landed ? 0 : p < 0.9 ? 0.3 + 0.7 * Math.pow(1 - p, 1.2) : (0.3 + 0.7 * Math.pow(0.1, 1.2)) * ((1 - p) / 0.1); // el motor se corta justo antes de tocar
    const legs = smooth(0.5, 1.7, tt);
    const sway = landed ? 0 : Math.sin(tt * 2.2) * 5 * (1 - p);

    // polvo: sale cuando la sonda está cerca del suelo y vuela en arcos bajos (g lunar)
    for (let i = 0; i < 26; i++) {
      const dir = i % 2 ? 1 : -1;
      const t0 = 1.9 + (i % 9) * 0.075;
      const age = tt - t0;
      if (age < 0 || age > 1.5 || (t0 > DESC + 0.25)) continue;
      const sp = 38 + ((i * 37) % 70), vy = 10 + ((i * 53) % 26);
      const px = W / 2 + sway + dir * (18 + sp * age), py = GROUND - Math.max(0, vy * age - 0.5 * 34 * age * age);
      c.globalAlpha = 0.65 * (1 - age / 1.5); c.fillStyle = '#d8d6f0';
      c.beginPath(); c.arc(px, py - 1, 2 + (i % 3) * 0.9, 0, 7); c.fill();
    }
    c.globalAlpha = 1;

    // el rover asoma por detrás de la sonda y rueda hacia la derecha (ease-out)
    if (tt > DESC + 0.35) {
      const r = smooth(DESC + 0.35, TOTAL, tt);
      c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round';   // rampa
      c.beginPath(); c.moveTo(W / 2 + 18, REST_Y + 6); c.lineTo(W / 2 + 58, GROUND); c.stroke();
      drawRoverSmall(c, W / 2 + 18 + 62 * r, GROUND + 1);
    }
    drawProbe(c, W / 2 + sway, y + sink, { legs, flame, sink, tilt: sway * 0.004, t: tt });
    text(c, t('Sin aire, se frena con cohetes'), W / 2, 478, 15, 'center');
  }, onDone);
  return { destroy: () => loop.destroy() };
}
