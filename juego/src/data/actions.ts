import type { ActionCheck, ActionId, Resources } from '../sim/types';
import { t } from '../core/i18n';

/** Textos de las acciones de cada sala (los números viven en sim/rules.ts; los textos, en data/locales). */
export const actionLabel = (id: ActionId): string => t(`action.${id}.label`);
/** Una frase: qué cuesta, qué da y cuál es su límite. */
export const actionWhy = (id: ActionId): string => t(`action.${id}.why`);

export const blockReason = (reason: NonNullable<ActionCheck['reason']>): string => t(`block.${reason}`);

export type ResourceKey = keyof Resources | 'science';
export const resourceLabel = (key: ResourceKey): string => t(`resource.${key}.label`);
/** Nombre corto para los textos flotantes y las fichas de costo. */
export const resourceShort = (key: ResourceKey): string => t(`resource.${key}.short`);
