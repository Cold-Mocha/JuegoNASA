import type { ActionId, RoomId } from '../sim/types';
import type { MissionId } from './missions';
import { ROOM_RECTS, type Point } from '../sim/stationMap';

/**
 * Salas de la Estación Central sobre el plano continuo (`sim/stationMap.ts`).
 * Posiciones (x, y) relativas a la esquina del piso de cada sala, en px de mapa:
 * todos los objetos van en el piso ('interactive' y 'deco'): (x, y) = pies del objeto (centro inferior).
 * Cada máquina dice sus acciones (vacío = sala de lectura o información) y, si hace falta, su propio nombre.
 * El mapa base es fijo; cada investigación suma sus propios objetos (`only(...)`), que solo aparecen al elegirla.
 */
export type PropKind = 'interactive' | 'deco' | 'wall';

export interface RoomProp {
  asset: string;
  kind: PropKind;
  x: number;
  y: number;
  actions?: ActionId[];
  /** Nombre que se muestra al usarla (por defecto, el de la sala). */
  name?: string;
  /** Si está, el objeto solo aparece en estas investigaciones (los demás están siempre). */
  missions?: MissionId[];
}

export interface Room {
  id: RoomId;
  name: string;
  props: RoomProp[];
}

const machine = (asset: string, x: number, y: number, actions: ActionId[], name?: string): RoomProp => ({ asset, kind: 'interactive', x, y, actions, name });
const deco = (asset: string, x: number, y: number): RoomProp => ({ asset, kind: 'deco', x, y });
/** Adorno colgado en la pared del fondo: no estorba al caminar ni proyecta sombra en el piso. */
const wall = (asset: string, x: number, y: number): RoomProp => ({ asset, kind: 'wall', x, y });
/** El objeto solo aparece cuando se elige esa investigación. */
const only = (missions: MissionId | MissionId[], p: RoomProp): RoomProp => ({ ...p, missions: Array.isArray(missions) ? missions : [missions] });

/**
 * Orden del mapa: las entradas de la nave están en la pared del fondo (x ≈ 215–345; Comunicaciones 165–295; Esclusa 155–285,
 * que además tiene la salida de abajo en la misma franja; Invernadero 315–445). Las máquinas van a la derecha de esa franja,
 * los casilleros y adornos a la izquierda, las cajas y plantas en los costados y el centro queda libre para caminar.
 */
export const ROOMS: Record<RoomId, Room> = {
  soporte: {
    id: 'soporte', name: 'Soporte vital',
    props: [machine('reciclador-aire', 455, 78, ['recycleAir'], 'Reciclador de CO₂'),
      machine('estacion-comida', 455, 255, ['cookMeal'], 'Cocina de la nave'),
      deco('casillero', 62, 62), wall('extintor', 165, 12), wall('cuadro-tierra', 290, -8),
      deco('planta', 40, 215), deco('cajas', 60, 305), deco('cajas', 520, 352)],
  },
  puente: {
    id: 'puente', name: 'Puente',
    props: [machine('consola-puente', 450, 66, ['forecast'], 'Clima espacial'),
      deco('casillero', 62, 62), wall('extintor', 125, 12), wall('cuadro-tierra', 290, -8),
      deco('planta', 40, 215), deco('mesa-comedor', 110, 352),
      deco('cajas', 520, 235), deco('cajas', 520, 305), deco('planta', 525, 352)],
  },
  enfermeria: {
    id: 'enfermeria', name: 'Enfermería',
    props: [machine('camilla-medica', 450, 66, ['heal']),
      deco('casillero', 62, 62), wall('extintor', 165, 12), wall('cuadro-tierra', 290, -8),
      deco('planta', 40, 215), deco('mesa-comedor', 110, 352),
      deco('cajas', 520, 235), deco('cajas', 520, 305), deco('planta', 525, 352)],
  },
  comunicaciones: {
    id: 'comunicaciones', name: 'Comunicaciones',
    props: [machine('consola-antena', 355, 72, ['alignAntenna'], 'Antena de la Tierra'),
      deco('casillero', 62, 62), wall('extintor', 140, 12),
      deco('planta', 40, 215), deco('mesa-comedor', 110, 352),
      deco('cajas', 420, 235), deco('cajas', 420, 305)],
  },
  esclusa: {
    id: 'esclusa', name: 'Esclusa',
    props: [deco('casillero-trajes', 80, 66), deco('casillero-trajes', 370, 66), wall('extintor', 300, 12),
      deco('planta', 40, 215), deco('cajas', 70, 345), deco('cajas', 420, 352)],
  },
  exterior: {
    id: 'exterior', name: 'Superficie lunar',
    props: [machine('panel-solar', 1550, 250, ['orientPanels'], 'Paneles solares'),
      deco('panel-solar', 1260, 250), deco('panel-solar', 1840, 250),
      machine('estacion-limpieza', 1550, 440, ['cleanDust'], 'Limpieza de polvo'),
      deco('roca', 260, 140), deco('roca', 760, 430), deco('roca', 1100, 150), deco('roca', 1700, 150),
      // objetos de cada investigación
      only('hielo-lunar', machine('roca-hielo', 430, 300, ['eva'], 'Taladro de hielo')),
      only('paneles-solares', machine('panel-solar', 960, 260, ['orientPanels'], 'Panel de pruebas'))],
  },
  invernadero: {
    id: 'invernadero', name: 'Invernadero',
    props: [wall('extintor', 255, 12),
      // la plantación solo está con la investigación del huerto
      only('huerto-lunar', machine('tanque-algas', 600, 82, ['growLights'], 'Cultivo de algas')),
      only('huerto-lunar', machine('rack-plantas', 640, 255, ['harvest'], 'Rack de plantas')),
      only('huerto-lunar', deco('planta', 60, 62)), only('huerto-lunar', deco('planta', 180, 62)),
      only('huerto-lunar', deco('planta', 40, 215)), only('huerto-lunar', deco('planta', 725, 352)),
      only('huerto-lunar', deco('bandeja-cultivo', 120, 352)), only('huerto-lunar', deco('bandeja-cultivo', 400, 352)),
      deco('cajas', 60, 290), deco('cajas', 560, 352)],
  },
};

/** Dónde aparece la fractura (objeto interactivo temporal) en cada sala de la nave donde puede abrirse. */
export const BREACH_SLOTS: Partial<Record<RoomId, { x: number; y: number }>> = {
  soporte: { x: 130, y: 175 }, puente: { x: 130, y: 175 }, enfermeria: { x: 130, y: 175 }, comunicaciones: { x: 390, y: 165 },
};

export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

/** Objetos de una sala para la investigación elegida: los fijos y los propios de esa investigación. */
export const roomProps = (room: RoomId, mission: MissionId): RoomProp[] =>
  ROOMS[room].props.filter((p) => !p.missions || p.missions.includes(mission));

/** Posición absoluta (en el mapa) de un objeto de la sala. */
export function propPosition(room: RoomId, p: RoomProp): Point {
  const r = ROOM_RECTS[room];
  return { x: r.x + p.x, y: r.y + p.y };
}

const unique = (xs: string[]): string[] => [...new Set(xs)];

/** Dibujos que hay que cargar para una investigación: normales (decoración) y marcados (máquinas, con contorno blanco fino). */
export function propAssetsFor(mission: MissionId): { plain: string[]; marked: string[] } {
  const props = ROOM_IDS.flatMap((id) => roomProps(id, mission));
  return {
    plain: unique(props.filter((p) => p.kind !== 'interactive').map((p) => p.asset)),
    marked: unique(props.filter((p) => p.kind === 'interactive').map((p) => `${p.asset}-marcado`)),
  };
}

/** Textura de un objeto: las máquinas usan la versión marcada. */
export const textureAsset = (p: RoomProp): string => (p.kind === 'interactive' ? `${p.asset}-marcado` : p.asset);
