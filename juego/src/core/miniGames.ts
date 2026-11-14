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
    <svg class="wires__lines" viewBox="0 0 ${WIRE_W} ${WIRE_H}" aria-hidden="true"></svg>
    <span class="wires__label wires__label--l">Cables</span><span class="wires__label wires__label--r">Antena</span>
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
    <p class="harvest__hint" data-hint>Toca las plantas con frutos rojos y brillo. Las verdes todavía no.</p>
    <button class="mn-btn mn-btn--sm harvest__finish" data-finish>Listo</button></div>`;
  const bar = root.querySelector<HTMLElement>('[data-time]')!;
  const hint = root.querySelector<HTMLElement>('[data-hint]')!;
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
      cb.onProgress(picked / ripeTotal);
      if (picked === ripeTotal) end();
    } else {
      left = Math.max(0, left - HARVEST_PENALTY);
      hint.textContent = `¡Esa aún está verde! Pierdes ${HARVEST_PENALTY} segundos.`;
      p.classList.remove('is-wrong');
      void p.offsetWidth;
      p.classList.add('is-wrong');
    }
  }));
  root.querySelector('[data-finish]')!.addEventListener('click', end);
  cb.onProgress(0);
  return { destroy() { over = true; window.clearInterval(timer); } };
}
