/**
 * Minijuego de sellar una fractura: una placa del casco con una grieta zigzag por la que se escapa el aire.
 * Se sigue la grieta con el sellador (arrastrando el ratón o el dedo, o con las flechas del teclado) hasta cubrirla entera.
 * Solo usa DOM y canvas (sin Phaser): lo monta la escena de la estación dentro de un panel.
 */
const W = 380;
const H = 500;
const TOOL_R = 20;      // a qué distancia de la grieta sella el sellador
const DONE_AT = 0.97;   // fracción de grieta sellada para terminar
const KEY_STEP = 16;

export interface SealGame {
  nudge(dx: number, dy: number): void;
  destroy(): void;
}

interface Options {
  onProgress(fraction: number): void;
  onDone(): void;
}

interface Pt { x: number; y: number; }

const TOOL_SVG = `<svg viewBox="0 0 96 96" width="84" height="84" aria-hidden="true">
  <g transform="rotate(-30 48 48)">
    <rect x="34" y="6" width="28" height="44" rx="9" fill="#ffcb47" stroke="#0e0b33" stroke-width="4"/>
    <rect x="40" y="14" width="16" height="10" rx="3" fill="#0e0b33"/>
    <rect x="42" y="48" width="12" height="20" rx="3" fill="#c4c2e0" stroke="#0e0b33" stroke-width="4"/>
    <path d="M48 68 v14" stroke="#0e0b33" stroke-width="9" stroke-linecap="round"/><path d="M48 68 v14" stroke="#f5f5f2" stroke-width="4" stroke-linecap="round"/>
  </g></svg>`;

/** Grieta zigzag de arriba a abajo, con muestras cada pocos píxeles para medir el avance. */
function makeCrack(): { poly: Pt[]; samples: Pt[] } {
  const poly: Pt[] = [{ x: 190, y: 28 }];
  let x = 190;
  for (let y = 28 + 52; y <= H - 28; y += 52) {
    x = Math.min(W - 70, Math.max(70, x + (Math.random() < 0.5 ? -1 : 1) * (28 + Math.random() * 44)));
    poly.push({ x, y: Math.min(H - 28, y) });
  }
  const samples: Pt[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 7);
    for (let k = 0; k < n; k++) samples.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  return { poly, samples };
}

function drawPlate(ctx: CanvasRenderingContext2D, poly: Pt[]): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#c4c2e0';
  ctx.strokeStyle = '#0e0b33';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(6, 6, W - 12, H - 12, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9a98c8';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(22, 22, W - 44, H - 44, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(14,11,51,.55)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2, 22); ctx.lineTo(W / 2, H - 22); ctx.moveTo(22, H / 2); ctx.lineTo(W - 22, H / 2); ctx.stroke();
  ctx.fillStyle = '#e4e3f2';
  for (let x = 38; x < W - 30; x += 40) for (const y of [38, H - 38]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  for (let y = 78; y < H - 60; y += 40) for (const x of [38, W - 38]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  // grieta
  const line = (w: number, c: string): void => {
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
  };
  line(20, '#0e0b33');
  line(11, '#0b0c0f');
  line(2.5, 'rgba(255,203,71,.75)');
}

export function mountSealGame(root: HTMLElement, opts: Options): SealGame {
  const { poly, samples } = makeCrack();
  root.innerHTML = `<div class="seal" style="width:${W}px;height:${H}px">
    <canvas class="seal__plate" width="${W}" height="${H}"></canvas>
    <div class="seal__air"></div>
    <canvas class="seal__bead" width="${W}" height="${H}" aria-label="Fractura en el casco" role="img"></canvas>
    <div class="seal__tool" aria-hidden="true">${TOOL_SVG}</div></div>`;
  const wrap = root.firstElementChild as HTMLElement;
  const [plate, bead] = [...wrap.querySelectorAll('canvas')] as HTMLCanvasElement[];
  const air = wrap.querySelector<HTMLElement>('.seal__air')!;
  const tool = wrap.querySelector<HTMLElement>('.seal__tool')!;
  drawPlate(plate.getContext('2d')!, poly);
  const bctx = bead.getContext('2d')!;
  // bocanadas de aire que se escapan por la grieta: se apagan a medida que se sella
  air.innerHTML = samples.filter((_, i) => i % 9 === 0).map((p, i) => `<i style="left:${p.x}px;top:${p.y}px;animation-delay:${(i % 6) * 0.25}s"></i>`).join('');
  const sealed = new Array<boolean>(samples.length).fill(false);
  let count = 0;
  let cx = 190;
  let cy = 28;
  let drawing = false;
  let finished = false;
  let last: Pt | null = null;

  const place = (): void => void (tool.style.transform = `translate(${cx - 12}px, ${cy - 70}px)`);
  const progress = (): void => {
    const f = count / samples.length;
    air.style.opacity = String(Math.max(0, 1 - f * 1.15));
    opts.onProgress(f);
    if (f >= DONE_AT && !finished) {
      finished = true;
      bctx.strokeStyle = '#f5f5f2';
      bctx.lineWidth = 14;
      bctx.lineCap = 'round';
      bctx.lineJoin = 'round';
      bctx.beginPath(); poly.forEach((p, i) => (i ? bctx.lineTo(p.x, p.y) : bctx.moveTo(p.x, p.y))); bctx.stroke();
      air.style.opacity = '0';
      opts.onDone();
    }
  };
  const apply = (nx: number, ny: number): void => {
    if (finished) return;
    const a = last ?? { x: nx, y: ny };
    bctx.strokeStyle = '#f5f5f2';
    bctx.lineWidth = 14;
    bctx.lineCap = 'round';
    bctx.beginPath(); bctx.moveTo(a.x, a.y); bctx.lineTo(nx, ny); bctx.stroke();
    bctx.strokeStyle = '#ffcb47';
    bctx.lineWidth = 5;
    bctx.beginPath(); bctx.moveTo(a.x, a.y); bctx.lineTo(nx, ny); bctx.stroke();
    last = { x: nx, y: ny };
    for (let i = 0; i < samples.length; i++) {
      if (!sealed[i] && Math.hypot(samples[i].x - nx, samples[i].y - ny) <= TOOL_R) { sealed[i] = true; count++; }
    }
    progress();
  };
  const toLocal = (ev: PointerEvent): Pt => {
    const r = bead.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
  };
  const move = (ev: PointerEvent): void => {
    const p = toLocal(ev);
    cx = p.x; cy = p.y;
    place();
    if (drawing) apply(cx, cy);
  };
  const down = (ev: PointerEvent): void => {
    drawing = true;
    last = null;
    bead.setPointerCapture(ev.pointerId);
    move(ev);
    ev.preventDefault();
  };
  const up = (): void => { drawing = false; last = null; };
  bead.addEventListener('pointerdown', down);
  bead.addEventListener('pointermove', move);
  bead.addEventListener('pointerup', up);
  bead.addEventListener('pointercancel', up);
  place();
  opts.onProgress(0);

  return {
    nudge(dx, dy) {
      cx = Math.min(W - 6, Math.max(6, cx + dx * KEY_STEP));
      cy = Math.min(H - 6, Math.max(6, cy + dy * KEY_STEP));
      place();
      apply(cx, cy);
    },
    destroy() { finished = true; },
  };
}
