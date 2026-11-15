/**
 * Las 4 fases jugables de la misión final «Casa» (sin texto). La lógica numérica vive en `sim/entry.ts`; aquí solo DOM y canvas.
 * Todas se juegan con ratón, dedo o flechas y terminan solas.
 */
import {
  BLACKOUT, BURN_TOLERANCE, CORRIDOR_HALF, GLIDE_SECONDS, INSPECT_GAME_SECONDS, REENTRY_SECONDS, bellyFacing, burnStep, corridorCenter,
  glideScore, glideStep, initialReentry, spinAngle, stepReentry,
} from '../sim/entry';
import type { MiniGameHandle } from './miniGames';
import { t as tr } from './i18n'; // `t` es el tiempo en varias fases de este archivo

export const CASA_W = 380;
export const CASA_H = 500;

export interface PhaseResult { score: number; unfound?: number; heatMax?: number; }
export type PhaseDone = (r: PhaseResult) => void;

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const SHIP = `<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"><path d="M60 8 C78 26 84 52 80 84 L92 108 L68 100 L60 112 L52 100 L28 108 L40 84 C36 52 42 26 60 8Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5" stroke-linejoin="round"/><path d="M42 84 L60 92 L78 84 L80 98 L60 106 L40 98Z" fill="#0e0b33"/><circle cx="60" cy="44" r="9" fill="#4cc3f5" stroke="#0e0b33" stroke-width="4"/></svg>`;

// ------------------------------------------------------------------ Fase 1: giro e inspección
/** La nave gira; cuando el vientre pasa frente a las ventanas, se tocan las losetas dañadas (brillan) para fotografiarlas. */
export function mountInspect(root: HTMLElement, damaged: number, cb: PhaseDone): MiniGameHandle {
  const total = 24;
  const cracks = new Set<number>();
  while (cracks.size < damaged) cracks.add(Math.floor(Math.random() * total));
  root.innerHTML = `<div class="casa-stage insp" style="width:${CASA_W}px;height:${CASA_H}px">
    <div class="insp__time"><i data-time></i></div>
    <div class="insp__ship" data-ship>${SHIP}</div>
    <div class="insp__window" data-window><div class="insp__belly">${Array.from({ length: total }, (_, i) =>
      `<button class="insp__tile ${cracks.has(i) ? 'is-crack' : ''}" data-i="${i}" aria-label="${tr('mini.tile')}"></button>`).join('')}</div></div>
    <div class="insp__flash" data-flash></div></div>`;
  const ship = root.querySelector<HTMLElement>('[data-ship]')!;
  const win = root.querySelector<HTMLElement>('[data-window]')!;
  const time = root.querySelector<HTMLElement>('[data-time]')!;
  const flash = root.querySelector<HTMLElement>('[data-flash]')!;
  const t0 = performance.now();
  let found = 0;
  let over = false;
  let raf = 0;
  const finish = (): void => {
    if (over) return;
    over = true;
    cancelAnimationFrame(raf);
    cb({ score: found / damaged, unfound: damaged - found });
  };
  root.querySelectorAll<HTMLButtonElement>('.insp__tile').forEach((tile) => tile.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (over || !bellyFacing(spinAngle((performance.now() - t0) / 1000))) return;
    if (tile.classList.contains('is-crack') && !tile.classList.contains('is-found')) {
      tile.classList.add('is-found');
      found++;
      flash.classList.remove('is-on');
      void flash.offsetWidth;
      flash.classList.add('is-on');
      if (found === damaged) window.setTimeout(finish, 500);
    }
  }));
  const frame = (): void => {
    const t = (performance.now() - t0) / 1000;
    const a = spinAngle(t);
    ship.style.transform = `rotate(${a}deg)`;
    win.classList.toggle('is-open', bellyFacing(a));
    time.style.width = `${Math.max(0, 1 - t / INSPECT_GAME_SECONDS) * 100}%`;
    if (t >= INSPECT_GAME_SECONDS) finish();
    else if (!over) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { destroy() { over = true; cancelAnimationFrame(raf); } };
}

// ------------------------------------------------------------------ Fase 2: quemada
/** Alinear la nave con la marca verde (que se mueve despacio) y mantener el motor hasta llenar el indicador. */
export function mountBurn(root: HTMLElement, cb: PhaseDone): MiniGameHandle {
  root.innerHTML = `<div class="casa-stage burn" style="width:${CASA_W}px;height:${CASA_H}px">
    <div class="burn__gauge" aria-hidden="true"><i data-gauge></i></div>
    <div class="burn__target" data-target></div>
    <div class="burn__ship" data-ship>${SHIP}<i class="burn__flame" data-flame></i></div></div>`;
  const stage = root.querySelector<HTMLElement>('.burn')!;
  const gaugeEl = root.querySelector<HTMLElement>('[data-gauge]')!;
  const target = root.querySelector<HTMLElement>('[data-target]')!;
  const ship = root.querySelector<HTMLElement>('[data-ship]')!;
  const flame = root.querySelector<HTMLElement>('[data-flame]')!;
  const t0 = performance.now();
  let last = t0;
  let x = 0.7;            // posición de la nave (−1..1)
  let gauge = 0;
  let alignedTime = 0;
  let over = false;
  let raf = 0;
  const SPAN = 140;
  const finish = (): void => {
    if (over) return;
    over = true;
    cancelAnimationFrame(raf);
    cb({ score: Math.min(1, alignedTime / 6) });
  };
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    const center = 0.5 * Math.sin(t * 0.9);
    const err = x - center;
    const aligned = Math.abs(err) <= BURN_TOLERANCE;
    if (aligned) alignedTime += dt;
    gauge = burnStep(gauge, err, dt);
    target.style.transform = `translateX(${center * SPAN}px)`;
    target.classList.toggle('is-on', aligned);
    ship.style.transform = `translateX(${x * SPAN}px)`;
    flame.style.opacity = String(aligned ? 1 : 0.25);
    gaugeEl.style.height = `${gauge * 100}%`;
    if (gauge >= 1 || t > 16) finish();
    else raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const move = (ev: PointerEvent): void => {
    const r = stage.getBoundingClientRect();
    x = clamp(((ev.clientX - r.left) / r.width - 0.5) * (CASA_W / SPAN), -1, 1);
  };
  stage.addEventListener('pointerdown', (ev) => { stage.setPointerCapture(ev.pointerId); move(ev); });
  stage.addEventListener('pointermove', (ev) => { if (ev.buttons || ev.pointerType === 'touch') move(ev); });
  return { nudge(dx) { x = clamp(x + dx * 0.08, -1, 1); }, destroy() { over = true; cancelAnimationFrame(raf); } };
}

// ------------------------------------------------------------------ Fase 3: corredor de reingreso
/** Mantener la nave dentro del corredor (una S) con el alabeo; el medidor de calor no debe llegar al rojo. Hay un tramo de apagón. */
export function mountReentry(root: HTMLElement, heatMult: number, cb: PhaseDone): MiniGameHandle {
  root.innerHTML = `<div class="casa-stage reentry" style="width:${CASA_W}px;height:${CASA_H}px">
    <canvas width="${CASA_W}" height="${CASA_H}" data-canvas></canvas>
    <div class="reentry__heat" aria-hidden="true"><i data-heat></i></div>
    <div class="reentry__static" data-static></div></div>`;
  const stage = root.querySelector<HTMLElement>('.reentry')!;
  const ctx = root.querySelector<HTMLCanvasElement>('[data-canvas]')!.getContext('2d')!;
  const heatEl = root.querySelector<HTMLElement>('[data-heat]')!;
  const staticEl = root.querySelector<HTMLElement>('[data-static]')!;
  let s = initialReentry();
  let roll = 0;
  let pointerX: number | null = null;
  let keyRoll = 0;
  let last = performance.now();
  let over = false;
  let heatMax = 0;
  let raf = 0;
  const NOW_Y = 410;
  const PX_PER_SEC = 38;
  const LANE = 150;
  const draw = (): void => {
    ctx.clearRect(0, 0, CASA_W, CASA_H);
    const grd = ctx.createLinearGradient(0, 0, 0, CASA_H);
    grd.addColorStop(0, '#0e0b33'); grd.addColorStop(1, `rgba(255,${Math.round(122 - Math.min(1, s.heat / 100) * 60)},89,.55)`);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, CASA_W, CASA_H);
    // corredor: más arriba es más futuro
    ctx.fillStyle = 'rgba(90,214,178,.28)';
    ctx.beginPath();
    for (let y = 0; y <= NOW_Y + 30; y += 6) ctx.lineTo(190 + corridorCenter(s.t + (NOW_Y - y) / PX_PER_SEC) * LANE - CORRIDOR_HALF * LANE, y);
    for (let y = NOW_Y + 30; y >= 0; y -= 6) ctx.lineTo(190 + corridorCenter(s.t + (NOW_Y - y) / PX_PER_SEC) * LANE + CORRIDOR_HALF * LANE, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5ad6b2'; ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let y = 0; y <= NOW_Y + 30; y += 6) {
        const cx = 190 + (corridorCenter(s.t + (NOW_Y - y) / PX_PER_SEC) + side * CORRIDOR_HALF) * LANE;
        if (y === 0) ctx.moveTo(cx, y); else ctx.lineTo(cx, y);
      }
      ctx.stroke();
    }
    // nave con estela de plasma
    const px = 190 + s.x * LANE;
    const inside = Math.abs(s.x - corridorCenter(s.t)) <= CORRIDOR_HALF;
    ctx.fillStyle = inside ? 'rgba(255,203,71,.75)' : 'rgba(255,107,122,.85)';
    ctx.beginPath(); ctx.ellipse(px, NOW_Y + 34, 18, 46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f5f2'; ctx.strokeStyle = '#0e0b33'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(px, NOW_Y - 26); ctx.lineTo(px + 18, NOW_Y + 16); ctx.lineTo(px, NOW_Y + 8); ctx.lineTo(px - 18, NOW_Y + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (pointerX !== null) roll = clamp((pointerX - s.x) * 6, -1, 1);
    else roll = keyRoll;
    keyRoll *= Math.max(0, 1 - dt * 6);
    s = stepReentry(s, roll, dt, heatMult);
    heatMax = Math.max(heatMax, s.heat);
    heatEl.style.height = `${Math.min(100, s.heat)}%`;
    heatEl.parentElement!.classList.toggle('is-hot', s.heat > 85);
    staticEl.style.opacity = s.t >= BLACKOUT[0] && s.t <= BLACKOUT[1] ? '0.55' : '0';
    draw();
    if (s.t >= REENTRY_SECONDS) {
      over = true;
      cb({ score: s.inside / REENTRY_SECONDS, heatMax });
    } else if (!over) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const toLane = (ev: PointerEvent): number => {
    const r = stage.getBoundingClientRect();
    return clamp((((ev.clientX - r.left) / r.width) * CASA_W - 190) / LANE, -1, 1);
  };
  stage.addEventListener('pointerdown', (ev) => { stage.setPointerCapture(ev.pointerId); pointerX = toLane(ev); });
  stage.addEventListener('pointermove', (ev) => { if (pointerX !== null) pointerX = toLane(ev); });
  const release = (): void => void (pointerX = null);
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  return { nudge(dx) { if (dx !== 0) keyRoll = dx; }, destroy() { over = true; cancelAnimationFrame(raf); } };
}

// ------------------------------------------------------------------ Fase 4: planeo
/** Sin motor: se controla la nariz para tocar la pista justo al final de la trayectoria. */
export function mountGlide(root: HTMLElement, cb: PhaseDone): MiniGameHandle {
  root.innerHTML = `<div class="casa-stage glide" style="width:${CASA_W}px;height:${CASA_H}px">
    <canvas width="${CASA_W}" height="${CASA_H}" data-canvas></canvas>
    <button class="glide__btn glide__btn--up" data-dir="-1" aria-label="${tr('mini.noseUp')}">▲</button>
    <button class="glide__btn glide__btn--down" data-dir="1" aria-label="${tr('mini.noseDown')}">▼</button></div>`;
  const ctx = root.querySelector<HTMLCanvasElement>('[data-canvas]')!.getContext('2d')!;
  let t = 0;
  let alt = 1;
  let pitch = 0;       // −1..1 (positivo = nariz arriba: desciende más lento)
  let hold = 0;        // botón mantenido
  let keyPitch = 0;
  let last = performance.now();
  let over = false;
  let raf = 0;
  const X0 = 30, X1 = 320, Y0 = 70, Y1 = 400;
  const draw = (): void => {
    ctx.clearRect(0, 0, CASA_W, CASA_H);
    const sky = ctx.createLinearGradient(0, 0, 0, Y1);
    sky.addColorStop(0, '#2a3f8f'); sky.addColorStop(1, '#9fd8f5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CASA_W, CASA_H);
    ctx.fillStyle = '#2e7d5b'; ctx.fillRect(0, Y1 + 18, CASA_W, CASA_H - Y1);
    ctx.fillStyle = '#3a3d43'; ctx.fillRect(X1 - 30, Y1 + 12, 70, 14);
    ctx.fillStyle = '#ffcb47'; for (let i = 0; i < 4; i++) ctx.fillRect(X1 - 24 + i * 18, Y1 + 17, 9, 3);
    // trayectoria ideal (puntos) y su punto guía
    ctx.fillStyle = 'rgba(245,245,242,.7)';
    for (let k = 0; k <= 20; k++) { const f = k / 20; ctx.beginPath(); ctx.arc(X0 + (X1 - X0) * f, Y0 + (Y1 - Y0) * f, 3, 0, Math.PI * 2); ctx.fill(); }
    const gf = Math.min(1, t / GLIDE_SECONDS);
    ctx.fillStyle = '#5ad6b2'; ctx.strokeStyle = '#0e0b33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(X0 + (X1 - X0) * gf, Y0 + (Y1 - Y0) * gf, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // nave
    const px = X0 + (X1 - X0) * gf;
    const py = Y0 + (1 - alt) * (Y1 - Y0);
    ctx.save(); ctx.translate(px, py); ctx.rotate(0.35 - pitch * 0.35);
    ctx.fillStyle = '#f5f5f2'; ctx.strokeStyle = '#0e0b33'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-10, -12); ctx.lineTo(-24, -4); ctx.lineTo(-24, 8); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0e0b33'; ctx.fillRect(-12, 6, 30, 5);
    ctx.restore();
  };
  const finish = (landedAt: number | null): void => {
    over = true;
    cancelAnimationFrame(raf);
    cb({ score: glideScore(alt, landedAt) });
  };
  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    pitch = clamp(-hold + -keyPitch, -1, 1);
    keyPitch *= Math.max(0, 1 - dt * 5);
    alt = glideStep(alt, pitch, dt);
    t += dt;
    draw();
    if (alt <= 0) { alt = 0; draw(); finish(t); } else if (t >= GLIDE_SECONDS) finish(null);
    else if (!over) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  root.querySelectorAll<HTMLButtonElement>('.glide__btn').forEach((b) => {
    b.addEventListener('pointerdown', (ev) => { hold = Number(b.dataset.dir); b.setPointerCapture(ev.pointerId); ev.preventDefault(); });
    b.addEventListener('pointerup', () => void (hold = 0));
    b.addEventListener('pointercancel', () => void (hold = 0));
  });
  return { nudge(_dx, dy) { if (dy !== 0) keyPitch = dy; }, destroy() { over = true; cancelAnimationFrame(raf); } };
}
