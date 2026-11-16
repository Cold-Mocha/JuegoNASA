import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { icon, type IconName } from '../core/icons';
import { chapterFor } from '../data/chapters';
import { mountBurn, mountGlide, mountInspect, type PhaseDone } from '../core/casaGames';
import { mountEntryGame } from '../core/reentryGame';
import type { MiniGameHandle } from '../core/miniGames';
import { casaScore, casaStars, type CasaResult } from '../sim/entry';
import { t } from '../core/i18n';
import { CHARACTERS } from '../data/characters';
import { UI_TEXT, type SceneKey } from '../data/voyageScript';
import { mountDialogue } from '../core/dialogue';
import { voyageArt, type ArtKind } from '../core/voyageArt';
import { mountAdapter, mountPowerBudget, mountRadioDial } from '../core/voyageGames';
import { MISSIONS } from '../data/missions';
import { endingFor, goNoGo, shipFromStars, voyageScore, type ShipState, type VoyageResult } from '../sim/voyage';

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
  private ship: ShipState = shipFromStars(0);
  private vr: VoyageResult = { signal: 0, air: 0, power: 0, inspected: 1, unfound: 0, reentry: 0, glide: 0 };

  constructor() {
    super(SCENES.reentry);
  }

  create(): void {
    fadeIn(this);
    drawStarfield(this, 'casa', !state.calm);
    this.res = { inspected: 1, burn: 0, corridor: 0, heatMax: 0, glide: 0 };
    this.unfound = 0;
    this.ui = new UiLayer(this, '<div class="casa" data-casa></div>');
    this.ui.on('retry', () => this.runPrelude(0)).on('home', () => this.exit())
      .on('chapter', (el) => { this.stop(); fadeTo(this, SCENES.archive, 300, { from: SCENES.reentry, entry: el.dataset.entry }); });
    const kb = this.input.keyboard!;
    kb.on('keydown', (ev: KeyboardEvent) => {
      audio.unlock();
      const k = ev.key.toLowerCase();
      if (k === 'escape') return this.exit();
      if (k.startsWith('arrow') && this.handle?.nudge) {
        this.handle?.nudge?.(k === 'arrowright' ? 1 : k === 'arrowleft' ? -1 : 0, k === 'arrowdown' ? 1 : k === 'arrowup' ? -1 : 0);
        ev.preventDefault();
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stop());
    this.runPrelude(0);
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

  private get lang(): 'es' | 'en' { return state.settings.lang === 'en' ? 'en' : 'es'; }
  private get pilot(): string { return CHARACTERS.find((c) => c.id === state.loadout?.character)?.name ?? (this.lang === 'es' ? 'Piloto' : 'Pilot'); }

  /** Diálogo con arte por capas arriba y la caja de texto abajo; `extra` es HTML opcional bajo el arte (p. ej. la lista GO / NO-GO). */
  private say(key: SceneKey, art: ArtKind | null, then: () => void, extra = ''): void {
    this.stop();
    const root = this.ui.q('[data-casa]');
    root.innerHTML = `<div class="voyage"><div class="voyage__stage">${art ? `<div class="voyage__art">${voyageArt(art)}</div>` : ''}${extra}</div><div data-dlg></div></div>`;
    const h = mountDialogue(this.ui.q('[data-dlg]'), key, { lang: this.lang, calm: state.calm, pilot: this.pilot, onDone: () => { h.destroy(); then(); } });
    this.handle = h;
  }

  /** Un minijuego del tramo 1 a pantalla completa (mismo marco que las demás fases). */
  private play(mount: (stage: HTMLElement) => MiniGameHandle): void {
    this.stop();
    const root = this.ui.q('[data-casa]');
    root.innerHTML = '<div class="mini-full"><div class="mini-full__stage" data-stage></div></div>';
    this.handle = mount(this.ui.q('[data-stage]'));
  }

  /** Tramo 1 del regreso (escenas 1–5 del guion «Rueda detenida»), seguido de las 4 fases de Casa. [PROPUESTA] */
  private runPrelude(n: number): void {
    const hard = state.loadout?.difficulty === 'comandante';
    const total = MISSIONS.reduce((a, m) => a + (state.progress.best[m.id]?.stars ?? 0), 0);
    if (n === 0) {
      this.ship = shipFromStars(total);
      this.vr = { signal: 0, air: 0, power: 0, inspected: 1, unfound: 0, reentry: 0, glide: 0 };
    }
    const go = (k: number): void => this.runPrelude(k);
    const es = this.lang === 'es';
    const done = (key: 'signal' | 'air' | 'power', next: number, after: SceneKey): ((score: number) => void) => (score) => {
      this.vr[key] = score; audio.play('achievement');
      this.timer = this.time.delayedCall(500, () => this.say(after, 'cabin', () => go(next)));
    };
    if (n === 0) {
      const rows = goNoGo(this.ship).map((g) => `<div class="golist__row ${g.go ? 'is-go' : 'is-nogo'}"><span>${UI_TEXT.items[g.id][this.lang]}</span><b>${g.go ? UI_TEXT.go[this.lang] : UI_TEXT.nogo[this.lang]}</b></div>`).join('');
      this.say('go', 'cabin', () => go(1), `<div class="golist" role="list" aria-label="GO / NO-GO">${rows}</div>`);
    } else if (n === 1) this.say('view', 'view', () => go(2));
    else if (n === 2) this.say('signalLost', 'storm', () => this.play((st) => mountRadioDial(st, { antenna: this.ship.antenna, hard, lang: this.lang, calm: state.calm, onDone: done('signal', 3, 'signalBack') })));
    else if (n === 3) this.say('air', 'cabin', () => this.play((st) => mountAdapter(st, { hard, seed: total * 7 + 3, lang: this.lang, calm: state.calm, onDone: done('air', 4, 'airDone') })));
    else if (n === 4) this.say('power', 'cabin', () => this.play((st) => mountPowerBudget(st, { energy: this.ship.energy, lang: this.lang, onDone: done('power', 5, 'powerDone') })));
    else if (n === 5) this.say('leo', 'orbit', () => this.startPhase(0));
    void es;
  }

  /** Icono de la fase un instante y después el juego. */
  private startPhase(i: number): void {
    this.stop();
    if (i === 0) this.unfound = 0;
    const root = this.ui.q('[data-casa]');
    root.innerHTML = `<div class="casa__intro">${icon(PHASE_ICON[i])}</div>`;
    audio.play(i === 2 ? 'alarm' : 'radio');
    this.timer = this.time.delayedCall(i === 0 ? 1100 : 800, () => {
      const advance = (): void => {
        audio.play('achievement');
        root.querySelector('.mini-full')?.classList.add('is-done');
        this.timer = this.time.delayedCall(700, () => (i === 3 ? this.finish() : this.startPhase(i + 1)));
      };
      if (i === 2) {
        // Reingreso del orbitador: modelo físico con alabeo, calor, g y apagón de comunicaciones (ver sim/reentry.ts)
        root.innerHTML = '<div class="casa__entry" data-stage></div>';
        const g = mountEntryGame(this.ui.q('[data-stage]'), {
          level: state.loadout?.difficulty === 'comandante' ? 'engineer' : 'explorer',
          lang: state.settings.lang,
          damage: this.unfound,
          inspected: this.unfound === 0,
          calm: state.calm,
          onDone: (r) => {
            this.res.corridor = r.quality;
            this.res.heatMax = Math.round((1 - r.heatMargin) * 100); // calor acumulado 0–100
            g.destroy();
            this.timer = this.time.delayedCall(300, () => this.startPhase(3));
          },
        });
        this.handle = { destroy: () => g.destroy() };
        return;
      }
      root.innerHTML = '<div class="mini-full"><div class="mini-full__stage" data-stage></div></div>';
      const stage = this.ui.q('[data-stage]');
      const done = (apply: (r: Parameters<PhaseDone>[0]) => void): PhaseDone => (r) => { apply(r); advance(); };
      if (i === 0) this.handle = mountInspect(stage, DAMAGED_TILES, done((r) => { this.res.inspected = r.score; this.unfound = r.unfound ?? 0; }));
      else if (i === 1) this.handle = mountBurn(stage, done((r) => void (this.res.burn = r.score)));
      else this.handle = mountGlide(stage, done((r) => void (this.res.glide = r.score)));
    });
  }

  /** Estrellas y puntaje; se guarda el mejor. Sin pérdida de tripulación: siempre se puede reintentar. */
  private finish(): void {
    this.stop();
    this.vr.inspected = this.res.inspected; this.vr.unfound = this.unfound; this.vr.reentry = this.res.corridor; this.vr.glide = this.res.glide;
    const ending = endingFor(this.vr);
    const stars = ending === 'C' ? Math.min(1, casaStars(this.res)) : casaStars(this.res);
    const score = Math.max(casaScore(this.res), voyageScore(this.vr) >= 0 ? Math.round(voyageScore(this.vr)) : 0);
    const prev = state.progress.casa;
    if (!prev || score > prev.score) state.saveProgress({ casa: { score, stars: Math.max(stars, prev?.stars ?? 0) } });
    this.say(ending === 'A' ? 'endA' : ending === 'B' ? 'endB' : 'endC', ending === 'C' ? 'storm' : 'orbit', () => this.showResult(stars, score, ending));
  }

  private showResult(stars: number, score: number, ending: 'A' | 'B' | 'C'): void {
    this.stop();
    audio.play('achievement');
    this.ui.q('[data-casa]').innerHTML = `<div class="casa__result"><p class="caption-mono">${UI_TEXT.endings[ending][this.lang]}</p>${ending === 'C' ? `<p class="body-sm">${UI_TEXT.retryWhat[this.lang]}</p>` : ''}
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
    <p class="body-sm">🌙 ${esc(c.habitat)} · ${c.number}/4</p>
    <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="chapter" data-entry="${esc(c.entry)}">${icon('book')}${t('Leer la ficha real')}</button></div>`;
}
