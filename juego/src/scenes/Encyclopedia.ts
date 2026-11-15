import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { CATEGORIES, ENTRIES } from '../data/encyclopedia';
import { DONKI_ARCHIVE } from '../data/donki-archive';
import { READER_GOAL } from '../sim/achievements';
import { ACHIEVEMENTS } from '../data/achievements';
import { icon } from '../core/icons';
import { t } from '../core/i18n';
import { CATEGORY_ICON } from '../core/iconMap';

interface ArchiveData { from?: string; entry?: string; }

/** Archivo Científico / ¿Sabías qué?: los datos reales detrás de cada mecánica, con su fuente. */
export class EncyclopediaScene extends Phaser.Scene {
  private ui!: UiLayer;
  private from: string = SCENES.menu;

  constructor() {
    super(SCENES.archive);
  }

  create(data: ArchiveData): void {
    this.from = data?.from ?? SCENES.menu;
    const overlay = this.from === SCENES.station;
    if (!overlay) fadeIn(this);
    drawStarfield(this, 'archive', false);

    this.ui = new UiLayer(this, /* html */ `
      <div class="archive">
        <header class="archive__head">
          <div><h1 class="display-lg archive__title">${t('Archivo científico')}</h1>
          <p class="body archive__subtitle">${t('¿Sabías qué? Los datos reales detrás del juego. Leídas:')} <span data-read></span>/${ENTRIES.length}</p></div>
          <button class="mn-btn mn-btn--secondary" data-action="back">${icon('back')}${t('Volver')}</button>
        </header>
        <div class="archive__body">
          <ul class="archive__list" data-list></ul>
          <article class="mn-panel archive__detail" data-detail aria-live="polite"></article>
        </div>
        <p class="caption-mono archive__note">${t('Clima espacial: {n} semanas reales guardadas en el juego (archivo histórico, no en vivo).', { n: DONKI_ARCHIVE.length })}</p>
      </div>`);

    this.ui
      .on('back', () => this.back())
      .on('open', (el) => this.show(el.dataset.id!));
    this.input.keyboard?.on('keydown-ESC', () => this.back());

    this.renderList();
    this.show(data?.entry ?? ENTRIES[0].id);
  }

  private renderList(): void {
    const read = state.progress.readEntries;
    this.ui.q('[data-list]').innerHTML = ENTRIES
      .map((e) => `<li><button class="archive__item ${read.includes(e.id) ? 'is-read' : ''}" data-action="open" data-id="${e.id}">
        <span class="archive__item-title">${esc(e.title)}</span><span class="caption-mono">${icon(CATEGORY_ICON[e.category])}${esc(CATEGORIES[e.category])}</span></button></li>`)
      .join('');
  }

  private show(id: string): void {
    const e = ENTRIES.find((x) => x.id === id) ?? ENTRIES[0];
    this.ui.q('[data-detail]').innerHTML = `
      <span class="mn-chip mn-chip--science">${icon(CATEGORY_ICON[e.category])}${esc(CATEGORIES[e.category])}</span>
      <h2 class="mn-panel__title archive__detail-title">${esc(e.title)}</h2>
      <p class="mn-telemetry__value archive__fact">${esc(e.fact)}</p>
      <p class="mn-panel__body">${esc(e.text)}</p>
      <p class="archive__ingame"><strong>${t('En el juego:')}</strong> ${esc(e.inGame)}</p>
      <p class="caption-mono archive__source">${t('FUENTE')}: <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.source)}</a></p>`;
    this.ui.el.querySelectorAll<HTMLElement>('.archive__item').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === e.id)));
    const before = state.progress.readEntries.length;
    const count = state.markRead(e.id);
    this.ui.q('[data-read]').textContent = String(count);
    if (count !== before) this.ui.el.querySelector(`.archive__item[data-id="${e.id}"]`)?.classList.add('is-read');
    if (count >= READER_GOAL && state.unlock(['reader']).length) {
      audio.play('achievement');
      this.ui.q('.archive__note').textContent = t('¡Logro desbloqueado: {title}!', { title: ACHIEVEMENTS.reader.title });
    }
  }

  private back(): void {
    if (this.from === SCENES.station) {
      this.scene.resume(SCENES.station);
      this.scene.stop();
      return;
    }
    fadeTo(this, this.from === SCENES.report ? SCENES.report : SCENES.menu);
  }
}
