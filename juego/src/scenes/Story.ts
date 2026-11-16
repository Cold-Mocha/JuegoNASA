import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { UiLayer } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { mountDialogue } from '../core/dialogue';
import { INTRO } from '../data/prologueScript';
import type { MiniGameHandle } from '../core/miniGames';

/** Historia introductoria: carta, Academia y prólogo, con cajas de diálogo estilo RPG (retrato, nombre, texto letra a letra). */
export class StoryScene extends Phaser.Scene {
  private ui?: UiLayer;
  private dlg?: MiniGameHandle;

  constructor() {
    super(SCENES.story);
  }

  create(): void {
    fadeIn(this);
    this.ui = new UiLayer(this, '<div data-root style="width:100%;height:100%"></div>', 'screen');
    this.dlg = mountDialogue(this.ui.q('[data-root]'), INTRO, {
      lang: state.settings.lang === 'en' ? 'en' : 'es',
      calm: state.calm,
      muted: state.settings.sfxVolume <= 0,
      pilot: '',
      full: true,
      onDone: () => this.finish(),
    });
    this.input.keyboard?.on('keydown-ESC', () => this.finish());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dlg?.destroy());
  }

  private finish(): void {
    this.dlg?.destroy();
    this.input.keyboard?.removeAllListeners();
    if (state.progress.tutorialDone) return fadeTo(this, SCENES.select);
    // primera vez: antes de elegir misión, una sesión de entrenamiento aparte (estación de práctica con el Huerto lunar)
    state.training = true;
    state.loadout = { mission: 'huerto-lunar', character: 'miu', difficulty: 'cadete' };
    fadeTo(this, SCENES.launch);
  }
}
