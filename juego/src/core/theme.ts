/** Puente entre los tokens CSS del design system y el canvas de Phaser. */
export type ThemeId = 'deep-space' | 'high-contrast';

const cache = new Map<string, number>();

/** Lee un token de color (`--star-gold`) y lo devuelve como número 0xRRGGBB para Phaser. */
export function tokenColor(name: string): number {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (!m) throw new Error(`Token de color "${name}" no es hex (valor: "${raw}")`);
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const value = parseInt(hex, 16);
  cache.set(name, value);
  return value;
}

/** Igual que tokenColor pero como string CSS, para Phaser.Text. */
export const tokenCss = (name: string): string => `#${tokenColor(name).toString(16).padStart(6, '0')}`;

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
  cache.clear();
}

/**
 * Ajustes del juego que el CSS también debe respetar (además de las preferencias del sistema):
 * `data-calm` = reducir movimiento (solo fundidos cortos); `data-solid` = paneles sólidos, sin desenfoque (Ultra Ligero).
 */
export function applyComfort(opts: { calm: boolean; solid: boolean }): void {
  const root = document.documentElement;
  root.toggleAttribute('data-calm', opts.calm);
  root.toggleAttribute('data-solid', opts.solid);
}

export const FONT_DISPLAY = 'Fredoka';
export const FONT_MONO = '"Space Mono"';
