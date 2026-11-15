import { state, type Settings } from './state';
import { applyComfort, applyTheme } from './theme';
import { audio } from './audio';
import type { UiLayer } from './ui';
import { icon } from './icons';
import { LANGS, getLang, t, type Lang } from './i18n';

const LANG_NAME: Record<Lang, string> = { es: 'Español', en: 'English' };

/** Selector de idioma (Español | English): botones con `data-action="lang"`; lo conecta `bindSettings`. */
export function languageSwitchHtml(): string {
  return `<div class="lang-switch" role="group" aria-label="Idioma / Language">${LANGS.map(
    (l) => `<button class="mn-btn mn-btn--sm ${getLang() === l ? '' : 'mn-btn--secondary'}" data-action="lang" data-lang="${l}" lang="${l}" aria-pressed="${getLang() === l}">${LANG_NAME[l]}</button>`,
  ).join('')}</div>`;
}

/** HTML del panel de Ajustes (lo usan el menú principal y la pausa). */
export function settingsHtml(withLang = false): string {
  const s = state.settings;
  const check = (key: keyof Settings, label: string, hint: string): string =>
    `<label class="setting"><input type="checkbox" data-action="setting" data-key="${key}" ${(key === 'theme' ? s.theme === 'high-contrast' : s[key]) ? 'checked' : ''}/> <span>${t(label)}<small class="setting__hint">${t(hint)}</small></span></label>`;
  const range = (key: 'musicVolume' | 'sfxVolume', label: string): string =>
    `<label class="setting setting--range"><span>${t(label)}</span><input type="range" min="0" max="100" step="10" value="${Math.round(s[key] * 100)}" data-range="${key}" aria-label="${t(label)}"/></label>`;
  return `
    <h2 class="mn-panel__title">${t('Ajustes')}</h2>
    ${withLang ? `<h3 class="setting__group">${t('Idioma')}</h3>${languageSwitchHtml()}` : ''}
    <h3 class="setting__group">${t('Audio')}</h3>
    ${range('musicVolume', 'Música')}
    ${range('sfxVolume', 'Efectos')}
    <h3 class="setting__group">${t('Rendimiento y accesibilidad')}</h3>
    ${check('ultraLight', 'Modo Ultra Ligero', 'Para computadores antiguos: dibujo más simple, sin partículas ni destellos (se aplica al recargar).')}
    ${check('reducedMotion', 'Reducir movimiento', 'Sin sacudidas ni rebotes.')}
    ${check('theme', 'Alto contraste', 'Colores más marcados.')}
    ${check('showFps', 'Mostrar FPS', 'Cuadros por segundo, para revisar el rendimiento.')}
    <div class="mn-panel__footer"><button class="mn-btn mn-btn--sm" data-action="close">${icon('check')}${t('Listo')}</button></div>`;
}

/**
 * Conecta los controles del panel. `onThemeChange` permite a la escena redibujar el canvas.
 * Devuelve una función para desconectar el listener de los sliders.
 */
export function bindSettings(ui: UiLayer, onThemeChange: () => void, onLangChange?: () => void): () => void {
  ui.on('lang', (el) => {
    const lang = el.dataset.lang as Lang;
    if (lang === getLang()) return;
    state.saveSettings({ lang });
    (onLangChange ?? (() => window.location.reload()))(); // recargar: todos los datos se traducen al cargar
  });
  ui.on('setting', (el) => {
    const input = el as HTMLInputElement;
    const key = input.dataset.key as keyof Settings;
    if (key === 'theme') {
      const theme = input.checked ? 'high-contrast' : 'deep-space';
      state.saveSettings({ theme });
      applyTheme(theme);
      onThemeChange();
      return;
    }
    state.saveSettings({ [key]: input.checked } as Partial<Settings>);
    applyComfort({ calm: state.calm, solid: state.settings.ultraLight });
  });
  const onInput = (ev: Event): void => {
    const input = ev.target as HTMLInputElement;
    const key = input.dataset.range as 'musicVolume' | 'sfxVolume' | undefined;
    if (!key) return;
    state.saveSettings({ [key]: Number(input.value) / 100 });
    audio.applyVolumes();
    if (key === 'sfxVolume') audio.play('click');
  };
  ui.el.addEventListener('input', onInput);
  return () => ui.el.removeEventListener('input', onInput);
}
