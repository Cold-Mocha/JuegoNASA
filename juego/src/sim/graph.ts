import type { RoomId } from './types';
import { WALK_SPEED } from './rules';
import { findRoute, roomCenter, routeLength } from './stationMap';

/** Segundos de juego que cuesta caminar del centro de una sala al de otra por los pasillos (redondeado a 0,1 s). */
export function travelTime(from: RoomId, to: RoomId): number {
  if (from === to) return 0;
  const a = roomCenter(from);
  return Math.round((routeLength(a, findRoute(a, roomCenter(to))) / WALK_SPEED) * 10) / 10;
}
