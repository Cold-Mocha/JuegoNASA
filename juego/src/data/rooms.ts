import type { ActionId, RoomId } from '../sim/types';
import { ROOM_RECTS, type Point } from '../sim/stationMap';

/**
 * Salas de la Estación Central sobre el plano continuo (`sim/stationMap.ts`).
 * Posiciones (x, y) relativas a la esquina del piso de cada sala, en px de mapa:
 * todos los objetos van en el piso ('interactive' y 'deco'): (x, y) = pies del objeto (centro inferior).
 * Cada máquina dice sus acciones (vacío = sala de lectura o información) y, si hace falta, su propio nombre.
 */
export type PropKind = 'interactive' | 'deco';

export interface RoomProp {
  asset: string;
  kind: PropKind;
  x: number;
  y: number;
  actions?: ActionId[];
  /** Nombre que se muestra al usarla (por defecto, el de la sala). */
  name?: string;
}

export interface Room {
  id: RoomId;
  name: string;
  props: RoomProp[];
}

const machine = (asset: string, x: number, y: number, actions: ActionId[], name?: string): RoomProp => ({ asset, kind: 'interactive', x, y, actions, name });
const deco = (asset: string, x: number, y: number): RoomProp => ({ asset, kind: 'deco', x, y });

export const ROOMS: Record<RoomId, Room> = {
  soporte: {
    id: 'soporte', name: 'Soporte vital',
    props: [machine('reciclador-aire', 430, 100, ['recycleAir']),
      deco('casillero', 50, 100), deco('cajas', 480, 320), deco('planta', 60, 330)],
  },
  puente: {
    id: 'puente', name: 'Puente',
    props: [machine('consola-puente', 460, 120, ['forecast']),
      deco('casillero', 40, 100), deco('mesa-comedor', 130, 320), deco('cajas', 330, 330)],
  },
  enfermeria: {
    id: 'enfermeria', name: 'Enfermería',
    props: [machine('camilla-medica', 470, 104, []),
      deco('casillero', 50, 100), deco('cajas', 110, 330)],
  },
  comunicaciones: {
    id: 'comunicaciones', name: 'Comunicaciones',
    props: [machine('consola-antena', 280, 100, ['alignAntenna']),
      deco('mesa-comedor', 240, 330)],
  },
  esclusa: {
    id: 'esclusa', name: 'Esclusa',
    props: [machine('puerta-esclusa', 370, 330, [], 'Compuerta a la superficie'),
      deco('casillero-trajes', 330, 110)],
  },
  exterior: {
    id: 'exterior', name: 'Superficie lunar',
    props: [machine('panel-solar', 2050, 250, ['orientPanels'], 'Paneles solares'),
      deco('panel-solar', 1760, 250), deco('panel-solar', 2340, 250),
      machine('roca-hielo', 430, 300, ['eva'], 'Roca con hielo')],
  },
  invernadero: {
    id: 'invernadero', name: 'Invernadero',
    props: [machine('tanque-algas', 600, 100, ['growLights']),
      deco('planta', 60, 110), deco('planta', 180, 110), deco('planta', 720, 200),
      deco('bandeja-cultivo', 120, 330), deco('bandeja-cultivo', 400, 330), deco('bandeja-cultivo', 660, 330)],
  },
};

export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

/** Posición absoluta (en el mapa) de un objeto de la sala. */
export function propPosition(room: RoomId, p: RoomProp): Point {
  const r = ROOM_RECTS[room];
  return { x: r.x + p.x, y: r.y + p.y };
}

/** Objetos que se descargan como PNG (los dibujados en código están en `core/propArt.ts`). */
export const PROP_ASSETS = [
  'camilla-medica', 'consola-antena', 'reciclador-aire', 'tanque-algas', 'consola-puente', 'puerta-esclusa',
  'casillero', 'casillero-trajes', 'planta', 'mesa-comedor', 'cajas', 'bandeja-cultivo',
] as const;
