import { SCRIPT, UI_TEXT, WHO_LABEL, type ScriptLine, type SceneKey } from '../data/voyageScript';
import { esc } from './ui';
import type { MiniGameHandle } from './miniGames';
import { michiSvg } from './art';
import { tokenCss } from './theme';

export interface DialogueOptions {
  lang: 'es' | 'en'; calm?: boolean; pilot: string; engineer?: boolean;
  /** Pantalla completa con fondos (prólogo) en vez de caja dentro de un minijuego. */
  full?: boolean;
  /** Sin sonido de «voz» al escribir. */
  muted?: boolean;
  onDone(): void; onLine?(line: ScriptLine, index: number): void;
}

const BASE = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
/** Retrato de Control Tierra: antena parabólica con ondas de radio (dibujo propio). */
const TIERRA_FACE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#10243a"/><circle cx="32" cy="34" r="22" fill="#1d5a8a"/><path d="M14 30c4 14 14 22 28 20 0-8-6-18-14-22-5-2-10-1-14 2z" fill="#3a9a5a"/><g transform="rotate(-30 32 34)"><path d="M18 34a14 10 0 0 0 28 0z" fill="#e8eef5"/><path d="M32 34V18" stroke="#e8eef5" stroke-width="2"/><circle cx="32" cy="17" r="2.5" fill="#ffcb47"/></g><path d="M44 12a14 14 0 0 1 8 8M42 6a22 22 0 0 1 14 14" fill="none" stroke="#9fe7c8" stroke-width="2" stroke-linecap="round"/></svg>';
const FACE: Partial<Record<string, string>> = { MIU: 'tabby', GUINA: 'ocelot', LEO: 'snow', ZIB: 'alien' };
/** Tono de la «voz» de cada personaje (estilo RPG). */
const PITCH: Partial<Record<string, number>> = { MIU: 330, GUINA: 440, LEO: 260, ZIB: 560, NEBULA: 200, TIERRA_US: 300, TIERRA_CL: 380 };
const isEarth = (who: string): boolean => who === 'TIERRA' || who === 'TIERRA_US' || who === 'TIERRA_CL';
const NEBULA = { id: 'miu' as const, name: 'Comandante Nébula', role: '', trait: '', fur: '#f5f5f2', furDark: '#c4c2e0', accent: 'nebula-violet' };

const GLITCH = '▒░#%/·';
/** Caja de diálogo estilo «máquina de escribir»: clic, Enter o Espacio avanza (el primero completa la línea). El texto completo va a un aviso accesible. */
export function mountDialogue(root: HTMLElement, key: SceneKey | ScriptLine[], opts: DialogueOptions): MiniGameHandle {
  const lines = typeof key === 'string' ? SCRIPT[key] : key;
  const lang = opts.lang;
  const reduce = opts.calm || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.innerHTML = `<div class="dlg${opts.full ? ' dlg--full' : ''}" data-dlg>
    <div class="dlg__bg" data-bg></div>
    <div class="dlg__box" role="group" aria-label="${esc(lang === 'es' ? 'Diálogo' : 'Dialogue')}">
      <p class="dlg__who" data-who></p>
      <div class="dlg__face" data-face hidden></div>
      <div class="dlg__main">
        <p class="dlg__text" data-text aria-hidden="true"></p>
        <p class="sr-only" data-sr aria-live="polite"></p>
        <p class="dlg__card" data-card hidden></p>
        <p class="dlg__note" data-note hidden></p>
        <div class="dlg__foot"><span class="dlg__hint">${esc(UI_TEXT.hint[lang])}</span>
          <button class="mn-btn mn-btn--secondary mn-btn--sm" data-skip>${esc(UI_TEXT.skip[lang])}</button></div>
      </div>
      <span class="dlg__next" data-next aria-hidden="true">▼</span>
    </div></div>`;
  const q = <T extends HTMLElement>(s: string): T => root.querySelector<T>(s)!;
  const card = q('[data-card]');
  const who = q('[data-who]'), text = q('[data-text]'), sr = q('[data-sr]'), box = q('.dlg__box');
  const face = q('[data-face]'), bgEl = q('[data-bg]'), note = q('[data-note]'), nextMark = q('[data-next]');
  let ac: AudioContext | undefined;
  const blip = (hz: number): void => {
    if (opts.muted || reduce) return;
    try {
      ac ??= new AudioContext();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = hz; g.gain.value = 0.025; o.connect(g).connect(ac.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.06); o.stop(ac.currentTime + 0.07);
    } catch { /* sin audio */ }
  };
  let i = -1;
  let full = '';
  let shown = 0;
  let timer = 0;
  let line: ScriptLine = lines[0];
  let dead = false;
  const finishLine = (): void => {
    clearInterval(timer); timer = 0; shown = full.length;
    text.textContent = full; text.classList.toggle('is-static', false);
    sr.textContent = full; nextMark.style.visibility = 'visible';
  };
  const next = (): void => {
    if (dead) return;
    if (timer) return finishLine();
    i++;
    if (i >= lines.length) { dead = true; opts.onDone(); return; }
    line = lines[i];
    full = (lang === 'es' ? line.es : line.en).replace(/\{PILOTO\}/g, opts.pilot);
    const meta = WHO_LABEL[line.who];
    who.textContent = meta[lang]; who.style.color = meta.color; who.hidden = !meta[lang];
    const fk = FACE[line.who];
    face.hidden = !fk && line.who !== 'NEBULA' && !isEarth(line.who);
    if (fk) face.innerHTML = `<img src="${BASE}prologue/portraits/${fk}.jpg" alt="">`;
    else if (line.who === 'NEBULA') face.innerHTML = michiSvg(NEBULA, tokenCss('nebula-violet'));
    else if (isEarth(line.who)) face.innerHTML = TIERRA_FACE;
    box.classList.toggle('has-face', !face.hidden);
    if (line.bg) bgEl.innerHTML = `<img src="${BASE}${line.bg}" alt="">`;
    note.hidden = !line.note; note.textContent = line.note ? line.note[lang] : '';
    nextMark.style.visibility = 'hidden';
    box.dataset.fx = !opts.calm && line.fx === 'shake' ? 'shake' : line.fx === 'whisper' ? 'whisper' : '';
    text.classList.toggle('is-nave', line.who === 'NAVE');
    sr.textContent = '';
    if (line.fx === 'dim' && !opts.calm && !reduce) { // guiño: la luz cae un instante (1–2 s)
      const dim = document.createElement('div');
      dim.className = 'dlg__dim';
      root.appendChild(dim);
      window.setTimeout(() => dim.remove(), 1600);
    }
    card.hidden = !(opts.engineer && line.card); card.textContent = line.card ? `ⓘ ${line.card[lang]}` : '';
    opts.onLine?.(line, i);
    shown = 0; text.textContent = '';
    if (reduce) return finishLine();
    timer = window.setInterval(() => {
      shown += 1;
      let s = full.slice(0, shown);
      if (line.fx === 'static' && !opts.calm) s = s.replace(/[a-zA-Z]/g, (c, k) => (((k * 7 + shown) % 9 === 0) ? GLITCH[(k + shown) % GLITCH.length] : c));
      text.textContent = s;
      if (shown % 2 === 0) blip(PITCH[line.who] ?? 200);
      if (shown >= full.length) finishLine();
    }, 24);
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); next(); }
  };
  window.addEventListener('keydown', onKey, true);
  root.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-skip]')) { dead = true; clearInterval(timer); opts.onDone(); return; }
    next();
  });
  next();
  return { destroy() { dead = true; clearInterval(timer); window.removeEventListener('keydown', onKey, true); void ac?.close(); } };
}

/** Muestra un diálogo dentro del escenario de un minijuego y, al terminar, monta el minijuego en el mismo contenedor. */
export function withIntro(key: SceneKey | ScriptLine[], opts: Omit<DialogueOptions, 'onDone'>, mount: (root: HTMLElement) => MiniGameHandle): (root: HTMLElement) => MiniGameHandle {
  return (root) => {
    let inner: MiniGameHandle | null = null;
    root.classList.add('dlg-in-stage');
    const d = mountDialogue(root, key, { ...opts, onDone: () => { d.destroy(); root.classList.remove('dlg-in-stage'); inner = mount(root); } });
    return { nudge: (dx, dy) => inner?.nudge?.(dx, dy), destroy() { d.destroy(); inner?.destroy(); root.classList.remove('dlg-in-stage'); } };
  };
}
