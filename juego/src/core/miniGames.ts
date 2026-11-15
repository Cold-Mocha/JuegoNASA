import { t } from './i18n';
import { audio } from './audio';
import {
  ALGAE_DRAIN, ALGAE_SECONDS, HARVEST_PENALTY, HARVEST_SECONDS, HEAL_HOLD_MS, ICE_FILL_SECONDS, ICE_MAX_SECONDS, PEDAL_BEATS, PEDAL_PASS, algaeScore, drillScore, harvestScore, healScore,
  messageScore, pedalScore, type MiniDifficulty,
} from '../sim/minigames';

export { PEDAL_PASS };

/**
 * Minijuegos con botones: reparar la antena (conectar cables) y cosechar (tocar solo las plantas maduras).
 * Solo usan DOM (sin Phaser): los monta la escena de la estación dentro de un panel. Se pueden jugar con ratón, dedo o teclado (Tab y Enter).
 */
export interface MiniGameHandle {
  /** Mueve la herramienta con las flechas (solo los minijuegos de arrastrar). Sin `nudge`, las flechas mueven el foco entre botones. */
  nudge?(dx: number, dy: number): void;
  /** Espacio, Enter, 1-4 y A/S/D (`key` en minúscula, ' ' = Espacio). Devuelve true si la usó. */
  key?(key: string, down: boolean): boolean;
  /** Teclas que muestra la pista (en PC). */
  keys?: string[];
  /** Gesto que demuestra la pista animada. */
  gesture?: 'tap' | 'hold' | 'drag' | 'beat';
  destroy(): void;
}

/** Teclas que las escenas reenvían al minijuego, además de las flechas. */
export const MINI_KEYS: ReadonlySet<string> = new Set([' ', 'enter', '1', '2', '3', '4', 'a', 's', 'd']);

/** Flechas en los minijuegos de botones: pasa el foco al botón habilitado más cercano en esa dirección (Enter o Espacio lo aprieta). */
export function moveFocus(root: HTMLElement, dx: number, dy: number): void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter((b) => b.offsetParent !== null);
  if (!buttons.length) return;
  const current = document.activeElement instanceof HTMLButtonElement && buttons.includes(document.activeElement) ? document.activeElement : null;
  if (!current) return buttons[0].focus();
  const center = (el: HTMLElement): { x: number; y: number } => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const from = center(current);
  let best: HTMLButtonElement | null = null;
  let bestCost = Infinity;
  for (const b of buttons) {
    if (b === current) continue;
    const c = center(b);
    const along = (c.x - from.x) * dx + (c.y - from.y) * dy; // avance en la dirección pedida
    if (along <= 1) continue;
    const across = Math.abs((c.x - from.x) * dy) + Math.abs((c.y - from.y) * dx);
    const cost = along + across * 2;
    if (cost < bestCost) { bestCost = cost; best = b; }
  }
  best?.focus();
}

export interface MiniCallbacks {
  onProgress(fraction: number): void;
  /** `result` (0–1) es cuánto se logró; sin valor = completo. */
  onDone(result?: number): void;
}

// ------------------------------------------------------------------ reparar la antena: conectar cables del mismo color
const WIRES = [
  { name: 'coral', color: '#ff7a59', shape: '●' },
  { name: 'celeste', color: '#4cc3f5', shape: '■' },
  { name: 'dorado', color: '#ffcb47', shape: '▲' },
  { name: 'violeta', color: '#9b7bff', shape: '◆' },
];
const WIRE_W = 380;
const WIRE_H = 500;
const WIRE_ROWS = [70, 180, 290, 400];

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function mountAntennaGame(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  const order = shuffle([0, 1, 2, 3]); // qué cable va en cada enchufe de la derecha
  const plug = (i: number): string => `<button class="wire wire--plug" data-plug="${i}" style="left:24px;top:${WIRE_ROWS[i]}px;--wire:${WIRES[i].color}" aria-label="${t('mini.wire', { n: i + 1 })}"><span aria-hidden="true">${WIRES[i].shape}</span></button>`;
  const socket = (slot: number): string => `<button class="wire wire--socket" data-socket="${order[slot]}" style="right:24px;top:${WIRE_ROWS[slot]}px;--wire:${WIRES[order[slot]].color}" aria-label="${t('mini.socket', { n: order[slot] + 1 })}"><span aria-hidden="true">${WIRES[order[slot]].shape}</span></button>`;
  root.innerHTML = `<div class="wires" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <svg class="wires__back" viewBox="0 0 ${WIRE_W} ${WIRE_H}" aria-hidden="true">
      <rect x="6" y="6" width="368" height="488" rx="16" fill="#c4c2e0" stroke="#0e0b33" stroke-width="5"/>
      <rect x="18" y="18" width="344" height="464" rx="10" fill="#9a98c8" stroke="#0e0b33" stroke-width="4"/>
      <path d="M60 18 V482 M320 18 V482" stroke="#0e0b33" stroke-width="3" opacity=".35"/>
      ${[40, 460].flatMap((y) => [30, 100, 170, 240, 310, 350].map((x) => `<circle cx="${x}" cy="${y}" r="4" fill="#e4e3f2" stroke="#0e0b33" stroke-width="1.5"/>`)).join('')}
      <g transform="translate(190 36)"><path d="M-46 14 Q0 -34 46 14 Q0 2 -46 14Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/><path d="M0 8 V30" stroke="#0e0b33" stroke-width="5"/><circle cx="0" cy="4" r="5" fill="#ffcb47" stroke="#0e0b33" stroke-width="2.5"/></g>
      ${[0, 1, 2, 3].map((i) => `<rect class="wires__bar" data-bar="${i}" x="${158 + i * 16}" y="${74 - i * 9}" width="10" height="${10 + i * 9}" rx="3" fill="#2a3f8f" stroke="#0e0b33" stroke-width="2"/>`).join('')}
    </svg>
    <svg class="wires__lines" viewBox="0 0 ${WIRE_W} ${WIRE_H}" aria-hidden="true"></svg>
    ${[0, 1, 2, 3].map(plug).join('')}${[0, 1, 2, 3].map(socket).join('')}</div>`;
  const svg = root.querySelector('svg')!;
  let selected: number | null = null;
  const done = new Set<number>();
  const plugs = [...root.querySelectorAll<HTMLButtonElement>('[data-plug]')];
  const sockets = [...root.querySelectorAll<HTMLButtonElement>('[data-socket]')];
  const select = (i: number | null): void => {
    selected = i;
    plugs.forEach((p) => p.setAttribute('aria-pressed', String(Number(p.dataset.plug) === i)));
  };
  plugs.forEach((p) => p.addEventListener('click', () => { if (!done.has(Number(p.dataset.plug))) select(Number(p.dataset.plug)); }));
  sockets.forEach((s) => s.addEventListener('click', () => {
    const id = Number(s.dataset.socket);
    if (selected === null || done.has(id)) return;
    if (selected !== id) {
      audio.play('miss');
      s.classList.remove('is-wrong');
      void s.offsetWidth; // reinicia la animación de error
      s.classList.add('is-wrong');
      select(null);
      return;
    }
    const slot = order.indexOf(id);
    const y1 = WIRE_ROWS[id] + 35;
    const y2 = WIRE_ROWS[slot] + 35;
    svg.insertAdjacentHTML('beforeend',
      `<path d="M96 ${y1} C 190 ${y1}, 190 ${y2}, ${WIRE_W - 96} ${y2}" fill="none" stroke="#0e0b33" stroke-width="16" stroke-linecap="round"/>
       <path d="M96 ${y1} C 190 ${y1}, 190 ${y2}, ${WIRE_W - 96} ${y2}" fill="none" stroke="${WIRES[id].color}" stroke-width="9" stroke-linecap="round"/>`);
    done.add(id);
    audio.play('hit');
    plugs[id].classList.add('is-done');
    plugs[id].disabled = true;
    s.classList.add('is-done');
    s.disabled = true;
    select(null);
    root.querySelectorAll<SVGElement>('.wires__bar').forEach((bar, i) => bar.setAttribute('fill', i < done.size ? '#5ad6b2' : '#2a3f8f')); // barras de señal
    cb.onProgress(done.size / WIRES.length);
    if (done.size === WIRES.length) cb.onDone();
  }));
  cb.onProgress(0);
  return { gesture: 'tap', keys: ['← ↑ → ↓', 'Enter'], destroy() { /* nada que limpiar: los eventos viven en el panel */ } };
}

// ------------------------------------------------------------------ cosechar: tocar solo las plantas maduras, contra el reloj
/** Tomatera en maceta: madura = tomates rojos con brillo y chispa; sin madurar = tomates verdes pequeños y flor. */
const plantSvg = (ripe: boolean): string => {
  const fruit = ripe ? '#ff4f63' : '#9be86a';
  const fruitDark = ripe ? '#c7283f' : '#5fb446';
  const r = ripe ? 8 : 5.5;
  const tomato = (x: number, y: number): string =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fruit}" stroke="#0e0b33" stroke-width="3"/>
     <path d="M${x - r + 2.5} ${y + r * 0.35} Q${x} ${y + r + 1} ${x + r - 2.5} ${y + r * 0.35}" fill="none" stroke="${fruitDark}" stroke-width="2" stroke-linecap="round"/>
     <circle cx="${x - r * 0.38}" cy="${y - r * 0.38}" r="${r * 0.24}" fill="#fff" opacity=".75"/>
     <path d="M${x - 3.5} ${y - r + 0.5} l3.5 -3.2 l3.5 3.2 M${x} ${y - r + 0.5} v-4" fill="none" stroke="#2f8f3a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const leaf = (x: number, y: number, rot: number): string =>
    `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x} ${y} C${x - 10} ${y - 4} ${x - 9} ${y - 16} ${x} ${y - 18} C${x + 9} ${y - 16} ${x + 10} ${y - 4} ${x} ${y}Z" fill="#5ad6b2" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/><path d="M${x} ${y - 2} V${y - 14}" stroke="#2a8f74" stroke-width="2" stroke-linecap="round"/></g>`;
  return `<svg viewBox="0 0 72 84" width="72" height="84" aria-hidden="true">
    <ellipse cx="36" cy="80" rx="22" ry="3.5" fill="#0e0b33" opacity=".35"/>
    <path d="M16 58 H56 L51 78 H21Z" fill="#ff7a59" stroke="#0e0b33" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="13" y="52" width="46" height="9" rx="4" fill="#ff9475" stroke="#0e0b33" stroke-width="3.5"/>
    <path d="M24 64 V74 M48 64 V74" stroke="#cf5a3a" stroke-width="3" stroke-linecap="round"/>
    <path d="M17 54 Q36 49 55 54" fill="none" stroke="#4a2f1f" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 52 C33 42 39 34 36 20" fill="none" stroke="#2f8f3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M45 54 V16" stroke="#a87c46" stroke-width="2.5" stroke-linecap="round"/>
    ${leaf(36, 46, -62)}${leaf(36, 40, 60)}${leaf(36, 30, -34)}${leaf(36, 26, 38)}
    ${tomato(25, 41)}${tomato(48, 36)}${tomato(34, 20)}
    ${ripe ? '<path d="M60 6 l2.4 6.6 6.6 2.4 -6.6 2.4 -2.4 6.6 -2.4 -6.6 -6.6 -2.4 6.6 -2.4Z" fill="#ffcb47" stroke="#0e0b33" stroke-width="2"/>'
      : '<circle cx="14" cy="22" r="3" fill="#ffcb47" stroke="#0e0b33" stroke-width="1.6"/><circle cx="14" cy="22" r="1" fill="#ff7a59"/>'}
  </svg>`;
};

/** `time`: multiplicador del reloj según la dificultad (más difícil, menos tiempo). */
export function mountHarvestGame(root: HTMLElement, cb: MiniCallbacks, time = 1): MiniGameHandle {
  const seconds = HARVEST_SECONDS * time;
  const cells = shuffle([...Array(7).fill(true), ...Array(5).fill(false)] as boolean[]);
  const ripeTotal = cells.filter(Boolean).length;
  root.innerHTML = `<div class="harvest" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="harvest__time" role="progressbar" aria-label="${t('mini.time')}" aria-valuemin="0" aria-valuemax="${seconds}"><i data-time></i></div>
    <div class="harvest__grid">${cells.map((ripe, i) => `<button class="plant" data-ripe="${ripe}" data-i="${i}" aria-label="${ripe ? t('mini.ripe') : t('mini.unripe')}">${plantSvg(ripe)}</button>`).join('')}</div>
    <div class="harvest__basket" aria-hidden="true">${Array.from({ length: ripeTotal }, () => '<i></i>').join('')}</div></div>`;
  const bar = root.querySelector<HTMLElement>('[data-time]')!;
  const basket = [...root.querySelectorAll<HTMLElement>('.harvest__basket i')];
  let left = seconds;
  let picked = 0;
  let over = false;
  const end = (): void => {
    if (over) return;
    over = true;
    window.clearInterval(timer);
    root.querySelectorAll<HTMLButtonElement>('.plant').forEach((p) => (p.disabled = true));
    cb.onDone(harvestScore(picked, ripeTotal));
  };
  const timer = window.setInterval(() => {
    left = Math.max(0, left - 0.1);
    bar.style.width = `${(left / seconds) * 100}%`;
    if (left <= 0) end();
  }, 100);
  root.querySelectorAll<HTMLButtonElement>('.plant').forEach((p) => p.addEventListener('click', () => {
    if (over) return;
    if (p.dataset.ripe === 'true') {
      picked++;
      audio.play('hit');
      p.classList.add('is-picked');
      p.disabled = true;
      basket[picked - 1]?.classList.add('is-full'); // la canasta se va llenando
      cb.onProgress(picked / ripeTotal);
      if (picked === ripeTotal) end();
    } else {
      left = Math.max(0, left - HARVEST_PENALTY);
      audio.play('miss');
      p.classList.remove('is-wrong');
      void p.offsetWidth;
      p.classList.add('is-wrong');
    }
  }));
  cb.onProgress(0);
  return { gesture: 'tap', keys: ['← ↑ → ↓', 'Enter'], destroy() { over = true; window.clearInterval(timer); } };
}

// ------------------------------------------------------------------ curarse: tratar cada herida manteniendo apretado hasta que se cierre
const HEAL_SPOTS = [
  { x: 190, y: 92, label: 'cabeza' }, { x: 190, y: 232, label: 'pecho' }, { x: 84, y: 250, label: 'brazo' }, { x: 148, y: 410, label: 'pierna' },
];

/** Un michi astronauta en la camilla con puntos rojos que laten: se mantiene apretado cada uno hasta que el anillo se llena. Sin texto. */
export function mountHealGame(root: HTMLElement, cb: MiniCallbacks, time = 1): MiniGameHandle {
  const spots = shuffle(HEAL_SPOTS).slice(0, 4);
  root.innerHTML = `<div class="heal" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <svg class="heal__body" viewBox="0 0 ${WIRE_W} ${WIRE_H}" aria-hidden="true">
      <rect x="40" y="40" width="300" height="440" rx="36" fill="#9fd8f5" stroke="#0e0b33" stroke-width="5"/>
      <rect x="258" y="52" width="70" height="46" rx="8" fill="#0e0b33" stroke="#0e0b33" stroke-width="3"/><path d="M264 78 h12 l5 -14 l8 26 l6 -16 l5 4 h18" fill="none" stroke="#5ad6b2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="52" y="440" width="60" height="26" rx="6" fill="#ff6b7a" stroke="#0e0b33" stroke-width="3"/><path d="M82 444 v18 M73 453 h18" stroke="#f5f5f2" stroke-width="5" stroke-linecap="round"/>
      <rect x="64" y="64" width="252" height="392" rx="26" fill="#f5f5f2" stroke="#0e0b33" stroke-width="4"/>
      <path d="M150 74 L130 28 L168 52Z M230 74 L250 28 L212 52Z" fill="#f2a65a" stroke="#0e0b33" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="190" cy="104" r="52" fill="#f2a65a" stroke="#0e0b33" stroke-width="5"/>
      <circle cx="168" cy="98" r="6" fill="#0e0b33"/><circle cx="212" cy="98" r="6" fill="#0e0b33"/><path d="M178 120 q12 10 24 0" fill="none" stroke="#0e0b33" stroke-width="4" stroke-linecap="round"/>
      <rect x="130" y="156" width="120" height="150" rx="34" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5"/>
      <rect x="152" y="188" width="76" height="38" rx="8" fill="#c4c2e0" stroke="#0e0b33" stroke-width="4"/>
      <rect x="64" y="176" width="70" height="30" rx="15" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5" transform="rotate(18 100 190)"/>
      <rect x="246" y="176" width="70" height="30" rx="15" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5" transform="rotate(-18 280 190)"/>
      <rect x="138" y="300" width="48" height="120" rx="22" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5"/><rect x="194" y="300" width="48" height="120" rx="22" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5"/>
    </svg>
    ${spots.map((p, i) => `<button class="heal__spot" data-spot="${i}" style="left:${p.x - 34}px;top:${p.y - 34}px" aria-label="${t('mini.wound')}"><span class="heal__ring"></span><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#f5f5f2" stroke-width="4" stroke-linecap="round"/></svg></button>`).join('')}
  </div>`;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.heal__spot')];
  const startedAt = performance.now();
  let healed = 0;
  let over = false;
  const holds = new Map<HTMLButtonElement, { raf: number; t0: number }>();
  const stop = (b: HTMLButtonElement): void => {
    const h = holds.get(b);
    if (!h) return;
    cancelAnimationFrame(h.raf);
    holds.delete(b);
    if (!b.classList.contains('is-healed')) b.style.setProperty('--p', '0');
  };
  const start = (b: HTMLButtonElement): void => {
    if (over || b.classList.contains('is-healed') || holds.has(b)) return;
    const t0 = performance.now();
    const tick = (now: number): void => {
      const p = Math.min(1, (now - t0) / HEAL_HOLD_MS);
      b.style.setProperty('--p', String(p));
      if (p >= 1) {
        holds.delete(b);
        b.classList.add('is-healed');
        b.disabled = true;
        healed++;
        audio.play('hit');
        cb.onProgress(healed / buttons.length);
        if (healed === buttons.length) {
          over = true;
          cb.onDone(healScore(performance.now() - startedAt, time));
        }
        return;
      }
      holds.get(b)!.raf = requestAnimationFrame(tick);
    };
    holds.set(b, { raf: requestAnimationFrame(tick), t0 });
  };
  buttons.forEach((b) => {
    b.addEventListener('pointerdown', (ev) => { b.setPointerCapture(ev.pointerId); start(b); ev.preventDefault(); });
    b.addEventListener('pointerup', () => stop(b));
    b.addEventListener('pointercancel', () => stop(b));
    b.addEventListener('pointerleave', () => stop(b));
    b.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { start(b); ev.preventDefault(); } });
    b.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') stop(b); });
  });
  cb.onProgress(0);
  return {
    gesture: 'hold',
    keys: buttons.map((_, i) => String(i + 1)),
    key(k, down) { // 1-4: mantener apretada la herida de ese número
      const b = buttons['1234'.indexOf(k)];
      if (!b) return false;
      if (down) start(b); else stop(b);
      return true;
    },
    destroy() { over = true; holds.forEach((h) => cancelAnimationFrame(h.raf)); holds.clear(); },
  };
}

// ------------------------------------------------------------------ pedalear: seguir el ritmo con los dos pedales
const PEDAL_GAP = 640;      // ms entre notas
const PEDAL_WINDOW = 320;   // ms de margen para acertar (ancho: un niño de 7 años llega)
const PEDAL_LEAD = 1100;    // ms antes de la primera nota
const PEDAL_LINE = 330;     // altura (px) de la línea de pedaleo (las notas la cruzan al compás)
const PEDAL_SPEED = 0.24;   // px por ms que caen las notas

/**
 * Bicicleta de energía (sin texto): caen notas por dos carriles, izquierdo y derecho; hay que tocar el pedal del mismo lado cuando
 * llegan a la línea. Con ratón o dedo (los dos botones grandes) o con las flechas izquierda y derecha. Calidad = notas acertadas.
 */
/** `time`: multiplica el espacio entre notas (más difícil, más rápido). */
export function mountPedal(root: HTMLElement, cb: MiniCallbacks, time = 1): MiniGameHandle {
  const sides = Array.from({ length: PEDAL_BEATS }, (_, i) => (i % 2 === 0 ? 'L' : 'R') as 'L' | 'R');
  root.innerHTML = `<div class="pedal" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="pedal__lane pedal__lane--l"></div><div class="pedal__lane pedal__lane--r"></div>
    <div class="pedal__line" style="top:${PEDAL_LINE}px"></div>
    <div class="pedal__meter" aria-hidden="true"><i data-meter></i><b class="pedal__goal" style="left:${PEDAL_PASS * 100}%"></b></div>
    <button class="pedal__btn pedal__btn--l" data-side="L" aria-label="${t('mini.pedalLeft')}">◀</button>
    <button class="pedal__btn pedal__btn--r" data-side="R" aria-label="${t('mini.pedalRight')}">▶</button></div>`;
  const meter = root.querySelector<HTMLElement>('[data-meter]')!;
  const lanes = { L: root.querySelector<HTMLElement>('.pedal__lane--l')!, R: root.querySelector<HTMLElement>('.pedal__lane--r')! };
  const notes = sides.map((side, i) => {
    const el = document.createElement('i');
    el.className = `pedal__note pedal__note--${side.toLowerCase()}`;
    el.textContent = side === 'L' ? '◀' : '▶';
    lanes[side].append(el);
    return { side, t: PEDAL_LEAD + i * PEDAL_GAP * time, el, judged: false };
  });
  const t0 = performance.now();
  let hits = 0;
  let judged = 0;
  let over = false;
  let raf = 0;
  const settle = (n: (typeof notes)[number], hit: boolean): void => {
    n.judged = true;
    judged++;
    n.el.classList.add(hit ? 'is-hit' : 'is-miss');
    audio.play(hit ? 'hit' : 'miss');
    if (hit) hits++;
    meter.style.width = `${(hits / PEDAL_BEATS) * 100}%`;
    meter.classList.toggle('is-pass', hits / PEDAL_BEATS > PEDAL_PASS);
    cb.onProgress(hits / PEDAL_BEATS);
    if (judged === PEDAL_BEATS && !over) {
      over = true;
      cancelAnimationFrame(raf);
      window.setTimeout(() => cb.onDone(pedalScore(hits)), 250);
    }
  };
  const press = (side: 'L' | 'R'): void => {
    if (over) return;
    const now = performance.now() - t0;
    const target = notes.filter((n) => !n.judged && n.side === side).sort((a, b) => Math.abs(a.t - now) - Math.abs(b.t - now))[0];
    const btn = root.querySelector<HTMLElement>(`.pedal__btn--${side.toLowerCase()}`)!;
    btn.classList.remove('is-pressed');
    void btn.offsetWidth;
    btn.classList.add('is-pressed');
    if (target && Math.abs(target.t - now) <= PEDAL_WINDOW) settle(target, true);
  };
  const frame = (): void => {
    const now = performance.now() - t0;
    for (const n of notes) {
      if (n.judged) continue;
      n.el.style.transform = `translateY(${PEDAL_LINE - 156 - (n.t - now) * PEDAL_SPEED - 26}px)`; // 156 = alto donde empieza el carril; la nota (52 px) queda centrada en la línea a su hora
      if (now - n.t > PEDAL_WINDOW) settle(n, false); // se pasó sin tocarla
    }
    if (!over) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  root.querySelectorAll<HTMLButtonElement>('.pedal__btn').forEach((b) => b.addEventListener('pointerdown', (ev) => { press(b.dataset.side as 'L' | 'R'); ev.preventDefault(); }));
  cb.onProgress(0);
  return {
    gesture: 'beat',
    keys: ['A', 'D', '← →'],
    nudge(dx) { if (dx !== 0) press(dx < 0 ? 'L' : 'R'); },
    key(k, down) { // A y D son los pedales, igual que las flechas
      if (k !== 'a' && k !== 'd') return false;
      if (down) press(k === 'a' ? 'L' : 'R');
      return true;
    },
    destroy() { over = true; cancelAnimationFrame(raf); },
  };
}

// ------------------------------------------------------------------ mensaje con ruido: completar el patrón dañado por la estática
const MSG_SYMBOLS = [
  { color: '#ff7a59', shape: '●' }, { color: '#4cc3f5', shape: '■' }, { color: '#ffcb47', shape: '▲' }, { color: '#9b7bff', shape: '◆' },
];

/**
 * Avisar a la Tierra (sin texto): el mensaje es un patrón de símbolos que se repite; la estática dañó dos casillas.
 * Para cada una se elige entre dos símbolos el que continúa el patrón (la redundancia permite recuperarlo). Calidad = aciertos sin errores.
 */
export function mountNoisyMessage(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  const base = shuffle([0, 1, 2, 3]).slice(0, 3);
  const message = Array.from({ length: 6 }, (_, i) => base[i % 3]);
  const bad = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2).sort((a, b) => a - b);
  root.innerHTML = `<div class="msg" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <svg class="msg__tower" viewBox="0 0 120 120" aria-hidden="true"><path d="M60 110 L44 40 M60 110 L76 40 M48 80 H72 M52 62 H68" stroke="#0e0b33" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M60 110 L44 40 M60 110 L76 40 M48 80 H72 M52 62 H68" stroke="#c4c2e0" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="60" cy="34" r="9" fill="#ffcb47" stroke="#0e0b33" stroke-width="4"/><path d="M36 24 q-12 10 0 20 M84 24 q12 10 0 20 M26 14 q-22 20 0 40 M94 14 q22 20 0 40" stroke="#4cc3f5" stroke-width="5" fill="none" stroke-linecap="round"/></svg>
    <div class="msg__row">${message.map((m, i) => (bad.includes(i)
      ? `<span class="msg__slot is-noise" data-i="${i}"></span>`
      : `<span class="msg__slot" style="--c:${MSG_SYMBOLS[m].color}">${MSG_SYMBOLS[m].shape}</span>`)).join('')}</div>
    <div class="msg__choices" data-choices></div></div>`;
  const slots = [...root.querySelectorAll<HTMLElement>('.msg__slot.is-noise')];
  const choices = root.querySelector<HTMLElement>('[data-choices]')!;
  let step = 0;
  let wrongs = 0;
  const showChoices = (): void => {
    const right = message[bad[step]];
    const other = shuffle([0, 1, 2, 3].filter((x) => x !== right))[0];
    slots.forEach((s, i) => s.classList.toggle('is-active', i === step));
    choices.innerHTML = shuffle([right, other]).map((c) => `<button class="msg__choice" data-c="${c}" style="--c:${MSG_SYMBOLS[c].color}" aria-label="${t('mini.symbol')}">${MSG_SYMBOLS[c].shape}</button>`).join('');
    choices.querySelectorAll<HTMLButtonElement>('.msg__choice').forEach((b) => b.addEventListener('click', () => {
      if (Number(b.dataset.c) !== right) {
        wrongs++;
        audio.play('miss');
        b.classList.remove('is-wrong');
        void b.offsetWidth;
        b.classList.add('is-wrong');
        return;
      }
      audio.play('hit');
      const s = slots[step];
      s.classList.remove('is-noise', 'is-active');
      s.style.setProperty('--c', MSG_SYMBOLS[right].color);
      s.textContent = MSG_SYMBOLS[right].shape;
      step++;
      cb.onProgress(step / bad.length);
      if (step === bad.length) {
        choices.innerHTML = '';
        cb.onDone(messageScore(wrongs));
      } else showChoices();
    }));
  };
  showChoices();
  cb.onProgress(0);
  return {
    gesture: 'tap',
    keys: ['1', '2'],
    key(k, down) { // 1 y 2 eligen el símbolo de la izquierda o el de la derecha
      const b = choices.querySelectorAll<HTMLButtonElement>('.msg__choice')['12'.indexOf(k)];
      if (!b) return false;
      if (down) b.click();
      return true;
    },
    destroy() { /* nada que limpiar */ },
  };
}

// ------------------------------------------------------------------ taladro de hielo: mantener el taladro sobre el punto hasta que el hielo se rompa
const ICE_STAGE_W = WIRE_W;
const ICE_SPOT_R = 46;
const ICE_CRACKS = ['M190 300 L168 262 L174 238', 'M190 300 L222 270 L236 244', 'M190 300 L150 322 L124 318', 'M190 300 L232 330 L258 348', 'M168 262 L140 246', 'M222 270 L250 280', 'M190 300 L186 352 L172 380', 'M232 330 L240 366'];

/**
 * Taladro de hielo (sin texto): hay que mantener apretado el taladro sobre el punto brillante del hielo hasta que se rompa.
 * El punto se mueve despacio, así que hay que seguirlo; si el taladro se sale, el avance baja. Con el mouse o el dedo se apoya
 * el taladro apretando y arrastrando. Con el teclado: flechas para mover y Espacio o Enter apretado para taladrar.
 * Calidad = fracción del tiempo apretado que estuvo sobre el punto.
 */
export function mountIceDrill(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  root.innerHTML = `<div class="ice" style="width:${ICE_STAGE_W}px;height:${WIRE_H}px" aria-label="${t('mini.drill')}">
    <div class="ice__gauge" aria-hidden="true"><i data-gauge></i></div>
    <svg class="ice__block" viewBox="0 0 ${ICE_STAGE_W} ${WIRE_H}" aria-hidden="true">
      <path d="M40 250 L120 214 L250 222 L340 256 L352 430 L28 436Z" fill="#bfe8ff" stroke="#0e0b33" stroke-width="5" stroke-linejoin="round"/>
      <path d="M40 250 L120 214 L250 222 L340 256 L190 280Z" fill="#e9f8ff" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
      <path d="M70 330 L110 300 M270 380 L310 350 M90 400 L130 372" stroke="#8fcdf0" stroke-width="5" stroke-linecap="round" fill="none"/>
      <g data-cracks fill="none" stroke="#0e0b33" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${ICE_CRACKS.map((d) => `<path d="${d}" opacity="0"/>`).join('')}</g>
    </svg>
    <div class="ice__spot" data-spot></div>
    <div class="ice__drill" data-drill><svg viewBox="0 0 70 170" width="70" height="170" aria-hidden="true">
      <rect x="14" y="0" width="42" height="64" rx="10" fill="#ff7a59" stroke="#0e0b33" stroke-width="5"/>
      <rect x="22" y="14" width="26" height="14" rx="4" fill="#ffcb47" stroke="#0e0b33" stroke-width="3"/>
      <rect x="26" y="64" width="18" height="30" fill="#c4c2e0" stroke="#0e0b33" stroke-width="4"/>
      <path d="M26 94 H44 L38 166 H32Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 108 L42 114 M28 126 L42 132 M29 144 L41 150" stroke="#0e0b33" stroke-width="3" stroke-linecap="round"/></svg></div>
    <div class="ice__shards" data-shards aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i style="--a:${i * 40 - 160}deg;--d:${70 + (i % 3) * 36}px"></i>`).join('')}</div>
    <div class="ice__flash" data-flash></div></div>`;
  const stage = root.querySelector<HTMLElement>('.ice')!;
  const gauge = root.querySelector<HTMLElement>('[data-gauge]')!;
  const spot = root.querySelector<HTMLElement>('[data-spot]')!;
  const drill = root.querySelector<HTMLElement>('[data-drill]')!;
  const cracks = [...root.querySelectorAll<SVGPathElement>('[data-cracks] path')];
  const t0 = performance.now();
  let last = t0;
  let x = ICE_STAGE_W / 2;
  let down = false;
  let progress = 0;
  let onSec = 0;
  let pressedSec = 0;
  let over = false;
  let raf = 0;
  const finish = (score: number): void => {
    if (over) return;
    over = true;
    cancelAnimationFrame(raf);
    stage.classList.add('is-broken');
    audio.play('hit');
    cb.onProgress(1);
    window.setTimeout(() => cb.onDone(score), 750);
  };
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    const spotX = ICE_STAGE_W / 2 + 85 * Math.sin(t * 0.8);
    const onSpot = Math.abs(x - spotX) <= ICE_SPOT_R + 8;
    if (down) {
      pressedSec += dt;
      if (onSpot) { onSec += dt; progress = Math.min(1, progress + dt / ICE_FILL_SECONDS); }
      else progress = Math.max(0, progress - dt / (ICE_FILL_SECONDS * 3));
    }
    spot.style.transform = `translateX(${spotX - ICE_STAGE_W / 2}px)`;
    spot.classList.toggle('is-on', down && onSpot);
    drill.style.transform = `translate(${x - ICE_STAGE_W / 2}px, ${down ? 0 : -56}px)`;
    drill.classList.toggle('is-drilling', down && onSpot);
    gauge.style.height = `${progress * 100}%`;
    cracks.forEach((c, i) => c.setAttribute('opacity', progress > (i + 0.5) / cracks.length ? '1' : '0'));
    cb.onProgress(progress);
    if (progress >= 1) return finish(drillScore(onSec, pressedSec));
    if (t > ICE_MAX_SECONDS) return finish(0.2);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const move = (ev: PointerEvent): void => {
    const r = stage.getBoundingClientRect();
    x = Math.min(ICE_STAGE_W - 30, Math.max(30, ((ev.clientX - r.left) / r.width) * ICE_STAGE_W));
  };
  stage.addEventListener('pointerdown', (ev) => { stage.setPointerCapture(ev.pointerId); move(ev); down = true; });
  stage.addEventListener('pointermove', move);
  const release = (): void => { down = false; };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  return {
    gesture: 'hold',
    keys: ['← →', 'Espacio'],
    nudge(dx) { x = Math.min(ICE_STAGE_W - 30, Math.max(30, x + dx * 16)); },
    key(k, isDown) {
      if (k !== ' ' && k !== 'enter') return false;
      down = isDown;
      return true;
    },
    destroy() { over = true; cancelAnimationFrame(raf); },
  };
}

// ------------------------------------------------------------------ cultivo de algas: mantener luz, nutrientes y temperatura en su franja verde
const ALGAE_HEAT_FROM_LIGHT = 0.18; // la luz calienta el tanque: subir la luz obliga a compensar la temperatura (suave, para que 3 tubos se puedan)
const ALL_ALGAE_GAUGES = [
  { label: 'mini.gauge.light', color: '#ffcb47', icon: '<circle cx="24" cy="24" r="8" fill="#ffcb47" stroke="#0e0b33" stroke-width="3"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4" stroke="#0e0b33" stroke-width="3" stroke-linecap="round"/>' },
  { label: 'mini.gauge.nutrients', color: '#4cc3f5', icon: '<path d="M24 6 C33 17 38 24 38 31 A14 14 0 0 1 10 31 C10 24 15 17 24 6Z" fill="#4cc3f5" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/>' },
  { label: 'mini.gauge.temperature', color: '#ff7a59', icon: '<rect x="19" y="6" width="10" height="26" rx="5" fill="#f5f5f2" stroke="#0e0b33" stroke-width="3"/><circle cx="24" cy="35" r="8" fill="#ff7a59" stroke="#0e0b33" stroke-width="3"/><rect x="22.5" y="18" width="3" height="16" fill="#ff7a59"/>' },
] as const;

/**
 * Cultivo de algas: de 1 a 3 jeringas según la dificultad (luz, nutrientes y temperatura) se desvían solas; mantener apretada su tecla (A, S, D) o su columna
 * la sube, soltarla la deja caer. Hay que tener TODAS en su franja verde hasta llenar la barra (`algaeHoldSec`); fuera de la franja
 * la barra baja. Si se acaba el tiempo antes, se pierde (puntaje 0). La luz calienta el tanque: subirla obliga a compensar la temperatura.
 */
export function mountAlgae(root: HTMLElement, cb: MiniCallbacks, cfg: MiniDifficulty): MiniGameHandle {
  const count = cfg.algaeTubes;
  const limit = ALGAE_SECONDS * Math.max(1, cfg.time); // con 3 tubos no se recorta el reloj: en Comandante la dificultad ya es el tercer tubo
  const ALGAE_GAUGES = ALL_ALGAE_GAUGES.slice(0, count);
  const KEYS = ['A', 'S', 'D'].slice(0, count); // la tecla de cada tubo, también dibujada debajo de él
  const band = ALGAE_GAUGES.map(() => ({ center: 0.35 + Math.random() * 0.3, half: cfg.algaeBandHalf }));
  const phase = ALGAE_GAUGES.map(() => Math.random() * 6.28);
  const pos = ALGAE_GAUGES.map(() => 0.5);
  const held = ALGAE_GAUGES.map(() => false);
  root.innerHTML = `<div class="algae" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="algae__time" role="progressbar" aria-label="${t('mini.time')}" aria-valuemin="0" aria-valuemax="${limit}"><i data-time></i></div>
    <div class="algae__grow" data-grow aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 20 C4 9 11 4 21 4 C21 15 15 20 4 20Z" fill="#7ed957" stroke="#0e0b33" stroke-width="2.5" stroke-linejoin="round"/></svg>
      <span class="algae__grow-track"><i data-grow-fill></i></span><b class="algae__goal">★</b></div>
    <svg class="algae__tank" viewBox="0 0 ${WIRE_W} 190" aria-hidden="true">
      <rect x="70" y="20" width="240" height="150" rx="26" fill="#bfe6ff" fill-opacity=".25" stroke="#0e0b33" stroke-width="5"/>
      <g class="algae__plants" data-plants>
      <path d="M78 70 Q130 56 190 70 T302 70 V150 Q302 162 290 162 H90 Q78 162 78 150Z" fill="#2f8f3a" fill-opacity=".85"/>
      <circle cx="120" cy="110" r="7" fill="#7ed957"/><circle cx="210" cy="132" r="9" fill="#7ed957"/><circle cx="260" cy="96" r="6" fill="#5ad6b2"/><circle cx="160" cy="145" r="5" fill="#5ad6b2"/>
      </g>
      <circle cx="105" cy="84" r="3.5" fill="#fff" opacity=".8"/><circle cx="240" cy="116" r="3" fill="#fff" opacity=".8"/><circle cx="182" cy="98" r="3" fill="#fff" opacity=".8"/>
      <rect x="120" y="4" width="140" height="14" rx="7" fill="#ee5fd6" stroke="#0e0b33" stroke-width="3"/></svg>
    ${ALGAE_GAUGES.map((g, i) => `<button class="algae__gauge" data-gauge="${i}" style="left:${28 + (3 - count) * 56 + i * 112}px;--c:${g.color}" aria-label="${t(g.label)}">
      <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">${g.icon}</svg>
      <span class="algae__dir" data-dir></span>
      <span class="algae__track"><i class="algae__band" style="bottom:${(band[i].center - band[i].half) * 100}%;height:${band[i].half * 200}%"></i><i class="algae__needle" data-needle></i></span>
      <kbd class="algae__key" aria-hidden="true">${KEYS[i]}</kbd></button>`).join('')}</div>`;
  const bar = root.querySelector<HTMLElement>('[data-time]')!;
  const gauges = [...root.querySelectorAll<HTMLButtonElement>('[data-gauge]')];
  const needles = gauges.map((g) => g.querySelector<HTMLElement>('[data-needle]')!);
  const dirs = gauges.map((g) => g.querySelector<HTMLElement>('[data-dir]')!);
  const stage = root.querySelector<HTMLElement>('.algae')!;
  const growFill = root.querySelector<HTMLElement>('[data-grow-fill]')!;
  const plants = root.querySelector<SVGGElement>('[data-plants]')!;
  let growing: boolean | null = null; // para sonar solo al cambiar entre «crece» y «se marchita»
  let elapsed = 0;
  let hold = 0; // segundos acumulados con las tres en la franja (baja al salirse)
  let over = false;
  let last = performance.now();
  let raf = 0;
  const tick = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    elapsed += dt;
    pos.forEach((p, i) => {
      let v = (held[i] ? 0.4 : -0.2) + 0.12 * Math.sin(elapsed * 1.7 + phase[i]);
      if (i === 2) v += ALGAE_HEAT_FROM_LIGHT * (pos[0] - 0.3); // la luz alta calienta; con luz baja el tanque se enfría
      pos[i] = Math.min(1, Math.max(0, p + v * dt));
      needles[i].style.bottom = `${pos[i] * 100}%`;
    });
    const ok = pos.map((p, i) => Math.abs(p - band[i].center) <= band[i].half);
    gauges.forEach((g, i) => {
      g.classList.toggle('is-ok', ok[i]);
      dirs[i].textContent = ok[i] ? '' : pos[i] < band[i].center ? '▲' : '▼'; // fuera de la franja: flecha hacia dónde hay que llevarla
    });
    const all = ok.every(Boolean);
    hold = Math.min(cfg.algaeHoldSec, Math.max(0, hold + (all ? dt : -dt * ALGAE_DRAIN)));
    // se ve si vas ganando: la barra sube y las algas crecen; si no, la barra baja, parpadea en rojo y las algas se marchitan
    const progress = hold / cfg.algaeHoldSec;
    growFill.style.width = `${progress * 100}%`;
    plants.style.transform = `scale(${0.55 + 0.45 * progress})`;
    stage.classList.toggle('is-growing', all);
    stage.classList.toggle('is-losing', !all);
    if (growing !== all) {
      if (growing !== null) audio.play(all ? 'hit' : 'miss');
      growing = all;
    }
    bar.style.width = `${Math.max(0, 1 - elapsed / limit) * 100}%`;
    bar.classList.toggle('is-low', limit - elapsed <= 5); // últimos segundos: el reloj avisa
    cb.onProgress(progress);
    if (progress >= 1 || elapsed >= limit) {
      over = true;
      cb.onDone(progress >= 1 ? algaeScore(limit - elapsed, limit) : 0); // sin llenar la barra a tiempo: se pierde
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const set = (i: number, on: boolean): void => {
    held[i] = on;
    gauges[i].classList.toggle('is-held', on); // la tecla dibujada se ve apretada
  };
  gauges.forEach((g, i) => {
    g.addEventListener('pointerdown', (ev) => { g.setPointerCapture(ev.pointerId); set(i, true); ev.preventDefault(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => g.addEventListener(n, () => set(i, false)));
    g.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { set(i, true); ev.preventDefault(); } });
    g.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') set(i, false); });
  });
  raf = requestAnimationFrame(tick);
  cb.onProgress(0);
  return {
    gesture: 'hold',
    keys: KEYS,
    key(k, down) { // A, S y D (o 1, 2 y 3) sostienen cada aguja; se pueden apretar varias a la vez
      const i = Math.max('asd'.indexOf(k), '123'.indexOf(k));
      if (i < 0 || i >= count) return false;
      if (!over) set(i, down);
      return true;
    },
    destroy() { over = true; cancelAnimationFrame(raf); },
  };
}
