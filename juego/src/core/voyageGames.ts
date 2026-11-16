import { ADAPTER_STEPS, BREAKERS, SHIELD_NEED, adapterScore, dialConfig, dialSignal, powerScore, reserve, type AdapterStep, type Breaker } from '../sim/voyage';
import { esc } from './ui';
import type { MiniGameHandle } from './miniGames';

type Lang = 'es' | 'en';
const W = 380;
const H = 500;
const INK = '#0e0b33';
const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
const frame = (root: HTMLElement, label: string, inner: string): HTMLElement => {
  root.innerHTML = `<div class="vg" style="width:${W}px;height:${H}px" role="group" aria-label="${esc(label)}">${inner}</div>`;
  return root.querySelector<HTMLElement>('.vg')!;
};

// ------------------------------------------------------------------ escena 3: sintonizar la radio (ruido que baja al acercarse al canal)
export function mountRadioDial(root: HTMLElement, o: { antenna: number; hard: boolean; lang: Lang; calm?: boolean; onDone(score: number): void }): MiniGameHandle {
  const es = o.lang === 'es';
  const cfg = dialConfig(o.antenna, o.hard);
  const el = frame(root, es ? 'Sintoniza la radio' : 'Tune the radio',
    `<canvas width="${W}" height="${H}" style="display:block;border:4px solid ${INK};border-radius:14px;touch-action:none;cursor:ew-resize" data-c></canvas>`);
  const cv = el.querySelector<HTMLCanvasElement>('[data-c]')!;
  const c = cv.getContext('2d')!;
  let pos = 0.15, target = 0.62, t = 0, lock = 0, best = 0, over = false;
  const set = (x: number): void => { pos = clamp(x); };
  cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') set((e.clientX - cv.getBoundingClientRect().left) / cv.getBoundingClientRect().width); });
  cv.addEventListener('pointerdown', (e) => set((e.clientX - cv.getBoundingClientRect().left) / cv.getBoundingClientRect().width));
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') { set(pos - 0.02); e.preventDefault(); }
    if (e.key === 'ArrowRight') { set(pos + 0.02); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);
  let raf = 0, last = performance.now();
  const finish = (score: number): void => { if (over) return; over = true; setTimeout(() => o.onDone(score), 600); };
  const frameFn = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) {
      t += dt;
      target = clamp(0.5 + 0.35 * Math.sin(t * cfg.drift * 6) + 0.1 * Math.sin(t * 1.7), 0.08, 0.92);
      const sig = dialSignal(pos, target, cfg.tolerance);
      best = Math.max(best, sig);
      lock = sig >= 0.85 ? lock + dt : Math.max(0, lock - dt * 2);
      if (lock >= cfg.lockSeconds) finish(clamp(0.7 + 0.3 * (1 - t / cfg.seconds)));
      else if (t >= cfg.seconds) finish(clamp(0.15 + 0.35 * best));
    }
    const sig = dialSignal(pos, target, cfg.tolerance);
    c.fillStyle = '#0b0830'; c.fillRect(0, 0, W, H);
    // estática: más puntos cuanto menos señal
    const dots = Math.floor((o.calm ? 200 : 700) * (1 - sig) + 30);
    for (let i = 0; i < dots; i++) { c.fillStyle = `rgba(228,227,242,${0.15 + Math.random() * 0.5})`; c.fillRect(Math.random() * W, 90 + Math.random() * 240, 2, 2); }
    // onda
    c.strokeStyle = sig > 0.85 ? '#5ad6b2' : '#7fd4ff'; c.lineWidth = 3; c.beginPath();
    for (let x = 0; x <= W; x += 4) { const a = (1 - sig) * 55 + 6; const y = 210 + Math.sin(x * 0.05 + t * 8) * a * Math.sin(x / W * Math.PI); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    // dial
    c.fillStyle = '#1b1650'; c.fillRect(24, 380, W - 48, 26);
    c.fillStyle = 'rgba(90,214,178,0.25)'; c.fillRect(24 + (W - 48) * (target - cfg.tolerance), 380, (W - 48) * cfg.tolerance * 2, 26);
    c.fillStyle = '#ffcb47'; c.fillRect(24 + (W - 48) * pos - 4, 372, 8, 42);
    c.fillStyle = '#f5f5f2'; c.font = '700 14px Arial'; c.textAlign = 'center';
    c.fillText(es ? 'Arrastra o usa ← →: busca donde el ruido baja' : 'Drag or use ← →: find where the noise drops', W / 2, 36);
    c.fillText(`${Math.max(0, Math.ceil(cfg.seconds - t))} s`, W / 2, 64);
    c.fillStyle = '#1b1650'; c.fillRect(24, 440, W - 48, 14); c.fillStyle = sig > 0.85 ? '#5ad6b2' : '#7fd4ff'; c.fillRect(24, 440, (W - 48) * sig, 14);
    c.fillStyle = '#f5f5f2'; c.fillText(es ? 'Señal' : 'Signal', W / 2, 478);
    if (!over || true) raf = requestAnimationFrame(frameFn);
  };
  raf = requestAnimationFrame(frameFn);
  return { nudge: (dx) => set(pos + dx * 0.02), destroy() { over = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); } };
}

// ------------------------------------------------------------------ escena 4: el adaptador de CO₂ (recordar el procedimiento y repetirlo)
const ITEM: Record<AdapterStep, { es: string; en: string; glyph: string }> = {
  bolsa: { es: 'Bolsa', en: 'Bag', glyph: '◐' }, carton: { es: 'Cartón', en: 'Cardboard', glyph: '▣' }, manguera: { es: 'Manguera', en: 'Hose', glyph: '≋' },
  cinta: { es: 'Cinta', en: 'Tape', glyph: '◎' }, filtro: { es: 'Filtro', en: 'Filter', glyph: '▦' },
};
export function mountAdapter(root: HTMLElement, o: { hard: boolean; seed: number; lang: Lang; calm?: boolean; onDone(score: number): void }): MiniGameHandle {
  const es = o.lang === 'es';
  const order = [...ADAPTER_STEPS];
  const display = [...ADAPTER_STEPS].sort((a, b) => Math.sin(o.seed * 13.7 + a.length * 3.1 + a.charCodeAt(0)) - Math.sin(o.seed * 13.7 + b.length * 3.1 + b.charCodeAt(0)));
  const el = frame(root, es ? 'El adaptador de CO₂' : 'The CO₂ adapter', `
    <div class="vg__panel">
      <p class="vg__title">${es ? 'Torre dicta, tú repites' : 'Tower reads, you repeat'}</p>
      <ol class="vg__steps" data-steps>${order.map((s, i) => `<li data-step="${i}">${esc(ITEM[s][o.lang])}</li>`).join('')}</ol>
      <p class="vg__note" data-note></p>
      <div class="vg__bar" role="progressbar" aria-label="CO₂" aria-valuemin="0" aria-valuemax="100"><span data-co2></span></div>
      <div class="vg__items">${display.map((s) => `<button class="vg__item" data-item="${s}" aria-label="${esc(ITEM[s][o.lang])}"><b>${ITEM[s].glyph}</b>${esc(ITEM[s][o.lang])}</button>`).join('')}</div>
    </div>`);
  const stepsEl = el.querySelector<HTMLElement>('[data-steps]')!;
  const note = el.querySelector<HTMLElement>('[data-note]')!;
  const co2 = el.querySelector<HTMLElement>('[data-co2]')!;
  let idx = 0, errors = 0, level = 22, over = false, started = false;
  const hideAfter = o.hard ? 5000 : 0;
  note.textContent = o.hard ? (es ? 'Memoriza los 5 pasos…' : 'Memorize the 5 steps…') : (es ? 'Toca cada pieza en el orden dictado.' : 'Tap each piece in the dictated order.');
  const t1 = hideAfter ? window.setTimeout(() => { stepsEl.classList.add('is-hidden'); started = true; note.textContent = es ? '¡Léelo de vuelta!' : 'Read it back!'; }, hideAfter) : 0;
  if (!hideAfter) started = true;
  const tick = window.setInterval(() => { if (!over && started) { level = Math.min(100, level + (o.calm ? 0.25 : 0.6)); co2.style.width = `${level}%`; co2.parentElement!.setAttribute('aria-valuenow', String(Math.round(level))); } }, 250);
  co2.style.width = `${level}%`;
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-item]');
    if (!b || over || !started) return;
    if (b.dataset.item === order[idx]) {
      b.disabled = true; b.classList.add('is-ok'); stepsEl.querySelector(`[data-step="${idx}"]`)?.classList.add('is-done');
      level = Math.max(8, level - 14); co2.style.width = `${level}%`;
      idx++;
      if (idx >= order.length) { over = true; note.textContent = es ? 'El CO₂ está bajando.' : 'CO₂ is coming down.'; setTimeout(() => o.onDone(adapterScore(errors)), 800); }
    } else {
      errors++; level = Math.min(100, level + 12); co2.style.width = `${level}%`; b.classList.add('is-bad'); setTimeout(() => b.classList.remove('is-bad'), 350);
      note.textContent = es ? 'Ese no es el paso. Repite desde el procedimiento.' : 'That is not the step. Check the procedure.';
      stepsEl.classList.remove('is-hidden');
      if (o.hard) setTimeout(() => stepsEl.classList.add('is-hidden'), 1800);
    }
  });
  return { destroy() { over = true; clearInterval(tick); if (t1) clearTimeout(t1); } };
}

// ------------------------------------------------------------------ escena 5: presupuesto de energía
const BR_LABEL: Record<Breaker['id'], { es: string; en: string }> = {
  luces: { es: 'Luces', en: 'Lights' }, calefaccion: { es: 'Calefacción', en: 'Heating' }, laboratorio: { es: 'Laboratorio', en: 'Laboratory' },
  comunicaciones: { es: 'Comunicaciones', en: 'Communications' }, cultivo: { es: 'Cultivo', en: 'Crops' },
};
export function mountPowerBudget(root: HTMLElement, o: { energy: number; lang: Lang; onDone(score: number): void }): MiniGameHandle {
  const es = o.lang === 'es';
  const on = new Set<Breaker['id']>(BREAKERS.map((b) => b.id));
  const el = frame(root, es ? 'Presupuesto de energía' : 'Power budget', `
    <div class="vg__panel">
      <p class="vg__title">${es ? 'Apaga lo que no necesitas para volver' : 'Switch off what you do not need to get home'}</p>
      <div class="vg__reserve"><span class="vg__need" style="left:${(SHIELD_NEED / 100) * 100}%"></span><span data-res></span></div>
      <p class="vg__note" data-note></p>
      <div class="vg__items vg__items--col">${BREAKERS.map((b) => `<button class="vg__sw is-on" aria-pressed="true" data-sw="${b.id}"><span>${esc(BR_LABEL[b.id][o.lang])}</span><em>−${b.cost}</em></button>`).join('')}</div>
      <button class="mn-btn" data-ok>${es ? 'Confirmar' : 'Confirm'}</button>
    </div>`);
  const res = el.querySelector<HTMLElement>('[data-res]')!;
  const note = el.querySelector<HTMLElement>('[data-note]')!;
  let done = false;
  const render = (): void => {
    const r = reserve(o.energy, on);
    res.style.width = `${clamp(r / 100) * 100}%`;
    res.classList.toggle('is-low', r < SHIELD_NEED);
    note.textContent = es ? `Reserva ${r} · el escudo necesita ${SHIELD_NEED}` : `Reserve ${r} · the shield needs ${SHIELD_NEED}`;
  };
  render();
  el.addEventListener('click', (e) => {
    const sw = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sw]');
    if (sw && !done) {
      const id = sw.dataset.sw as Breaker['id'];
      if (on.has(id)) on.delete(id); else on.add(id);
      sw.classList.toggle('is-on', on.has(id)); sw.setAttribute('aria-pressed', String(on.has(id))); render();
    }
    if ((e.target as HTMLElement).closest('[data-ok]') && !done) { done = true; setTimeout(() => o.onDone(powerScore(o.energy, on)), 300); }
  });
  return { destroy() { done = true; } };
}
