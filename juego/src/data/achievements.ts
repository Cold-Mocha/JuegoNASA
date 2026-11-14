import type { AchievementId } from '../sim/achievements';

/** Logros científicos: cada uno premia una decisión que también toman los planificadores reales. */
export const ACHIEVEMENTS: Record<AchievementId, { title: string; text: string }> = {
  'first-forecast': { title: 'Pronóstico experto', text: 'Pediste un pronóstico solar antes de que llegara una llamarada.' },
  'safe-shelter': { title: 'A salvo a tiempo', text: 'Pasaste una llamarada dentro de la nave, protegido por sus paredes.' },
  'lunar-night': { title: 'Noche lunar', text: 'Trabajaste durante la noche lunar, sin sol para los paneles.' },
  explorer: { title: 'Exploración lunar', text: 'Recogiste muestras de hielo en la superficie lunar.' },
  'strong-signal': { title: 'Señal fuerte', text: 'Alineaste la antena para hablar con la Tierra.' },
  'mission-complete': { title: 'Investigación completa', text: 'Terminaste todas las tareas de una investigación y volviste a la Tierra.' },
  'healthy-crew': { title: 'Tripulación sana', text: 'Volviste a la Tierra con menos de 30 % de radiación.' },
  scientist: { title: 'Ciencia de campo', text: 'Juntaste 4 puntos de ciencia o más en una jornada científica.' },
  reader: { title: 'Archivo leído', text: 'Leíste 5 fichas del Archivo Científico.' },
};
