import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import { audio } from './audio';

/**
 * Capa de interfaz HTML sobre el canvas (Phaser DOMElement): escala junto con el juego
 * y reutiliza las clases `mn-*` del design system. Acciones por delegación: `data-action="..."`.
 */
export class UiLayer {
  readonly el: HTMLDivElement;
  /** Objeto de Phaser que contiene la capa (para asignarlo a una cámara). */
  readonly dom: Phaser.GameObjects.DOMElement;
  private readonly handlers = new Map<string, (target: HTMLElement) => void>();

  constructor(scene: Phaser.Scene, html: string, className = 'screen') {
    this.el = document.createElement('div');
    this.el.className = `mn-root ${className}`;
    this.el.style.width = `${GAME_WIDTH}px`;
    this.el.style.height = `${GAME_HEIGHT}px`;
    this.el.innerHTML = html;
    this.dom = scene.add.dom(0, 0, this.el).setOrigin(0, 0).setScrollFactor(0); // fija a la pantalla aunque la cámara siga al michi
    this.el.addEventListener('click', this.onClick);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  on(action: string, fn: (target: HTMLElement) => void): this {
    this.handlers.set(action, fn);
    return this;
  }

  q<T extends HTMLElement = HTMLElement>(selector: string): T {
    const node = this.el.querySelector<T>(selector);
    if (!node) throw new Error(`UiLayer: no existe "${selector}"`);
    return node;
  }

  /** Mueve el foco al primer elemento navegable (teclado / mando). */
  focusFirst(selector = '[data-action]'): void {
    requestAnimationFrame(() => this.el.querySelector<HTMLElement>(selector)?.focus());
  }

  private onClick = (ev: MouseEvent): void => {
    const target = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target || target.hasAttribute('disabled')) return;
    audio.unlock();
    audio.play('click');
    this.handlers.get(target.dataset.action!)?.(target);
  };

  destroy(): void {
    this.el.removeEventListener('click', this.onClick);
    this.dom.destroy();
  }
}

/** Escapa texto que venga de datos antes de interpolarlo en HTML. */
export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
