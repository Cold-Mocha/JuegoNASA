import type { IconName } from './icons';
import type { ActionId, Resources, RoomId, TaskGoal } from '../sim/types';
import type { AchievementId } from '../sim/achievements';
import type { EntryCategory } from '../data/encyclopedia';
import type { DifficultyId } from '../data/difficulties';
import type { MissionId } from '../data/missions';

/** Un solo icono por concepto en toda la app (HUD, acciones, tareas, mapa, archivo, logros e informe). */
export const RESOURCE_ICON: Record<keyof Resources, IconName> = {
  energy: 'bolt', oxygen: 'oxygen', food: 'sprout', health: 'heart', radiation: 'radiation',
};

export const ACTION_ICON: Record<ActionId, IconName> = {
  repairAntenna: 'antenna', tellEarth: 'radar', forecast: 'sun', growLights: 'sprout', harvest: 'sprout', cleanDust: 'panel', cleanTestPanel: 'panel', eva: 'snowflake', heal: 'heart', repair: 'gear', pedal: 'bolt',
};

export const ROOM_ICON: Record<RoomId, IconName> = {
  soporte: 'wind', puente: 'radar', enfermeria: 'heart', esclusa: 'helmet',
  invernadero: 'sprout', exterior: 'moon',
};

export const taskIcon = (t: TaskGoal): IconName => (t.kind === 'action' ? ACTION_ICON[t.action] : 'shield');

export const MISSION_ICON: Record<MissionId, IconName> = {
  'huerto-lunar': 'sprout', 'paneles-solares': 'panel', 'hielo-lunar': 'snowflake',
};

export const CATEGORY_ICON: Record<EntryCategory, IconName> = {
  luna: 'moon', sol: 'sun', vida: 'sprout', misiones: 'rocket', universo: 'galaxy', chile: 'map',
};

export const ACHIEVEMENT_ICON: Record<AchievementId, IconName> = {
  'safe-shelter': 'shield', 'lunar-night': 'moon', explorer: 'helmet', 'strong-signal': 'antenna',
  'mission-complete': 'rocket', 'healthy-crew': 'heart', reader: 'book',
};

export const DIFFICULTY_ICON: Record<DifficultyId, IconName> = { cadete: 'book', piloto: 'rocket', comandante: 'medal' };
