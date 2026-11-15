import { es } from '../data/locales/es';
import { en } from '../data/locales/en';

/**
 * Traducción de la interfaz. El español es el idioma base: sus claves tipan a `t()`, así una clave mal escrita
 * o sin traducir no compila. El idioma se guarda en `state.settings.lang`; al cambiarlo, la escena se reinicia.
 */
export type Lang = 'es' | 'en';
export type TKey = keyof typeof es;

export const LANG_NAMES: Record<Lang, string> = { es: 'Español', en: 'English' };

const DICTS: Record<Lang, Record<TKey, string>> = { es, en };
let current: Lang = 'es';

/** Idioma inicial según el navegador: español si está configurado en español; si no, inglés. */
export const detectLang = (): Lang => (navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en');

export const getLang = (): Lang => current;

/** Locale para fechas y números. */
export const dateLocale = (): string => (current === 'es' ? 'es-CL' : 'en-US');

/** Texto de una clave; `vars` reemplaza los `{nombre}` del texto. */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  const text = DICTS[current][key];
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

/** Cambia el idioma: actualiza `<html lang>` y el aviso de girar el teléfono (está fuera del canvas). */
export function setLang(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
  const notice = document.querySelector('[data-rotate-notice]');
  if (notice) notice.textContent = t('app.rotate');
}
