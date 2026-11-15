import { mountDustGame } from './dustGame';
import type { MiniCallbacks, MiniGameHandle } from './miniGames';
import { t } from './i18n';

/**
 * Panel de pruebas (Energía del Sol), sin texto, en dos pasos:
 * 1) se limpia el polvo con el cepillo (el mismo de los paneles de la estación);
 * 2) se orienta el panel hacia el Sol (arrastrando, con las flechas o con los botones) hasta que el medidor llegue arriba.
 * Puntaje = la mejor potencia que se alcanzó (cos del ángulo con el Sol).
 */
const W = 380;
const H = 500;
const PIVOT = { x: 190, y: 400 };
const SUN_R = 230;
const AIM_SECONDS = 12;
const HOLD_AT = 0.97;       // potencia mínima para dar por alineado el panel
const HOLD_SECONDS = 0.7;   // cuánto hay que mantenerla
const KEY_DEG = 6;
const ROTATE_DEG_PER_SEC = 70;

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const PANEL_SVG = `<svg viewBox="0 0 160 110" width="160" height="110" aria-hidden="true">
  <rect x="8" y="8" width="144" height="70" rx="8" fill="#2a3f8f" stroke="#0e0b33" stroke-width="5"/>
  <path d="M56 8v70M104 8v70M8 31v24M8 55h144M8 31h144" stroke="#4cc3f5" stroke-width="2.5" fill="none"/>
  <rect x="68" y="78" width="24" height="26" rx="5" fill="#c4c2e0" stroke="#0e0b33" stroke-width="4"/></svg>`;
const SUN_SVG = `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="14" fill="#ffcb47" stroke="#0e0b33" stroke-width="4"/>
  <path d="M32 6v8M32 50v8M6 32h8M50 32h8M14 14l6 6M44 44l6 6M14 50l6-6M44 20l6-6" stroke="#ffcb47" stroke-width="5" stroke-linecap="round"/></svg>`;

/** `time`: multiplica el tiempo para apuntar al Sol (más difícil, menos tiempo). */
export function mountTestPanel(root: HTMLElement, cb: MiniCallbacks, time = 1): MiniGameHandle {
  const aimSeconds = AIM_SECONDS * time;
  let handle: MiniGameHandle = { destroy() { /* se reemplaza al montar el primer paso */ } };
  let destroyed = false;
  let timer = 0;

  const startAim = (): void => {
    if (destroyed) return;
    const sunAngle = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 22);
    const sx = PIVOT.x + SUN_R * Math.sin((sunAngle * Math.PI) / 180);
    const sy = PIVOT.y - SUN_R * Math.cos((sunAngle * Math.PI) / 180);
    root.innerHTML = `<div class="aim" style="width:${W}px;height:${H}px">
      <div class="aim__time" role="progressbar" aria-label="${t('mini.time')}" aria-valuemin="0" aria-valuemax="${aimSeconds}"><i data-time></i></div>
      <div class="aim__sun" style="left:${sx - 32}px;top:${sy - 32}px">${SUN_SVG}</div>
      <div class="aim__panel" data-panel style="left:${PIVOT.x - 80}px;top:${PIVOT.y - 100}px">${PANEL_SVG}</div>
      <div class="aim__meter" role="meter" aria-label="${t('mini.power')}" aria-valuemin="0" aria-valuemax="100"><i data-power></i></div>
      <button class="aim__btn aim__btn--l" data-dir="-1" aria-label="${t('mini.turnLeft')}"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="#0e0b33" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="aim__btn aim__btn--r" data-dir="1" aria-label="${t('mini.turnRight')}"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="#0e0b33" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
    const stage = root.firstElementChild as HTMLElement;
    const panel = stage.querySelector<HTMLElement>('[data-panel]')!;
    const power = stage.querySelector<HTMLElement>('[data-power]')!;
    const time = stage.querySelector<HTMLElement>('[data-time]')!;
    let angle = 0;
    let dir = 0;
    let best = 0;
    let held = 0;
    let elapsed = 0;
    let over = false;
    let raf = 0;
    let last = performance.now();
    const render = (): number => {
      panel.style.transform = `rotate(${angle}deg)`;
      panel.style.transformOrigin = '80px 100px';
      const p = Math.max(0, Math.cos(((angle - sunAngle) * Math.PI) / 180));
      power.style.height = `${p * 100}%`;
      stage.classList.toggle('is-aligned', p >= HOLD_AT);
      best = Math.max(best, p);
      return p;
    };
    const finish = (): void => {
      if (over) return;
      over = true;
      cancelAnimationFrame(raf);
      cb.onDone(best);
    };
    const tick = (now: number): void => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsed += dt;
      angle = clamp(angle + dir * ROTATE_DEG_PER_SEC * dt, -80, 80);
      const p = render();
      held = p >= HOLD_AT ? held + dt : 0;
      time.style.width = `${Math.max(0, 1 - elapsed / aimSeconds) * 100}%`;
      cb.onProgress(0.5 + 0.5 * best);
      if (held >= HOLD_SECONDS || elapsed >= aimSeconds) return finish();
      raf = requestAnimationFrame(tick);
    };
    stage.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((b) => {
      const d = Number(b.dataset.dir);
      b.addEventListener('pointerdown', (ev) => { b.setPointerCapture(ev.pointerId); dir = d; ev.preventDefault(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, () => { if (dir === d) dir = 0; }));
      b.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { dir = d; ev.preventDefault(); } });
      b.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') dir = 0; });
    });
    // arrastrar: el panel apunta hacia donde está el puntero
    const aimAt = (ev: PointerEvent): void => {
      const r = stage.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * W - PIVOT.x;
      const y = PIVOT.y - ((ev.clientY - r.top) / r.height) * H;
      angle = clamp((Math.atan2(x, Math.max(1, y)) * 180) / Math.PI, -80, 80);
    };
    stage.addEventListener('pointerdown', (ev) => { if ((ev.target as HTMLElement).closest('[data-dir]')) return; aimAt(ev); stage.setPointerCapture(ev.pointerId); });
    stage.addEventListener('pointermove', (ev) => { if (ev.buttons) aimAt(ev); });
    handle = {
      nudge(dx) { angle = clamp(angle + dx * KEY_DEG, -80, 80); },
      destroy() { over = true; cancelAnimationFrame(raf); },
    };
    render();
    raf = requestAnimationFrame((t) => { last = t; tick(t); });
  };

  handle = mountDustGame(root, {
    dust: 0.8,
    onProgress: (f) => cb.onProgress(0.5 * f),
    onDone: () => { timer = window.setTimeout(() => { handle.destroy(); startAim(); }, 450); },
  });
  return {
    nudge: (dx, dy) => handle.nudge?.(dx, dy),
    destroy() { destroyed = true; window.clearTimeout(timer); handle.destroy(); },
  };
}
