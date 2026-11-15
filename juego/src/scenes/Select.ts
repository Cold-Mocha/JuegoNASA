import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { tokenCss } from '../core/theme';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { michiSvg, missionArtSvg } from '../core/art';
import { MISSIONS, archiveFor, missionText, type MissionId } from '../data/missions';
import { CHARACTERS, characterRole, characterTrait, type CharacterId } from '../data/characters';
import { DIFFICULTIES, difficultyDescription, difficultyName, type DifficultyId } from '../data/difficulties';
import { icon } from '../core/icons';
import { DIFFICULTY_ICON } from '../core/iconMap';
import { MICHI_ANIMS, type MichiAnim } from '../data/preload';
import { t } from '../core/i18n';

interface Option { id: string; title: string; subtitle: string; body: string; art: string; chips?: string[]; }
interface Step { key: 'mission' | 'character' | 'difficulty'; label: string; options: Option[]; }

const STAR = '<svg class="mn-star is-earned" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C26 16 32 22 45 24C32 26 26 32 24 45C22 32 16 26 3 24C16 22 22 16 24 3Z"/></svg>';
const STAR_OFF = STAR.replace(' is-earned', '');

/** Vista previa del michi: cada ACTION_EVERY_MS hace una de estas acciones durante `sec` segundos y vuelve a estar quieto. */
const ACTION_EVERY_MS = 8000;
const PREVIEW_ACTIONS: { anim: MichiAnim; sec: number }[] = [
  { anim: 'walk', sec: 2.4 }, { anim: 'use', sec: 2.4 }, { anim: 'smile', sec: 2.4 }, { anim: 'blink', sec: 1.5 },
];

/** «Casa» se desbloquea al ganar las tres jornadas. */
const casaUnlocked = (): boolean => MISSIONS.every((m) => (state.progress.best[m.id]?.stars ?? 0) >= 1);
const CASA_ART = '<svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="70" fill="#4cc3f5" opacity=".18"/><circle cx="96" cy="108" r="44" fill="#3a8de0" stroke="#0e0b33" stroke-width="4"/><path d="M80 96 q12 -10 24 2 q-4 14 -16 10Z" fill="#5ad6b2" stroke="#0e0b33" stroke-width="3"/><path d="M52 24 C62 36 64 52 62 68 L72 80 L56 76 L52 86 L48 76 L32 80 L42 68 C40 52 42 36 52 24Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/></svg>';

/** Selector en 3 pasos: Tripulante → Jornada científica → Dificultad. */
export class SelectScene extends Phaser.Scene {
  private step = 0;
  private picks: Record<Step['key'], string | null> = { mission: null, character: null, difficulty: null };
  private ui!: UiLayer;
  private steps: Step[] = [];
  private pvId: CharacterId = CHARACTERS[0].id;
  private pvFrame = 0;
  private pvFrameTimer?: number;
  private pvActionTimer?: number;
  private pvBackTimer?: number;
  private pvLast = -1;

  constructor() {
    super(SCENES.select);
  }

  create(): void {
    this.step = 0;
    this.picks = {
      // la primera vez ya viene elegido lo más fácil: basta con pulsar Siguiente
      mission: state.loadout?.mission ?? 'huerto-lunar',
      character: state.loadout?.character ?? 'miu',
      difficulty: state.loadout?.difficulty ?? 'cadete',
    };
    this.steps = [
      {
        key: 'character', label: t('select.step.character'),
        options: CHARACTERS.map((c) => ({
          id: c.id, title: c.name, subtitle: characterRole(c.id), body: characterTrait(c.id), art: michiSvg(c, tokenCss(c.accent)),
        })),
      },
      {
        key: 'mission', label: t('select.step.mission'),
        options: [...MISSIONS.map((m) => {
          const best = state.progress.best[m.id];
          const flares = archiveFor(m).flares.length;
          return {
            id: m.id, title: missionText(m.id, 'name'), subtitle: missionText(m.id, 'question'), body: missionText(m.id, 'brief'),
            art: missionArtSvg(m.id, tokenCss(m.accent)),
            chips: [t('select.tasks', { n: m.tasks.length }), t('select.new', { name: missionText(m.id, 'newObject') }), t(flares === 1 ? 'select.flares.one' : 'select.flares.many', { n: flares }), ...(best ? ['★'.repeat(best.stars)] : [])],
          };
        }),
          ...(casaUnlocked() ? [{
            id: 'casa', title: t('casa.name'), subtitle: t('casa.subtitle'), body: t('casa.body'),
            art: CASA_ART, chips: [t('casa.phases'), ...(state.progress.casa ? ['★'.repeat(state.progress.casa.stars)] : [])],
          }] : []),
        ],
      },
      {
        key: 'difficulty', label: t('select.step.difficulty'),
        options: DIFFICULTIES.map((d) => ({
          id: d.id, title: difficultyName(d.id), subtitle: '', body: difficultyDescription(d.id), // las estrellas ya dicen el nivel
          art: `<div class="option__icon">${icon(DIFFICULTY_ICON[d.id])}</div><div class="mn-stars">${STAR.repeat(d.stars)}${STAR_OFF.repeat(3 - d.stars)}</div>`,
        })),
      },
    ];

    fadeIn(this);
    drawStarfield(this, 'select', !state.calm);
    this.ui = new UiLayer(this, /* html */ `
      <div class="select">
        <ol class="stepper" data-stepper></ol>
        <div class="select__grid" role="radiogroup" data-grid></div>
        <div class="select__footer">
          <button class="mn-btn mn-btn--secondary" data-action="back">${t('select.back')}</button>
          <button class="mn-btn" data-action="next" data-next>${t('select.next')}</button>
        </div>
      </div>`);

    this.ui
      .on('pick', (el) => this.pick(el.dataset.id!))
      .on('back', () => (this.step === 0 ? fadeTo(this, SCENES.menu) : this.render(this.step - 1)))
      .on('next', () => this.next());

    // Navegación con flechas entre tarjetas (teclado / mando mapeado a flechas)
    this.ui.el.addEventListener('keydown', (ev) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(ev.key)) return;
      const cards = [...this.ui.el.querySelectorAll<HTMLElement>('.option')];
      const i = cards.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      const n = (i + (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : -1) + cards.length) % cards.length;
      cards[n].focus();
      this.pick(cards[n].dataset.id!);
      ev.preventDefault();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopPreview());
    this.render(0);
  }

  private render(i: number): void {
    // pista de dirección: Siguiente trae las tarjetas desde la derecha; Atrás, desde la izquierda
    this.ui.q('[data-grid]').dataset.dir = i < this.step ? 'back' : 'next';
    this.step = i;
    const step = this.steps[i];
    this.ui.q('[data-stepper]').innerHTML = this.steps
      .map((s, k) => `<li class="stepper__item ${k === i ? 'is-current' : k < i ? 'is-done' : ''}"><span class="stepper__num">${k + 1}</span>${esc(s.label)}</li>`)
      .join('');
    const grid = this.ui.q('[data-grid]');
    this.stopPreview();
    grid.classList.toggle('is-roster', step.key === 'character');
    grid.classList.toggle('is-compact', step.key === 'difficulty');
    if (step.key === 'character') {
      // michis en vertical a la izquierda y, al lado, el michi completo haciendo cosas
      const cards = step.options.map((o) => `
        <button class="option option--row" role="radio" aria-checked="${this.picks.character === o.id}" data-action="pick" data-id="${esc(o.id)}">
          <div class="option__art">${o.art}</div>
          <span class="option__text">
            <span class="title option__title">${esc(o.title)}</span>
            <span class="heading option__subtitle">${esc(o.subtitle)}</span>
            <span class="body-sm option__body">${esc(o.body)}</span>
          </span>
        </button>`).join('');
      grid.innerHTML = `<div class="roster">${cards}</div>
        <aside class="preview mn-panel" aria-label="${t('select.preview')}">
          <div class="preview__stage"><div class="preview__sprite" data-preview-sprite role="img" aria-label="${t('select.sprite')}"></div></div>
        </aside>`;
      this.startPreview((this.picks.character as CharacterId | null) ?? CHARACTERS[0].id);
    } else {
      grid.innerHTML = step.options
        .map((o) => `
        <button class="option" role="radio" aria-checked="${this.picks[step.key] === o.id}" data-action="pick" data-id="${esc(o.id)}">
          <div class="option__art">${o.art}</div>
          ${o.chips ? `<span class="option__chips">${o.chips.map((c) => `<span class="mn-chip mn-chip--outline">${esc(c)}</span>`).join('')}</span>` : ''}
          <span class="title option__title">${esc(o.title)}</span>
          ${o.subtitle ? `<span class="heading option__subtitle">${esc(o.subtitle)}</span>` : ''}
          <span class="body-sm option__body">${esc(o.body)}</span>
        </button>`)
        .join('');
    }
    const next = this.ui.q<HTMLButtonElement>('[data-next]');
    next.innerHTML = i === this.steps.length - 1 ? `${icon('rocket')}${t('select.launch')}` : t('select.next');
    this.syncNext();
    this.ui.focusFirst(this.picks[step.key] ? `.option[data-id="${this.picks[step.key]}"]` : '.option');
  }

  private pick(id: string): void {
    const step = this.steps[this.step];
    this.picks[step.key] = id;
    if (step.key === 'character') this.startPreview(id as CharacterId, true);
    this.ui.el.querySelectorAll<HTMLElement>('.option').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === id)));
    this.syncNext();
  }

  // ---------- vista previa del michi (hoja de sprites animada con CSS; sin movimiento si se pidió menos movimiento) ----------
  private startPreview(id: CharacterId, greet = false): void {
    this.stopPreview();
    this.pvId = id;
    this.setPreviewAnim('idle');
    if (state.calm) return;
    if (greet) this.doAction({ anim: 'smile', sec: 1.6 });
    this.pvActionTimer = window.setInterval(() => {
      let a = PREVIEW_ACTIONS[Math.floor(Math.random() * PREVIEW_ACTIONS.length)];
      if (PREVIEW_ACTIONS.length > 1 && PREVIEW_ACTIONS.indexOf(a) === this.pvLast) a = PREVIEW_ACTIONS[(PREVIEW_ACTIONS.indexOf(a) + 1) % PREVIEW_ACTIONS.length];
      this.pvLast = PREVIEW_ACTIONS.indexOf(a);
      this.doAction(a);
    }, ACTION_EVERY_MS);
  }

  /** Hace una acción durante `sec` segundos y vuelve a estar quieto. */
  private doAction(a: { anim: MichiAnim; sec: number }): void {
    window.clearTimeout(this.pvBackTimer);
    this.setPreviewAnim(a.anim);
    this.pvBackTimer = window.setTimeout(() => this.setPreviewAnim('idle'), a.sec * 1000);
  }

  private setPreviewAnim(anim: MichiAnim): void {
    window.clearInterval(this.pvFrameTimer);
    this.pvFrame = 0;
    const cfg = MICHI_ANIMS[anim];
    const el = this.ui.el.querySelector<HTMLElement>('[data-preview-sprite]');
    if (!el) return;
    el.style.backgroundImage = `url(game/michi/${this.pvId}/sin-casco/${anim}.png)`;
    // porcentajes: el sprite se adapta al alto disponible sin cambiar la lógica de cuadros
    el.style.backgroundSize = `${cfg.frames * 100}% 100%`;
    const show = (): void => void (el.style.backgroundPosition = `${cfg.frames > 1 ? (this.pvFrame / (cfg.frames - 1)) * 100 : 0}% 0`);
    show();
    if (state.calm) return;
    this.pvFrameTimer = window.setInterval(() => {
      this.pvFrame = (this.pvFrame + 1) % cfg.frames;
      show();
    }, 1000 / cfg.fps);
  }

  private stopPreview(): void {
    window.clearInterval(this.pvFrameTimer);
    window.clearInterval(this.pvActionTimer);
    window.clearTimeout(this.pvBackTimer);
  }

  private syncNext(): void {
    this.ui.q<HTMLButtonElement>('[data-next]').disabled = !this.picks[this.steps[this.step].key];
  }

  private next(): void {
    // la misión final no pide dificultad: va directo a sus 4 fases
    if (this.steps[this.step].key === 'mission' && this.picks.mission === 'casa') return fadeTo(this, SCENES.reentry);
    if (this.step < this.steps.length - 1) return this.render(this.step + 1);
    const { mission, character, difficulty } = this.picks;
    if (!mission || !character || !difficulty) return;
    state.loadout = { mission: mission as MissionId, character: character as CharacterId, difficulty: difficulty as DifficultyId };
    fadeTo(this, SCENES.launch);
  }
}
