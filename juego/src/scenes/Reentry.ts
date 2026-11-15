import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { icon, type IconName } from '../core/icons';
import { chapterFor } from '../data/chapters';
import { mountBurn, mountGlide, mountInspect, mountReentry, type PhaseDone } from '../core/casaGames';
import type { MiniGameHandle } from '../core/miniGames';
import { casaScore, casaStars, heatMultiplier, type CasaResult } from '../sim/entry';
import { t } from '../core/i18n';

const STAR = '<svg class="mn-star is-earned" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C26 16 32 22 45 24C32 26 26 32 24 45C22 32 16 26 3 24C16 22 22 16 24 3Z"/></svg>';
const STAR_OFF = STAR.replace(' is-earned', '');
const PHASE_ICON: IconName[] = ['radar', 'rocket', 'sun', 'map'];
const DAMAGED_TILES = 4;

/**
 * Misión final «Casa» (sin texto): 1) giro e inspección, 2) quemada, 3) corredor de reingreso con apagón, 4) planeo.
 * Los daños que no se encuentran en la fase 1 suben el calor de la fase 3. Se sale con Esc.
 */
export class ReentryScene extends Phaser.Scene {
  private ui!: UiLayer;
  private handle?: MiniGameHandle;
  private timer?: Phaser.Time.TimerEvent;
  private res: CasaResult = { inspected: 1, burn: 0, corridor: 0, heatMax: 0, glide: 0 };
  private unfound = 0;

  constructor() {
    super(SCENES.reentry);
  }

  create(): void {
    fadeIn(this);
    drawStarfield(this, 'casa', !state.calm);
    this.res = { inspected: 1, burn: 0, corridor: 0, heatMax: 0, glide: 0 };
    this.unfound = 0;
    this.ui = new UiLayer(this, '<div class="casa" data-casa></div>');
    this.ui.on('retry', () => this.startPhase(0)).on('home', () => this.exit())
      .on('chapter', (el) => { this.stop(); fadeTo(this, SCENES.archive, 300, { from: SCENES.reentry, entry: el.dataset.entry }); });
    const kb = this.input.keyboard!;
    kb.on('keydown', (ev: KeyboardEvent) => {
      audio.unlock();
      const k = ev.key.toLowerCase();
      if (k === 'escape') return this.exit();
      if (k.startsWith('arrow')) {
        this.handle?.nudge?.(k === 'arrowright' ? 1 : k === 'arrowleft' ? -1 : 0, k === 'arrowdown' ? 1 : k === 'arrowup' ? -1 : 0);
        ev.preventDefault();
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stop());
    this.startPhase(0);
  }

  private stop(): void {
    this.handle?.destroy();
    this.handle = undefined;
    this.timer?.remove();
  }

  private exit(): void {
    this.stop();
    fadeTo(this, SCENES.menu);
  }

  /** Icono de la fase un instante y después el juego. */
  private startPhase(i: number): void {
    this.stop();
    if (i === 0) this.unfound = 0;
    const root = this.ui.q('[data-casa]');
    root.innerHTML = `<div class="casa__intro">${icon(PHASE_ICON[i])}</div>`;
    audio.play(i === 2 ? 'alarm' : 'radio');
    this.timer = this.time.delayedCall(i === 0 ? 1100 : 800, () => {
      root.innerHTML = '<div class="mini-full"><div class="mini-full__stage" data-stage></div></div>';
      const stage = this.ui.q('[data-stage]');
      const done = (apply: (r: Parameters<PhaseDone>[0]) => void): PhaseDone => (r) => {
        apply(r);
        audio.play('achievement');
        root.querySelector('.mini-full')?.classList.add('is-done');
        this.timer = this.time.delayedCall(700, () => (i === 3 ? this.finish() : this.startPhase(i + 1)));
      };
      if (i === 0) this.handle = mountInspect(stage, DAMAGED_TILES, done((r) => { this.res.inspected = r.score; this.unfound = r.unfound ?? 0; }));
      else if (i === 1) this.handle = mountBurn(stage, done((r) => void (this.res.burn = r.score)));
      else if (i === 2) this.handle = mountReentry(stage, heatMultiplier(this.unfound), done((r) => { this.res.corridor = r.score; this.res.heatMax = r.heatMax ?? 0; }));
      else this.handle = mountGlide(stage, done((r) => void (this.res.glide = r.score)));
    });
  }

  /** Estrellas y puntaje; se guarda el mejor. Sin pérdida de tripulación: siempre se puede reintentar. */
  private finish(): void {
    this.stop();
    const stars = casaStars(this.res);
    const score = casaScore(this.res);
    const prev = state.progress.casa;
    if (!prev || score > prev.score) state.saveProgress({ casa: { score, stars: Math.max(stars, prev?.stars ?? 0) } });
    audio.play('achievement');
    this.ui.q('[data-casa]').innerHTML = `<div class="casa__result">
      <div class="mn-stars">${STAR.repeat(stars)}${STAR_OFF.repeat(3 - stars)}</div>
      <p class="casa__score">${score}</p>
      ${casaChapter()}
      <div class="casa__buttons">
        <button class="mn-btn" data-action="retry" aria-label="${t('Reintentar')}">${icon('retry')}</button>
        <button class="mn-btn mn-btn--secondary" data-action="home" aria-label="${t('Menú')}">${icon('home')}</button>
      </div></div>`;
  }
}

/** Capítulo final de la historia: mensaje de la Tierra (recreación) y su ficha real. */
function casaChapter(): string {
  const c = chapterFor('casa');
  if (!c) return '';
  return `<div class="casa__chapter"><span class="mn-chip mn-chip--science">${t('Capítulo {n}', { n: c.number })} · ${esc(c.title)}</span>
    <p class="caption-mono">${t('Mensaje de la Tierra (RECREACIÓN: personaje ficticio)')}</p>
    <p class="mn-panel__body"><strong>${esc(c.from)}:</strong> ${esc(c.message)}</p>
    <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="chapter" data-entry="${esc(c.entry)}">${icon('book')}${t('Leer la ficha real')}</button></div>`;
}
