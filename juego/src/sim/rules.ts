import type { ActionId, Resources, RoomId, Zone } from './types';

/**
 * Reglas numéricas del juego (diseño v2, `escenario/estacion-central.json`).
 * Valores reales usados como referencia: ver SOURCES.md. Los valores de juego están escalados
 * a una misión de 7 jornadas y se declaran como simulados dentro del juego.
 */

/** Consumo pasivo por jornada: la estación gasta energía, oxígeno y comida. */
export const PASSIVE_PER_DAY = { energy: -5, oxygen: -9, food: -7 } as const;

/** Luz solar por jornada (1–3 día, 4 atardecer, 5–7 noche lunar). */
export const LIGHT_BY_DAY = [1, 1, 1, 0.5, 0, 0, 0] as const;

/** Radiación de fondo por jornada (rayos cósmicos; en la Luna ≈200× la de la superficie terrestre). */
export const BACKGROUND_RADIATION_PER_DAY = 2;

/** El reciclador renueva el oxígeno solo: genera esto por jornada mientras no tenga una fractura abierta. Con la fractura, el oxígeno solo baja. */
export const OXYGEN_REGEN_PER_DAY = 14;

/** Con una fractura abierta el aire se escapa: el oxígeno de la nave baja esto extra por jornada (además del consumo normal). */
export const OXYGEN_LEAK_PER_DAY = -30;

/** Sin energía, el soporte vital rinde menos: el oxígeno baja más rápido. */
export const NO_ENERGY_EXTRA_OXYGEN_PER_DAY = -10;

/**
 * Salud: baja por jornada cuando el oxígeno o la comida llegan a 0, y con la radiación a partir de HEALTH_RADIATION_AT:
 * de a poco al principio y más rápido mientras más alta (la pérdida máxima por jornada se da con 100 %). La radiación no se puede sacar.
 */
export const HEALTH_DANGER_AT = 0;
export const HEALTH_LOSS_PER_DAY = { oxygen: -45, food: -25, radiation: -30 } as const;
export const HEALTH_RADIATION_AT = 50;

/**
 * Tormentas de polvo: el polvo ya no se acumula solo cada día; cubre los paneles en eventos al azar (al empezar cada jornada).
 * Cada tormenta suma DUST_PER_STORM de polvo y ensucia el panel de pruebas; solo entonces hay algo que limpiar.
 * Si pasan DUST_STORM_MAX_GAP jornadas sin tormenta, la siguiente llega segura (así la investigación siempre se puede cumplir).
 */
export const DUST_PER_STORM: readonly [number, number] = [0.2, 0.35];
export const DUST_STORM_CHANCE = 0.5;
export const DUST_STORM_MAX_GAP = 2;
export const DUST_MAX_LOSS = 0.8;

/** Los paneles renuevan la energía siempre: generan esto por jornada con los paneles limpios. Si el polvo los deja generando menos de lo que gasta la nave, la energía empieza a bajar. */
export const PANEL_REGEN_PER_DAY = 7; // lenta: con los paneles limpios solo sobran 2 por jornada (pedalear recupera mucho más rápido)

/** Degradación de la antena por jornada (rango; se sortea con la semilla). */
export const ANTENNA_DRIFT_PER_DAY: readonly [number, number] = [0.12, 0.2];

/** Bajo este enlace (60 %) no llegan el pronóstico ni los envíos. */
export const LINK_MIN_RADIO = 0.6;

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
/** Cuánto se agrandó el plano respecto del diseño base (salas, pasillos y distancias): más aire entre objetos y personajes. */
export const WORLD_SCALE = 0.9;
export const WALK_SPEED = 500 * WORLD_SCALE; // el plano es más grande: se escala para que los tiempos de viaje no cambien
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
  repairAntenna: { room: 'comunicaciones', cost: { energy: -5 }, gain: {}, delayed: true },
  growLights:   { room: 'invernadero', cost: { energy: -7 }, gain: { oxygen: 6, food: 4 } }, // + GROW_LIGHTS_AT_DUSK al cierre de la jornada
  harvest:      { room: 'invernadero', cost: { energy: -3 }, gain: { food: 20 } },            // × lo cosechado en el minijuego
  cleanDust:    { room: 'exterior', cost: { energy: -2, radiation: 2 }, gain: {} },
  cleanTestPanel: { room: 'exterior', cost: { energy: -2, radiation: 2 }, gain: {}, science: 1 },  // panel de pruebas (solo en Energía del Sol): mide, no limpia la estación
  eva:          { room: 'exterior', cost: { energy: -3, radiation: 4 }, gain: {}, science: 2 }, // recoger muestras de hielo en la roca
  repair:       { room: 'soporte', cost: { energy: -4 }, gain: {} }, // la sala real es la de la fractura (ver Simulation.breach)
  pedal:        { room: 'puente', cost: { food: -3 }, gain: { energy: 10 } },                // bicicleta: energía de emergencia, × calidad del minijuego
  heal:         { room: 'enfermeria', cost: { energy: -8, food: -4 }, gain: { health: 25 } },
};

/** Las algas siguen creciendo: más oxígeno y comida al terminar la jornada. */
/** Acciones que solo se pueden hacer una vez por jornada: las propias de cada investigación y la cosecha (no tiene sentido repetirlas el mismo día). */
export const ONCE_PER_DAY: ReadonlySet<ActionId> = new Set<ActionId>(['growLights', 'cleanTestPanel', 'eva', 'harvest']);
/** Otras acciones con tope diario mayor que uno (la bicicleta cansa: 3 por jornada). */
export const MAX_PER_DAY: Partial<Record<ActionId, number>> = { pedal: 3 };

/** Calidad de un minijuego a partir de su puntaje (0–1): jugar mal nunca deja la acción en cero ni la regala. Solo escala las ganancias. */
export const quality = (score: number): number => 0.4 + 0.6 * Math.min(1, Math.max(0, score));

export const GROW_LIGHTS_AT_DUSK = { oxygen: 5, food: 4 } as const;

/** Fracturas del casco: desde el día BREACH_FROM_DAY, cada jornada hay esta probabilidad de que se abra una en una sala de la nave. */
export const BREACH_FROM_DAY = 2;
export const BREACH_CHANCE = 0.6;
export const BREACH_ROOMS: readonly RoomId[] = ['soporte']; // el reciclador de oxígeno está en Soporte vital

export const clamp = (v: number, min = 0, max = 100): number => Math.min(max, Math.max(min, v));
