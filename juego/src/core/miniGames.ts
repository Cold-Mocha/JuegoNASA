import { t } from './i18n';
import { alertFx, between, flash, pop } from './miniFx';
/**
 * Minijuegos con botones: reparar la antena (conectar cables) y cosechar (tocar solo las plantas maduras).
 * Solo usan DOM (sin Phaser): los monta la escena de la estación dentro de un panel. Se pueden jugar con ratón, dedo o teclado (Tab y Enter).
 */
export interface MiniGameHandle {
  /** Mueve la herramienta con las flechas (solo los minijuegos de arrastrar). */
  nudge?(dx: number, dy: number): void;
  destroy(): void;
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
  const plug = (i: number): string => `<button class="wire wire--plug" data-plug="${i}" style="left:24px;top:${WIRE_ROWS[i]}px;--wire:${WIRES[i].color}" aria-label="${t('Cable {color}', { color: t(WIRES[i].name) })}"><span aria-hidden="true">${WIRES[i].shape}</span></button>`;
  const socket = (slot: number): string => `<button class="wire wire--socket" data-socket="${order[slot]}" style="right:24px;top:${WIRE_ROWS[slot]}px;--wire:${WIRES[order[slot]].color}" aria-label="${t('Enchufe {color}', { color: t(WIRES[order[slot]].name) })}"><span aria-hidden="true">${WIRES[order[slot]].shape}</span></button>`;
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
  return { destroy() { /* nada que limpiar: los eventos viven en el panel */ } };
}

// ------------------------------------------------------------------ cosechar: tocar solo las plantas maduras, contra el reloj
const HARVEST_SECONDS = 20;
const HARVEST_PENALTY = 2;

/**
 * Madura = fruto GRANDE, dorado y brillante, con estrella y borde punteado; verde = fruto PEQUEÑO, oscuro y con capuchón.
 * Se distingue por tamaño, luminosidad y forma, no por el color rojo/verde (apto para daltonismo).
 */
const plantSvg = (ripe: boolean): string => {
  const fruit = ripe ? '#ffcb47' : '#2c6b4f';
  const r = ripe ? 9 : 5;
  const dot = (x: number, y: number): string => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fruit}" stroke="#0e0b33" stroke-width="3"/>${ripe ? `<circle cx="${x - 3}" cy="${y - 3}" r="2.4" fill="#fff8d6"/>` : `<path d="M${x - 4} ${y - r + 1} l4 -5 l4 5Z" fill="#1c4533" stroke="#0e0b33" stroke-width="2"/>`}`;
  return `<svg viewBox="0 0 64 72" width="64" height="72" aria-hidden="true">${ripe ? '<circle cx="32" cy="36" r="31" fill="none" stroke="#ffcb47" stroke-width="3" stroke-dasharray="3 6" opacity=".9"/>' : ''}
    <path d="M12 52 H52 L47 68 H17Z" fill="#ff7a59" stroke="#0e0b33" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M32 52 V22" stroke="#2f8f3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 40 q-16 -2 -18 -16 q16 0 18 16Z M32 34 q16 -2 18 -16 q-16 0 -18 16Z" fill="#5ad6b2" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/>
    ${dot(21, 46)}${dot(43, 44)}${dot(32, 19)}
    ${ripe ? '<path d="M50 6 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z" fill="#ffcb47" stroke="#0e0b33" stroke-width="2"/>' : ''}
  </svg>`;
};

export function mountHarvestGame(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  const cells = shuffle([...Array(7).fill(true), ...Array(5).fill(false)] as boolean[]);
  const ripeTotal = cells.filter(Boolean).length;
  root.innerHTML = `<div class="harvest" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="harvest__time" role="progressbar" aria-label="${t('Tiempo')}" aria-valuemin="0" aria-valuemax="${HARVEST_SECONDS}"><i data-time></i></div>
    <div class="harvest__grid">${cells.map((ripe, i) => `<button class="plant" data-ripe="${ripe}" data-i="${i}" aria-label="${ripe ? t('Planta madura') : t('Planta verde')}">${plantSvg(ripe)}</button>`).join('')}</div>
    <div class="harvest__basket" aria-hidden="true">${Array.from({ length: ripeTotal }, () => '<i></i>').join('')}</div></div>`;
  const bar = root.querySelector<HTMLElement>('[data-time]')!;
  const basket = [...root.querySelectorAll<HTMLElement>('.harvest__basket i')];
  let left = HARVEST_SECONDS;
  let picked = 0;
  let over = false;
  const plants = [...root.querySelectorAll<HTMLButtonElement>('.plant')];
  const evTimers: number[] = [];
  const open = (): HTMLButtonElement[] => plants.filter((p) => !p.disabled);
  // Evento 1: una fruta dorada que brilla da +3 s si se toca a tiempo (aparece entre los 4 y 8 s)
  evTimers.push(window.setTimeout(() => {
    const ripe = open().filter((p) => p.dataset.ripe === 'true');
    if (over || !ripe.length) return;
    const g = ripe[Math.floor(Math.random() * ripe.length)];
    g.classList.add('is-gold');
    g.dataset.gold = '1';
    pop(root, '⭐');
    evTimers.push(window.setTimeout(() => { g.classList.remove('is-gold'); delete g.dataset.gold; }, 4500));
  }, between(4, 8) * 1000));
  // Evento 2: entre los 9 y 13 s dos macetas titilan y cambian de lugar
  evTimers.push(window.setTimeout(() => {
    const free = open();
    if (over || free.length < 2) return;
    const [a, b] = [...free].sort(() => Math.random() - 0.5);
    a.classList.add('is-swap'); b.classList.add('is-swap');
    flash(root, '#4cc3f5');
    evTimers.push(window.setTimeout(() => {
      a.classList.remove('is-swap'); b.classList.remove('is-swap');
      if (over) return;
      const mark = document.createComment('');
      a.replaceWith(mark); b.replaceWith(a); mark.replaceWith(b);
    }, 800));
  }, between(9, 13) * 1000));
  const end = (): void => {
    if (over) return;
    over = true;
    window.clearInterval(timer);
    evTimers.forEach((x) => window.clearTimeout(x));
    root.querySelectorAll<HTMLButtonElement>('.plant').forEach((p) => (p.disabled = true));
    cb.onDone(picked / ripeTotal);
  };
  const timer = window.setInterval(() => {
    left = Math.max(0, left - 0.1);
    bar.style.width = `${(left / HARVEST_SECONDS) * 100}%`;
    if (left <= 0) end();
  }, 100);
  root.querySelectorAll<HTMLButtonElement>('.plant').forEach((p) => p.addEventListener('click', () => {
    if (over) return;
    if (p.dataset.ripe === 'true') {
      picked++;
      if (p.dataset.gold) { left = Math.min(HARVEST_SECONDS, left + 3); p.classList.remove('is-gold'); alertFx(root, '+3', '#5ad6b2'); }
      p.classList.add('is-picked');
      p.disabled = true;
      basket[picked - 1]?.classList.add('is-full'); // la canasta se va llenando
      cb.onProgress(picked / ripeTotal);
      if (picked === ripeTotal) end();
    } else {
      left = Math.max(0, left - HARVEST_PENALTY);
      p.classList.remove('is-wrong');
      void p.offsetWidth;
      p.classList.add('is-wrong');
    }
  }));
  cb.onProgress(0);
  return { destroy() { over = true; window.clearInterval(timer); evTimers.forEach((x) => window.clearTimeout(x)); } };
}

// ------------------------------------------------------------------ curarse: tratar cada herida manteniendo apretado hasta que se cierre
const HEAL_SPOTS = [
  { x: 190, y: 92, label: 'cabeza' }, { x: 190, y: 232, label: 'pecho' }, { x: 84, y: 250, label: 'brazo' }, { x: 148, y: 410, label: 'pierna' },
];
const HEAL_HOLD_MS = 900;

/** Un michi astronauta en la camilla con puntos rojos que laten: se mantiene apretado cada uno hasta que el anillo se llena. Sin texto. */
export function mountHealGame(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
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
    ${spots.map((p, i) => `<button class="heal__spot" data-spot="${i}" style="left:${p.x - 34}px;top:${p.y - 34}px" aria-label="${t('Herida en la {part}', { part: t(p.label) })}"><span class="heal__ring"></span><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#f5f5f2" stroke-width="4" stroke-linecap="round"/></svg></button>`).join('')}
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
        cb.onProgress(healed / buttons.length);
        if (healed === buttons.length) {
          over = true;
          cb.onDone(Math.min(1, Math.max(0, 1 - (performance.now() - startedAt - 4000) / 8000))); // más rápido, más calidad
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
  return { destroy() { over = true; holds.forEach((h) => cancelAnimationFrame(h.raf)); holds.clear(); } };
}

// ------------------------------------------------------------------ pedalear: seguir el ritmo con los dos pedales
const PEDAL_BEATS = 14;
const PEDAL_GAP = 640;      // ms entre notas
const PEDAL_WINDOW = 240;   // ms de margen para acertar
const PEDAL_LEAD = 1100;    // ms antes de la primera nota
const PEDAL_LINE = 330;     // altura (px) de la línea de pedaleo (las notas la cruzan al compás)
const PEDAL_SPEED = 0.24;   // px por ms que caen las notas
/** Hay que llenar MÁS que esta fracción de la barra para ganar energía. */
export const PEDAL_PASS = 0.75;

/**
 * Bicicleta de energía (sin texto): caen notas por dos carriles, izquierdo y derecho; hay que tocar el pedal del mismo lado cuando
 * llegan a la línea. Con ratón o dedo (los dos botones grandes) o con las flechas izquierda y derecha. Calidad = notas acertadas.
 */
export function mountPedal(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  // ritmo distinto cada vez: lados al azar (sin más de 2 iguales seguidos), pausas desiguales que se acortan hacia el final y, a veces, dos pedales a la vez
  const score: Array<{ side: 'L' | 'R'; t: number }> = [];
  let clock = PEDAL_LEAD;
  let run = 0;
  let lastSide: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';
  const burstAt = 4 + Math.floor(Math.random() * (PEDAL_BEATS - 10)); // ráfaga: 4 notas seguidas algo más juntas
  while (score.length < PEDAL_BEATS) {
    if (score.length >= 3 && score.length <= PEDAL_BEATS - 2 && Math.random() < 0.16) {
      score.push({ side: 'L', t: clock }, { side: 'R', t: clock });
    } else {
      let side: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';
      if (side === lastSide && run >= 2) side = side === 'L' ? 'R' : 'L';
      run = side === lastSide ? run + 1 : 1;
      lastSide = side;
      score.push({ side, t: clock });
    }
    const inBurst = score.length > burstAt && score.length <= burstAt + 4;
    clock += PEDAL_GAP * (inBurst ? 0.78 : [0.75, 1, 1, 1.3][Math.floor(Math.random() * 4)]) * (1 - 0.25 * (score.length / PEDAL_BEATS));
  }
  root.innerHTML = `<div class="pedal" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="pedal__wheel" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="pedal__lane pedal__lane--l"></div><div class="pedal__lane pedal__lane--r"></div>
    <div class="pedal__line" style="top:${PEDAL_LINE}px"></div>
    <div class="pedal__combo" data-combo aria-hidden="true"></div>
    <div class="pedal__meter" aria-hidden="true"><i data-meter></i><b class="pedal__goal" style="left:${PEDAL_PASS * 100}%"></b></div>
    <button class="pedal__btn pedal__btn--l" data-side="L" aria-label="${t('Pedal izquierdo')}">◀</button>
    <button class="pedal__btn pedal__btn--r" data-side="R" aria-label="${t('Pedal derecho')}">▶</button></div>`;
  const wheel = root.querySelector<HTMLElement>('.pedal__wheel')!;
  const meter = root.querySelector<HTMLElement>('[data-meter]')!;
  const lanes = { L: root.querySelector<HTMLElement>('.pedal__lane--l')!, R: root.querySelector<HTMLElement>('.pedal__lane--r')! };
  const notes = score.map(({ side, t }) => {
    const el = document.createElement('i');
    el.className = `pedal__note pedal__note--${side.toLowerCase()}`;
    el.textContent = side === 'L' ? '◀' : '▶';
    lanes[side].append(el);
    return { side, t, el, judged: false };
  });
  const t0 = performance.now();
  const combo = root.querySelector<HTMLElement>('[data-combo]')!;
  const evTimers: number[] = [];
  // aviso de la ráfaga ~1 s antes de que lleguen las notas juntas; la rueda brilla mientras dura
  const burstT = score[Math.min(score.length - 1, burstAt + 1)].t;
  evTimers.push(window.setTimeout(() => { alertFx(root, '⚡', '#ffcb47'); root.firstElementChild?.classList.add('is-burst'); }, Math.max(0, burstT - 1100)));
  evTimers.push(window.setTimeout(() => root.firstElementChild?.classList.remove('is-burst'), burstT + 2600));
  let streak = 0;
  let hits = 0;
  let judged = 0;
  let over = false;
  let raf = 0;
  const settle = (n: (typeof notes)[number], hit: boolean): void => {
    n.judged = true;
    judged++;
    n.el.classList.add(hit ? 'is-hit' : 'is-miss');
    if (hit) hits++;
    streak = hit ? streak + 1 : 0;
    if (hit && streak % 5 === 0) { combo.textContent = `🔥${streak}`; combo.classList.remove('is-on'); void combo.offsetWidth; combo.classList.add('is-on'); }
    meter.style.width = `${(hits / PEDAL_BEATS) * 100}%`;
    meter.classList.toggle('is-pass', hits / PEDAL_BEATS > PEDAL_PASS);
    wheel.style.setProperty('--spin', `${Math.max(0.25, 1.6 - (hits / PEDAL_BEATS) * 1.35)}s`);
    cb.onProgress(hits / PEDAL_BEATS);
    if (judged === PEDAL_BEATS && !over) {
      over = true;
      cancelAnimationFrame(raf);
      evTimers.forEach((x) => window.clearTimeout(x));
      window.setTimeout(() => cb.onDone(hits / PEDAL_BEATS), 250);
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
    nudge(dx) { if (dx !== 0) press(dx < 0 ? 'L' : 'R'); },
    destroy() { over = true; cancelAnimationFrame(raf); evTimers.forEach((x) => window.clearTimeout(x)); },
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
    choices.innerHTML = shuffle([right, other]).map((c) => `<button class="msg__choice" data-c="${c}" style="--c:${MSG_SYMBOLS[c].color}" aria-label="${t('Símbolo')}">${MSG_SYMBOLS[c].shape}</button>`).join('');
    choices.querySelectorAll<HTMLButtonElement>('.msg__choice').forEach((b) => b.addEventListener('click', () => {
      if (Number(b.dataset.c) !== right) {
        wrongs++;
        b.classList.remove('is-wrong');
        void b.offsetWidth;
        b.classList.add('is-wrong');
        return;
      }
      const s = slots[step];
      s.classList.remove('is-noise', 'is-active');
      s.style.setProperty('--c', MSG_SYMBOLS[right].color);
      s.textContent = MSG_SYMBOLS[right].shape;
      step++;
      cb.onProgress(step / bad.length);
      if (step === bad.length) {
        choices.innerHTML = '';
        cb.onDone(Math.max(0.2, 1 - wrongs * 0.3));
      } else showChoices();
    }));
  };
  showChoices();
  cb.onProgress(0);
  return { destroy() { /* nada que limpiar */ } };
}

// ------------------------------------------------------------------ biofirmas: emparejar los picos del espectro con su huella
const BIO_KINDS = {
  water: { color: '#4cc3f5', icon: '<path d="M32 8 C44 24 50 34 50 44 A18 18 0 0 1 14 44 C14 34 20 24 32 8Z" fill="#4cc3f5" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>' },
  mineral: { color: '#ffcb47', icon: '<path d="M32 8 L52 26 L42 54 L22 54 L12 26Z" fill="#ffcb47" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/><path d="M12 26 H52 M32 8 L22 26 L32 54 L42 26Z" fill="none" stroke="#0e0b33" stroke-width="3"/>' },
  organic: { color: '#7ed957', icon: '<path d="M12 52 C12 24 28 10 54 10 C54 38 40 54 12 52Z" fill="#7ed957" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/><path d="M14 50 C26 38 36 28 48 16" stroke="#0e0b33" stroke-width="3" fill="none"/>' },
  noise: { color: '#9a98c8', icon: '' },
} as const;
type BioKind = keyof typeof BIO_KINDS;

/**
 * Taladro de hielo (sin texto): el espectrómetro muestra picos; hay que emparejar cada uno con su huella (agua, mineral, orgánico).
 * Un pico es solo ruido y no corresponde a nada: emparejarlo es sobreinterpretar. Los orgánicos solos no prueban vida: se necesitan varias pruebas.
 * Calidad = 1 − errores.
 */
export function mountBiosignature(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  const peaks = shuffle<BioKind>(['water', 'mineral', 'organic', 'noise']);
  const cards = shuffle<BioKind>(['water', 'mineral', 'organic']);
  const heights = [150, 220, 120, 190];
  root.innerHTML = `<div class="bio" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <svg class="bio__spectrum" viewBox="0 0 ${WIRE_W} 250" aria-hidden="true"><path d="M20 230 H360" stroke="#c4c2e0" stroke-width="3"/>
      ${peaks.map((_, i) => `<path d="M${40 + i * 84} 230 Q${58 + i * 84} ${230 - heights[i] * 1.4} ${76 + i * 84} 230" fill="none" stroke="#5ad6b2" stroke-width="5" stroke-linecap="round"/>`).join('')}</svg>
    <div class="bio__peaks">${peaks.map((k, i) => `<button class="bio__peak" data-peak="${i}" style="left:${40 + i * 84 - 6}px;top:${210 - heights[i] * 0.7}px;--c:${BIO_KINDS[k].color}" aria-label="${t('Pico del espectro')}"></button>`).join('')}</div>
    <div class="bio__cards">${cards.map((k, i) => `<button class="bio__card" data-card="${i}" style="--c:${BIO_KINDS[k].color}" aria-label="${t('Huella')}"><svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">${BIO_KINDS[k].icon}</svg></button>`).join('')}</div></div>`;
  const peakEls = [...root.querySelectorAll<HTMLButtonElement>('[data-peak]')];
  const cardEls = [...root.querySelectorAll<HTMLButtonElement>('[data-card]')];
  let selected: number | null = null;
  let matched = 0;
  let errors = 0;
  const select = (i: number | null): void => {
    selected = i;
    peakEls.forEach((p, k) => p.setAttribute('aria-pressed', String(k === i)));
  };
  peakEls.forEach((p, i) => p.addEventListener('click', () => { if (!p.disabled) select(i); }));
  cardEls.forEach((c, j) => c.addEventListener('click', () => {
    if (selected === null || c.disabled) return;
    const peak = peakEls[selected];
    if (peaks[selected] === cards[j]) {
      peak.disabled = true;
      peak.classList.add('is-done');
      c.disabled = true;
      c.classList.add('is-done');
      matched++;
      cb.onProgress(matched / cards.length);
      if (matched === cards.length) cb.onDone(Math.max(0.2, 1 - errors * 0.25));
    } else {
      errors++; // incluye emparejar el pico de ruido: sobreinterpretar
      c.classList.remove('is-wrong');
      void c.offsetWidth;
      c.classList.add('is-wrong');
    }
    select(null);
  }));
  cb.onProgress(0);
  return { destroy() { /* nada que limpiar */ } };
}

// ------------------------------------------------------------------ cultivo de algas: mantener luz, nutrientes y temperatura en su franja verde
const ALGAE_SECONDS = 15;
const ALGAE_NEEDED = 0.7;     // fracción del tiempo en rango que da el puntaje completo
const ALGAE_HEAT_FROM_LIGHT = 0.3; // la luz calienta el tanque: subir la luz obliga a compensar la temperatura
const ALGAE_GAUGES = [
  { label: 'Luz', color: '#ffcb47', icon: '<circle cx="24" cy="24" r="8" fill="#ffcb47" stroke="#0e0b33" stroke-width="3"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4" stroke="#0e0b33" stroke-width="3" stroke-linecap="round"/>' },
  { label: 'Nutrientes', color: '#4cc3f5', icon: '<path d="M24 6 C33 17 38 24 38 31 A14 14 0 0 1 10 31 C10 24 15 17 24 6Z" fill="#4cc3f5" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/>' },
  { label: 'Temperatura', color: '#ff7a59', icon: '<rect x="19" y="6" width="10" height="26" rx="5" fill="#f5f5f2" stroke="#0e0b33" stroke-width="3"/><circle cx="24" cy="35" r="8" fill="#ff7a59" stroke="#0e0b33" stroke-width="3"/><rect x="22.5" y="18" width="3" height="16" fill="#ff7a59"/>' },
] as const;

/**
 * Cultivo de algas (sin texto): tres indicadores verticales se desvían solos; mantener apretado el de cada columna lo sube, soltarlo lo deja caer.
 * Hay que tener las tres agujas dentro de su franja verde; la luz calienta el tanque, así que subirla obliga a compensar la temperatura.
 * Puntaje = fracción del tiempo con las tres en rango.
 */
export function mountAlgae(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  const band = ALGAE_GAUGES.map(() => ({ center: 0.35 + Math.random() * 0.3, half: 0.12 }));
  const phase = ALGAE_GAUGES.map(() => Math.random() * 6.28);
  const pos = ALGAE_GAUGES.map(() => 0.5);
  const held = ALGAE_GAUGES.map(() => false);
  root.innerHTML = `<div class="algae" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="algae__time" role="progressbar" aria-label="${t('Tiempo')}" aria-valuemin="0" aria-valuemax="${ALGAE_SECONDS}"><i data-time></i></div>
    <svg class="algae__tank" viewBox="0 0 ${WIRE_W} 190" aria-hidden="true">
      <rect x="70" y="20" width="240" height="150" rx="26" fill="#bfe6ff" fill-opacity=".25" stroke="#0e0b33" stroke-width="5"/>
      <path d="M78 70 Q130 56 190 70 T302 70 V150 Q302 162 290 162 H90 Q78 162 78 150Z" fill="#2f8f3a" fill-opacity=".85"/>
      <circle cx="120" cy="110" r="7" fill="#7ed957"/><circle cx="210" cy="132" r="9" fill="#7ed957"/><circle cx="260" cy="96" r="6" fill="#5ad6b2"/><circle cx="160" cy="145" r="5" fill="#5ad6b2"/>
      <circle cx="105" cy="84" r="3.5" fill="#fff" opacity=".8"/><circle cx="240" cy="116" r="3" fill="#fff" opacity=".8"/><circle cx="182" cy="98" r="3" fill="#fff" opacity=".8"/>
      <rect x="120" y="4" width="140" height="14" rx="7" fill="#ee5fd6" stroke="#0e0b33" stroke-width="3"/></svg>
    ${ALGAE_GAUGES.map((g, i) => `<button class="algae__gauge" data-gauge="${i}" style="left:${28 + i * 112}px;--c:${g.color}" aria-label="${t(g.label)}">
      <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">${g.icon}</svg>
      <span class="algae__track"><i class="algae__band" style="bottom:${(band[i].center - band[i].half) * 100}%;height:${band[i].half * 200}%"></i><i class="algae__needle" data-needle></i></span></button>`).join('')}</div>`;
  const bar = root.querySelector<HTMLElement>('[data-time]')!;
  const gauges = [...root.querySelectorAll<HTMLButtonElement>('[data-gauge]')];
  const needles = gauges.map((g) => g.querySelector<HTMLElement>('[data-needle]')!);
  let elapsed = 0;
  let inRange = 0;
  // Evento: a los 5–9 s y de nuevo a los 14–17 s un medidor al azar se sacude y salta (hay que corregirlo)
  const evTimers: number[] = [];
  const jolt = (): void => {
    const i = Math.floor(Math.random() * ALGAE_GAUGES.length);
    pos[i] = Math.min(1, Math.max(0, pos[i] + (pos[i] > 0.5 ? -0.28 : 0.28)));
    gauges[i].classList.add('is-alert');
    alertFx(root, '❗', '#ff7a59');
    window.setTimeout(() => gauges[i].classList.remove('is-alert'), 1000);
  };
  evTimers.push(window.setTimeout(jolt, between(5, 9) * 1000), window.setTimeout(jolt, between(14, 17) * 1000));
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
    gauges.forEach((g, i) => g.classList.toggle('is-ok', ok[i]));
    if (ok.every(Boolean)) inRange += dt;
    bar.style.width = `${Math.max(0, 1 - elapsed / ALGAE_SECONDS) * 100}%`;
    cb.onProgress(Math.min(1, elapsed / ALGAE_SECONDS));
    if (elapsed >= ALGAE_SECONDS) {
      cb.onDone(Math.min(1, inRange / (ALGAE_SECONDS * ALGAE_NEEDED)));
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const set = (i: number, on: boolean): void => { held[i] = on; };
  gauges.forEach((g, i) => {
    g.addEventListener('pointerdown', (ev) => { g.setPointerCapture(ev.pointerId); set(i, true); ev.preventDefault(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => g.addEventListener(n, () => set(i, false)));
    g.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { set(i, true); ev.preventDefault(); } });
    g.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') set(i, false); });
  });
  raf = requestAnimationFrame(tick);
  cb.onProgress(0);
  return { destroy() { cancelAnimationFrame(raf); evTimers.forEach((x) => window.clearTimeout(x)); } };
}
