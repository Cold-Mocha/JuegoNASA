import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { tokenCss } from '../core/theme';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { michiSvg, missionArtSvg } from '../core/art';
import { MISSIONS, archiveFor, type MissionId } from '../data/missions';
import { CHARACTERS, type CharacterId } from '../data/characters';
import { DIFFICULTIES, type DifficultyId } from '../data/difficulties';
import { icon } from '../core/icons';
import { DIFFICULTY_ICON } from '../core/iconMap';

interface Option { id: string; title: string; subtitle: string; body: string; art: string; chip?: string; }
interface Step { key: 'mission' | 'character' | 'difficulty'; label: string; heading: string; options: Option[]; }

const STAR = '<svg class="mn-star is-earned" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C26 16 32 22 45 24C32 26 26 32 24 45C22 32 16 26 3 24C16 22 22 16 24 3Z"/></svg>';
const STAR_OFF = STAR.replace(' is-earned', '');

/** Selector en 3 pasos: Tripulante → Jornada científica → Dificultad. */
export class SelectScene extends Phaser.Scene {
  private step = 0;
  private picks: Record<Step['key'], string | null> = { mission: null, character: null, difficulty: null };
  private ui!: UiLayer;
  private steps: Step[] = [];

  constructor() {
    super(SCENES.select);
  }

  create(): void {
    this.step = 0;
    this.picks = {
      mission: state.loadout?.mission ?? null,
      character: state.loadout?.character ?? null,
      difficulty: state.loadout?.difficulty ?? null,
    };
    this.steps = [
      {
        key: 'character', label: 'Tripulante', heading: 'Elige tu tripulante',
        options: CHARACTERS.map((c) => ({
          id: c.id, title: c.name, subtitle: c.role, body: c.trait, art: michiSvg(c, tokenCss(c.accent)),
        })),
      },
      {
        key: 'mission', label: 'Jornada científica', heading: 'Jornadas científicas',
        options: MISSIONS.map((m) => {
          const best = state.progress.best[m.id];
          const flares = archiveFor(m).flares.length;
          return {
            id: m.id, title: m.name, subtitle: m.question, body: m.brief,
            art: missionArtSvg(m.id, tokenCss(m.accent)),
            chip: `${m.tasks.length} tareas, ${flares} llamarada${flares === 1 ? '' : 's'} real${flares === 1 ? '' : 'es'}${best ? ` ${'★'.repeat(best.stars)}` : ''}`,
          };
        }),
      },
      {
        key: 'difficulty', label: 'Dificultad', heading: '¿Qué tan difícil?',
        options: DIFFICULTIES.map((d) => ({
          id: d.id, title: d.name, subtitle: `Nivel ${d.stars}`, body: d.description,
          art: `<div class="option__icon">${icon(DIFFICULTY_ICON[d.id])}</div><div class="mn-stars">${STAR.repeat(d.stars)}${STAR_OFF.repeat(3 - d.stars)}</div>`,
        })),
      },
    ];

    fadeIn(this);
    drawStarfield(this, 'select', !state.calm);
    this.ui = new UiLayer(this, /* html */ `
      <div class="select">
        <ol class="stepper" data-stepper></ol>
        <h2 class="display-lg select__heading" data-heading></h2>
        <div class="select__grid" role="radiogroup" data-grid></div>
        <div class="select__footer">
          <button class="mn-btn mn-btn--secondary" data-action="back">${icon('back')}Atrás</button>
          <button class="mn-btn" data-action="next" data-next>Siguiente${icon('next')}</button>
        </div>
      </div>`);

    this.ui
      .on('pick', (el) => this.pick(el.dataset.id!))
      .on('back', () => (this.step === 0 ? fadeTo(this, SCENES.menu) : this.render(this.step - 1)))
      .on('next', () => this.next());

    // Navegación con flechas entre tarjetas (teclado / mando mapeado a flechas)
    this.ui.el.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      const cards = [...this.ui.el.querySelectorAll<HTMLElement>('.option')];
      const i = cards.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      const n = (i + (ev.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length;
      cards[n].focus();
      this.pick(cards[n].dataset.id!);
      ev.preventDefault();
    });

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
    this.ui.q('[data-heading]').textContent = step.heading;
    this.ui.q('[data-grid]').innerHTML = step.options
      .map((o) => `
        <button class="option" role="radio" aria-checked="${this.picks[step.key] === o.id}" data-action="pick" data-id="${esc(o.id)}">
          <div class="option__art">${o.art}</div>
          ${o.chip ? `<span class="mn-chip mn-chip--outline">${esc(o.chip)}</span>` : ''}
          <span class="title option__title">${esc(o.title)}</span>
          <span class="heading option__subtitle">${esc(o.subtitle)}</span>
          <span class="body-sm option__body">${esc(o.body)}</span>
        </button>`)
      .join('');
    const next = this.ui.q<HTMLButtonElement>('[data-next]');
    next.innerHTML = i === this.steps.length - 1 ? `${icon('rocket')}¡Despegar!` : `Siguiente${icon('next')}`;
    this.syncNext();
    this.ui.focusFirst(this.picks[step.key] ? `.option[data-id="${this.picks[step.key]}"]` : '.option');
  }

  private pick(id: string): void {
    const step = this.steps[this.step];
    this.picks[step.key] = id;
    this.ui.el.querySelectorAll<HTMLElement>('.option').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === id)));
    this.syncNext();
  }

  private syncNext(): void {
    this.ui.q<HTMLButtonElement>('[data-next]').disabled = !this.picks[this.steps[this.step].key];
  }

  private next(): void {
    if (this.step < this.steps.length - 1) return this.render(this.step + 1);
    const { mission, character, difficulty } = this.picks;
    if (!mission || !character || !difficulty) return;
    state.loadout = { mission: mission as MissionId, character: character as CharacterId, difficulty: difficulty as DifficultyId };
    fadeTo(this, SCENES.launch);
  }
}
