import { state, type Settings } from './state';
import { applyComfort, applyTheme } from './theme';
import { audio } from './audio';
import type { UiLayer } from './ui';

/** Herramientas de desarrollo (contador de FPS): solo con `?debug` en la dirección. */
const DEBUG = new URLSearchParams(location.search).has('debug');

/** HTML del panel de Ajustes (lo usan el menú principal y la pausa). */
export function settingsHtml(): string {
  const s = state.settings;
  const check = (key: keyof Settings, label: string, hint: string): string =>
    `<label class="setting"><input type="checkbox" data-action="setting" data-key="${key}" ${(key === 'theme' ? s.theme === 'high-contrast' : s[key]) ? 'checked' : ''}/> <span>${label}<small class="setting__hint">${hint}</small></span></label>`;
  const range = (key: 'musicVolume' | 'sfxVolume', label: string): string =>
    `<label class="setting setting--range"><span>${label}</span><input type="range" min="0" max="100" step="10" value="${Math.round(s[key] * 100)}" data-range="${key}" aria-label="${label}"/></label>`;
  return `
    <h2 class="mn-panel__title">Ajustes</h2>
    <h3 class="setting__group">Audio</h3>
    ${range('musicVolume', 'Música')}
    ${range('sfxVolume', 'Efectos')}
    <h3 class="setting__group">Rendimiento y accesibilidad</h3>
    ${check('ultraLight', 'Modo Ultra Ligero', 'Para computadores antiguos: dibujo más simple, sin partículas ni destellos (se aplica al recargar).')}
    ${check('reducedMotion', 'Reducir movimiento', 'Sin sacudidas ni rebotes.')}
    ${check('theme', 'Alto contraste', 'Colores más marcados.')}
    ${DEBUG ? check('showFps', 'Mostrar FPS', 'Cuadros por segundo, para revisar el rendimiento.') : ''}
    <div class="mn-panel__footer"><button class="mn-btn mn-btn--sm" data-action="close">Listo</button></div>`;
}

/**
 * Conecta los controles del panel. `onThemeChange` permite a la escena redibujar el canvas.
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
