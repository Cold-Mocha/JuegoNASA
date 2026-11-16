import { SCRIPT, UI_TEXT, WHO_LABEL, type ScriptLine, type SceneKey } from '../data/voyageScript';
import { esc } from './ui';
import type { MiniGameHandle } from './miniGames';

export interface DialogueOptions { lang: 'es' | 'en'; calm?: boolean; pilot: string; onDone(): void; onLine?(line: ScriptLine, index: number): void; }

const GLITCH = '▒░#%/·';
/** Caja de diálogo estilo «máquina de escribir»: clic, Enter o Espacio avanza (el primero completa la línea). El texto completo va a un aviso accesible. */
export function mountDialogue(root: HTMLElement, key: SceneKey | ScriptLine[], opts: DialogueOptions): MiniGameHandle {
  const lines = typeof key === 'string' ? SCRIPT[key] : key;
  const lang = opts.lang;
  const reduce = opts.calm || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.innerHTML = `<div class="dlg" data-dlg>
    <div class="dlg__box" role="group" aria-label="${esc(lang === 'es' ? 'Diálogo' : 'Dialogue')}">
      <p class="dlg__who" data-who></p>
      <p class="dlg__text" data-text aria-hidden="true"></p>
      <p class="sr-only" data-sr aria-live="polite"></p>
      <div class="dlg__foot"><span class="dlg__hint">${esc(UI_TEXT.hint[lang])}</span>
        <button class="mn-btn mn-btn--secondary mn-btn--sm" data-skip>${esc(UI_TEXT.skip[lang])}</button></div>
    </div></div>`;
  const q = <T extends HTMLElement>(s: string): T => root.querySelector<T>(s)!;
  const who = q('[data-who]'), text = q('[data-text]'), sr = q('[data-sr]'), box = q('.dlg__box');
  let i = -1;
  let full = '';
  let shown = 0;
  let timer = 0;
  let line: ScriptLine = lines[0];
  let dead = false;
  const finishLine = (): void => {
    clearInterval(timer); timer = 0; shown = full.length;
    text.textContent = full; text.classList.toggle('is-static', false);
    sr.textContent = full;
  };
  const next = (): void => {
    if (dead) return;
    if (timer) return finishLine();
    i++;
    if (i >= lines.length) { dead = true; opts.onDone(); return; }
    line = lines[i];
    full = (lang === 'es' ? line.es : line.en).replace(/\{PILOTO\}/g, opts.pilot);
    const meta = WHO_LABEL[line.who];
    who.textContent = meta[lang]; who.style.color = meta.color;
    box.dataset.fx = !opts.calm && line.fx === 'shake' ? 'shake' : line.fx === 'whisper' ? 'whisper' : '';
    text.classList.toggle('is-nave', line.who === 'NAVE');
    sr.textContent = '';
    opts.onLine?.(line, i);
    shown = 0; text.textContent = '';
    if (reduce) return finishLine();
    timer = window.setInterval(() => {
      shown += 1;
      let s = full.slice(0, shown);
      if (line.fx === 'static' && !opts.calm) s = s.replace(/[a-zA-Z]/g, (c, k) => (((k * 7 + shown) % 9 === 0) ? GLITCH[(k + shown) % GLITCH.length] : c));
      text.textContent = s;
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
  return { destroy() { dead = true; clearInterval(timer); window.removeEventListener('keydown', onKey, true); } };
}
