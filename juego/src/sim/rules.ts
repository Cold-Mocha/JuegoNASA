import type { ActionId, Resources, RoomId, Zone } from './types';

/**
 * Reglas numéricas del juego (diseño v2, `escenario/estacion-central.json`).
 * Valores reales usados como referencia: ver SOURCES.md. Los valores de juego están escalados
 * a una misión de 7 jornadas y se declaran como simulados dentro del juego.
 */

/** Consumo pasivo por jornada: la estación gasta energía, oxígeno y comida. */
export const PASSIVE_PER_DAY = { energy: -8, oxygen: -9, food: -7 } as const;

/** Luz solar por jornada (1–3 día, 4 atardecer, 5–7 noche lunar). */
export const LIGHT_BY_DAY = [1, 1, 1, 0.5, 0, 0, 0] as const;

/** Radiación de fondo por jornada (rayos cósmicos; en la Luna ≈200× la de la superficie terrestre). */
export const BACKGROUND_RADIATION_PER_DAY = 2;

/** Sin energía, el soporte vital rinde menos: el oxígeno baja más rápido. */
export const NO_ENERGY_EXTRA_OXYGEN_PER_DAY = -10;

/** Salud: baja por jornada si falta oxígeno o comida (≤ HEALTH_DANGER_AT) o si la radiación pasa del umbral. */
export const HEALTH_DANGER_AT = 15;
export const HEALTH_LOSS_PER_DAY = { oxygen: -45, food: -25, radiation: -30 } as const;
export const HEALTH_RADIATION_AT = 70;

/** Polvo en los paneles por jornada (rango; se sortea con la semilla). Cada 100 % de polvo quita DUST_MAX_LOSS de la energía. */
export const DUST_PER_DAY: readonly [number, number] = [0.08, 0.14];
export const DUST_MAX_LOSS = 0.8;

/** Los paneles renuevan la energía siempre: generan esto por jornada con los paneles limpios. Si el polvo los deja generando menos de lo que gasta la nave, la energía empieza a bajar. */
export const PANEL_REGEN_PER_DAY = 14;

/** Degradación de la antena por jornada (rango; se sortea con la semilla). */
export const ANTENNA_DRIFT_PER_DAY: readonly [number, number] = [0.12, 0.2];

/** Bajo este enlace (60 %) no llegan el pronóstico ni los envíos. */
export const LINK_MIN_RADIO = 0.6;
export const RESUPPLY_DAYS = [3, 6] as const;
export const RESUPPLY_AMOUNT = 25;

/** Ida y vuelta de una señal Tierra–Luna (384 400 km / c ≈ 1,28 s por sentido). */
export const EARTH_MOON_ROUND_TRIP_SEC = 2.56;

export const FLARE_DURATION_SEC = 10;
/** Aviso antes de cada llamarada (segundos de juego): con pronóstico llega mucho antes. */
export const FLARE_WARNING_SEC = { forecasted: 25, unforecasted: 10 } as const;
/** Dentro de la nave las paredes dejan pasar solo esta fracción de la radiación (llamaradas y fondo). */
export const SHELTER_FACTOR = 0.1;

/** Zona de cada sala. Los pasillos de la nave son 'ship'; los caminos de afuera, 'surface' (ver `stationMap.ts`). */
export const ROOM_ZONE: Record<RoomId, Zone> = {
  soporte: 'ship', puente: 'ship', enfermeria: 'ship', comunicaciones: 'ship', esclusa: 'ship',
  invernadero: 'greenhouse', exterior: 'surface',
};

/** Oxígeno del traje (0–100): en la superficie dura SUIT_SECONDS (÷ dificultad); en la nave o el invernadero se recarga. */
export const SUIT_SECONDS = 45;
export const SUIT_REFILL_PER_SEC = 40;
export const SUIT_LOW = 30;
/** Si el traje se vacía, la tripulación rescata al michi: vuelve a la Esclusa y la estación gasta oxígeno. */
export const SUIT_RESCUE_OXYGEN = -15;
export const EVA_FACTOR = 3;
export const ACTION_COOLDOWN_SEC = 3;
/** Velocidad al caminar por el plano (px de mapa por segundo; ver `stationMap.ts`). Escala de juego, no real. */
export const WALK_SPEED = 500;
export const CRITICAL_THRESHOLD = 20;

export interface ActionRule {
  room: RoomId;
  cost: Partial<Resources>;   // negativo = gasta
  gain: Partial<Resources>;   // positivo = suma
  science?: number;
  /** Requiere enlace con la Tierra y responde tras la demora de comunicación. */
  delayed?: boolean;
}

export const ACTIONS: Record<ActionId, ActionRule> = {
  alignAntenna: { room: 'comunicaciones', cost: { energy: -5 }, gain: {}, delayed: true },
  recycleAir:   { room: 'soporte', cost: { energy: -6 }, gain: { oxygen: 15 } },
  cookMeal:     { room: 'soporte', cost: { energy: -5 }, gain: { food: 18 } },
  growLights:   { room: 'invernadero', cost: { energy: -7 }, gain: { oxygen: 6, food: 4 } }, // + GROW_LIGHTS_AT_DUSK al cierre de la jornada
  harvest:      { room: 'invernadero', cost: { energy: -3 }, gain: { food: 15 } },
  forecast:     { room: 'puente', cost: { energy: -1 }, gain: {}, delayed: true },
  orientPanels: { room: 'exterior', cost: { radiation: 3 }, gain: { energy: 20 } }, // × luz × (1 − pérdida por polvo)
  cleanDust:    { room: 'exterior', cost: { energy: -2, radiation: 2 }, gain: {} },
  eva:          { room: 'exterior', cost: { energy: -3, radiation: 4 }, gain: {}, science: 2 }, // recoger muestras de hielo en la roca
  repair:       { room: 'soporte', cost: { energy: -4 }, gain: {} }, // la sala real es la de la fractura (ver Simulation.breach)
  heal:         { room: 'enfermeria', cost: { energy: -8, food: -4 }, gain: { health: 25 } },
};

/** Las algas siguen creciendo: más oxígeno y comida al terminar la jornada. */
export const GROW_LIGHTS_AT_DUSK = { oxygen: 5, food: 4 } as const;
export const FORECAST_HORIZON_DAYS = 2;

/** Fracturas del casco: desde el día BREACH_FROM_DAY, cada jornada hay esta probabilidad de que se abra una en una sala de la nave. */
export const BREACH_FROM_DAY = 2;
export const BREACH_CHANCE = 0.6;
export const BREACH_ROOMS: readonly RoomId[] = ['soporte', 'puente', 'enfermeria', 'comunicaciones'];

export const clamp = (v: number, min = 0, max = 100): number => Math.min(max, Math.max(min, v));
