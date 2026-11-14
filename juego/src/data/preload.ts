import type Phaser from 'phaser';
import type { Loadout } from '../core/state';
import { propAssetsFor } from './rooms';

/** Animaciones del michi de papel (assets/personajes/michi-papel/animaciones/animaciones.json). */
export const MICHI_ANIMS = {
  idle: { frames: 2, fps: 2, loop: true },
  blink: { frames: 3, fps: 12, loop: false },
  walk: { frames: 2, fps: 6, loop: true },
  use: { frames: 3, fps: 8, loop: false },
  hurt: { frames: 3, fps: 10, loop: false },
  smile: { frames: 2, fps: 4, loop: true },
} as const;
export type MichiAnim = keyof typeof MICHI_ANIMS;
export const MICHI_FRAME = 256;
export const MICHI_ANCHOR = { x: 132 / 256, y: 225 / 256 };

export const propKey = (asset: string): string => `prop-${asset}`;
export const michiKey = (helmet: boolean, anim: MichiAnim): string => `michi-${helmet ? 'casco' : 'sin-casco'}-${anim}`;

/**
 * Assets que se cargan DURANTE la pantalla del cohete (la barra refleja el progreso real).
 * Solo se carga la variante del tripulante elegido (exportados por herramientas/exportar_juego.py).
 * El plano de la estación no se descarga: se rasteriza desde SVG (`core/stationArt.ts`) en la misma pantalla.
 */
export function queueStationAssets(load: Phaser.Loader.LoaderPlugin, loadout: Loadout): void {
  const { plain, marked } = propAssetsFor(loadout.mission);
  for (const asset of [...plain, ...marked, 'reciclador-roto', 'reciclador-roto-marcado']) if (!load.textureManager.exists(propKey(asset))) load.svg(propKey(asset), `game/props/${asset}.svg`, { scale: 1.25 });
  for (const helmet of [false, true]) {
    for (const anim of Object.keys(MICHI_ANIMS) as MichiAnim[]) {
      const key = michiKey(helmet, anim);
      // la textura cambia con el tripulante: se reemplaza si ya existía de otra partida
      if (load.textureManager.exists(key)) load.textureManager.remove(key);
      load.spritesheet(key, `game/michi/${loadout.character}/${helmet ? 'casco' : 'sin-casco'}/${anim}.png`, { frameWidth: MICHI_FRAME, frameHeight: MICHI_FRAME });
    }
  }
}
