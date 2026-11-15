import Phaser from 'phaser';
import { SCENES, GAME_WIDTH } from '../core/config';
import { state } from '../core/state';
import { tokenColor } from '../core/theme';
import { drawStarfield } from '../core/starfield';
import { UiLayer } from '../core/ui';
import { fadeTo, fadeIn } from '../core/fade';
import { settingsHtml, bindSettings, languageSwitchHtml } from '../core/settingsPanel';
import { t } from '../core/i18n';
import { ACHIEVEMENTS } from '../data/achievements';
import type { AchievementId } from '../sim/achievements';
import { icon } from '../core/icons';
import { ACHIEVEMENT_ICON } from '../core/iconMap';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    state.training = false; // volver al menú cancela un entrenamiento a medias
    fadeIn(this);
    drawStarfield(this, 'menu', !state.calm);
    this.drawPlanet();

    const ui = new UiLayer(this, /* html */ `
      <div class="menu">
        <div class="menu__lang">${languageSwitchHtml()}</div>
        <h1 class="display-xl menu__title">MICHINAUTAS</h1>
        <p class="body menu__subtitle">${t('Entrena como astronauta junior')}</p>
        <nav class="menu__actions" aria-label="${t('Menú principal')}">
          <button class="mn-btn menu__play" data-action="play">${icon('rocket')}${t('Jugar')}</button>
          <button class="mn-btn mn-btn--secondary" data-action="archive">${icon('book')}${t('Archivo científico')}</button>
          <button class="mn-btn mn-btn--secondary" data-action="achievements">${icon('trophy')}${t('Logros')}</button>
          <button class="mn-btn mn-btn--secondary" data-action="settings">${icon('gear')}${t('Ajustes')}</button>
          <button class="mn-btn mn-btn--secondary" data-action="credits">${icon('info')}${t('Créditos')}</button>
        </nav>
        <p class="caption-mono menu__footer">${t('Proyecto creado para el NASA Space Apps Challenge 2026')}</p>
      </div>
      <div class="modal" data-modal hidden></div>`);

    const modal = ui.q('[data-modal]');
    const openModal = (html: string): void => {
      modal.innerHTML = `<div class="mn-panel modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div>`;
      modal.querySelector('.mn-panel__title')?.setAttribute('id', 'modal-title');
      modal.hidden = false;
      ui.focusFirst('.modal [data-action]');
    };
    const closeModal = (): void => {
      modal.hidden = true;
      ui.focusFirst();
    };

    ui.on('play', () => fadeTo(this, SCENES.story))
      .on('close', closeModal)
      .on('archive', () => fadeTo(this, SCENES.archive))
      .on('settings', () => openModal(settingsHtml(true)))
      .on('achievements', () => {
        const owned = state.progress.achievements;
        const items = (Object.keys(ACHIEVEMENTS) as AchievementId[])
          .map((id) => `<li class="achievement ${owned.includes(id) ? 'is-earned' : ''}"><span class="achievement__medal" aria-hidden="true">${owned.includes(id) ? icon(ACHIEVEMENT_ICON[id]) : '?'}</span>
            <span><strong>${t(ACHIEVEMENTS[id].title)}</strong><small>${t(ACHIEVEMENTS[id].text)}</small></span></li>`)
          .join('');
        openModal(`<h2 class="mn-panel__title">${t('Logros científicos ({n}/{total})', { n: owned.length, total: Object.keys(ACHIEVEMENTS).length })}</h2>
          <ul class="achievement-list">${items}</ul>
          <div class="mn-panel__footer"><button class="mn-btn mn-btn--sm" data-action="close">${icon('close')}${t('Cerrar')}</button></div>`);
      })
      .on('credits', () =>
        openModal(`
          <h2 class="mn-panel__title">${t('Créditos')}</h2>
          <p class="mn-panel__body">${t('Equipo Michinautas, Universidad de La Frontera, Temuco.')}</p>
          <p class="mn-panel__body">${t('Proyecto creado para el NASA Space Apps Challenge 2026. Usa datos e imágenes abiertas de la NASA; la NASA no respalda este proyecto.')}</p>
          <p class="mn-panel__body">${t('Datos científicos: NASA (DONKI, Fact Sheets, OSDR, Science), NOAA SWPC, ESA y Zhang et al. 2020. Lista completa en el Archivo científico.')}</p>
          <p class="mn-panel__body">${t('Sonido y música generados por código (Web Audio API).')}</p>
          <p class="caption-mono">${t('Fuentes tipográficas: Fredoka y Space Mono (SIL OFL 1.1).')}</p>
          <div class="mn-panel__footer"><button class="mn-btn mn-btn--sm" data-action="close">${icon('close')}${t('Cerrar')}</button></div>`),
      );

    bindSettings(ui, () => this.scene.restart()); // el tema redibuja el canvas con los nuevos colores
    this.input.keyboard?.on('keydown-ESC', () => !modal.hidden && closeModal());
    ui.focusFirst();
  }

  private drawPlanet(): void {
    const g = this.add.graphics();
    const x = GAME_WIDTH - 180, y = 600;
    g.fillStyle(tokenColor('nebula-violet'), 1).fillCircle(x, y, 210);
    g.fillStyle(tokenColor('space-600'), 0.55).fillCircle(x + 60, y + 40, 150);
    g.lineStyle(10, tokenColor('nebula-magenta'), 1).strokeEllipse(x, y, 620, 120);
    if (!state.calm) this.tweens.add({ targets: g, y: -10, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
