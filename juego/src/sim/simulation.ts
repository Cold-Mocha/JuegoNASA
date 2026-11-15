import {
  ACTIONS, ACTION_COOLDOWN_SEC, ANTENNA_DRIFT_PER_DAY, BACKGROUND_RADIATION_PER_DAY, CRITICAL_THRESHOLD,
  BREACH_CHANCE, BREACH_FROM_DAY, BREACH_ROOMS, DUST_MAX_LOSS, DUST_PER_STORM, DUST_STORM_CHANCE, DUST_STORM_MAX_GAP, EARTH_MOON_ROUND_TRIP_SEC, EVA_FACTOR, FLARE_DURATION_SEC, FLARE_WARNING_SEC,
  GROW_LIGHTS_AT_DUSK, HEALTH_DANGER_AT, HEALTH_LOSS_PER_DAY, HEALTH_RADIATION_AT, LIGHT_BY_DAY, LINK_MIN_RADIO,
  NO_ENERGY_EXTRA_OXYGEN_PER_DAY, MAX_PER_DAY, ONCE_PER_DAY, OXYGEN_LEAK_PER_DAY, OXYGEN_REGEN_PER_DAY, PANEL_REGEN_PER_DAY, PASSIVE_PER_DAY, ROOM_ZONE, SHELTER_FACTOR,
  SUIT_LOW, SUIT_REFILL_PER_SEC, SUIT_RESCUE_OXYGEN, SUIT_SECONDS, clamp,
} from './rules';
import { travelTime } from './graph';
import { flareDose } from './flares';
import { between, createRng } from './rng';
import type {
  ActionCheck, ActionId, Components, DeathCause, Resources, RoomId, SimConfig, SimEvent, SimStats, SolarEvent, TaskGoal, Zone,
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

const RESOURCE_KEYS: (keyof Resources)[] = ['energy', 'oxygen', 'food', 'health', 'radiation'];

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
  res: Resources = { energy: 100, oxygen: 70, food: 70, health: 100, radiation: 0 };
  comp: Components = { antenna: 1, dust: 0 };
  science = 0;
  /** El panel de pruebas se ensució con la última tormenta de polvo y todavía no se limpió. */
  testDirty = false;
  private lastStormDay = 0;
  ended: 'won' | 'lost' | null = null;
  cause: DeathCause | null = null;
  readonly stats: SimStats = { shelteredFlares: 0, unshieldedFlares: 0, evas: 0, antennaAligns: 0, actions: 0, actionsBy: {} };

  private readonly rnd: () => number;
  private events: SimEvent[] = [];
  private fired = 0;
  private warned = 0;
  private active: ActiveFlare[] = [];
  private pending: Pending[] = [];
  private cooldowns = new Map<ActionId, number>();
  private doneToday = new Map<ActionId, { day: number; n: number }>(); // cuántas veces se hizo hoy cada acción con tope diario
  private duskOxygen = 0;
  private duskFood = 0;
  private travelUntil = 0;
  private travelTo: RoomId | null = null;
  private hall = false;
  private doneTasks = new Set<string>();
  private critical = new Set<keyof Resources>();
  private suitWarned = false;
  private panelsWereOk = true;
  private stageAnnounced = false;
  /** Sala donde hay una fractura (el oxígeno no se regenera, ni en la nave ni en el traje) o null. */
  breach: RoomId | null = null;

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

  /** ¿Se terminaron las tareas de la investigación? Entonces se desbloquea "Avisar a la Tierra" (etapa 2). */
  get stage2Unlocked(): boolean {
    return this.tasks.filter((t) => (t.stage ?? 1) === 1).every((t) => this.taskProgress(t) >= t.count);
  }

  /** La acción pertenece a una tarea de la etapa 2 que todavía no está disponible. */
  private stageLocked(action: ActionId): boolean {
    return !this.stage2Unlocked && this.tasks.some((t) => t.stage === 2 && t.kind === 'action' && t.action === action);
  }

  get tasksDone(): number {
    return this.tasks.filter((t) => this.taskProgress(t) >= t.count).length;
  }

  /** El michi está en un pasillo (camina libre por el plano): no hay máquinas a mano. */
  get inHall(): boolean {
    return this.hall;
  }

  /** Rendimiento de los paneles (0–1): el polvo les quita hasta DUST_MAX_LOSS. */
  get panelEfficiency(): number {
    return 1 - this.comp.dust * DUST_MAX_LOSS;
  }

  /** Energía que generan los paneles por jornada: depende del polvo y de la luz (de noche no producen nada). */
  get panelOutput(): number {
    return PANEL_REGEN_PER_DAY * this.panelEfficiency * this.light;
  }

  /** Los paneles funcionan mientras generen al menos lo que gasta la nave (entonces la energía se renueva sola). */
  get panelsOk(): boolean {
    return this.panelOutput >= -PASSIVE_PER_DAY.energy * this.config.drain;
  }

  /** Radio buena o mala: lo único que ve el jugador del enlace con la Tierra. */
  get radioOk(): boolean {
    return this.comp.antenna >= LINK_MIN_RADIO;
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

  /** ¿Se puede hacer ahora, sin importar dónde esté el michi? (cooldown, límite diario, energía o comida) */
  available(action: ActionId): boolean {
    if (this.ended) return false;
    if (action === 'repair' && !this.breach) return false;
    if (this.stageLocked(action)) return false;
    if ((this.cooldowns.get(action) ?? 0) > this.time || this.isPending(action)) return false;
    if (this.dailyLimitReached(action)) return false;
    const d = this.preview(action);
    if (d.energy !== undefined && d.energy < 0 && this.res.energy + d.energy < 0) return false;
    if (d.food !== undefined && d.food < 0 && this.res.food + d.food < 0) return false;
    return true;
  }

  /** Tope de veces por jornada de una acción (Infinity = sin tope). */
  private dailyCap(action: ActionId): number {
    return ONCE_PER_DAY.has(action) ? 1 : MAX_PER_DAY[action] ?? Infinity;
  }

  private dailyLimitReached(action: ActionId): boolean {
    const d = this.doneToday.get(action);
    return d?.day === this.day && d.n >= this.dailyCap(action);
  }

  /** ¿Sirve de algo hacerla ahora? (curarse con la salud llena, cosechar con la comida llena o limpiar paneles limpios no) */
  useful(action: ActionId): boolean {
    switch (action) {
      case 'heal': return this.res.health < 100;
      case 'pedal': return this.res.energy < 100;
      case 'harvest': return this.res.food < 100;
      case 'cleanDust': return this.comp.dust > 0.05;
      case 'cleanTestPanel': return this.testDirty;
      case 'repairAntenna': return this.comp.antenna < 0.95;
      default: return true;
    }
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
    if (this.breach && d.oxygen !== undefined && d.oxygen > 0) delete d.oxygen; // con fractura el oxígeno no se regenera
    if (action === 'eva' && this.flareActive) d.radiation = (d.radiation ?? 0) * EVA_FACTOR;
    if (rule.science) d.science = rule.science;
    return d;
  }

  /** Limpiar solo se puede cuando una tormenta de polvo ensució los paneles (no a voluntad). */
  private needsCleaning(action: ActionId): boolean {
    if (action === 'cleanDust') return this.comp.dust > 0.05;
    if (action === 'cleanTestPanel') return this.testDirty;
    return true;
  }

  canAct(action: ActionId): ActionCheck {
    if (this.ended) return { ok: false, reason: 'ended' };
    const room = action === 'repair' ? this.breach : ACTIONS[action].room;
    if (!room || this.traveling || this.hall || room !== this.room) return { ok: false, reason: 'busy' };
    if ((this.cooldowns.get(action) ?? 0) > this.time || this.isPending(action)) return { ok: false, reason: 'cooldown' };
    const d = this.preview(action);
    if (d.energy !== undefined && d.energy < 0 && this.res.energy + d.energy < 0) return { ok: false, reason: 'noEnergy' };
    if (d.food !== undefined && d.food < 0 && this.res.food + d.food < 0) return { ok: false, reason: 'noFood' };
    if (this.stageLocked(action)) return { ok: false, reason: 'locked' };
    if (!this.needsCleaning(action)) return { ok: false, reason: 'clean' };
    if (this.dailyLimitReached(action)) return { ok: false, reason: action === 'eva' ? 'evaDone' : 'doneToday' };
    return { ok: true };
  }

  /** Ejecuta la acción si es posible. Devuelve el cambio aplicado o null. */
  act(action: ActionId, scale = 1): ActionDelta | null {
    if (!this.canAct(action).ok) return null;
    const d = this.preview(action);
    if (scale !== 1) for (const k of Object.keys(d) as (keyof ActionDelta)[]) if ((d[k] ?? 0) > 0) d[k] = Math.round((d[k] as number) * scale); // minijuegos: se gana según lo logrado
    this.apply(d);
    if (d.science) this.science += d.science;
    this.cooldowns.set(action, this.time + ACTION_COOLDOWN_SEC);
    const cap = this.dailyCap(action);
    if (cap !== Infinity) {
      const prev = this.doneToday.get(action);
      this.doneToday.set(action, { day: this.day, n: (prev?.day === this.day ? prev.n : 0) + 1 });
    }
    this.stats.actions++;
    this.stats.actionsBy[action] = (this.stats.actionsBy[action] ?? 0) + 1;

    switch (action) {
      case 'growLights': if (!this.breach) this.duskOxygen += GROW_LIGHTS_AT_DUSK.oxygen; this.duskFood += GROW_LIGHTS_AT_DUSK.food; break;
      case 'cleanDust': this.comp.dust = 0; break;
      case 'cleanTestPanel': this.testDirty = false; break; // el panel de pruebas no limpia los paneles de la estación
      case 'repair': this.breach = null; this.events.push({ type: 'breachRepaired' }); break;
      case 'eva': this.stats.evas++; break;
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
    this.res.energy = clamp(this.res.energy + PASSIVE_PER_DAY.energy * k + this.panelOutput * (dt / len));
    this.checkPanels();
    this.res.oxygen = clamp(this.res.oxygen + PASSIVE_PER_DAY.oxygen * k + (this.breach ? OXYGEN_LEAK_PER_DAY * k : OXYGEN_REGEN_PER_DAY * (dt / len)) + (this.res.energy <= 0 ? NO_ENERGY_EXTRA_OXYGEN_PER_DAY * k : 0));
    this.res.food = clamp(this.res.food + PASSIVE_PER_DAY.food * k);
    this.updateHealth(k);
    this.res.radiation = clamp(this.res.radiation + BACKGROUND_RADIATION_PER_DAY * (dt / len) * shield);

    this.updateSuit(dt);
    if (this.ended) return;
    this.updateFlares(dt, shield);
    this.resolvePending();
    this.checkDepleted();
    this.checkCritical();
  }

  /** Cada jornada puede abrirse una fractura en una sala de la nave (una a la vez). */
  private rollBreach(): void {
    if (this.breach || this.day < BREACH_FROM_DAY || this.rnd() >= BREACH_CHANCE) return;
    this.breach = BREACH_ROOMS[Math.floor(this.rnd() * BREACH_ROOMS.length)];
    this.events.push({ type: 'breachOpened', room: this.breach });
  }

  /** Avisa cuando los paneles empiezan a fallar (la energía va a bajar) y cuando se arreglan. */
  private checkPanels(): void {
    const ok = this.panelsOk;
    if (ok === this.panelsWereOk) return;
    this.panelsWereOk = ok;
    this.events.push({ type: ok ? 'panelsRestored' : 'panelsFailing' });
  }

  /** La salud baja mientras falte oxígeno o comida, o la radiación sea muy alta. */
  private updateHealth(k: number): void {
    let loss = 0;
    if (this.res.oxygen <= HEALTH_DANGER_AT) loss += HEALTH_LOSS_PER_DAY.oxygen;
    if (this.res.food <= HEALTH_DANGER_AT) loss += HEALTH_LOSS_PER_DAY.food;
    if (this.res.radiation > HEALTH_RADIATION_AT) loss += HEALTH_LOSS_PER_DAY.radiation * ((this.res.radiation - HEALTH_RADIATION_AT) / (100 - HEALTH_RADIATION_AT));
    if (loss) this.res.health = clamp(this.res.health + loss * k);
  }

  private updateFlares(dt: number, shield: number): void {
    const events = this.config.events;
    // aviso previo: con pronóstico llega antes
    while (this.warned < events.length) {
      const e = events[this.warned];
      const forecasted = false;
      const lead = FLARE_WARNING_SEC.unforecasted;
      if (this.time < this.eventTime(e) - lead) break;
      this.warned++;
      this.events.push({ type: 'flareWarning', event: e, inSec: Math.max(0, this.eventTime(e) - this.time), forecasted });
    }
    while (this.fired < events.length && this.time >= this.eventTime(events[this.fired])) {
      const event = events[this.fired++];
      this.active.push({ event, remaining: FLARE_DURATION_SEC, total: flareDose(event.classType, event.sep), received: 0 });
      this.events.push({ type: 'flareStart', event, forecasted: false });
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
    this.apply({ oxygen: SUIT_RESCUE_OXYGEN });
    this.room = 'esclusa';
    this.zone = 'ship';
    this.travelTo = null;
    this.hall = false;
    this.events.push({ type: 'suitEmpty', oxygenLost: -SUIT_RESCUE_OXYGEN });
    this.checkDepleted();
  }

  private resolvePending(): void {
    const due = this.pending.filter((p) => this.time >= p.at);
    if (!due.length) return;
    this.pending = this.pending.filter((p) => this.time < p.at);
    for (const p of due) {
      if (p.action === 'repairAntenna') {
        this.comp.antenna = 1;
        this.stats.antennaAligns++;
        this.events.push({ type: 'actionResolved', action: p.action, message: 'linkRestored' });
      }
    }
  }

  /** Con salud 0 (o la radiación al límite) la tripulación vuelve a la Tierra; la causa es la que estaba en peligro. */
  private checkDepleted(): void {
    if (this.res.radiation >= 100) this.finish(false, 'radiation');
    else if (this.res.health <= 0) {
      const causes: DeathCause[] = [];
      if (this.res.oxygen <= HEALTH_DANGER_AT) causes.push('oxygen');
      if (this.res.food <= HEALTH_DANGER_AT) causes.push('food');
      if (this.res.radiation > HEALTH_RADIATION_AT) causes.push('radiation');
      this.finish(false, causes.length === 1 ? causes[0] : 'mixed');
    }
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
    if (!this.breach) this.res.oxygen = clamp(this.res.oxygen + this.duskOxygen);
    this.res.food = clamp(this.res.food + this.duskFood);
    this.duskOxygen = 0;
    this.duskFood = 0;
    this.comp.antenna = Math.max(0, this.comp.antenna - between(this.rnd, ANTENNA_DRIFT_PER_DAY));
    if (this.day >= this.config.days) {
      // fin del plazo: gana si sobrevivió y (si hay investigación) la terminó
      if (this.tasks.length && this.tasksDone < this.tasks.length) this.finish(false, 'timeout');
      else this.finish(true);
      return;
    }
    this.day++;
    this.events.push({ type: 'dayStart', day: this.day, light: this.light });
    this.rollBreach();
    this.rollDustStorm();
  }

  /** Cada jornada puede llegar una tormenta de polvo (segura si pasaron DUST_STORM_MAX_GAP jornadas sin una): cubre los paneles y ensucia el de pruebas. */
  private rollDustStorm(): void {
    if (this.rnd() >= DUST_STORM_CHANCE && this.day - this.lastStormDay < DUST_STORM_MAX_GAP) return;
    this.lastStormDay = this.day;
    this.comp.dust = Math.min(1, this.comp.dust + between(this.rnd, DUST_PER_STORM));
    this.testDirty = true;
    this.events.push({ type: 'dustStorm' });
  }

  /** Avisa cada tarea recién cumplida; con todas cumplidas, la tripulación vuelve a la Tierra. */
  private checkTasks(): void {
    if (this.ended || !this.tasks.length) return;
    for (const t of this.tasks) {
      if (this.doneTasks.has(t.id) || this.taskProgress(t) < t.count) continue;
      this.doneTasks.add(t.id);
      this.events.push({ type: 'taskDone', id: t.id });
    }
    if (!this.stageAnnounced && this.tasks.some((t) => t.stage === 2) && this.stage2Unlocked) {
      this.stageAnnounced = true;
      this.events.push({ type: 'stageUnlocked' });
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
