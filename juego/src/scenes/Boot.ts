import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { applyTheme, tokenCss } from '../core/theme';
import { addSvgTexture, capsuleSvg, michiSvg, rocketSvg } from '../core/art';
import { CHARACTERS } from '../data/characters';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  async create(): Promise<void> {
    applyTheme(state.settings.theme);
    // Phaser dibuja texto en canvas: las fuentes deben estar listas antes de la primera escena.
    await Promise.all([
      document.fonts.load('700 32px Fredoka'),
      document.fonts.load('600 20px Fredoka'),
      document.fonts.load('400 18px Fredoka'),
      document.fonts.load('700 32px "Space Mono"'),
    ]).catch(() => undefined); // si falla, se usa la fuente de respaldo

    const tex = this.textures;
    await Promise.all([
      addSvgTexture(tex, 'rocket', rocketSvg(), 52, 210),
      addSvgTexture(tex, 'csm', capsuleSvg(), 56, 112),
      ...CHARACTERS.map((c) => addSvgTexture(tex, `michi-${c.id}`, michiSvg(c, tokenCss(c.accent)), 160, 160)),
    ]);
    this.scene.start(SCENES.menu);
  }
}
