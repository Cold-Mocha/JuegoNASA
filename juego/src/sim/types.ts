/** Tipos de la simulación. Este módulo y todo `src/sim/` es TypeScript puro: sin Phaser ni DOM. */
export type RoomId = 'soporte' | 'puente' | 'enfermeria' | 'comunicaciones' | 'esclusa' | 'invernadero' | 'exterior';

/**
 * Dónde está el michi: dentro de la nave (protegido de las llamaradas, el traje se recarga), en el invernadero
 * (afuera, pero con aire: el traje no gasta) o en la superficie lunar (el traje gasta oxígeno).
 */
export type Zone = 'ship' | 'greenhouse' | 'surface';

export type ActionId =
  | 'alignAntenna' | 'recycleAir' | 'growLights' | 'forecast' | 'orientPanels' | 'eva';

export type ResupplyChoice = 'life' | 'energy';

/**
 * Solo 3 recursos (el reto pide 2–3 para 7–12 años): energía, soporte vital y radiación.
 * `life` = soporte vital (aire y comida juntos). `radiation` es la dosis acumulada en % del límite de la misión.
 */
export interface Resources {
  energy: number;
  life: number;
  radiation: number;
}

/** Componentes físicos que se degradan (0–1). */
export interface Components {
  antenna: number; // calidad del enlace con la Tierra (se muestra como "Señal")
}

/** Llamarada ubicada en la línea de tiempo de la misión. */
export interface SolarEvent {
  day: number;        // 1..días de la misión
  hour: number;       // hora UTC real del pico (0–24)
  classType: string;  // "X9.3"
  sep: boolean;
  peakTime: string;   // ISO real (para citarla en pantalla)
}

/**
 * Tarea de una investigación (jornada científica). Se cumple al llegar a `count`:
 * - action: veces que se hizo una acción; science: puntos de ciencia; shelter: llamaradas pasadas dentro de la nave.
 */
export type TaskGoal =
  | { id: string; kind: 'action'; action: ActionId; count: number }
  | { id: string; kind: 'science'; count: number }
  | { id: string; kind: 'shelter'; count: number };

export interface SimConfig {
  days: number;         // plazo de la jornada científica (días lunares comprimidos)
  dayLengthSec: number;
  drain: number;        // multiplicador del consumo pasivo
  events: SolarEvent[];
  seed: number;
  /** Tareas de la investigación. Al cumplirlas todas, la tripulación vuelve a la Tierra. Sin tareas: gana quien sobrevive el plazo. */
  tasks?: TaskGoal[];
}

/** Por qué terminó antes de tiempo: se acabó el soporte vital, la radiación llegó al límite o se acabó el plazo. */
export type DeathCause = 'life' | 'radiation' | 'timeout';

export type SimEvent =
  | { type: 'dayStart'; day: number; light: number }
  | { type: 'flareWarning'; event: SolarEvent; inSec: number; forecasted: boolean }
  | { type: 'flareStart'; event: SolarEvent; forecasted: boolean }
  | { type: 'flareEnd'; event: SolarEvent; dose: number }
  | { type: 'actionDone'; action: ActionId; delta: Partial<Resources> & { science?: number } }
  | { type: 'actionResolved'; action: ActionId; message: 'forecastReady' | 'linkRestored' }
  | { type: 'resupplyOffer'; day: number }
  | { type: 'resupplyMissed'; day: number }
  | { type: 'critical'; resource: keyof Resources }
  | { type: 'suitLow' }
  | { type: 'suitEmpty'; lifeLost: number }
  | { type: 'taskDone'; id: string }
  | { type: 'gameOver'; cause: DeathCause }
  | { type: 'missionComplete' };

export interface ActionCheck {
  ok: boolean;
  reason?: 'busy' | 'cooldown' | 'noEnergy' | 'night' | 'noLink' | 'evaDone' | 'ended';
}

export interface SimStats {
  forecasts: number;
  shelteredFlares: number; // llamaradas pasadas dentro de la nave
  unshieldedFlares: number;
  evas: number;
  antennaAligns: number;
  resupplies: number;
  actions: number;
  actionsBy: Partial<Record<ActionId, number>>;
}
