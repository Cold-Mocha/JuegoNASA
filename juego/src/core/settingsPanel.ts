import { state, type Settings } from './state';
import { applyComfort, applyTheme } from './theme';
import { audio } from './audio';
import { LANG_NAMES, getLang, setLang, t, type Lang } from './i18n';
import type { UiLayer } from './ui';

/** Herramientas de desarrollo (contador de FPS): solo con `?debug` en la dirección. */
const DEBUG = new URLSearchParams(location.search).has('debug');

/** Botones ES / EN (menú y Ajustes). */
export const langButtonsHtml = (): string => (Object.keys(LANG_NAMES) as Lang[])
  .map((l) => `<button class="mn-btn mn-btn--sm ${l === getLang() ? '' : 'mn-btn--secondary'}" data-action="lang" data-lang="${l}" aria-pressed="${l === getLang()}">${LANG_NAMES[l]}</button>`).join('');

/** HTML del panel de Ajustes (lo usan el menú principal y la pausa). `withLang`: muestra el idioma (cambiarlo reinicia la escena, así que en plena misión no se ofrece). */
export function settingsHtml(withLang = true): string {
  const s = state.settings;
  const check = (key: keyof Settings, label: string, hint: string): string =>
    `<label class="setting"><input type="checkbox" data-action="setting" data-key="${key}" ${(key === 'theme' ? s.theme === 'high-contrast' : s[key]) ? 'checked' : ''}/> <span>${label}<small class="setting__hint">${hint}</small></span></label>`;
  const range = (key: 'musicVolume' | 'sfxVolume', label: string): string =>
    `<label class="setting setting--range"><span>${label}</span><input type="range" min="0" max="100" step="10" value="${Math.round(s[key] * 100)}" data-range="${key}" aria-label="${label}"/></label>`;
  return `
    <h2 class="mn-panel__title">${t('settings.title')}</h2>
    ${withLang ? `<h3 class="setting__group">${t('settings.lang')}</h3><div class="setting__langs">${langButtonsHtml()}</div>` : ''}
    <h3 class="setting__group">${t('settings.audio')}</h3>
    ${range('musicVolume', t('settings.music'))}
    ${range('sfxVolume', t('settings.sfx'))}
    <h3 class="setting__group">${t('settings.comfort')}</h3>
    ${check('ultraLight', t('settings.ultraLight'), t('settings.ultraLight.hint'))}
    ${check('reducedMotion', t('settings.reducedMotion'), t('settings.reducedMotion.hint'))}
    ${check('theme', t('settings.contrast'), t('settings.contrast.hint'))}
    ${DEBUG ? check('showFps', t('settings.fps'), t('settings.fps.hint')) : ''}
    <div class="mn-panel__footer"><button class="mn-btn mn-btn--sm" data-action="close">${t('common.done')}</button></div>`;
}

/**
 * Conecta los controles del panel. `onThemeChange` permite a la escena redibujar el canvas (también se llama al cambiar de idioma).
 * Devuelve una función para desconectar el listener de los sliders.
 */
export function bindSettings(ui: UiLayer, onThemeChange: () => void): () => void {
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
  ui.on('lang', (el) => {
    const lang = el.dataset.lang as Lang;
    if (lang === getLang()) return;
    state.saveSettings({ lang });
    setLang(lang);
    onThemeChange();
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
