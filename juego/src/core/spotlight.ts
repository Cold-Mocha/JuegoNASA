/**
 * Spotlight del tutorial: oscurece la pantalla salvo un hueco sobre lo que se está enseñando.
 * Fuera del hueco la capa bloquea los clics; dentro pasan. En coordenadas de juego (la UI escala con el canvas).
 */
/** `round`: el hueco es un círculo que encierra al rectángulo (se usa para el personaje). */
export interface SpotRect { x: number; y: number; w: number; h: number; round?: boolean; }

const PAD = 8;

/** Rectángulo de un elemento del HUD en coordenadas de juego. */
export function rectOf(el: Element, root: HTMLElement, gameWidth: number): SpotRect | null {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null; // oculto
  const base = root.getBoundingClientRect();
  const k = base.width / gameWidth || 1;
  return { x: (r.left - base.left) / k, y: (r.top - base.top) / k, w: r.width / k, h: r.height / k };
}

/** Rectángulo que cubre a todos (p. ej. el indicador de paneles y la barra de energía juntos). */
export function unionRect(rects: (SpotRect | null)[]): SpotRect | null {
  const rs = rects.filter((r): r is SpotRect => !!r);
  if (!rs.length) return null;
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
}

const HOLE_RADIUS = 18;
const box = (q: SpotRect): SpotRect => (q.round ? { x: q.x + q.w / 2 - Math.max(q.w, q.h) / 2, y: q.y + q.h / 2 - Math.max(q.w, q.h) / 2, w: Math.max(q.w, q.h), h: Math.max(q.w, q.h) } : q);
const overlap = (a0: SpotRect, b0: SpotRect): boolean => {
  const a = box(a0);
  const b = box(b0);
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
};

/** Los huecos que se tocan se unen en uno solo (si no, con «evenodd» la parte compartida quedaría oscura). */
function mergeOverlaps(rects: SpotRect[]): SpotRect[] {
  const out = [...rects];
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      if (!overlap(out[i], out[j])) continue;
      const u = unionRect([box(out[i]), box(out[j])])!; // al juntarse, el círculo pasa a ser parte de un hueco rectangular
      out.splice(j, 1);
      out[i] = u;
      i = -1; // vuelve a empezar: el hueco nuevo puede tocar a otros
      break;
    }
  }
  return out;
}

/** Círculo (dos arcos) que encierra al rectángulo. */
const circlePath = ({ x, y, w, h }: SpotRect): string => {
  const r = Math.max(w, h) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
};

const holePath = (q: SpotRect): string => (q.round ? circlePath(q) : roundedRectPath(q));

const roundedRectPath = ({ x, y, w, h }: SpotRect): string => {
  const r = Math.min(HOLE_RADIUS, w / 2, h / 2);
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
};

export class Spotlight {
  private readonly dim: HTMLElement;
  private readonly ring: HTMLElement;
  private sig = '';

  /** `el` contiene la capa oscura (`[data-spot-dim]`, recortada) y el anillo (`[data-spot-ring]`, fuera del recorte para que se vea). */
  constructor(private readonly el: HTMLElement, private readonly width: number, private readonly height: number) {
    this.dim = el.querySelector<HTMLElement>('[data-spot-dim]')!;
    this.ring = el.querySelector<HTMLElement>('[data-spot-ring]')!;
  }

  /**
   * `rect` es lo que enseña el paso (lleva anillo); `holes` son huecos extra sin anillo (por ejemplo, el personaje, siempre a la vista).
   * `rect` null y sin huecos = solo oscurece. `passthrough`: deja pasar los clics a todo (pasos de caminar).
   */
  show(rect: SpotRect | null, passthrough: boolean, holes: SpotRect[] = []): void {
    const pad = (q: SpotRect): SpotRect => ({ x: Math.round(q.x - PAD), y: Math.round(q.y - PAD), w: Math.round(q.w + PAD * 2), h: Math.round(q.h + PAD * 2), round: q.round });
    const r = rect && pad(rect);
    const cuts = mergeOverlaps([...(r ? [r] : []), ...holes.map(pad)]);
    const sig = `${cuts.map((c) => `${c.x},${c.y},${c.w},${c.h},${c.round ? 'o' : ''}`).join(';') || '-'}|${r ? `${r.x},${r.y},${r.w},${r.h}` : '-'}|${passthrough}`;
    this.el.hidden = false;
    if (sig === this.sig) return; // se llama cada frame: solo se toca el DOM si cambió
    this.sig = sig;
    this.dim.classList.toggle('is-passthrough', passthrough);
    const { width: W, height: H } = this;
    this.dim.style.clipPath = cuts.length ? `path(evenodd, 'M0 0H${W}V${H}H0Z${cuts.map(holePath).join('')}')` : 'none';
    this.ring.hidden = !r;
    if (r) Object.assign(this.ring.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  }

  hide(): void {
    this.el.hidden = true;
    this.sig = '';
  }
}
