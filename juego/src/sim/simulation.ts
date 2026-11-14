import {
  ACTIONS, ACTION_COOLDOWN_SEC, ANTENNA_DRIFT_PER_DAY, BACKGROUND_RADIATION_PER_DAY, CRITICAL_THRESHOLD,
  EARTH_MOON_ROUND_TRIP_SEC, EVA_FACTOR, FLARE_DURATION_SEC, FLARE_WARNING_SEC, FORECAST_HORIZON_DAYS, GROW_LIGHTS_LIFE_AT_DUSK,
  LIGHT_BY_DAY, LINK_MIN_RADIO,
  NO_ENERGY_EXTRA_LIFE_PER_DAY, PASSIVE_PER_DAY, RESUPPLY_AMOUNT, RESUPPLY_DAYS, ROOM_ZONE, SHELTER_FACTOR,
  SUIT_LOW, SUIT_REFILL_PER_SEC, SUIT_RESCUE_LIFE, SUIT_SECONDS, clamp,
} from './rules';
import { travelTime } from './graph';
import { flareDose } from './flares';
import { between, createRng } from './rng';
import type {
  ActionCheck, ActionId, Components, DeathCause, ResupplyChoice, Resources, RoomId, SimConfig, SimEvent, SimStats, SolarEvent, TaskGoal, Zone,
} from './types';

export type ActionDelta = Partial<Resources> & { science?: number };

interface ActiveFlare { event: SolarEvent; remaining: number; total: number; received: number; }
interface Pending { action: ActionId; at: number; }

export interface MissionSummary {
  won: boolean;
  cause: DeathCause | null;
  daysSurvived: number;
  days: number;
  science: number;
  tasksDone: number;
  tasksTotal: number;
  resources: Resources;
  stats: SimStats;
}

const RESOURCE_KEYS: (keyof Resources)[] = ['energy', 'life', 'radiation'];

/** Avance de una tarea (0..count) según lo hecho: sirve en la partida y en el informe final. */
export function taskProgress(t: TaskGoal, stats: SimStats, science: number): number {
  const n = t.kind === 'action' ? stats.actionsBy[t.action] ?? 0 : t.kind === 'science' ? science : stats.shelteredFlares;
  return Math.min(t.count, n);
}

/**
 * Simulación de la Estación Central: recursos, calendario lunar, llamaradas reales, acciones y fin de misión.
 * Se avanza con `tick(dt)` (segundos). La escena solo lee el estado y vacía `drainEvents()` cada frame.
 */
export class Simulation {
  readonly config: SimConfig;
  time = 0;
  day = 1;
  room: RoomId = 'puente';
  /** Dónde está el michi: en la nave está protegido de las llamaradas; afuera el traje gasta oxígeno. */
  zone: Zone = 'ship';
  /** Oxígeno del traje (0–100). Solo baja en la superficie. */
  suit = 100;
  res: Resources = { energy: 60, life: 70, radiation: 0 };
  comp: Components = { antenna: 1 };
  science = 0;
  ended: 'won' | 'lost' | null = null;
  cause: DeathCause | null = null;
  readonly stats: SimStats = { forecasts: 0, shelteredFlares: 0, unshieldedFlares: 0, evas: 0, antennaAligns: 0, resupplies: 0, actions: 0, actionsBy: {} };

  private readonly rnd: () => number;
  private events: SimEvent[] = [];
  private fired = 0;
  private warned = 0;
  private active: ActiveFlare[] = [];
  private pending: Pending[] = [];
  private cooldowns = new Map<ActionId, number>();
  private forecastUntilDay = 0;
  private evaDay = 0;
  private duskLife = 0;
  private travelUntil = 0;
  private travelTo: RoomId | null = null;
  private hall = false;
  private doneTasks = new Set<string>();
  private resupplyDay = 0;
  private critical = new Set<keyof Resources>();
  private suitWarned = false;

  constructor(config: SimConfig) {
    this.config = { ...config, events: [...config.events].sort((a, b) => a.day - b.day || a.hour - b.hour) };
    this.rnd = createRng(config.seed);
  }

  // ---------- lectura ----------
  get light(): number {
    return LIGHT_BY_DAY[Math.min(this.day, LIGHT_BY_DAY.length) - 1] ?? 0;
  }

  get dayProgress(): number {
    return (this.time % this.config.dayLengthSec) / this.config.dayLengthSec;
  }

  get traveling(): boolean {
    return this.travelTo !== null;
  }

  /** Llamarada ya avisada que todavía no empieza: cuántos segundos faltan (para la cuenta regresiva). */
  get incomingFlare(): { event: SolarEvent; inSec: number } | null {
    if (this.warned <= this.fired) return null;
    const event = this.config.events[this.fired];
    return { event, inSec: Math.max(0, this.eventTime(event) - this.time) };
  }

  /** Recursos en estado crítico ahora (para guiar al jugador a la sala que los repara). */
  get criticals(): ReadonlySet<keyof Resources> {
    return this.critical;
  }

  /** Tareas de la investigación (vacío = misión de supervivencia). */
  get tasks(): readonly TaskGoal[] {
    return this.config.tasks ?? [];
  }

  /** Avance de una tarea (0..count). */
  taskProgress(t: TaskGoal): number {
    return taskProgress(t, this.stats, this.science);
  }

  get tasksDone(): number {
    return this.tasks.filter((t) => this.taskProgress(t) >= t.count).length;
  }

  /** El michi está en un pasillo (camina libre por el plano): no hay máquinas a mano. */
  get inHall(): boolean {
    return this.hall;
  }

  /** Radio buena o mala: lo único que ve el jugador del enlace con la Tierra. */
  get radioOk(): boolean {
    return this.comp.antenna >= LINK_MIN_RADIO;
  }

  get resupplyOpen(): boolean {
    return this.resupplyDay === this.day && !this.ended;
  }

  /** Dentro de la nave las paredes frenan la radiación. */
  get sheltered(): boolean {
    return this.zone === 'ship';
  }

  /** Segundos que le quedan al traje en la superficie. */
  get suitSecondsLeft(): number {
    return (this.suit / 100) * (SUIT_SECONDS / Math.max(0.1, this.config.drain));
  }

  get flareActive(): boolean {
    return this.active.length > 0;
  }

  /** Llamaradas futuras visibles gracias al pronóstico (vacío si no se pidió o expiró). */
  get forecast(): SolarEvent[] {
    if (this.forecastUntilDay < this.day) return [];
    return this.config.events.slice(this.fired).filter((e) => e.day <= this.forecastUntilDay);
  }

  get forecastValid(): boolean {
    return this.forecastUntilDay >= this.day;
  }

  isPending(action: ActionId): boolean {
    return this.pending.some((p) => p.action === action);
  }

  eventTime(e: SolarEvent): number {
    return (e.day - 1 + e.hour / 24) * this.config.dayLengthSec;
  }

  drainEvents(): SimEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  // ---------- acciones ----------
  /** Efecto que tendría la acción ahora (para mostrar costos en la UI antes de elegir). */
  preview(action: ActionId): ActionDelta {
    const rule = ACTIONS[action];
    const d: ActionDelta = { ...rule.cost };
    for (const [k, v] of Object.entries(rule.gain) as [keyof Resources, number][]) d[k] = (d[k] ?? 0) + v;
    if (action === 'orientPanels') d.energy = Math.round(20 * this.light);
    if (action === 'eva') {
      if (this.flareActive) d.radiation = (d.radiation ?? 0) * EVA_FACTOR;
      d.science = rule.science;
    }
    return d;
  }

  canAct(action: ActionId): ActionCheck {
    if (this.ended) return { ok: false, reason: 'ended' };
    if (this.traveling || this.hall || ACTIONS[action].room !== this.room) return { ok: false, reason: 'busy' };
    if ((this.cooldowns.get(action) ?? 0) > this.time || this.isPending(action)) return { ok: false, reason: 'cooldown' };
    const d = this.preview(action);
    if (d.energy !== undefined && d.energy < 0 && this.res.energy + d.energy < 0) return { ok: false, reason: 'noEnergy' };
    if (action === 'orientPanels' && this.light === 0) return { ok: false, reason: 'night' };
    if (action === 'forecast' && !this.radioOk) return { ok: false, reason: 'noLink' };
    if (action === 'eva' && this.evaDay === this.day) return { ok: false, reason: 'evaDone' };
    return { ok: true };
  }

  /** Ejecuta la acción si es posible. Devuelve el cambio aplicado o null. */
  act(action: ActionId): ActionDelta | null {
    if (!this.canAct(action).ok) return null;
    const d = this.preview(action);
    this.apply(d);
    if (d.science) this.science += d.science;
    this.cooldowns.set(action, this.time + ACTION_COOLDOWN_SEC);
    this.stats.actions++;
    this.stats.actionsBy[action] = (this.stats.actionsBy[action] ?? 0) + 1;

    switch (action) {
      case 'growLights': this.duskLife += GROW_LIGHTS_LIFE_AT_DUSK; break;
      case 'eva': this.evaDay = this.day; this.stats.evas++; break;
      default: break;
    }
    if (ACTIONS[action].delayed) this.pending.push({ action, at: this.time + EARTH_MOON_ROUND_TRIP_SEC });
    this.events.push({ type: 'actionDone', action, delta: d });
    this.checkTasks();
    return d;
  }

  /**
   * La escena avisa dónde quedó el michi al caminar libremente por el plano (room null = pasillo o camino)
   * y en qué zona está (nave, invernadero o superficie). El tiempo de caminar corre solo con el reloj.
   */
  enter(room: RoomId | null, zone: Zone = room ? ROOM_ZONE[room] : 'ship'): void {
    if (this.ended || this.traveling) return;
    this.hall = room === null;
    if (room) this.room = room;
    this.zone = zone;
  }

  /** Modelo abstracto de caminar (lo usa el bot de balance): llega tras `travelTime` segundos; si sale de la nave, va expuesto. */
  travel(to: RoomId): number {
    if (this.ended || this.traveling || to === this.room) return 0;
    const secs = travelTime(this.room, to);
    if (secs === 0) return 0;
    this.zone = ROOM_ZONE[this.room] === 'ship' && ROOM_ZONE[to] === 'ship' ? 'ship' : 'surface';
    this.travelTo = to;
    this.travelUntil = this.time + secs;
    return secs;
  }

  chooseResupply(choice: ResupplyChoice): boolean {
    if (!this.resupplyOpen) return false;
    this.apply({ [choice]: RESUPPLY_AMOUNT });
    this.resupplyDay = 0;
    this.stats.resupplies++;
    return true;
  }

  // ---------- tiempo ----------
  tick(dt: number): void {
    if (this.ended || dt <= 0) return;
    const step = Math.min(dt, 0.25); // pasos acotados: estable aunque el navegador congele la pestaña
    let left = dt;
    while (left > 0 && !this.ended) {
      const h = Math.min(step, left);
      this.advance(h);
      left -= h;
    }
  }

  private advance(dt: number): void {
    const len = this.config.dayLengthSec;
    this.time += dt;

    const newDay = Math.floor(this.time / len) + 1;
    while (this.day < newDay && !this.ended) this.closeDay();
    if (this.ended) return;

    if (this.travelTo && this.time >= this.travelUntil) {
      this.room = this.travelTo;
      this.zone = ROOM_ZONE[this.room];
      this.travelTo = null;
    }

    const k = (dt / len) * this.config.drain;
    const shield = this.sheltered ? SHELTER_FACTOR : 1;
    this.res.energy = clamp(this.res.energy + PASSIVE_PER_DAY.energy * k);
    this.res.life = clamp(this.res.life + PASSIVE_PER_DAY.life * k + (this.res.energy <= 0 ? NO_ENERGY_EXTRA_LIFE_PER_DAY * k : 0));
    this.res.radiation = clamp(this.res.radiation + BACKGROUND_RADIATION_PER_DAY * (dt / len) * shield);

    this.updateSuit(dt);
    if (this.ended) return;
    this.updateFlares(dt, shield);
    this.resolvePending();
    this.checkDepleted();
    this.checkCritical();
  }

  private updateFlares(dt: number, shield: number): void {
    const events = this.config.events;
    // aviso previo: con pronóstico llega antes
    while (this.warned < events.length) {
      const e = events[this.warned];
      const forecasted = this.forecastUntilDay >= e.day;
      const lead = forecasted ? FLARE_WARNING_SEC.forecasted : FLARE_WARNING_SEC.unforecasted;
      if (this.time < this.eventTime(e) - lead) break;
      this.warned++;
      this.events.push({ type: 'flareWarning', event: e, inSec: Math.max(0, this.eventTime(e) - this.time), forecasted });
    }
    while (this.fired < events.length && this.time >= this.eventTime(events[this.fired])) {
      const event = events[this.fired++];
      this.active.push({ event, remaining: FLARE_DURATION_SEC, total: flareDose(event.classType, event.sep), received: 0 });
      this.events.push({ type: 'flareStart', event, forecasted: this.forecastUntilDay >= event.day });
    }
    for (const f of this.active) {
      const portion = Math.min(dt, f.remaining) / FLARE_DURATION_SEC;
      const dose = f.total * portion * shield;
      f.received += dose;
      f.remaining -= dt;
      this.res.radiation = clamp(this.res.radiation + dose);
    }
    for (const f of this.active.filter((a) => a.remaining <= 0)) {
      if (f.received <= f.total * 0.3) this.stats.shelteredFlares++;
      else this.stats.unshieldedFlares++;
      this.events.push({ type: 'flareEnd', event: f.event, dose: Math.round(f.received) });
    }
    this.active = this.active.filter((a) => a.remaining > 0);
    this.checkTasks();
  }

  /** El traje gasta oxígeno en la superficie y se recarga en la nave o el invernadero. Vacío = rescate. */
  private updateSuit(dt: number): void {
    if (this.zone !== 'surface') {
      this.suit = Math.min(100, this.suit + SUIT_REFILL_PER_SEC * dt);
      if (this.suit > SUIT_LOW) this.suitWarned = false;
      return;
    }
    this.suit = Math.max(0, this.suit - (100 / SUIT_SECONDS) * this.config.drain * dt);
    if (!this.suitWarned && this.suit <= SUIT_LOW) {
      this.suitWarned = true;
      this.events.push({ type: 'suitLow' });
    }
    if (this.suit > 0) return;
    this.apply({ life: SUIT_RESCUE_LIFE });
    this.room = 'esclusa';
    this.zone = 'ship';
    this.travelTo = null;
    this.hall = false;
    this.events.push({ type: 'suitEmpty', lifeLost: -SUIT_RESCUE_LIFE });
    this.checkDepleted();
  }

  private resolvePending(): void {
    const due = this.pending.filter((p) => this.time >= p.at);
    if (!due.length) return;
    this.pending = this.pending.filter((p) => this.time < p.at);
    for (const p of due) {
      if (p.action === 'alignAntenna') {
        this.comp.antenna = 1;
        this.stats.antennaAligns++;
        this.events.push({ type: 'actionResolved', action: p.action, message: 'linkRestored' });
      } else if (p.action === 'forecast') {
        this.forecastUntilDay = this.day + FORECAST_HORIZON_DAYS - 1;
        this.stats.forecasts++;
        this.events.push({ type: 'actionResolved', action: p.action, message: 'forecastReady' });
      }
    }
  }

  /** Sin soporte vital o con la radiación al límite, la tripulación vuelve a la Tierra (sin barra de salud intermedia). */
  private checkDepleted(): void {
    if (this.res.life <= 0) this.finish(false, 'life');
    else if (this.res.radiation >= 100) this.finish(false, 'radiation');
  }

  private checkCritical(): void {
    for (const key of RESOURCE_KEYS) {
      const bad = key === 'radiation' ? this.res.radiation >= 100 - CRITICAL_THRESHOLD : this.res[key] <= CRITICAL_THRESHOLD;
      if (bad && !this.critical.has(key)) {
        this.critical.add(key);
        this.events.push({ type: 'critical', resource: key });
      } else if (!bad) this.critical.delete(key);
    }
  }

  private closeDay(): void {
    this.res.life = clamp(this.res.life + this.duskLife);
    this.duskLife = 0;
    this.comp.antenna = Math.max(0, this.comp.antenna - between(this.rnd, ANTENNA_DRIFT_PER_DAY));
    if (this.day >= this.config.days) {
      // fin del plazo: gana si sobrevivió y (si hay investigación) la terminó
      if (this.tasks.length && this.tasksDone < this.tasks.length) this.finish(false, 'timeout');
      else this.finish(true);
      return;
    }
    this.day++;
    this.resupplyDay = 0;
    this.events.push({ type: 'dayStart', day: this.day, light: this.light });
    if ((RESUPPLY_DAYS as readonly number[]).includes(this.day)) {
      if (this.radioOk) {
        this.resupplyDay = this.day;
        this.events.push({ type: 'resupplyOffer', day: this.day });
      } else this.events.push({ type: 'resupplyMissed', day: this.day });
    }
  }

  /** Avisa cada tarea recién cumplida; con todas cumplidas, la tripulación vuelve a la Tierra. */
  private checkTasks(): void {
    if (this.ended || !this.tasks.length) return;
    for (const t of this.tasks) {
      if (this.doneTasks.has(t.id) || this.taskProgress(t) < t.count) continue;
      this.doneTasks.add(t.id);
      this.events.push({ type: 'taskDone', id: t.id });
    }
    if (this.doneTasks.size === this.tasks.length) this.finish(true);
  }

  private finish(won: boolean, cause?: DeathCause): void {
    if (this.ended) return;
    this.ended = won ? 'won' : 'lost';
    if (won) {
      this.events.push({ type: 'missionComplete' });
      return;
    }
    this.cause = cause ?? 'timeout';
    this.events.push({ type: 'gameOver', cause: this.cause });
  }

  private apply(d: Partial<Resources>): void {
    for (const key of RESOURCE_KEYS) if (d[key] !== undefined) this.res[key] = clamp(this.res[key] + d[key]!);
  }

  summary(): MissionSummary {
    return {
      won: this.ended === 'won',
      cause: this.cause,
      daysSurvived: this.ended === 'won' || this.cause === 'timeout' ? this.day : this.day - 1,
      days: this.config.days,
      science: this.science,
      tasksDone: this.tasksDone,
      tasksTotal: this.tasks.length,
      resources: { ...this.res },
      stats: { ...this.stats, actionsBy: { ...this.stats.actionsBy } },
    };
  }
}
