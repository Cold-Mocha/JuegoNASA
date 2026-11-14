import type Phaser from 'phaser';

/**
 * Antes algunos objetos se dibujaban aquí en código. Ahora todos los objetos de la estación son SVG
 * generados por `herramientas/props_detallados.py` y se cargan en la pantalla del cohete (ver `data/preload.ts`).
 * Estas funciones quedan para que las escenas existentes sigan funcionando.
 */
export const drawnPropsReady = (_textures: Phaser.Textures.TextureManager): boolean => true;
export const addDrawnProps = (_textures: Phaser.Textures.TextureManager): Promise<void> => Promise.resolve();
