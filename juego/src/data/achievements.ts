import type { AchievementId } from '../sim/achievements';
import { t } from '../core/i18n';

/** Logros científicos: cada uno premia una decisión que también toman los planificadores reales (textos en data/locales). */
export const ACHIEVEMENT_IDS: AchievementId[] = ['safe-shelter', 'lunar-night', 'explorer', 'strong-signal', 'mission-complete', 'healthy-crew', 'scientist', 'reader'];

export const achievementTitle = (id: AchievementId): string => t(`achievement.${id}.title`);
export const achievementText = (id: AchievementId): string => t(`achievement.${id}.text`);
