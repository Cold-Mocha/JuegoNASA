import type { ActionId, RoomId } from '../sim/types';
import type { MissionId } from './missions';
import { ROOM_RECTS, type Point } from '../sim/stationMap';
import { WORLD_SCALE } from '../sim/rules';
import { t, type TKey } from '../core/i18n';
import type { EntryId } from './encyclopedia';

/**
 * Salas de la Estación Central sobre el plano continuo (`sim/stationMap.ts`).
 * Posiciones (x, y) relativas a la esquina del piso de cada sala, en px del diseño base (se multiplican por WORLD_SCALE):
 * todos los objetos van en el piso ('interactive' y 'deco'): (x, y) = pies del objeto (centro inferior); 'wall' y 'poster' cuelgan de la pared del fondo.
 * Cada máquina dice sus acciones (vacío = sala de lectura o información) y, si hace falta, su propio nombre.
 * El mapa base es fijo; cada investigación suma sus propios objetos (`only(...)`), que solo aparecen al elegirla.
 */
export type PropKind = 'interactive' | 'deco' | 'wall' | 'poster';

export interface RoomProp {
  asset: string;
  kind: PropKind;
  x: number;
  y: number;
  actions?: ActionId[];
  /** Clave del nombre que se muestra al usarla (por defecto, el de la sala). */
  nameKey?: TKey;
  /** Si está, el objeto solo aparece en estas investigaciones (los demás están siempre). */
  missions?: MissionId[];
  /** Cartel: ficha real del Archivo que se abre al leerlo. */
  entry?: EntryId;
}

export interface Room {
  id: RoomId;
  props: RoomProp[];
}

const machine = (asset: string, x: number, y: number, actions: ActionId[], nameKey?: TKey): RoomProp => ({ asset, kind: 'interactive', x, y, actions, nameKey });
const deco = (asset: string, x: number, y: number): RoomProp => ({ asset, kind: 'deco', x, y });
/** Adorno colgado en la pared del fondo: no estorba al caminar ni proyecta sombra en el piso. */
const wall = (asset: string, x: number, y: number): RoomProp => ({ asset, kind: 'wall', x, y });
/** Cartel de pared que se puede leer (mismo marco que el cuadro de la Tierra): abre su ficha real en el Archivo. No estorba al caminar. */
const poster = (asset: string, x: number, y: number, nameKey: TKey, entry: EntryId): RoomProp => ({ asset, kind: 'poster', x, y, actions: [], nameKey, entry });
/** El objeto solo aparece cuando se elige esa investigación. */
const only = (missions: MissionId | MissionId[], p: RoomProp): RoomProp => ({ ...p, missions: Array.isArray(missions) ? missions : [missions] });

/**
 * Orden del mapa: las puertas de los pasillos dan a las franjas x ≈ 215–345 (Esclusa 315–445 arriba y abajo;
 * Invernadero 315–445; Exterior 935–1065 arriba y 515–645 abajo). Esas franjas y el centro quedan libres para caminar; las máquinas
 * y casilleros van contra la pared, y las cajas y plantas en los costados, una sola pila por lado y sin montarse sobre otro objeto.
 */
export const ROOMS: Record<RoomId, Room> = {
  soporte: {
    id: 'soporte',
    props: [deco('reciclador-aire', 445, 78), // normalmente decorativo; cuando se rompe lo reemplaza 'reciclador-roto' (interactivo)
      deco('casillero', 62, 62), wall('extintor', 165, 12), wall('cuadro-tierra', 290, -8),
      deco('planta', 45, 255), deco('cajas', 480, 350)],
  },
  puente: {
    id: 'puente',
    props: [deco('casillero', 62, 62), wall('extintor', 125, 12), poster('cartel-artemis', 290, -8, 'poster.artemis', 'chile-artemis'),
      machine('bicicleta-estatica', 445, 120, ['pedal'], 'machine.bike'),
      deco('planta', 45, 215), deco('mesa-comedor', 105, 352), deco('cajas', 480, 350)],
  },
  enfermeria: {
    id: 'enfermeria',
    props: [machine('camilla-medica', 450, 66, ['heal']),
      deco('casillero', 62, 62), wall('extintor', 165, 12), poster('cartel-terremoto-1960', 300, -8, 'poster.terremoto-1960', 'chile-1960'),
      deco('planta', 45, 215), deco('mesa-comedor', 105, 352), deco('cajas', 480, 350)],
  },
  esclusa: {
    id: 'esclusa',
    // sala ancha: cuatro casilleros de trajes contra la pared, cuadros y extintores, y a cada lado cajas y plantas (las puertas quedan libres en x ≈ 315–445)
    props: [deco('casillero-trajes', 70, 66), deco('casillero-trajes', 190, 66), deco('casillero-trajes', 570, 66), deco('casillero-trajes', 690, 66),
      wall('extintor', 255, 12), wall('extintor', 520, 12), poster('cartel-tololo', 130, -8, 'poster.tololo', 'chile-tololo'), poster('cartel-seguimiento', 640, -8, 'poster.seguimiento', 'chile-seguimiento'),
      deco('planta', 45, 235), deco('planta', 715, 235), deco('casillero', 62, 160), deco('casillero', 698, 160),
      deco('cajas', 110, 350), deco('cajas', 650, 350), deco('mesa-comedor', 200, 352), deco('mesa-comedor', 560, 352)],
  },
  exterior: {
    id: 'exterior',
    props: [deco('panel-solar', 760, 250), deco('panel-solar', 1260, 250), deco('panel-solar', 1600, 250),
      machine('estacion-limpieza', 1600, 480, ['cleanDust'], 'machine.dustStation'),
      machine('consola-antena', 170, 430, ['repairAntenna', 'tellEarth', 'forecast'], 'machine.antenna'), // la antena, afuera y a la izquierda
      deco('roca', 160, 150), deco('roca', 900, 470), deco('roca', 1900, 420),
      // objetos de cada investigación
      only('hielo-lunar', machine('roca-hielo', 430, 300, ['eva', 'analyze'], 'machine.drill')),
      only('paneles-solares', machine('panel-solar', 440, 260, ['cleanTestPanel'], 'machine.testPanel'))],
  },
  invernadero: {
    id: 'invernadero',
    props: [wall('extintor', 255, 12),
      // arriba a la derecha el rack de plantas (la cosecha está en todas las jornadas)
      machine('rack-plantas', 620, 100, ['harvest'], 'machine.plantRack'),
      // con la investigación del huerto: las algas al otro lado, las bandejas abajo y las macetas por los costados
      only('huerto-lunar', machine('tanque-algas', 115, 90, ['growLights'], 'machine.algae')),
      only('huerto-lunar', poster('cartel-arads', 420, -8, 'poster.arads', 'chile-arads')),
      only('huerto-lunar', deco('bandeja-cultivo', 250, 350)), only('huerto-lunar', deco('bandeja-cultivo', 470, 350)),
      only('huerto-lunar', deco('planta', 50, 240)), only('huerto-lunar', deco('planta', 710, 250)),
      // en las otras investigaciones no hay tanque de algas: el invernadero igual se ve cultivado (bandejas, macetas y cajas de cosecha)
      only(['paneles-solares', 'hielo-lunar'], deco('planta', 70, 80)), only(['paneles-solares', 'hielo-lunar'], deco('planta', 170, 80)),
      only(['paneles-solares', 'hielo-lunar'], wall('cuadro-tierra', 420, -8)),
      only(['paneles-solares', 'hielo-lunar'], deco('bandeja-cultivo', 250, 350)), only(['paneles-solares', 'hielo-lunar'], deco('bandeja-cultivo', 520, 350)),
      only(['paneles-solares', 'hielo-lunar'], deco('planta', 50, 250)), only(['paneles-solares', 'hielo-lunar'], deco('planta', 710, 250)),
      only(['paneles-solares', 'hielo-lunar'], deco('cajas', 720, 360))],
  },
};

export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

export const roomName = (id: RoomId): string => t(`room.${id}`);

/** Objetos de una sala para la investigación elegida: los fijos y los propios de esa investigación. */
export const roomProps = (room: RoomId, mission: MissionId): RoomProp[] =>
  ROOMS[room].props.filter((p) => !p.missions || p.missions.includes(mission));

/** Posición absoluta (en el mapa) de un objeto de la sala. */
export function propPosition(room: RoomId, p: RoomProp): Point {
  const r = ROOM_RECTS[room];
  return { x: r.x + p.x * WORLD_SCALE, y: r.y + p.y * WORLD_SCALE };
}

const unique = (xs: string[]): string[] => [...new Set(xs)];

/** Dibujos que hay que cargar para una investigación: normales (decoración) y marcados (máquinas, con contorno blanco fino). */
export function propAssetsFor(mission: MissionId): { plain: string[]; marked: string[] } {
  const props = ROOM_IDS.flatMap((id) => roomProps(id, mission));
  return {
    plain: unique(props.map((p) => p.asset)), // las máquinas también: se ven normales hasta que se puede interactuar con ellas
    marked: unique(props.filter((p) => p.kind === 'interactive').map((p) => `${p.asset}-marcado`)),
  };
}

/** Textura de un objeto: las máquinas usan la versión marcada. */
export const textureAsset = (p: RoomProp, active: boolean): string => (p.kind === 'interactive' && active ? `${p.asset}-marcado` : p.asset);
