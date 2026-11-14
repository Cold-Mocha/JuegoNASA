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
  const plug = (i: number): string => `<button class="wire wire--plug" data-plug="${i}" style="left:24px;top:${WIRE_ROWS[i]}px;--wire:${WIRES[i].color}" aria-label="Cable ${WIRES[i].name}"><span aria-hidden="true">${WIRES[i].shape}</span></button>`;
  const socket = (slot: number): string => `<button class="wire wire--socket" data-socket="${order[slot]}" style="right:24px;top:${WIRE_ROWS[slot]}px;--wire:${WIRES[order[slot]].color}" aria-label="Enchufe ${WIRES[order[slot]].name}"><span aria-hidden="true">${WIRES[order[slot]].shape}</span></button>`;
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

const plantSvg = (ripe: boolean): string => {
  const fruit = ripe ? '#ff6b7a' : '#7ed957';
  return `<svg viewBox="0 0 64 72" width="64" height="72" aria-hidden="true">
    <path d="M12 52 H52 L47 68 H17Z" fill="#ff7a59" stroke="#0e0b33" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M32 52 V22" stroke="#2f8f3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 40 q-16 -2 -18 -16 q16 0 18 16Z M32 34 q16 -2 18 -16 q-16 0 -18 16Z" fill="#5ad6b2" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="22" cy="46" r="7" fill="${fruit}" stroke="#0e0b33" stroke-width="3"/><circle cx="42" cy="44" r="7" fill="${fruit}" stroke="#0e0b33" stroke-width="3"/><circle cx="32" cy="20" r="7" fill="${fruit}" stroke="#0e0b33" stroke-width="3"/>
    ${ripe ? '<path d="M50 6 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2Z" fill="#ffcb47" stroke="#0e0b33" stroke-width="2"/>' : ''}
  </svg>`;
};

export function mountHarvestGame(root: HTMLElement, cb: MiniCallbacks): MiniGameHandle {
  const cells = shuffle([...Array(7).fill(true), ...Array(5).fill(false)] as boolean[]);
  const ripeTotal = cells.filter(Boolean).length;
  root.innerHTML = `<div class="harvest" style="width:${WIRE_W}px;height:${WIRE_H}px">
    <div class="harvest__time" role="progressbar" aria-label="Tiempo" aria-valuemin="0" aria-valuemax="${HARVEST_SECONDS}"><i data-time></i></div>
    <div class="harvest__grid">${cells.map((ripe, i) => `<button class="plant" data-ripe="${ripe}" data-i="${i}" aria-label="${ripe ? 'Planta madura' : 'Planta verde'}">${plantSvg(ripe)}</button>`).join('')}</div>
    <div class="harvest__basket" aria-hidden="true">${Array.from({ length: ripeTotal }, () => '<i></i>').join('')}</div></div>`;
  const bar = root.querySelector<HTMLElement>('[data-time]')!;
  const basket = [...root.querySelectorAll<HTMLElement>('.harvest__basket i')];
  let left = HARVEST_SECONDS;
  let picked = 0;
  let over = false;
  const end = (): void => {
    if (over) return;
    over = true;
    window.clearInterval(timer);
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
  return { destroy() { over = true; window.clearInterval(timer); } };
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
    ${spots.map((p, i) => `<button class="heal__spot" data-spot="${i}" style="left:${p.x - 34}px;top:${p.y - 34}px" aria-label="Herida en la ${p.label}"><span class="heal__ring"></span><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#f5f5f2" stroke-width="4" stroke-linecap="round"/></svg></button>`).join('')}
  </div>`;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.heal__spot')];
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
          cb.onDone();
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
