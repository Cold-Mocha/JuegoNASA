import { icon } from './icons';
import { t } from './i18n';
import { esc } from './ui';
import type { MiniGameHandle } from './miniGames';

/**
 * Marco común de los minijuegos a pantalla completa (estación y misión «Casa»): escenario, pista de los primeros segundos
 * (con el gesto animado y las teclas), botón Salir y resultado (icono y ganancia).
 */
const HAND = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><path d="M17 44 V16 a4.5 4.5 0 0 1 9 0 V25 l9 1.6 a4.5 4.5 0 0 1 3.6 5.4 L36 44Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/></svg>';

/** Escenario y botón Salir. `exitAction` es el `data-action` del botón en la escena que monta el marco. Los mensajes van aparte (`miniMsgsHtml`). */
export const miniFrameHtml = (exitAction: string): string => `
  <div class="mini-full" aria-label="${t('mini.label')}">
    <div class="mini-full__stage" data-mini-stage></div>
  </div>
  <button class="mn-btn mn-btn--secondary mn-btn--sm mini-full__exit" data-action="${exitAction}">${icon('close')}${t('mini.exit')}</button>`;

/** Pista y resultado del minijuego: nunca al centro, sino en la columna de la izquierda, debajo de las stats. */
export const miniMsgsHtml = (hint: string): string => `
  <p class="mini-msg mini-msg--hint" data-mini-hint><span>${esc(hint)}</span></p>
  <div class="mini-msg mini-msg--result" data-mini-result role="status" hidden></div>`;

/** Suma a la pista el gesto animado y las teclas que declara el minijuego (las teclas se ocultan en pantallas táctiles). */
export function decorateHint(msgs: HTMLElement, handle: MiniGameHandle): void {
  const hint = msgs.querySelector<HTMLElement>('[data-mini-hint]');
  if (!hint) return;
  if (handle.gesture) hint.insertAdjacentHTML('afterbegin', `<span class="mini-gesture mini-gesture--${handle.gesture}" aria-hidden="true">${HAND}</span>`);
  if (handle.keys?.length) hint.insertAdjacentHTML('beforeend', `<span class="mini-keys">${handle.keys.map((k) => `<kbd>${esc(k)}</kbd>`).join('')}</span>`);
}

/** Resultado al terminar: un icono de listo y, si hay, la ganancia real («+8 energía», HTML ya escapado). Reemplaza a la pista. */
export function showMiniResult(msgs: HTMLElement, frame: HTMLElement, _score: number, gainHtml = ''): void {
  const box = msgs.querySelector<HTMLElement>('[data-mini-result]');
  if (!box) return;
  // con ganancias y pérdidas se muestran ellas (sin el check gigante); sin cifras (fases de «Casa») queda un check chico
  box.innerHTML = gainHtml ? `<p class="mini-msg__gain">${gainHtml}</p>` : `<span class="mini-msg__done" aria-label="${t('mini.done')}">${icon('check')}</span>`;
  box.hidden = false;
  const hint = msgs.querySelector<HTMLElement>('[data-mini-hint]');
  if (hint) hint.hidden = true;
  frame.querySelector('.mini-full')?.classList.add('is-done');
}
