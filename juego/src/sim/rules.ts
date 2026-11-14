import type { ActionId, Resources, RoomId, Zone } from './types';

/**
 * Reglas numéricas del juego (diseño v2, `escenario/estacion-central.json`).
 * Valores reales usados como referencia: ver SOURCES.md. Los valores de juego están escalados
 * a una misión de 7 jornadas y se declaran como simulados dentro del juego.
 */

/** Consumo pasivo por jornada (diseño v2; aire y comida van juntos en el soporte vital). */
export const PASSIVE_PER_DAY = { energy: -8, life: -12 } as const;

/** Luz solar por jornada (1–3 día, 4 atardecer, 5–7 noche lunar). */
export const LIGHT_BY_DAY = [1, 1, 1, 0.5, 0, 0, 0] as const;

/** Radiación de fondo por jornada (rayos cósmicos; en la Luna ≈200× la de la superficie terrestre). */
export const BACKGROUND_RADIATION_PER_DAY = 2;

/** Sin energía, el soporte vital rinde menos: baja más rápido. */
export const NO_ENERGY_EXTRA_LIFE_PER_DAY = -12;

/** Degradación de la antena por jornada (rango; se sortea con la semilla). */
export const ANTENNA_DRIFT_PER_DAY: readonly [number, number] = [0.12, 0.2];

/** La radio está "buena" o "mala" (sin porcentajes): bajo este enlace no llegan el pronóstico ni los envíos. */
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
/** Si el traje se vacía, la tripulación rescata al michi: vuelve a la Esclusa y la estación gasta aire y comida. */
export const SUIT_RESCUE_LIFE = -15;
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
  recycleAir:   { room: 'soporte', cost: { energy: -6 }, gain: { life: 15 } },
  growLights:   { room: 'invernadero', cost: { energy: -7 }, gain: { life: 10 } }, // + GROW_LIGHTS_LIFE_AT_DUSK al cierre de la jornada
  forecast:     { room: 'puente', cost: { energy: -1 }, gain: {}, delayed: true },
  orientPanels: { room: 'exterior', cost: { radiation: 3 }, gain: { energy: 20 } }, // diseño v2: +5; ajustado en QA de balance
  eva:          { room: 'exterior', cost: { energy: -3, radiation: 4 }, gain: {}, science: 2 }, // recoger muestras de hielo en la roca
};

/** Las algas siguen creciendo: más aire y comida al terminar la jornada (ahora poco, después más). */
export const GROW_LIGHTS_LIFE_AT_DUSK = 8;
export const FORECAST_HORIZON_DAYS = 2;

export const clamp = (v: number, min = 0, max = 100): number => Math.min(max, Math.max(min, v));
