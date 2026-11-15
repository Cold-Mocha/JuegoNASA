import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { t, setLang, getLang, hasEnglish, detectLang } from '../../src/core/i18n';
import { EN } from '../../src/i18n/en';

describe('i18n', () => {
  beforeEach(() => setLang('es'));
  afterEach(() => vi.unstubAllGlobals());

  it('en español devuelve el texto de origen', () => {
    expect(t('Jugar')).toBe('Jugar');
  });

  it('en inglés traduce y cae al español si falta la traducción', () => {
    setLang('en');
    expect(getLang()).toBe('en');
    expect(t('Jugar')).toBe('Play');
    expect(t('Texto sin traducir')).toBe('Texto sin traducir');
  });

  it('reemplaza parámetros {nombre} y deja los que no se pasaron', () => {
    setLang('en');
    expect(t('Logros científicos ({n}/{total})', { n: 2, total: 9 })).toBe('Science achievements (2/9)');
    expect(t('Hola {x}', { y: 1 })).toBe('Hola {x}');
  });

  it('detecta el idioma del navegador: inglés si empieza con "en", español en los demás casos', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectLang()).toBe('en');
    vi.stubGlobal('navigator', { language: 'es-CL' });
    expect(detectLang()).toBe('es');
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(detectLang()).toBe('es');
  });

  it('el diccionario no tiene traducciones vacías ni con parámetros distintos al original', () => {
    const params = (s: string): string => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const [es, en] of Object.entries(EN)) {
      expect(en.trim(), `traducción vacía: ${es}`).not.toBe('');
      expect(params(en), `parámetros distintos en: ${es}`).toBe(params(es));
    }
  });

  it('hasEnglish refleja el diccionario', () => {
    expect(hasEnglish('Jugar')).toBe(true);
    expect(hasEnglish('xyz')).toBe(false);
  });
});
