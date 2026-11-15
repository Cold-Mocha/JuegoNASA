import Phaser from 'phaser';
import { audio, type Mood } from '../core/audio';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { icon } from '../core/icons';
import { t, type TKey } from '../core/i18n';
import { decorateHint, miniFrameHtml, miniMsgsHtml, showMiniResult } from '../core/miniFrame';
import {
  MINI_KEYS, moveFocus, mountAlgae, mountAntennaGame, mountHarvestGame, mountHealGame, mountIceDrill, mountNoisyMessage, mountPedal,
  type MiniCallbacks, type MiniGameHandle,
} from '../core/miniGames';
import { mountDustGame } from '../core/dustGame';
import { mountSealGame } from '../core/sealGame';
import { mountTestPanel } from '../core/testPanelGame';
import { mountBiofirmas, mountDnaWorkshop } from '../core/dnaGame';
import { mountBelt, mountDelivery, mountRover } from '../core/finaleGames';
import { mountBurn, mountGlide, mountInspect, mountLink, mountReentry } from '../core/casaGames';
import { MINI_DIFFICULTY } from '../sim/minigames';
import type { DifficultyId } from '../data/difficulties';

/**
 * Modo debug: prueba cualquier minijuego sin una partida (se abre desde el pie del menú principal).
 * Cada minijuego se monta con el mismo marco que en la estación y en «Casa»; el resultado (0–100 %) se muestra al terminar y no se guarda nada.
 */
type Group = 'station' | 'lab' | 'probe' | 'casa';
type GameId = 'wires' | 'message' | 'harvest' | 'heal' | 'pedal' | 'algae' | 'drill' | 'dust' | 'seal' | 'testPanel' | 'dna' | 'bio'
  | 'belt' | 'delivery' | 'rover' | 'casaLink' | 'casaInspect' | 'casaBurn' | 'casaReentry' | 'casaGlide';
interface LabGame {
  id: GameId;
  group: Group;
  hint: TKey;
  wide?: boolean;
  mood: Mood;
  /** `done(score)` con el puntaje 0–1 (sin valor = completo). */
  mount: (root: HTMLElement, done: (score?: number) => void, diff: DifficultyId) => MiniGameHandle;
}

const cb = (done: (score?: number) => void): MiniCallbacks => ({ onProgress: () => undefined, onDone: (r) => done(r) });
const hard = (d: DifficultyId): boolean => d === 'comandante';

const GAMES: readonly LabGame[] = [
  { id: 'wires', group: 'station', hint: 'hint.wires', mood: 'surface', mount: (r, d) => mountAntennaGame(r, cb(d)) },
  { id: 'message', group: 'station', hint: 'hint.message', mood: 'surface', mount: (r, d) => mountNoisyMessage(r, cb(d)) },
  { id: 'harvest', group: 'station', hint: 'hint.harvest', mood: 'greenhouse', mount: (r, d, k) => mountHarvestGame(r, cb(d), MINI_DIFFICULTY[k].time) },
  { id: 'heal', group: 'station', hint: 'hint.heal', mood: 'station', mount: (r, d, k) => mountHealGame(r, cb(d), MINI_DIFFICULTY[k].time) },
  { id: 'pedal', group: 'station', hint: 'hint.pedal', mood: 'station', mount: (r, d, k) => mountPedal(r, cb(d), MINI_DIFFICULTY[k].time) },
  { id: 'algae', group: 'station', hint: 'hint.algae', mood: 'greenhouse', mount: (r, d, k) => mountAlgae(r, cb(d), MINI_DIFFICULTY[k]) },
  { id: 'drill', group: 'station', hint: 'hint.drill', mood: 'surface', mount: (r, d) => mountIceDrill(r, cb(d)) },
  { id: 'dust', group: 'station', hint: 'hint.dust', mood: 'surface', mount: (r, d) => ({ ...mountDustGame(r, { dust: 0.6, onProgress: () => undefined, onDone: () => d() }), gesture: 'drag', keys: ['← ↑ → ↓'] }) },
  { id: 'seal', group: 'station', hint: 'hint.seal', mood: 'station', mount: (r, d) => ({ ...mountSealGame(r, { onProgress: () => undefined, onDone: () => d() }), gesture: 'drag', keys: ['← ↑ → ↓'] }) },
  { id: 'testPanel', group: 'station', hint: 'hint.testPanel', mood: 'surface', mount: (r, d, k) => ({ ...mountTestPanel(r, cb(d), MINI_DIFFICULTY[k].time), gesture: 'drag', keys: ['← ↑ → ↓'] }) },
  { id: 'dna', group: 'lab', hint: 'hint.dna', mood: 'greenhouse', mount: (r, d, k) => mountDnaWorkshop(r, { mission: 'huerto-lunar', hard: hard(k), onDone: d }) },
  { id: 'bio', group: 'lab', hint: 'hint.bio', mood: 'surface', mount: (r, d, k) => mountBiofirmas(r, { hard: hard(k), seed: Date.now() % 1000, onDone: d }) },
  { id: 'belt', group: 'probe', hint: 'hint.belt', wide: true, mood: 'space', mount: (r, d, k) => mountBelt(r, { hard: hard(k), seed: Date.now() % 1000, calm: state.calm, onDone: (x) => d(x.score) }) },
  { id: 'delivery', group: 'probe', hint: 'hint.delivery', wide: true, mood: 'space', mount: (r, d) => mountDelivery(r, () => d()) },
  { id: 'rover', group: 'probe', hint: 'hint.rover', wide: true, mood: 'moon', mount: (r, d, k) => mountRover(r, { hard: hard(k), batteries: 2, chips: 1, onDone: (x) => d(x.score) }) },
  { id: 'casaLink', group: 'casa', hint: 'hint.casaLink', mood: 'casa', mount: (r, d) => mountLink(r, (x) => d(x.score)) },
  { id: 'casaInspect', group: 'casa', hint: 'hint.casaInspect', mood: 'casa', mount: (r, d) => mountInspect(r, 4, (x) => d(x.score)) },
  { id: 'casaBurn', group: 'casa', hint: 'hint.casaBurn', mood: 'casa', mount: (r, d) => mountBurn(r, (x) => d(x.score)) },
  { id: 'casaReentry', group: 'casa', hint: 'hint.casaReentry', mood: 'casa', mount: (r, d) => mountReentry(r, 1, (x) => d(x.score)) },
  { id: 'casaGlide', group: 'casa', hint: 'hint.casaGlide', mood: 'casa', mount: (r, d) => mountGlide(r, (x) => d(x.score)) },
];

const GROUPS: readonly Group[] = ['station', 'lab', 'probe', 'casa'];
const DIFFS: readonly DifficultyId[] = ['cadete', 'piloto', 'comandante'];

export class MiniLabScene extends Phaser.Scene {
  private ui!: UiLayer;
  private handle?: MiniGameHandle;
  private timer?: Phaser.Time.TimerEvent;
  private diff: DifficultyId = 'piloto';
  private current?: LabGame;

  constructor() {
    super(SCENES.miniLab);
  }

  create(): void {
    audio.setMood('menu');
    fadeIn(this);
    drawStarfield(this, 'menu', !state.calm);
    this.ui = new UiLayer(this, '<div class="lab" data-lab></div>');
    this.ui
      .on('lab-play', (el) => this.play(GAMES.find((g) => g.id === el.dataset.game)!))
      .on('lab-diff', (el) => { this.diff = el.dataset.diff as DifficultyId; this.renderList(); })
      .on('lab-list', () => this.renderList())
      .on('lab-retry', () => { if (this.current) this.play(this.current); })
      .on('lab-menu', () => this.exit());
    const kb = this.input.keyboard!;
    kb.on('keydown', (ev: KeyboardEvent) => {
      audio.unlock();
      const k = ev.key.toLowerCase();
      if (k === 'escape') return this.handle ? this.renderList() : this.exit();
      if (!this.handle) return;
      if (k.startsWith('arrow')) {
        const dx = k === 'arrowright' ? 1 : k === 'arrowleft' ? -1 : 0;
        const dy = k === 'arrowdown' ? 1 : k === 'arrowup' ? -1 : 0;
        const stage = this.ui.el.querySelector<HTMLElement>('[data-mini-stage]');
        if (this.handle.nudge) this.handle.nudge(dx, dy);
        else if (stage) moveFocus(stage, dx, dy);
        ev.preventDefault();
      } else if (MINI_KEYS.has(k) && this.handle.key && (ev.repeat || this.handle.key(k, true))) ev.preventDefault();
    });
    kb.on('keyup', (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (MINI_KEYS.has(k) && this.handle?.key?.(k, false)) ev.preventDefault();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stop());
    this.renderList();
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

  /** Lista de minijuegos por grupo, con el selector de dificultad (cambia tiempos y ayudas). */
  private renderList(): void {
    this.stop();
    this.current = undefined;
    audio.setMood('menu');
    const groups = GROUPS.map((g) => `<section class="lab__group"><h2 class="heading lab__h">${t(`lab.group.${g}`)}</h2>
      <div class="lab__grid">${GAMES.filter((x) => x.group === g).map((x) => `<button class="mn-btn mn-btn--secondary lab__game" data-action="lab-play" data-game="${x.id}">${icon('play')}${esc(t(`lab.game.${x.id}`))}</button>`).join('')}</div></section>`).join('');
    this.ui.q('[data-lab]').innerHTML = `<div class="lab__panel mn-panel">
      <div class="lab__head">
        <h1 class="display-lg lab__title">${t('lab.title')}</h1>
        <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="lab-menu">${icon('home')}${t('common.menu')}</button>
      </div>
      <p class="mn-panel__body">${t('lab.body')}</p>
      <div class="lab__diffs" role="radiogroup" aria-label="${t('select.step.difficulty')}">${DIFFS.map((d) => `<button class="mn-btn mn-btn--sm ${d === this.diff ? '' : 'mn-btn--secondary'}" role="radio" aria-checked="${d === this.diff}" data-action="lab-diff" data-diff="${d}">${t(`difficulty.${d}.name`)}</button>`).join('')}</div>
      <div class="lab__groups">${groups}</div></div>`;
    this.ui.focusFirst('[data-action="lab-play"]');
  }

  /** Abre un minijuego con el marco común; al terminar muestra el resultado y deja repetir o volver a la lista. */
  private play(g: LabGame): void {
    this.stop();
    this.current = g;
    audio.setMood(g.mood);
    const root = this.ui.q('[data-lab]');
    root.innerHTML = `<div class="casa lab__play">${miniFrameHtml('lab-list')}<div class="casa__msgs" data-msgs>${miniMsgsHtml(t(g.hint))}</div></div>`;
    if (g.wide) root.querySelector('.mini-full')?.classList.add('mini-full--wide');
    const msgs = this.ui.q('[data-msgs]');
    this.handle = g.mount(this.ui.q('[data-mini-stage]'), (score) => {
      audio.play('achievement');
      const pct = Math.round((score ?? 1) * 100);
      showMiniResult(msgs, root, score ?? 1, `<b>${pct} %</b>`);
      msgs.insertAdjacentHTML('beforeend', `<div class="lab__after">
        <button class="mn-btn mn-btn--sm" data-action="lab-retry">${icon('retry')}${t('common.retry')}</button>
        <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="lab-list">${icon('list')}${t('lab.back')}</button></div>`);
      this.ui.focusFirst('[data-action="lab-retry"]');
    }, this.diff);
    decorateHint(msgs, this.handle);
  }
}
