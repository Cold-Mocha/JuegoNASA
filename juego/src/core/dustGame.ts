/**
 * Minijuego de limpiar los paneles: un panel solar grande (con su soporte) cubierto de polvo y un cepillo.
 * Se limpia a mano: arrastrando el ratón o el dedo, o con las flechas del teclado. Al sacar casi todo el polvo, termina.
 * Solo usa DOM y canvas (sin Phaser): lo monta la escena de la estación dentro de un panel.
 */
const W = 380;
const H = 500;
const PANEL = { x: 92, y: 22, w: 262, h: 456 };   // marco del panel dentro del canvas
const BRUSH_R = 22;                               // radio de limpieza del cepillo
const DONE_AT = 0.96;                             // fracción de polvo limpiada para terminar
const KEY_STEP = 18;

export interface DustGame {
  /** Mueve el cepillo (teclado): limpia por donde pasa. */
  nudge(dx: number, dy: number): void;
  destroy(): void;
}

interface Options {
  /** Polvo acumulado en los paneles (0–1): más polvo, más manchas. */
  dust: number;
  onProgress(fraction: number): void;
  onDone(): void;
}

const BRUSH_SVG = `<svg viewBox="0 0 96 96" width="86" height="86" aria-hidden="true">
  <g transform="rotate(-35 48 48)">
    <rect x="40" y="2" width="14" height="46" rx="6" fill="#9b7bff" stroke="#0e0b33" stroke-width="4"/>
    <rect x="22" y="44" width="50" height="14" rx="5" fill="#c4c2e0" stroke="#0e0b33" stroke-width="4"/>
    <path d="M26 58 v26 M34 58 v30 M42 58 v32 M50 58 v32 M58 58 v30 M66 58 v26" stroke="#0e0b33" stroke-width="7" stroke-linecap="round"/>
    <path d="M26 58 v26 M34 58 v30 M42 58 v32 M50 58 v32 M58 58 v30 M66 58 v26" stroke="#e3bd84" stroke-width="3.5" stroke-linecap="round"/>
  </g></svg>`;

function drawPanel(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  // soporte (cercha) a la izquierda
  ctx.strokeStyle = '#0e0b33';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(40, 40); ctx.lineTo(40, 470);
  ctx.moveTo(74, 60); ctx.lineTo(74, 450);
  ctx.stroke();
  ctx.strokeStyle = '#9a98c8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, 40); ctx.lineTo(40, 470);
  ctx.moveTo(74, 60); ctx.lineTo(74, 450);
  ctx.stroke();
  ctx.strokeStyle = '#0e0b33';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let y = 70; y < 440; y += 62) { ctx.moveTo(40, y); ctx.lineTo(74, y + 31); ctx.lineTo(40, y + 62); }
  ctx.stroke();
  ctx.strokeStyle = '#c4c2e0';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // marco y vidrio del panel
  const { x, y, w, h } = PANEL;
  ctx.fillStyle = '#c4c2e0';
  ctx.strokeStyle = '#0e0b33';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(x - 10, y - 10, w + 20, h + 20, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a3f8f';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.stroke();
  // celdas: 4 columnas × 6 filas
  ctx.strokeStyle = '#4cc3f5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) { ctx.moveTo(x + (w / 4) * i, y); ctx.lineTo(x + (w / 4) * i, y + h); }
  for (let j = 1; j < 6; j++) { ctx.moveTo(x, y + (h / 6) * j); ctx.lineTo(x + w, y + (h / 6) * j); }
  ctx.stroke();
  ctx.strokeStyle = '#0e0b33';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  // brillo
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  ctx.beginPath(); ctx.moveTo(x + 20, y + 20); ctx.lineTo(x + 120, y + 20); ctx.lineTo(x + 60, y + 150); ctx.lineTo(x + 20, y + 150); ctx.fill();
}

/** Manchas de polvo irregulares (como en el boceto) y granitos sueltos sobre el vidrio. */
function drawDust(ctx: CanvasRenderingContext2D, dust: number): void {
  ctx.clearRect(0, 0, W, H);
  const patches = 6 + Math.round(Math.min(1, dust) * 8);
  const { x, y, w, h } = PANEL;
  for (let p = 0; p < patches; p++) {
    const cx = x + 30 + Math.random() * (w - 60);
    const cy = y + 30 + Math.random() * (h - 60);
    const r = 20 + Math.random() * 20;
    ctx.fillStyle = Math.random() < 0.5 ? '#b4ae9e' : '#9c9684';
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.65 + Math.random() * 0.5);
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr * 0.8;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(cx + (Math.random() - 0.5) * r * 1.2, cy + (Math.random() - 0.5) * r, 1.8 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = '#b4ae9e';
  for (let i = 0; i < 40 + dust * 60; i++) {
    ctx.beginPath(); ctx.arc(x + 8 + Math.random() * (w - 16), y + 8 + Math.random() * (h - 16), 1.5 + Math.random() * 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

function dustPixels(ctx: CanvasRenderingContext2D): number {
  const data = ctx.getImageData(PANEL.x, PANEL.y, PANEL.w, PANEL.h).data;
  let n = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] > 40) n++; // se muestrea 1 de cada 4 píxeles
  return n;
}

/** Monta el minijuego dentro de `root` (se vacía antes). */
export function mountDustGame(root: HTMLElement, opts: Options): DustGame {
  root.innerHTML = `<div class="dust" style="width:${W}px;height:${H}px">
    <canvas class="dust__panel" width="${W}" height="${H}"></canvas>
    <canvas class="dust__dirt" width="${W}" height="${H}" aria-label="Polvo sobre el panel solar" role="img"></canvas>
    <div class="dust__brush" aria-hidden="true">${BRUSH_SVG}</div></div>`;
  const wrap = root.firstElementChild as HTMLElement;
  const [panel, dirt] = [...wrap.querySelectorAll('canvas')] as HTMLCanvasElement[];
  const brush = wrap.querySelector<HTMLElement>('.dust__brush')!;
  drawPanel(panel.getContext('2d')!);
  const dctx = dirt.getContext('2d', { willReadFrequently: true })!;
  drawDust(dctx, opts.dust);
  const total = Math.max(1, dustPixels(dctx));
  let cx = PANEL.x + PANEL.w + 30;
  let cy = PANEL.y + PANEL.h - 30;
  let drawing = false;
  let finished = false;
  let last: { x: number; y: number } | null = null;
  let timer = 0;

  const place = (): void => void (brush.style.transform = `translate(${cx - 14}px, ${cy - 70}px)`);
  const check = (): void => {
    const fraction = Math.min(1, 1 - dustPixels(dctx) / total);
    opts.onProgress(fraction);
    if (fraction >= DONE_AT && !finished) {
      finished = true;
      dctx.clearRect(0, 0, W, H);
      opts.onDone();
    }
  };
  const scrub = (nx: number, ny: number): void => {
    if (finished) return;
    dctx.save();
    dctx.globalCompositeOperation = 'destination-out';
    dctx.lineWidth = BRUSH_R * 2;
    dctx.lineCap = 'round';
    dctx.beginPath();
    dctx.moveTo(last?.x ?? nx, last?.y ?? ny);
    dctx.lineTo(nx, ny);
    dctx.stroke();
    dctx.restore();
    last = { x: nx, y: ny };
    window.clearTimeout(timer);
    timer = window.setTimeout(check, 60); // se mide al terminar el trazo, no en cada movimiento
  };
  const toLocal = (ev: PointerEvent): { x: number; y: number } => {
    const r = dirt.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
  };
  const move = (ev: PointerEvent): void => {
    const p = toLocal(ev);
    cx = p.x; cy = p.y;
    place();
    if (drawing) scrub(cx, cy);
  };
  const down = (ev: PointerEvent): void => {
    drawing = true;
    last = null;
    dirt.setPointerCapture(ev.pointerId);
    move(ev);
    ev.preventDefault();
  };
  const up = (): void => { drawing = false; last = null; };
  dirt.addEventListener('pointerdown', down);
  dirt.addEventListener('pointermove', move);
  dirt.addEventListener('pointerup', up);
  dirt.addEventListener('pointercancel', up);
  place();
  opts.onProgress(0);

  return {
    nudge(dx, dy) {
      cx = Math.min(W - 6, Math.max(6, cx + dx * KEY_STEP));
      cy = Math.min(H - 6, Math.max(6, cy + dy * KEY_STEP));
      place();
      scrub(cx, cy);
    },
    destroy() {
      window.clearTimeout(timer);
      finished = true;
    },
  };
}
