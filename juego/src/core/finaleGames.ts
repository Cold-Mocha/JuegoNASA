import { t } from './i18n';
import {
  BELT_SECONDS, BELT_SHIP_Y, CHECKPOINTS, POTHOLE_W, ROCKS, ROVER_LEN, ROVER_LIVES, beltDone, beltScore, createBelt, createRover, craters, hintSeconds,
  moveBelt, potholes, roverDone, roverLives, roverScore, slopeAt, stepBelt, stepRover, terrainY, type BeltState, type BeltThing, type RoverState,
} from '../sim/finale';
import type { MiniGameHandle } from './miniGames';

/**
 * La sonda: el cinturón de asteroides, el alunizaje y el rover lunar, en un canvas apaisado de 940 × 590 que aprovecha la pantalla del PC
 * (la estación lo monta con el marco ancho, al lado de las barras). La lógica vive en `sim/finale.ts`; aquí solo se dibuja y se leen los controles.
 * [DIBUJO] En el cinturón las rocas están mucho más juntas que en la realidad.
 */
export const FINALE_W = 940;
export const FINALE_H = 590;
const W = FINALE_W;
const H = FINALE_H;
const INK = '#0e0b33';
const PAPER = '#f5f5f2';
const GOLD = '#ffcb47';
const TEAL = '#5ad6b2';
const CYAN = '#7fe3ff';

export interface BeltResult { score: number; batteries: number; chips: number; algae: number; hull: number; }
export interface RoverResult { score: number; rocks: number; flips: number; }

interface Loop { destroy(): void; }

/** Bucle de animación con límite de dt; `step` devuelve true al terminar (la llamada de cierre se guarda para que `destroy` la cancele). */
function runLoop(step: (dt: number) => boolean, draw: (dt: number) => void, finish: () => void): Loop {
  let raf = 0;
  let timer = 0;
  let dead = false;
  let last = performance.now();
  const frame = (now: number): void => {
    if (dead) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const over = step(dt);
    draw(dt);
    if (over) { timer = window.setTimeout(() => { if (!dead) finish(); }, 900); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { destroy() { dead = true; cancelAnimationFrame(raf); clearTimeout(timer); } };
}

function makeCanvas(root: HTMLElement, label: string, extra = ''): { c: CanvasRenderingContext2D; el: HTMLCanvasElement; box: HTMLElement } {
  root.innerHTML = `<div class="finale" style="position:relative;width:${W}px;height:${H}px"><canvas width="${W}" height="${H}" role="img" aria-label="${label}" style="display:block;border:4px solid ${INK};border-radius:16px;touch-action:none"></canvas>${extra}</div>`;
  const el = root.querySelector('canvas')!;
  return { c: el.getContext('2d')!, el, box: root.querySelector<HTMLElement>('.finale')! };
}

// ------------------------------------------------------------------ utilidades de dibujo
const text = (c: CanvasRenderingContext2D, s: string, x: number, y: number, size = 20, align: CanvasTextAlign = 'left', color = PAPER): void => {
  c.font = `700 ${size}px Fredoka, Arial, Helvetica, sans-serif`;
  c.textAlign = align;
  c.lineWidth = 5;
  c.strokeStyle = INK;
  c.strokeText(s, x, y);
  c.fillStyle = color;
  c.fillText(s, x, y);
};

/** Píldora del HUD sobre el canvas (fondo oscuro translúcido con borde). */
const pill = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  c.fillStyle = 'rgba(14, 11, 51, .72)';
  c.strokeStyle = 'rgba(245, 245, 242, .35)';
  c.lineWidth = 2;
  c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); c.stroke();
};

const heart = (c: CanvasRenderingContext2D, x: number, y: number, r: number, full: boolean): void => {
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.45);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  c.fillStyle = full ? '#ff6b7a' : 'rgba(245,245,242,.18)';
  c.fill();
  c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
};

const smooth = (a: number, b: number, x: number): number => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
/** Ruido determinista 0–1 a partir de un número (para manchas, estrellas y rocas estables). */
const hash = (n: number): number => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Cielo con estrellas en tres capas de paralaje; `scroll` avanza en px (hacia la izquierda). */
function starfield(c: CanvasRenderingContext2D, scroll: number, top: string, bottom: string): void {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let layer = 0; layer < 3; layer++) {
    const speed = [0.15, 0.4, 1][layer];
    const size = [1.2, 1.8, 2.6][layer];
    c.fillStyle = layer === 2 ? '#ffffff' : '#c9c6ec';
    c.globalAlpha = [0.5, 0.75, 1][layer];
    for (let i = 0; i < 46; i++) {
      const x = ((hash(i + layer * 100) * (W + 40) - scroll * speed) % (W + 40) + (W + 40)) % (W + 40) - 20;
      const y = hash(i * 3.7 + layer * 50) * H;
      c.fillRect(x, y, size, size);
    }
  }
  c.globalAlpha = 1;
}

function nebula(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

function moonDisc(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#f1efff'); g.addColorStop(0.7, '#bdbad8'); g.addColorStop(1, '#8a87ad');
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = 'rgba(110,106,150,.55)';
  for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.4, 0.12], [0.4, -0.35, 0.09], [-0.45, 0.25, 0.1]]) {
    c.beginPath(); c.arc(x + dx * r, y + dy * r, k * r, 0, Math.PI * 2); c.fill();
  }
}

function earthDisc(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#7fc1ff'); g.addColorStop(1, '#2d63c4');
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.save(); c.clip();
  c.fillStyle = '#7ed957';
  c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.1, r * 0.35, r * 0.22, 0.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + r * 0.35, y + r * 0.35, r * 0.25, r * 0.15, -0.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.75)';
  c.beginPath(); c.ellipse(x + r * 0.1, y - r * 0.5, r * 0.5, r * 0.1, 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x - r * 0.2, y + r * 0.6, r * 0.45, r * 0.08, -0.1, 0, Math.PI * 2); c.fill();
  c.restore();
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
}

// ------------------------------------------------------------------ la sonda (dibujo compartido)
interface ProbeLook { scale?: number; legs?: number; flame?: number; tilt?: number; sink?: number; panels?: boolean; t: number; }

/** [DIBUJO] Sonda propia y sin logo: cuerpo dorado con lámina térmica, ojo-cámara, antena, paneles y cuatro patas que se despliegan. Origen = centro del cuerpo; el motor apunta hacia abajo. */
function drawProbe(c: CanvasRenderingContext2D, x: number, y: number, o: ProbeLook): void {
  const d = o.legs ?? 0;
  const sink = o.sink ?? 0;
  c.save();
  c.translate(x, y);
  c.rotate(o.tilt ?? 0);
  c.scale(o.scale ?? 1, o.scale ?? 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // llama del motor (violeta por fuera, naranja y núcleo claro), con brillo
  const f = o.flame ?? 0;
  if (f > 0.02) {
    const fl = Math.sin(o.t * 52) * 2.2 + Math.sin(o.t * 31) * 1.4;
    const glow = c.createRadialGradient(0, 30, 2, 0, 30, 40 + 30 * f);
    glow.addColorStop(0, 'rgba(255,190,90,.55)'); glow.addColorStop(1, 'rgba(255,120,60,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(0, 34, 40 + 30 * f, 0, Math.PI * 2); c.fill();
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
  // patas con amortiguador y pie
  for (const sg of [-1, 1]) {
    const hx = sg * 14, hy = 10;
    const fx = sg * (17 + 19 * d), fy = 30 + 11 * d - sink;
    ink(5.5, INK); c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
    ink(2.4, '#cfcde6'); c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy); c.stroke();
    ink(3, INK); c.beginPath(); c.moveTo(hx * 0.6, hy + 4); c.lineTo((hx + fx) / 2, (hy + fy) / 2); c.stroke();
    c.fillStyle = '#8d8aa8'; ink(2.5, INK);
    c.beginPath(); c.ellipse(fx, fy + 2, 8, 3, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  // paneles solares con celdas y puntal
  if (o.panels !== false) {
    for (const sg of [-1, 1]) {
      ink(3, INK); c.beginPath(); c.moveTo(sg * 15, -4); c.lineTo(sg * 24, -4); c.stroke();
      const x0 = sg > 0 ? 24 : -50;
      const pg = c.createLinearGradient(x0, -12, x0 + 26, 6);
      pg.addColorStop(0, '#4f74f0'); pg.addColorStop(1, '#2a3f8f');
      c.fillStyle = pg; ink(3, INK);
      c.beginPath(); c.rect(x0, -12, 26, 17); c.fill(); c.stroke();
      ink(1.2, '#9fb3ff');
      c.beginPath();
      for (const k of [1, 2, 3]) { c.moveTo(x0 + k * 6.5, -12); c.lineTo(x0 + k * 6.5, 5); }
      c.moveTo(x0, -3.5); c.lineTo(x0 + 26, -3.5); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x0 + 2, -10, 8, 4);
    }
  }
  // tobera
  c.fillStyle = '#6f6c8c'; ink(3, INK);
  c.beginPath(); c.moveTo(-6, 14); c.lineTo(6, 14); c.lineTo(10, 24); c.lineTo(-10, 24); c.closePath(); c.fill(); c.stroke();
  // antena parabólica
  ink(3, INK); c.beginPath(); c.moveTo(7, -20); c.lineTo(13, -33); c.stroke();
  c.fillStyle = PAPER; c.beginPath(); c.ellipse(13, -35, 9, 4, -0.5, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#ff6b7a'; c.beginPath(); c.arc(13, -35, 2, 0, Math.PI * 2); c.fill();
  // cuerpo dorado con lámina térmica arrugada
  const body = c.createLinearGradient(-21, -20, 21, 14);
  body.addColorStop(0, '#ffe08a'); body.addColorStop(0.5, '#e9b949'); body.addColorStop(1, '#b8862a');
  c.fillStyle = body; ink(3, INK);
  c.beginPath(); c.moveTo(-16, -20); c.lineTo(16, -20); c.lineTo(21, 14); c.lineTo(-21, 14); c.closePath(); c.fill(); c.stroke();
  ink(1.2, 'rgba(120,80,20,.55)');
  c.beginPath(); c.moveTo(-14, -8); c.lineTo(-6, -2); c.lineTo(-12, 6); c.moveTo(8, -14); c.lineTo(14, -4); c.lineTo(10, 8); c.stroke();
  c.fillStyle = '#cfcde6'; ink(3, INK);
  c.beginPath(); c.rect(-16, -25, 32, 8); c.fill(); c.stroke();
  c.fillStyle = TEAL; c.beginPath(); c.arc(-10, -21, 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ff6b7a'; c.beginPath(); c.arc(10, -21, 1.8, 0, Math.PI * 2); c.fill();
  // ojo-cámara
  c.fillStyle = '#2a2570'; ink(2.6, INK); c.beginPath(); c.arc(0, -3, 10, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = CYAN; c.beginPath(); c.arc(0, -3, 6.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = INK; c.beginPath(); c.ellipse(0, -3, 2.2, 5.6, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(2.6, -6, 2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(-2.4, -0.4, 1, 0, Math.PI * 2); c.fill();
  c.restore();
}

/**
 * [DIBUJO] Rover lunar de seis ruedas (suspensión balancín como los róveres reales): chasis con lámina dorada, cubierta de paneles,
 * mástil con cabeza-cámara y antena. Origen = punto de apoyo en el suelo; `angle` lo inclina con la pendiente; `wheel` gira las ruedas.
 */
function drawRover(c: CanvasRenderingContext2D, x: number, y: number, angle: number, wheel: number, scale = 1): void {
  c.save();
  c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const ink = (w: number, col: string): void => { c.lineWidth = w; c.strokeStyle = col; };
  // balancines de la suspensión
  ink(6, INK); c.beginPath(); c.moveTo(-34, -12); c.lineTo(-10, -30); c.lineTo(8, -14); c.moveTo(-10, -30); c.lineTo(34, -12); c.stroke();
  ink(3, '#b9b5d0'); c.beginPath(); c.moveTo(-34, -12); c.lineTo(-10, -30); c.lineTo(8, -14); c.moveTo(-10, -30); c.lineTo(34, -12); c.stroke();
  // seis ruedas (se ven tres) con rayos que giran
  for (const wx of [-34, 0, 34]) {
    c.fillStyle = '#3b3b4f'; ink(3, INK);
    c.beginPath(); c.arc(wx, -12, 12, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#6f6c8c'; c.beginPath(); c.arc(wx, -12, 6.5, 0, Math.PI * 2); c.fill();
    ink(2, '#9a98c8'); c.beginPath();
    for (let k = 0; k < 3; k++) { const a = wheel + k * (Math.PI / 3) * 2; c.moveTo(wx + Math.cos(a) * 3, -12 + Math.sin(a) * 3); c.lineTo(wx + Math.cos(a) * 11, -12 + Math.sin(a) * 11); }
    c.stroke();
    for (let k = 0; k < 8; k++) { const a = wheel + k * Math.PI / 4; c.fillStyle = INK; c.beginPath(); c.arc(wx + Math.cos(a) * 12, -12 + Math.sin(a) * 12, 1.6, 0, Math.PI * 2); c.fill(); }
  }
  // chasis con lámina dorada
  const foil = c.createLinearGradient(-38, -52, 38, -30);
  foil.addColorStop(0, '#ffe08a'); foil.addColorStop(1, '#c7922f');
  c.fillStyle = foil; ink(3.5, INK);
  c.beginPath(); c.roundRect(-38, -52, 76, 22, 6); c.fill(); c.stroke();
  ink(1.2, 'rgba(120,80,20,.5)'); c.beginPath(); c.moveTo(-28, -48); c.lineTo(-18, -40); c.lineTo(-24, -34); c.moveTo(14, -48); c.lineTo(22, -38); c.stroke();
  // cubierta de paneles solares
  const deck = c.createLinearGradient(-44, -62, 44, -52);
  deck.addColorStop(0, '#4f74f0'); deck.addColorStop(1, '#2a3f8f');
  c.fillStyle = deck; ink(3, INK);
  c.beginPath(); c.moveTo(-46, -54); c.lineTo(46, -54); c.lineTo(40, -62); c.lineTo(-40, -62); c.closePath(); c.fill(); c.stroke();
  ink(1, '#9fb3ff'); c.beginPath(); for (let k = -30; k <= 30; k += 15) { c.moveTo(k, -54); c.lineTo(k * 0.88, -62); } c.stroke();
  // mástil con cabeza-cámara de dos ojos
  ink(5, INK); c.beginPath(); c.moveTo(24, -60); c.lineTo(24, -86); c.stroke();
  ink(2.5, PAPER); c.beginPath(); c.moveTo(24, -60); c.lineTo(24, -86); c.stroke();
  c.fillStyle = PAPER; ink(3, INK);
  c.beginPath(); c.roundRect(12, -100, 26, 15, 4); c.fill(); c.stroke();
  for (const ex of [19, 31]) { c.fillStyle = '#2a2570'; c.beginPath(); c.arc(ex, -92.5, 4.2, 0, Math.PI * 2); c.fill(); c.fillStyle = CYAN; c.beginPath(); c.arc(ex, -92.5, 2.4, 0, Math.PI * 2); c.fill(); }
  // antena y caja de instrumentos
  ink(3, INK); c.beginPath(); c.moveTo(-26, -62); c.lineTo(-30, -82); c.stroke();
  c.fillStyle = PAPER; c.beginPath(); c.ellipse(-30, -84, 9, 3.5, 0.3, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#cfcde6'; c.beginPath(); c.roundRect(-8, -72, 18, 10, 3); c.fill(); c.stroke();
  c.fillStyle = TEAL; c.beginPath(); c.arc(-2, -67, 2, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ------------------------------------------------------------------ cinturón (horizontal: la sonda va hacia la derecha)
const BELT_LANE_Y = [H * 0.3, H * 0.53, H * 0.76];
const SHIP_X = 170;
/** La lógica mide el avance en y (0 arriba, la sonda en BELT_SHIP_Y); en pantalla ese eje va de derecha a izquierda. */
const BELT_K = (W + 50 - SHIP_X) / (BELT_SHIP_Y + 30);
const beltX = (y: number): number => SHIP_X + (BELT_SHIP_Y - y) * BELT_K;

const COMMAND_DELAY = 0.22; // [MODELO] retardo de la orden «a control remoto» (en la realidad la luz tarda horas)

/** Imagen real de Saturno (NASA/JPL/Space Science Institute, PIA06193) si el archivo está en public/game/nasa/saturn.jpg. */
let saturnImg: HTMLImageElement | null = null;
let saturnOk = false;
function saturnPhoto(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!saturnImg) {
    saturnImg = new Image();
    saturnImg.onload = () => { saturnOk = true; };
    saturnImg.src = `${import.meta.env.BASE_URL}game/nasa/saturn.jpg`;
  }
  return saturnOk ? saturnImg : null;
}

function drawAsteroid(c: CanvasRenderingContext2D, x: number, y: number, seed: number, rot: number): void {
  const n = 11;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    const r = 34 * (0.74 + 0.34 * hash(seed * 13 + i));
    return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.92] as const;
  });
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px + 6, py + 7) : c.moveTo(px + 6, py + 7))); c.closePath(); c.fill();
  const g = c.createRadialGradient(x - 12, y - 14, 4, x, y, 40);
  g.addColorStop(0, '#c9c6de'); g.addColorStop(0.6, '#8d8aa8'); g.addColorStop(1, '#5b587a');
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 3.5; c.lineJoin = 'round';
  c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill(); c.stroke();
  for (let k = 0; k < 3; k++) {
    const a = rot * 0.6 + seed + k * 2.1;
    const cx = x + Math.cos(a) * 13, cy = y + Math.sin(a) * 11, r = 5 + 3 * hash(seed + k);
    c.fillStyle = 'rgba(70,66,100,.75)'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(220,218,240,.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, Math.PI * 0.9, Math.PI * 1.7); c.stroke();
  }
}

function drawCargo(c: CanvasRenderingContext2D, th: BeltThing, x: number, y: number, tt: number): void {
  const pulse = 1 + 0.08 * Math.sin(tt * 6 + th.lane);
  const halo = th.kind === 'battery' ? 'rgba(255,203,71,.45)' : th.kind === 'chip' ? 'rgba(90,214,178,.45)' : 'rgba(126,217,87,.45)';
  nebula(c, x, y, 42 * pulse, halo);
  c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'round';
  if (th.kind === 'battery') {
    c.fillStyle = '#cfcde6'; c.beginPath(); c.roundRect(x - 6, y - 26, 12, 6, 2); c.fill(); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.roundRect(x - 17, y - 21, 34, 44, 7); c.fill(); c.stroke();
    for (let k = 0; k < 3; k++) { c.fillStyle = '#7a5a10'; c.fillRect(x - 10, y + 10 - k * 11, 20, 7); }
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 13, y - 17, 5, 34);
  } else if (th.kind === 'chip') {
    c.strokeStyle = INK; c.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x - 26, y + k * 7); c.lineTo(x + 26, y + k * 7); c.moveTo(x + k * 7, y - 26); c.lineTo(x + k * 7, y + 26); c.stroke(); }
    c.fillStyle = TEAL; c.beginPath(); c.roundRect(x - 19, y - 19, 38, 38, 5); c.fill(); c.stroke();
    c.fillStyle = '#1f5f52'; c.beginPath(); c.roundRect(x - 10, y - 10, 20, 20, 3); c.fill();
    c.fillStyle = CYAN; c.fillRect(x - 5, y - 5, 10, 10);
  } else {
    c.fillStyle = 'rgba(191,230,255,.55)'; c.beginPath(); c.roundRect(x - 15, y - 24, 30, 48, 15); c.fill(); c.stroke();
    c.fillStyle = '#2f8f3a'; c.beginPath(); c.roundRect(x - 11, y - 4, 22, 24, 10); c.fill();
    c.fillStyle = '#7ed957';
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 5 + (k % 2) * 10, y + 4 + Math.floor(k / 2) * 8, 3, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#fff'; c.globalAlpha = 0.8;
    for (let k = 0; k < 3; k++) { const by = y - 6 - ((tt * 30 + k * 12) % 26); c.beginPath(); c.arc(x - 4 + k * 4, by, 2, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
}

export function mountBelt(root: HTMLElement, opts: { hard: boolean; seed: number; calm?: boolean; onDone(r: BeltResult): void }): MiniGameHandle {
  const { c, el } = makeCanvas(root, t('probe.beltLabel'));
  const s: BeltState = createBelt(opts.seed, opts.hard);
  const ids = new WeakMap<BeltThing, number>();
  let nextId = 1;
  const idOf = (th: BeltThing): number => { let v = ids.get(th); if (!v) { v = nextId++; ids.set(th, v); } return v; };
  // Control remoto: la orden viaja hasta la sonda y llega con un pequeño retardo ([MODELO]; en la realidad tarda horas).
  const delay = opts.calm ? COMMAND_DELAY * 0.5 : COMMAND_DELAY;
  const pending: { at: number; dir: -1 | 1 }[] = [];
  let sentAt = -9;
  const send = (dir: -1 | 1): void => { pending.push({ at: s.t + delay, dir }); sentAt = s.t; };
  const onKey = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w' || k === 'arrowleft' || k === 'a') { send(-1); e.preventDefault(); }
    if (k === 'arrowdown' || k === 's' || k === 'arrowright' || k === 'd') { send(1); e.preventDefault(); }
  };
  const onPointer = (e: PointerEvent): void => {
    const r = el.getBoundingClientRect();
    send(e.clientY - r.top < r.height / 2 ? -1 : 1);
  };
  window.addEventListener('keydown', onKey);
  el.addEventListener('pointerdown', onPointer);
  let sy = BELT_LANE_Y[s.lane];
  let scroll = 0;
  let shake = 0;
  let lastHull = s.hull;
  const draw = (dt: number): void => {
    while (pending.length && pending[0].at <= s.t) moveBelt(s, pending.shift()!.dir); // la orden «llega» a la sonda
    scroll += dt * 260;
    if (s.hull < lastHull) shake = 0.35;
    lastHull = s.hull;
    shake = Math.max(0, shake - dt);
    c.save();
    if (shake > 0) c.translate((hash(scroll) - 0.5) * 14 * shake / 0.35, (hash(scroll + 9) - 0.5) * 14 * shake / 0.35);
    starfield(c, scroll, '#070523', '#1d1257');
    nebula(c, W * 0.35, H * 0.25, 260, 'rgba(155,92,255,.18)');
    nebula(c, W * 0.75, H * 0.8, 220, 'rgba(238,95,214,.12)');
    // Saturno al fondo: grande, tenue y detrás de todo (foto de la NASA; el crédito está en «Créditos» y en SOURCES.md, no en pantalla)
    const photo = saturnPhoto();
    if (photo) {
      const pw = 620, ph = pw * (photo.naturalHeight / photo.naturalWidth);
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.55;
      c.drawImage(photo, W * 0.42 - pw / 2, H * 0.3 - ph / 2, pw, ph);
      c.restore();
    }
    // la Luna se acerca a medida que pasa el tiempo
    const near = Math.min(1, s.t / BELT_SECONDS);
    moonDisc(c, W + 40 - near * 70, H * 0.42, 70 + near * 120);
    earthDisc(c, 70, 90, 22);
    // estelas de velocidad
    c.strokeStyle = 'rgba(201,198,236,.35)'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = ((hash(i * 9.1) * W * 1.4 - scroll * 2.2) % (W * 1.4) + W * 1.4) % (W * 1.4) - 100;
      const y = hash(i * 4.3) * H;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y); c.stroke();
    }
    // carriles
    c.setLineDash([10, 16]); c.strokeStyle = 'rgba(245,245,242,.12)'; c.lineWidth = 2;
    for (const ly of BELT_LANE_Y) { c.beginPath(); c.moveTo(0, ly); c.lineTo(W, ly); c.stroke(); }
    c.setLineDash([]);
    for (const th of s.things) {
      const x = beltX(th.y), y = BELT_LANE_Y[th.lane];
      if (th.kind === 'rock') drawAsteroid(c, x, y, idOf(th), th.y * 0.01 + idOf(th));
      else drawCargo(c, th, x, y, s.t);
    }
    // la sonda se desliza entre carriles (amortiguado) e inclina la nariz hacia donde va
    const target = BELT_LANE_Y[s.lane];
    const err = target - sy;
    sy += err * (1 - Math.exp(-dt * 11));
    if (Math.abs(err) > 6) { // chorritos de gas frío del lado contrario
      const side = err > 0 ? -1 : 1;
      c.fillStyle = '#e9d6ff';
      for (let i = 0; i < 4; i++) { c.globalAlpha = 0.8 - i * 0.2; c.beginPath(); c.arc(SHIP_X + 4 - i * 3, sy + side * (34 + i * 8), 5 - i, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
    }
    c.globalAlpha = s.invuln > 0 && Math.floor(s.t * 10) % 2 ? 0.4 : 1;
    drawProbe(c, SHIP_X, sy, { scale: 1.35, legs: 0, flame: 0.45, tilt: Math.PI / 2 + Math.max(-0.25, Math.min(0.25, err / 240)), t: s.t });
    c.globalAlpha = 1;
    c.restore();
    // HUD: tiempo, casco, carga y avance hacia la Luna
    pill(c, 16, 14, 120, 40); text(c, `${Math.max(0, Math.ceil(BELT_SECONDS - s.t))} s`, 76, 43, 24, 'center');
    pill(c, W - 156, 14, 140, 40); for (let i = 0; i < 3; i++) heart(c, W - 124 + i * 40, 36, 11, i < s.hull);
    pill(c, W / 2 - 170, 14, 340, 40);
    text(c, `▮ ${s.got.battery}`, W / 2 - 120, 43, 22, 'center', GOLD);
    text(c, `▪ ${s.got.chip}`, W / 2, 43, 22, 'center', TEAL);
    text(c, `● ${s.got.algae}`, W / 2 + 120, 43, 22, 'center', '#7ed957');
    // enlace de control remoto
    const sending = s.t - sentAt < delay + 0.12;
    c.font = '700 13px Arial, Helvetica, sans-serif'; c.textAlign = 'left'; c.fillStyle = sending ? CYAN : '#a9a6c4';
    c.fillText(sending ? t('finale.belt.sending') : t('finale.belt.link'), 18, 74);
    c.font = '700 11px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(200,200,230,.8)';
    c.fillText(t('finale.belt.delayNote'), W / 2, H - 34);
    c.fillStyle = 'rgba(14,11,51,.72)'; c.beginPath(); c.roundRect(160, H - 26, W - 320, 12, 6); c.fill();
    c.fillStyle = CYAN; c.beginPath(); c.roundRect(160, H - 26, (W - 320) * near, 12, 6); c.fill();
  };
  const loop = runLoop((dt) => { stepBelt(s, dt * (opts.calm ? 0.8 : 1)); return beltDone(s); }, draw, () =>
    opts.onDone({ score: beltScore(s), batteries: s.got.battery, chips: s.got.chip, algae: s.got.algae, hull: s.hull }));
  // las flechas las lee el propio juego: `nudge` vacío evita que la estación mueva el foco entre botones mientras se maneja
  return { nudge: () => undefined, keys: ['↑ ↓'], gesture: 'tap', destroy() { loop.destroy(); window.removeEventListener('keydown', onKey); el.removeEventListener('pointerdown', onPointer); } };
}

// ------------------------------------------------------------------ rover lunar (horizontal, cámara que lo sigue)
const ROVER_X = 260;
const GROUND_Y = 400; // y de pantalla donde queda siempre el suelo bajo el rover: la cámara sube y baja con las cuestas

function mountains(c: CanvasRenderingContext2D, cam: number, k: number, base: number, amp: number, color: string, seed: number): void {
  c.fillStyle = color;
  c.beginPath(); c.moveTo(0, H);
  for (let px = 0; px <= W; px += 8) {
    const wx = (cam * k + px) / 90 + seed;
    c.lineTo(px, base - amp * (0.55 * Math.abs(Math.sin(wx)) + 0.3 * Math.abs(Math.sin(wx * 2.3 + 1)) + 0.15 * Math.sin(wx * 5.1)));
  }
  c.lineTo(W, H); c.closePath(); c.fill();
}

function drawCrystal(c: CanvasRenderingContext2D, x: number, y: number, tt: number): void {
  nebula(c, x, y - 6, 30 + 4 * Math.sin(tt * 4), 'rgba(255,233,160,.55)');
  c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 3;
  const shards: [number, number, number][] = [[-8, 18, -0.3], [0, 26, 0], [9, 16, 0.35]];
  for (const [dx, h, a] of shards) {
    c.save(); c.translate(x + dx, y + 4); c.rotate(a);
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.moveTo(-5, 0); c.lineTo(-4, -h * 0.75); c.lineTo(0, -h); c.lineTo(4, -h * 0.75); c.lineTo(5, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(-2, -2); c.lineTo(-2, -h * 0.7); c.lineTo(0, -h * 0.9); c.closePath(); c.fill();
    c.restore();
  }
  c.fillStyle = '#8d8aa8'; c.beginPath(); c.ellipse(x, y + 5, 16, 5, 0, 0, Math.PI * 2); c.fill(); c.stroke();
}

/**
 * Cresta lunar de fondo para el efecto de profundidad (cámara multiplano): cada capa se mueve a su propia velocidad
 * (`kx` en horizontal, `ky` en vertical): las lejanas casi no se mueven y las cercanas pasan rápido. Borde iluminado y manchas de sombra.
 * [DIBUJO] Las capas lejanas se pintan más cerca del color del cielo para dar sensación de distancia (en la Luna real no hay bruma).
 */
function ridge(c: CanvasRenderingContext2D, camX: number, camY: number, kx: number, ky: number, base: number, amp: number, color: string, rim: string, seed: number): void {
  const off = -camY * ky;
  const ys: number[] = [];
  c.fillStyle = color; c.beginPath(); c.moveTo(0, H);
  for (let px = 0; px <= W; px += 8) {
    const wx = (camX * kx + px) / 80 + seed;
    const y = base + off - amp * (0.55 * Math.abs(Math.sin(wx)) + 0.3 * Math.abs(Math.sin(wx * 2.3 + 1)) + 0.15 * Math.sin(wx * 5.1));
    ys.push(y); c.lineTo(px, y);
  }
  c.lineTo(W, H); c.closePath(); c.fill();
  c.strokeStyle = rim; c.lineWidth = 2; c.beginPath();
  ys.forEach((y, k) => (k ? c.lineTo(k * 8, y) : c.moveTo(0, y)));
  c.stroke();
  c.fillStyle = 'rgba(8,6,40,.22)'; // manchas de sombra (cráteres lejanos) que viajan con la capa
  for (let k = 0; k < 7; k++) {
    const wx = Math.floor((camX * kx) / 160) * 160 + k * 160 + hash(k + Math.floor((camX * kx) / 160) + seed) * 100;
    const px = wx - camX * kx;
    const idx = Math.max(0, Math.min(ys.length - 1, Math.round(px / 8)));
    if (px < -40 || px > W + 40) continue;
    c.beginPath(); c.ellipse(px, ys[idx] + 28 + hash(wx) * 40, 20 + hash(wx * 3) * 26, 4 + hash(wx * 5) * 4, 0, 0, Math.PI * 2); c.fill();
  }
}

/** Domo de una base lunar lejana, con su antena y una luz que parpadea (siluetas en la capa media). */
function farBase(c: CanvasRenderingContext2D, x: number, y: number, tt: number): void {
  c.fillStyle = '#34306d'; c.beginPath(); c.arc(x, y, 18, Math.PI, 0); c.rect(x - 18, y, 36, 8); c.fill();
  c.strokeStyle = '#34306d'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 24, y + 8); c.lineTo(x + 24, y - 26); c.stroke();
  c.fillStyle = Math.sin(tt * 3) > 0 ? '#ff7a59' : '#5a2f6b'; c.beginPath(); c.arc(x + 24, y - 28, 2.5, 0, Math.PI * 2); c.fill();
}

/** Roca oscura en primer plano (pasa rápido y borrosa, por delante de todo). */
function fgRock(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  c.fillStyle = 'rgba(10,8,38,.92)'; c.beginPath();
  c.moveTo(x - w / 2, y); c.lineTo(x - w * 0.35, y - h * 0.7); c.lineTo(x - w * 0.05, y - h); c.lineTo(x + w * 0.3, y - h * 0.75); c.lineTo(x + w / 2, y);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(160,156,220,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - w * 0.35, y - h * 0.7); c.lineTo(x - w * 0.05, y - h); c.lineTo(x + w * 0.3, y - h * 0.75); c.stroke();
}

export function mountRover(root: HTMLElement, opts: { hard: boolean; batteries: number; chips: number; onDone(r: RoverResult): void }): MiniGameHandle {
  const btn = (id: string, label: string, side: string): string => `<button class="mn-btn" data-rv="${id}" aria-label="${label}" style="position:absolute;bottom:16px;${side};min-width:170px;min-height:72px;font-size:22px;touch-action:none">${label}</button>`;
  const { c, box } = makeCanvas(root, t('probe.roverLabel'), btn('pedal', `▶ ${t('probe.pedal')}`, 'left:16px') + btn('jump', `▲ ${t('probe.jump')}`, 'right:16px'));
  const s: RoverState = createRover(opts.batteries, opts.chips, opts.hard);
  const input = { pedal: false, jump: false };
  let hint = hintSeconds(s.chips);
  let tt = 0;
  let lastX = 0;
  let wheel = 0;
  let camY = terrainY(0) - GROUND_Y;
  let lastDeaths = 0;
  let notice = 0;
  const sparkles: { x: number; y: number; t: number }[] = [];
  const dust: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  const seen = new Set<number>();
  const keyMap = (k: string): 'pedal' | 'jump' | null => (k === 'arrowright' || k === 'd' ? 'pedal' : k === 'arrowup' || k === 'w' || k === ' ' ? 'jump' : null);
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
  const bind = (id: 'pedal' | 'jump'): void => {
    const b = box.querySelector<HTMLElement>(`[data-rv="${id}"]`)!;
    b.addEventListener('pointerdown', (e) => { input[id] = true; b.style.filter = 'brightness(1.25)'; e.preventDefault(); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { input[id] = false; b.style.filter = ''; });
  };
  bind('pedal'); bind('jump');
  const craterList = craters(opts.hard);
  const holes = potholes(opts.hard);
  const draw = (dt: number): void => {
    tt += dt;
    const camX = s.x - ROVER_X;
    camY += (terrainY(s.x) - GROUND_Y - camY) * Math.min(1, dt * 5); // la cámara sigue la altura del suelo con suavidad
    const gy = (wx: number): number => terrainY(wx) - camY;
    const moved = s.x - lastX;
    lastX = s.x;
    wheel += moved / 12;
    if (s.deaths > lastDeaths) { lastDeaths = s.deaths; notice = 2.2; }
    notice = Math.max(0, notice - dt);

    // ---- capas de profundidad, de la más lejana a la más cercana
    starfield(c, camX * 0.02, '#05031a', '#16124a');
    earthDisc(c, W - 150 - camX * 0.01, 110 - camY * 0.02, 38);
    ridge(c, camX, camY, 0.05, 0.12, 300, 150, '#25225f', 'rgba(170,166,235,.22)', 3);
    ridge(c, camX, camY, 0.1, 0.22, 345, 125, '#322e6c', 'rgba(170,166,235,.3)', 11);
    ridge(c, camX, camY, 0.2, 0.4, 395, 100, '#423e80', 'rgba(190,186,245,.38)', 23);
    for (let k = 0; k < 3; k++) { // bases lejanas sobre la tercera capa
      const wx = Math.floor((camX * 0.2) / 1500) * 1500 + k * 1500 + 700;
      const px = wx - camX * 0.2;
      if (px > -60 && px < W + 60) farBase(c, px, 405 - camY * 0.4 - 60, tt + k);
    }
    ridge(c, camX, camY, 0.4, 0.68, 450, 80, '#55509a', 'rgba(205,200,250,.45)', 37);

    // ---- el suelo: el campo de juego
    const ground = c.createLinearGradient(0, 300, 0, H);
    ground.addColorStop(0, '#aeabce'); ground.addColorStop(1, '#6a678f');
    c.fillStyle = ground; c.strokeStyle = INK; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(0, H);
    for (let px = 0; px <= W; px += 4) c.lineTo(px, gy(camX + px));
    c.lineTo(W, H); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(60,56,105,.28)'; c.lineWidth = 2; // capas del suelo, para que tenga grosor
    for (const dy of [26, 62, 110]) { c.beginPath(); for (let px = 0; px <= W; px += 8) (px ? c.lineTo(px, gy(camX + px) + dy) : c.moveTo(px, gy(camX) + dy)); c.stroke(); }
    for (let i = 0; i < 40; i++) { // piedritas que pasan con el suelo
      const wx = Math.floor(camX / 60) * 60 + i * 60 + hash(i + Math.floor(camX / 60)) * 40;
      const px = wx - camX;
      if (px < -10 || px > W + 10) continue;
      c.fillStyle = 'rgba(80,76,115,.7)'; c.beginPath(); c.ellipse(px, gy(wx) + 14 + hash(wx) * 50, 3 + hash(wx * 2) * 5, 2 + hash(wx * 3) * 2, 0, 0, Math.PI * 2); c.fill();
    }
    for (const cr of craterList) { // sombra dentro del cuenco y borde iluminado
      const x0 = cr.x - cr.r - camX, x1 = cr.x + cr.r - camX;
      if (x1 < -20 || x0 > W + 20) continue;
      c.fillStyle = 'rgba(20,16,64,.28)'; c.beginPath();
      c.moveTo(x0, gy(cr.x - cr.r));
      for (let px = Math.max(0, Math.floor(x0)); px <= Math.min(W, x1); px += 4) c.lineTo(px, gy(camX + px));
      c.lineTo(Math.min(W, x1), gy(cr.x + cr.r)); c.closePath(); c.fill();
      c.strokeStyle = '#e4e2f8'; c.lineWidth = 3; c.beginPath();
      for (let px = Math.max(0, Math.floor(cr.x + cr.r * 0.95 - camX)); px <= Math.min(W, cr.x + cr.r * 1.3 - camX); px += 4) (px === Math.max(0, Math.floor(cr.x + cr.r * 0.95 - camX)) ? c.moveTo(px, gy(camX + px) - 2) : c.lineTo(px, gy(camX + px) - 2));
      c.stroke();
    }
    for (const p of holes) { // baches pequeños: hoyo oscuro con borde, y una señal de peligro delante
      const px = p - camX;
      if (px < -50 || px > W + 60) continue;
      const y = gy(p + POTHOLE_W / 2);
      c.fillStyle = INK; c.beginPath(); c.ellipse(px + POTHOLE_W / 2, y + 2, POTHOLE_W / 2 + 4, 9, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#d9d7f2'; c.lineWidth = 2; c.beginPath(); c.ellipse(px + POTHOLE_W / 2, y + 2, POTHOLE_W / 2 + 4, 9, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      const sx = px - 34, sy = gy(p - 34);
      c.fillStyle = '#ffcb47'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sx, sy - 30); c.lineTo(sx + 12, sy - 6); c.lineTo(sx - 12, sy - 6); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = INK; c.beginPath(); c.moveTo(sx, sy - 6); c.lineTo(sx, sy); c.stroke();
      text(c, '!', sx, sy - 10, 14, 'center', INK);
    }
    for (const cp of CHECKPOINTS) { // banderas de los puntos de control
      if (!cp) continue;
      const px = cp - camX;
      if (px < -30 || px > W + 30) continue;
      const y = gy(cp);
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(px, y); c.lineTo(px, y - 46); c.stroke();
      c.fillStyle = s.x >= cp ? CYAN : '#8d8aa8'; c.beginPath(); c.moveTo(px, y - 46); c.lineTo(px + 26, y - 38 + Math.sin(tt * 4) * 2); c.lineTo(px, y - 28); c.closePath(); c.fill(); c.stroke();
    }
    ROCKS.forEach((rx, i) => {
      if (s.rocks.has(i)) {
        if (!seen.has(i)) { seen.add(i); sparkles.push({ x: rx, y: gy(rx) - 14, t: 0 }); }
        return;
      }
      if (rx < camX - 30 || rx > camX + W + 30) return;
      drawCrystal(c, rx - camX, gy(rx) - 4, tt + i);
    });
    for (const sp of sparkles) { // destello al recoger una roca (sigue la cámara vertical)
      sp.t += dt;
      if (sp.t > 0.8) continue;
      const px = sp.x - camX;
      c.strokeStyle = GOLD; c.lineWidth = 3; c.globalAlpha = 1 - sp.t / 0.8;
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const r0 = 10 + sp.t * 40, r1 = r0 + 12; c.beginPath(); c.moveTo(px + Math.cos(a) * r0, gy(sp.x) - 14 + Math.sin(a) * r0); c.lineTo(px + Math.cos(a) * r1, gy(sp.x) - 14 + Math.sin(a) * r1); c.stroke(); }
      c.globalAlpha = 1;
    }
    // ---- el rover: sombra al saltar, inclinación con la pendiente y polvo que levantan las ruedas
    const gyR = gy(s.x);
    const slope = Math.atan(slopeAt(s.x));
    const sh = Math.max(0.3, 1 - s.h / 160);
    c.fillStyle = `rgba(14,11,51,${0.35 * sh})`; c.beginPath(); c.ellipse(ROVER_X, gyR + 2, 46 * sh, 7 * sh, 0, 0, Math.PI * 2); c.fill();
    if (s.h === 0 && s.v > 12 && input.pedal) {
      for (let k = 0; k < 2; k++) dust.push({ x: ROVER_X - 40, y: gyR - 4, vx: -40 - Math.random() * 60, vy: -30 - Math.random() * 50, life: 0.9 });
    }
    for (const p of dust) { p.life -= dt; p.x += p.vx * dt; p.vy += 60 * dt; p.y += p.vy * dt; } // en la Luna el polvo cae en arcos (sin aire que lo frene)
    for (let i = dust.length - 1; i >= 0; i--) if (dust[i].life <= 0 || dust.length > 80) dust.splice(i, 1);
    for (const p of dust) { c.globalAlpha = Math.max(0, p.life) * 0.7; c.fillStyle = '#d8d6f0'; c.beginPath(); c.arc(p.x, p.y, 3, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = s.invuln > 0 && Math.floor(tt * 10) % 2 === 0 ? 0.35 : 1; // parpadea mientras reaparece
    drawRover(c, ROVER_X, gyR - s.h, s.h > 0 ? slope * 0.3 : slope, wheel, 1.3);
    c.globalAlpha = 1;
    // ---- primer plano: rocas oscuras que pasan más rápido que todo lo demás
    for (let k = -1; k < 6; k++) {
      const idx = Math.floor((camX * 1.7) / 560) + k;
      const px = idx * 560 + hash(idx) * 260 - camX * 1.7;
      fgRock(c, px, H + 14 - camY * 0.05, 90 + hash(idx * 3) * 90, 34 + hash(idx * 7) * 40);
    }
    if (hint > 0) { // pista: flecha hacia la próxima roca (los chips del cinturón dan segundos de pista)
      const next = ROCKS.findIndex((_, i) => !s.rocks.has(i));
      if (next >= 0) {
        const dist = Math.round((ROCKS[next] - s.x) / 10);
        pill(c, W - 170, 70, 154, 40); text(c, `◆ → ${Math.max(0, dist)} m`, W - 93, 98, 22, 'center', GOLD);
      }
    }
    pill(c, 16, 14, 120, 40); text(c, `${Math.max(0, Math.ceil(s.left))} s`, 76, 43, 24, 'center');
    pill(c, 16, 60, 120, 40); text(c, '♥'.repeat(roverLives(s)) + '♡'.repeat(ROVER_LIVES - roverLives(s)), 76, 90, 22, 'center', '#ff7a59');
    pill(c, W - 156, 14, 140, 40); text(c, `◆ ${s.rocks.size}/${ROCKS.length}`, W - 86, 43, 22, 'center', GOLD);
    c.fillStyle = 'rgba(14,11,51,.72)'; c.beginPath(); c.roundRect(W / 2 - 200, 26, 400, 14, 7); c.fill();
    c.fillStyle = CYAN; c.beginPath(); c.roundRect(W / 2 - 200, 26, 400 * Math.min(1, s.x / ROVER_LEN), 14, 7); c.fill();
    c.fillStyle = '#fff';
    for (const cp of CHECKPOINTS) if (cp) c.fillRect(W / 2 - 200 + 400 * (cp / ROVER_LEN) - 1, 24, 2, 18); // marcas de los puntos de control
    if (notice > 0) { pill(c, W / 2 - 230, 120, 460, 44); text(c, t('probe.pothole'), W / 2, 150, 20, 'center', '#ffcb47'); }
  };
  const loop = runLoop((dt) => { stepRover(s, dt, { pedal: input.pedal, jump: input.jump }); hint = Math.max(0, hint - dt); return roverDone(s); }, draw, () =>
    opts.onDone({ score: roverScore(s), rocks: s.rocks.size, flips: s.deaths }));
  return { nudge: () => undefined, keys: ['→', '↑'], gesture: 'hold', destroy() { loop.destroy(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); } };
}

/**
 * Alunizaje breve (4,2 s) y suave: la sonda baja frenando con su motor (en la Luna no hay aire: no hay paracaídas),
 * despliega las patas, toca el suelo sin rebotar y suelta el rover. El polvo vuela en arcos bajos y no se queda flotando (sin aire).
 */
export function mountDelivery(root: HTMLElement, onDone: () => void): MiniGameHandle {
  const { c } = makeCanvas(root, t('probe.deliveryLabel'));
  const TOTAL = 4.2, DESC = 2.6, GROUND = 470, S = 1.7, REST_Y = GROUND - 42 * S;
  let tt = 0;
  const pits: [number, number, number][] = [[120, 500, 60], [620, 520, 80], [400, 556, 46], [820, 492, 34]];
  const loop = runLoop((dt) => { tt += dt; return tt >= TOTAL; }, () => {
    starfield(c, tt * 6, '#05031a', '#16124a');
    earthDisc(c, W - 140, 100, 44);
    mountains(c, 0, 0, 400, 110, '#3b3770', 5);
    mountains(c, 0, 0, 440, 70, '#5a5690', 17);
    const ground = c.createLinearGradient(0, GROUND, 0, H);
    ground.addColorStop(0, '#b4b2dc'); ground.addColorStop(1, '#7c79a8');
    c.fillStyle = ground; c.fillRect(0, GROUND, W, H - GROUND);
    c.strokeStyle = INK; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
    for (const [cx, cy, r] of pits) {
      c.fillStyle = 'rgba(70,66,110,.5)'; c.beginPath(); c.ellipse(cx, cy, r, r * 0.22, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(230,228,250,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, r, r * 0.22, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    }

    const p = Math.min(1, tt / DESC);
    const y = -80 + (REST_Y + 80) * (1 - Math.pow(1 - p, 2.4)); // frena hasta velocidad cero al tocar
    const landed = tt >= DESC;
    const k = tt - DESC;
    const sink = landed ? 4 * Math.exp(-7 * k) * Math.cos(15 * k) : 0; // las patas amortiguan el toque
    const flame = landed ? 0 : p < 0.9 ? 0.3 + 0.7 * Math.pow(1 - p, 1.2) : (0.3 + 0.7 * Math.pow(0.1, 1.2)) * ((1 - p) / 0.1); // el motor se corta justo antes de tocar
    const legs = smooth(0.5, 1.7, tt);
    const sway = landed ? 0 : Math.sin(tt * 2.2) * 8 * (1 - p);

    // polvo: sale cuando la sonda está cerca del suelo y vuela en arcos bajos (g lunar)
    for (let i = 0; i < 40; i++) {
      const dir = i % 2 ? 1 : -1;
      const t0 = 1.9 + (i % 9) * 0.075;
      const age = tt - t0;
      if (age < 0 || age > 1.5 || t0 > DESC + 0.25) continue;
      const sp = 60 + ((i * 37) % 110), vy = 16 + ((i * 53) % 40);
      const px = W / 2 + sway + dir * (28 + sp * age), py = GROUND - Math.max(0, vy * age - 0.5 * 34 * age * age);
      c.globalAlpha = 0.65 * (1 - age / 1.5); c.fillStyle = '#d8d6f0';
      c.beginPath(); c.arc(px, py - 1, 2.5 + (i % 3), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // el rover sale por una rampa y rueda hacia la derecha (ease-out)
    if (tt > DESC + 0.35) {
      const r = smooth(DESC + 0.35, TOTAL, tt);
      c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(W / 2 + 30, REST_Y + 10); c.lineTo(W / 2 + 110, GROUND); c.stroke();
      drawRover(c, W / 2 + 40 + 150 * r, GROUND + 1, 0, r * 12, 0.8);
    }
    drawProbe(c, W / 2 + sway, y + sink, { scale: S, legs, flame, sink, tilt: sway * 0.003, t: tt });
    pill(c, W / 2 - 200, H - 52, 400, 40);
    text(c, t('probe.noAir'), W / 2, H - 23, 20, 'center');
  }, onDone);
  return { destroy: () => loop.destroy() };
}
