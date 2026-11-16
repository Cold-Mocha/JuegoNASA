/**
 * Reingreso (fase 3 de «Casa»): pantalla jugable. Solo DOM y canvas (sin Phaser), como `dustGame.ts` y `sealGame.ts`.
 * La física vive en `sim/entry.ts` (probada con Vitest); aquí solo se dibuja y se leen los controles.
 *
 * Controles: ← → inclinan el alabeo (mantener), ↓ o Espacio lo nivelan, o se arrastra el deslizador (táctil y ratón).
 * Explorador: el juego dibuja el alabeo aconsejado. Ingeniero: sin consejo, con números y unidades.
 * Con `calm`: sin sacudidas, sin partículas y sin ruido animado en el apagón.
 */
import { mountSolarFx } from './solarFx';
import {
  LIMITS, MAX_BANK_DEG, TAEM, TARGET_RANGE_KM, adviseBank, clampBank, corridorNow, createEntry, mach, scoreEntry, stepEntry,
  type EntryEnding, type EntryResult, type EntryState, type Level,
} from '../sim/reentry';
import { entryT, type EntryTextKey, type Lang } from '../data/reentryText';

const W = 720;
const H = 330;
const STEP = 1 / 20;
const KEY_RATE_DEG_PER_S = 60;
const COACH_GAP_S = 4;

// Colores del design system (tokens.css); el canvas no lee variables CSS.
const C = {
  space900: '#0e0b33', space700: '#241d6b', space600: '#322a8a', ink: '#f5f5f2', muted: '#c4c2e0', line: '#8a87c4',
  gold: '#ffcb47', teal: '#5ad6b2', cyan: '#4cc3f5', coral: '#ff7a59', danger: '#ff6b7a', magenta: '#ee5fd6', violet: '#9b7bff',
} as const;

export interface EntryGameOptions {
  level: Level;
  lang: Lang;
  seed?: number;
  /** Daños sin reparar de la inspección (fase 1) y tormenta geomagnética (0 a 0,5). */
  damage?: number;
  storm?: number;
  /** Si la inspección de la fase 1 se hizo (para la tercera estrella). */
  inspected?: boolean;
  calm?: boolean;
  /** Se llama en cada desenlace (éxito o fracaso), para estadísticas. */
  onAttempt?(result: EntryResult): void;
  /** Se llama cuando el jugador continúa tras un éxito. `result.quality` es el `score` 0..1 del hook de minijuegos. */
  onDone(result: EntryResult): void;
}

export interface EntryGame {
  /** Inclina el alabeo un paso (teclado alternativo desde la escena): -1 izquierda, 1 derecha, 0 nivelar. */
  nudge(dir: -1 | 0 | 1): void;
  destroy(): void;
}

const ENDING_KEYS: Record<Exclude<EntryEnding, 'running'>, { title: EntryTextKey; body: EntryTextKey }> = {
  success: { title: 'success', body: 'successBody' },
  burned: { title: 'burned', body: 'burnedBody' },
  skipped: { title: 'skipped', body: 'skippedBody' },
  overstress: { title: 'overstress', body: 'overstressBody' },
  long: { title: 'long', body: 'longBody' },
  short: { title: 'short', body: 'shortBody' },
  offcourse: { title: 'offcourse', body: 'offcourseBody' },
};

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const deg = (rad: number): number => (rad * 180) / Math.PI;

/** Monta el minijuego dentro de `root` (se vacía antes). */
export function mountEntryGame(root: HTMLElement, opts: EntryGameOptions): EntryGame {
  const t = (k: EntryTextKey): string => entryT(opts.lang, k);
  const explorer = opts.level === 'explorer';
  let attempt = 0;
  let s: EntryState = newState();
  let cmd = 0;
  let started = false;
  let finished = false;
  let acc = 0;
  let last = performance.now();
  let raf = 0;
  let lastCoach = -99;
  let coachKey: EntryTextKey | '' = '';
  let wasBlackout = false;
  let saidFinal = false;
  let holding: -1 | 0 | 1 = 0;
  const keys = { left: false, right: false };

  function newState(): EntryState {
    return createEntry({ level: opts.level, seed: (opts.seed ?? 1) + attempt * 7919, damage: opts.damage, storm: opts.storm });
  }

  root.innerHTML = `<div class="entry" data-entry>
    <p class="entry__goal body-sm">${esc(explorer ? t('goalExplorer') : t('goalEngineer'))}</p>
    <div class="entry__stage">
      <canvas class="entry__canvas" width="${W}" height="${H}" role="img" aria-label="${esc(t('title'))}"></canvas>
      <div class="entry__overlay" data-start>
        <button class="mn-btn" data-act="start">${esc(t('start'))}</button>
        <p class="entry__hint caption-mono">${esc(t('controls'))}</p>
      </div>
      <div class="entry__overlay entry__overlay--result" data-result hidden></div>
    </div>
    <p class="entry__comms body-sm" data-comms aria-live="polite">${esc(t('coachIntro'))}</p>
    <div class="entry__controls">
      <button class="mn-btn mn-btn--secondary mn-btn--icon" data-hold="-1" aria-label="${esc(t('bankLeft'))}">◀</button>
      <input class="entry__slider" type="range" min="${-MAX_BANK_DEG}" max="${MAX_BANK_DEG}" step="1" value="0" data-slider aria-label="${esc(t('bank'))}" />
      <button class="mn-btn mn-btn--secondary mn-btn--icon" data-hold="1" aria-label="${esc(t('bankRight'))}">▶</button>
      <button class="mn-btn mn-btn--secondary mn-btn--sm" data-act="level">${esc(t('level'))}</button>
    </div>
    <div class="entry__telemetry readout" data-telemetry></div>
    ${explorer ? '' : `<p class="entry__note caption-mono">${esc(t('engineerNote'))}</p>`}
    <p class="entry__note caption-mono">${esc(t('tag'))}</p>
  </div>`;

  const wrap = root.querySelector<HTMLElement>('[data-entry]')!;
  const canvas = wrap.querySelector<HTMLCanvasElement>('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const slider = wrap.querySelector<HTMLInputElement>('[data-slider]')!;
  const comms = wrap.querySelector<HTMLElement>('[data-comms]')!;
  const fx = mountSolarFx(wrap, !!opts.calm); // interferencia (estática breve) al entrar y salir del apagón de radio
  const telemetry = wrap.querySelector<HTMLElement>('[data-telemetry]')!;
  const startBox = wrap.querySelector<HTMLElement>('[data-start]')!;
  const resultBox = wrap.querySelector<HTMLElement>('[data-result]')!;
  const stars = makeStars();

  // ------------------------------------------------------------ entrada
  const bankText = (v: number): string =>
    `${t('bank')} ${Math.abs(Math.round(v))}° ${Math.abs(v) < 1 ? t('bankLevel') : v < 0 ? t('bankLeft') : t('bankRight')}`;
  const syncSlider = (): void => {
    slider.value = String(Math.round(cmd));
    slider.setAttribute('aria-valuetext', bankText(cmd));
  };
  const setCmd = (v: number): void => { cmd = clampBank(v); };

  slider.addEventListener('input', () => setCmd(Number(slider.value)));
  const onClick = (ev: Event): void => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'start') begin();
    else if (act === 'level') setCmd(0);
    else if (act === 'retry') { attempt += 1; restart(); }
    else if (act === 'next') opts.onDone(scoreEntry(s, { inspected: opts.inspected }));
  };
  const onHold = (ev: PointerEvent): void => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-hold]');
    if (!el) return;
    holding = Number(el.dataset.hold) as -1 | 1;
    el.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
  };
  const onRelease = (): void => { holding = 0; };
  const onKeyDown = (ev: KeyboardEvent): void => {
    const target = ev.target as HTMLElement | null;
    const inField = target?.tagName === 'BUTTON' || target?.tagName === 'INPUT';
    if (ev.key === 'ArrowLeft') keys.left = true;
    else if (ev.key === 'ArrowRight') keys.right = true;
    else if (ev.key === 'ArrowDown' || ev.key === '0' || (ev.key === ' ' && !inField)) setCmd(0);
    else return;
    ev.preventDefault();
  };
  const onKeyUp = (ev: KeyboardEvent): void => {
    if (ev.key === 'ArrowLeft') keys.left = false;
    else if (ev.key === 'ArrowRight') keys.right = false;
  };
  wrap.addEventListener('click', onClick);
  wrap.addEventListener('pointerdown', onHold);
  window.addEventListener('pointerup', onRelease);
  window.addEventListener('pointercancel', onRelease);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // ------------------------------------------------------------ flujo
  function begin(): void {
    started = true;
    startBox.hidden = true;
    last = performance.now();
  }
  function restart(): void {
    s = newState();
    cmd = 0; acc = 0; finished = false; lastCoach = -99; coachKey = ''; wasBlackout = false; saidFinal = false;
    resultBox.hidden = true;
    say('coachIntro', true);
    syncSlider();
  }
  function say(key: EntryTextKey, force = false): void {
    if (!force && (key === coachKey || s.t - lastCoach < COACH_GAP_S)) return;
    coachKey = key;
    lastCoach = s.t;
    comms.textContent = t(key);
    comms.classList.toggle('is-alert', key === 'coachBlackout' || key === 'coachHighDrag' || key === 'coachReverseRight' || key === 'coachReverseLeft');
  }

  /** Mensajes de Mando según lo que pasa. En el apagón no hay consejo (la radio no funciona), pero los instrumentos siguen. */
  function coach(): void {
    if (s.blackout && !wasBlackout) { wasBlackout = true; fx.interfere('severe'); say('coachBlackout', true); return; }
    if (!s.blackout && wasBlackout) { wasBlackout = false; fx.interfere('moderate'); say('coachBlackoutEnd', true); return; }
    if (s.blackout || !explorer) return;
    if (!s.guiding) return;
    if (coachKey === 'coachIntro') { say('coachGuide', true); return; }
    const { lowG, highG } = corridorNow(s);
    const e = deg(s.heading);
    if (e > LIMITS.headingDeg * 0.75) say('coachReverseLeft');
    else if (e < -LIMITS.headingDeg * 0.75) say('coachReverseRight');
    else if (s.dragG > highG) say('coachHighDrag');
    else if (s.dragG < lowG) say('coachLowDrag');
    else if (!saidFinal && s.v < TAEM.speedMS * 2.2) { saidFinal = true; say('coachFinal', true); }
  }

  function end(): void {
    finished = true;
    const result = scoreEntry(s, { inspected: opts.inspected });
    opts.onAttempt?.(result);
    const keysFor = ENDING_KEYS[result.ending as Exclude<EntryEnding, 'running'>];
    const ok = result.ending === 'success';
    const bar = (label: EntryTextKey, v: number, color: string): string =>
      `<div class="mn-bar"><span class="mn-bar__label">${esc(t(label))}</span><div class="mn-bar__track"><div class="mn-bar__fill" style="width:${Math.round(clamp01(v) * 100)}%;--bar-color:${color}"></div></div><span class="mn-bar__value">${Math.round(clamp01(v) * 100)}%</span></div>`;
    resultBox.innerHTML = `<div class="entry__card ${ok ? 'is-ok' : 'is-fail'}">
      <h3 class="heading">${esc(t(keysFor.title))}</h3>
      ${ok ? `<p class="entry__stars" role="img" aria-label="${result.stars} ${esc(t('stars'))}">${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}</p>` : ''}
      <p class="body-sm">${esc(t(keysFor.body))}</p>
      <div class="entry__bars">
        ${bar('resultCorridor', result.corridor, C.teal)}${bar('resultHeading', result.heading, C.cyan)}
        ${bar('resultEnergy', result.energy, C.gold)}${bar('resultHeat', result.heatMargin, C.coral)}
      </div>
      <button class="mn-btn" data-act="${ok ? 'next' : 'retry'}">${esc(t(ok ? 'next' : 'retry'))}</button>
    </div>`;
    resultBox.hidden = false;
    resultBox.querySelector<HTMLButtonElement>('button')?.focus();
  }

  // ------------------------------------------------------------ bucle
  function frame(now: number): void {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (started && !finished) {
      const dir = keys.left || holding < 0 ? -1 : keys.right || holding > 0 ? 1 : 0;
      if (dir !== 0) setCmd(cmd + dir * KEY_RATE_DEG_PER_S * dt);
      acc += dt;
      while (acc >= STEP && s.ending === 'running') {
        stepEntry(s, cmd, STEP);
        acc -= STEP;
        coach();
      }
      syncSlider();
      if (s.ending !== 'running') end();
    }
    draw(now / 1000);
    renderTelemetry();
  }

  // ------------------------------------------------------------ dibujo
  function makeStars(): { x: number; y: number; r: number }[] {
    const out: { x: number; y: number; r: number }[] = [];
    let a = 12345;
    for (let i = 0; i < 70; i++) {
      a = (a * 1664525 + 1013904223) >>> 0;
      const x = (a % 1000) / 1000;
      a = (a * 1664525 + 1013904223) >>> 0;
      const y = (a % 1000) / 1000;
      out.push({ x: x * W, y: y * H * 0.75, r: 0.6 + ((a >>> 8) % 3) * 0.5 });
    }
    return out;
  }

  function draw(time: number): void {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const heavy = !opts.calm && s.loadG > 2 && !finished;
    if (heavy) ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    drawSky();
    drawVehicle(time);
    drawBankDial();
    drawDragGauge();
    drawHeatGauge();
    drawHeadingGauge();
    if (s.blackout) drawBlackout(time);
    ctx.restore();
  }

  function drawSky(): void {
    const a = clamp01((s.h - 20_000) / 102_000); // 1 arriba (espacio) → 0 abajo
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.space900);
    g.addColorStop(1, mix(C.space700, '#2a3f8f', 1 - a));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.muted;
    ctx.globalAlpha = 0.25 + 0.6 * a;
    for (const st of stars) { ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // la Tierra: un arco grande abajo; cuanto más bajo, más cerca y más brillo de atmósfera
    const cy = H + 520 - (1 - a) * 90;
    const atm = ctx.createRadialGradient(W / 2, cy, 560, W / 2, cy, 620 + (1 - a) * 50);
    atm.addColorStop(0, 'rgba(76,195,245,0.55)');
    atm.addColorStop(1, 'rgba(76,195,245,0)');
    ctx.fillStyle = atm;
    ctx.beginPath(); ctx.arc(W / 2, cy, 640, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d3f8f';
    ctx.beginPath(); ctx.arc(W / 2, cy, 560, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W / 2, cy, 560, 0, Math.PI * 2); ctx.stroke();
  }

  /** El orbitador, vista de lado, con la nariz arriba (unos 40° de ángulo de ataque) y el vientre hacia el flujo. */
  function drawVehicle(time: number): void {
    const heat = clamp01(s.heatRate);
    ctx.save();
    ctx.translate(360, 150);
    ctx.rotate((-26 * Math.PI) / 180);
    if (heat > 0.02) {
      const glow = ctx.createRadialGradient(34, 14, 6, 34, 14, 90);
      glow.addColorStop(0, `rgba(255,203,71,${0.85 * heat})`);
      glow.addColorStop(0.5, `rgba(255,122,89,${0.55 * heat})`);
      glow.addColorStop(1, 'rgba(238,95,214,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(34, 14, 90, 0, Math.PI * 2); ctx.fill();
      if (!opts.calm) {
        ctx.strokeStyle = `rgba(255,203,71,${0.7 * heat})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const off = ((time * 160 + i * 37) % 120);
          ctx.beginPath(); ctx.moveTo(-60 - off, -6 + i * 4); ctx.lineTo(-90 - off, -6 + i * 4); ctx.stroke();
        }
      }
    }
    // [DIBUJO] Orbitador tipo transbordador (diseño propio, sin logos), de lado, nariz arriba y vientre negro hacia el flujo.
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = C.space900; ctx.lineWidth = 4;
    ctx.fillStyle = '#e9e8f2';
    ctx.beginPath(); // fuselaje con morro redondeado
    ctx.moveTo(74, 6); ctx.quadraticCurveTo(70, -12, 40, -15); ctx.lineTo(-58, -15); ctx.lineTo(-62, 11); ctx.lineTo(36, 12); ctx.quadraticCurveTo(66, 12, 74, 6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.space900; // losetas negras del vientre
    ctx.beginPath(); ctx.moveTo(72, 8); ctx.lineTo(-61, 11); ctx.lineTo(-60, 5); ctx.lineTo(60, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9e8f2'; // ala delta vista de lado (borde de ataque)
    ctx.beginPath(); ctx.moveTo(30, 2); ctx.lineTo(-52, 12); ctx.lineTo(-62, 12); ctx.lineTo(-30, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9e8f2'; // deriva (cola vertical)
    ctx.beginPath(); ctx.moveTo(-34, -15); ctx.lineTo(-62, -50); ctx.lineTo(-66, -15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.space700; // motores principales
    ctx.fillRect(-68, -12, 7, 8);
    ctx.fillStyle = C.cyan; // ventanas de la cabina
    ctx.beginPath(); ctx.moveTo(46, -13); ctx.lineTo(58, -9); ctx.lineTo(48, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawBankDial(): void {
    const cx = 360, cy = 62, r = 38;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI + 0.35, -0.35); ctx.stroke();
    const at = (bank: number, len: number): [number, number] => {
      const a = (bank * Math.PI) / 180;
      return [cx + Math.sin(a) * len, cy - Math.cos(a) * len];
    };
    if (explorer && s.guiding && !s.blackout) {
      const [ax, ay] = at(adviseBank(s), r + 4);
      ctx.fillStyle = C.teal;
      ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.fill();
    }
    const [cx2, cy2] = at(cmd, r - 4);
    ctx.strokeStyle = C.ink; ctx.setLineDash([3, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx2, cy2); ctx.stroke(); ctx.setLineDash([]);
    const [bx, by] = at(s.bank, r - 2);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = '600 14px Fredoka, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(t('bank'), cx, cy + 18);
    ctx.restore();
  }

  function drawDragGauge(): void {
    const x = 20, y = 40, w = 46, h = 250, max = 2;
    const yOf = (g: number): number => y + h - clamp01(g / max) * h;
    ctx.save();
    ctx.fillStyle = C.space600; ctx.strokeStyle = C.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
    if (s.guiding) {
      const { refG, lowG, highG } = corridorNow(s);
      ctx.fillStyle = 'rgba(90,214,178,0.55)';
      ctx.fillRect(x + 3, yOf(highG), w - 6, yOf(lowG) - yOf(highG));
      ctx.strokeStyle = C.teal; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, yOf(refG)); ctx.lineTo(x + w, yOf(refG)); ctx.stroke();
      ctx.fillStyle = C.gold; ctx.strokeStyle = C.space900; ctx.lineWidth = 3;
      const ny = yOf(s.dragG);
      ctx.beginPath(); ctx.moveTo(x + w + 4, ny); ctx.lineTo(x + w + 22, ny - 9); ctx.lineTo(x + w + 22, ny + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = C.muted; ctx.font = '500 12px Fredoka, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t('waitingAir'), x + w / 2 + 6, y + h / 2, 60);
    }
    ctx.fillStyle = C.ink; ctx.font = '600 14px Fredoka, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(t('drag'), x, y - 12);
    ctx.restore();
  }

  function drawHeatGauge(): void {
    const x = W - 66, y = 40, w = 46, h = 250;
    const fill = clamp01(s.heat / LIMITS.heatCapacity);
    ctx.save();
    ctx.fillStyle = C.space600; ctx.strokeStyle = C.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(0, y + h, 0, y);
    g.addColorStop(0, C.teal); g.addColorStop(0.55, C.gold); g.addColorStop(0.85, C.coral); g.addColorStop(1, C.danger);
    ctx.fillStyle = g;
    ctx.fillRect(x + 3, y + h - fill * (h - 3) - 1, w - 6, fill * (h - 3));
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    const ly = y + h - 0.85 * h;
    ctx.beginPath(); ctx.moveTo(x - 4, ly); ctx.lineTo(x + w + 4, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.ink; ctx.font = '600 14px Fredoka, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(t('heat'), x + w, y - 12);
    ctx.restore();
  }

  function drawHeadingGauge(): void {
    const x0 = 130, x1 = 590, y = 306, range = 30;
    const xOf = (d: number): number => x0 + ((Math.max(-range, Math.min(range, d)) + range) / (2 * range)) * (x1 - x0);
    ctx.save();
    ctx.fillStyle = C.space600; ctx.strokeStyle = C.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x0, y - 8, x1 - x0, 16, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(90,214,178,0.55)';
    ctx.fillRect(xOf(-LIMITS.headingDeg), y - 5, xOf(LIMITS.headingDeg) - xOf(-LIMITS.headingDeg), 10);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xOf(0), y - 10); ctx.lineTo(xOf(0), y + 10); ctx.stroke();
    ctx.fillStyle = Math.abs(deg(s.heading)) > LIMITS.headingDeg ? C.danger : C.gold; ctx.strokeStyle = C.space900; ctx.lineWidth = 3;
    const mx = xOf(deg(s.heading));
    ctx.beginPath(); ctx.moveTo(mx, y - 12); ctx.lineTo(mx - 8, y - 26); ctx.lineTo(mx + 8, y - 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = '600 14px Fredoka, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(t('heading'), x0 - 10, y + 5);
    ctx.restore();
  }

  function drawBlackout(time: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(14,11,51,0.45)';
    ctx.fillRect(100, 0, W - 200, H);
    if (!opts.calm) {
      for (let i = 0; i < 260; i++) {
        const x = 100 + Math.random() * (W - 200);
        const y = Math.random() * H;
        ctx.fillStyle = `rgba(245,245,242,${0.05 + Math.random() * 0.2})`;
        ctx.fillRect(x, y, 2 + Math.random() * 14, 1.5);
      }
    } else {
      ctx.strokeStyle = 'rgba(245,245,242,0.12)'; ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 6) { ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W - 100, y); ctx.stroke(); }
    }
    ctx.fillStyle = C.magenta; ctx.font = '700 20px "Space Mono", monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = opts.calm ? 1 : 0.65 + 0.35 * Math.sin(time * 6);
    ctx.fillText(t('noSignal'), W / 2, 252);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.ink; ctx.font = '500 14px Fredoka, sans-serif';
    ctx.fillText(t('blackoutBanner'), W / 2, 274);
    ctx.restore();
  }

  // ------------------------------------------------------------ telemetría (DOM, legible por lector de pantalla)
  let teleCache = '';
  function renderTelemetry(): void {
    const progress = clamp01(1 - (s.v - TAEM.speedMS) / (7_800 - TAEM.speedMS));
    const pct = (v: number): string => `${Math.round(v)}%`;
    const items: [string, string][] = explorer
      ? [[t('progress'), pct(progress * 100)], [t('heat'), pct((s.heat / LIMITS.heatCapacity) * 100)]]
      : [
          [t('mach'), mach(s.v, s.h).toFixed(1)],
          [t('altitude'), `${(s.h / 1000).toFixed(1)} km`],
          [t('speed'), `${(s.v / 1000).toFixed(2)} km/s`],
          [t('drag'), `${s.dragG.toFixed(2)} g`],
          [t('load'), `${s.loadG.toFixed(2)} g`],
          [t('heat'), pct((s.heat / LIMITS.heatCapacity) * 100)],
          [t('heading'), `${deg(s.heading).toFixed(1)}°`],
          [t('bank'), `${Math.round(s.bank)}°`],
          [t('range'), `${Math.round(s.range)} / ${TARGET_RANGE_KM} km`],
        ];
    const html = items.map(([k, v]) => `<span class="entry__item"><span class="entry__key">${esc(k)}</span> <b>${esc(v)}</b></span>`).join('');
    if (html !== teleCache) { telemetry.innerHTML = html; teleCache = html; }
  }

  syncSlider();
  raf = requestAnimationFrame(frame);

  return {
    nudge(dir) {
      if (dir === 0) setCmd(0);
      else setCmd(cmd + dir * 6);
      syncSlider();
    },
    destroy() {
      fx.destroy();
      cancelAnimationFrame(raf);
      finished = true;
      wrap.removeEventListener('click', onClick);
      wrap.removeEventListener('pointerdown', onHold);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    },
  };
}

/** Mezcla lineal de dos colores #rrggbb (para el cielo). */
function mix(a: string, b: string, t: number): string {
  const p = (hex: string, i: number): number => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number): string => Math.round(p(a, i) + (p(b, i) - p(a, i)) * clamp01(t)).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}
