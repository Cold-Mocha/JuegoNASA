import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { state } from '../core/state';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { STORY } from '../data/story';
import { michiSvg } from '../core/art';
import { tokenCss } from '../core/theme';
import { icon } from '../core/icons';

const COMMANDER = { id: 'miu' as const, name: 'Comandante Nébula', role: '', trait: '', fur: '#f5f5f2', furDark: '#c4c2e0', accent: 'nebula-violet' };

/** Historia introductoria: láminas de imagen + texto con efecto máquina de escribir. */
export class StoryScene extends Phaser.Scene {
  private index = 0;
  private image!: Phaser.GameObjects.Image;
  private ui!: UiLayer;
  private typing?: Phaser.Time.TimerEvent;
  private fullText = '';

  constructor() {
    super(SCENES.story);
  }

  preload(): void {
    STORY.forEach((s, i) => this.load.image(`story-${i}`, s.image));
  }

  create(): void {
    this.index = 0;
    fadeIn(this);
    this.image = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'story-0');

    this.ui = new UiLayer(this, /* html */ `
      <button class="mn-btn mn-btn--secondary mn-btn--sm story__skip" data-action="skip">${icon('skip')}Saltar</button>
      <div class="story__bottom">
        <div class="mn-dialogue story__dialogue" data-action="advance" role="button" tabindex="0" aria-live="polite">
          <div class="mn-dialogue__portrait story__portrait" data-portrait></div>
          <div>
            <p class="mn-dialogue__name" data-name></p>
            <p class="mn-dialogue__text" data-text></p>
            <div class="mn-dialogue__hint">Continuar <span class="mn-key">Espacio</span></div>
          </div>
        </div>
        <div class="story__meta"><span class="story__credit" data-credit></span><span class="story__dots" data-dots></span></div>
      </div>`, 'screen screen--clear');

    this.ui.on('advance', () => this.advance()).on('skip', () => this.finish());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-ESC', () => this.finish());
    this.show(0);
    this.ui.focusFirst('[data-action="advance"]');
  }

  private show(i: number): void {
    const slide = STORY[i];
    this.image.setTexture(`story-${i}`);
    this.fitCover(this.image);
    if (!state.settings.reducedMotion) {
      this.image.setAlpha(0);
      this.tweens.add({ targets: this.image, alpha: 1, duration: 350 });
    }

    const name = this.ui.q('[data-name]');
    name.textContent = slide.speaker ?? '';
    name.hidden = !slide.speaker;
    const portrait = this.ui.q('[data-portrait]');
    portrait.hidden = !slide.speaker;
    if (slide.speaker && !portrait.innerHTML) portrait.innerHTML = michiSvg(COMMANDER, tokenCss('nebula-violet'));
    this.ui.q('.story__dialogue').classList.toggle('is-narration', !slide.speaker);
    this.ui.q('[data-credit]').textContent = slide.credit ? `Fuente: ${slide.credit}` : '';
    this.ui.q('[data-dots]').innerHTML = STORY.map((_, k) => `<i class="${k === i ? 'is-on' : ''}"></i>`).join('');
    this.type(slide.text);
  }

  /** Escribe el texto letra a letra; un toque lo completa. */
  private type(text: string): void {
    this.typing?.remove();
    this.fullText = text;
    const el = this.ui.q('[data-text]');
    if (state.settings.reducedMotion) {
      el.textContent = text;
      return;
    }
    let n = 0;
    el.textContent = '';
    this.typing = this.time.addEvent({
      delay: 1000 / state.settings.textSpeed,
      repeat: text.length - 1,
      callback: () => (el.innerHTML = esc(text.slice(0, ++n))),
    });
  }

  private advance(): void {
    const el = this.ui.q('[data-text]');
    if (this.typing && this.typing.getRepeatCount() > 0) {
      this.typing.remove();
      this.typing = undefined;
      el.textContent = this.fullText;
      return;
    }
    if (++this.index >= STORY.length) return this.finish();
    this.show(this.index);
  }

  private finish(): void {
    this.input.keyboard?.removeAllListeners();
    if (state.progress.tutorialDone) return fadeTo(this, SCENES.select);
    // primera vez: antes de elegir misión, una sesión de entrenamiento aparte (estación de práctica con el Huerto lunar)
    state.training = true;
    state.loadout = { mission: 'huerto-lunar', character: 'miu', difficulty: 'cadete' };
    fadeTo(this, SCENES.launch);
  }

  private fitCover(img: Phaser.GameObjects.Image): void {
    const s = Math.max(GAME_WIDTH / img.width, GAME_HEIGHT / img.height);
    img.setScale(s);
  }
}
