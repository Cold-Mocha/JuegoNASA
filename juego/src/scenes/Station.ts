import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { state } from '../core/state';
import { tokenColor, tokenCss, FONT_DISPLAY } from '../core/theme';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { settingsHtml, bindSettings } from '../core/settingsPanel';
import { michiSvg, michiFaceSvg, addSvgTexture } from '../core/art';
import { MAP_RASTER, MAP_TEXTURE, stationSvg } from '../core/stationArt';
import { addDrawnProps, drawnPropsReady } from '../core/propArt';
import { MISSIONS, MISSION_DAYS, missionEvents, realDate, type Mission } from '../data/missions';
import { DIFFICULTIES, type Difficulty } from '../data/difficulties';
import { CHARACTERS } from '../data/characters';
import { ROOMS, ROOM_IDS, propPosition, roomProps, textureAsset, type RoomProp } from '../data/rooms';
import { ACTION_TEXT, BLOCK_REASON, RESOURCE_TEXT } from '../data/actions';
import { CONTROLS, POINTER_HINT } from '../data/controls';
import { MICHI_ANCHOR, MICHI_ANIMS, michiKey, propKey, type MichiAnim } from '../data/preload';
import { Simulation, type ActionDelta } from '../sim/simulation';
import { FLARE_DURATION_SEC, SUIT_LOW, WALK_SPEED, WORLD_SCALE, quality } from '../sim/rules';
import {
  GRAVITY, PX_PER_METER, airTime, jumpHeight, createDash, startDash, tickDash, dashSpeedFactor, type DashState,
} from '../sim/physics';
import {
  HALLS, MAP_H, MAP_W, ROOM_RECTS, WALL_H, findRoute, isWalkable, moveOnMap, roomAt, roomCenter, zoneAt, type Obstacle, type Point,
} from '../sim/stationMap';
import { severity } from '../sim/flares';
import { Pool } from '../sim/pool';
import { computeScore } from '../sim/score';
import { earnedAchievements } from '../sim/achievements';
import type { ActionId, Resources, RoomId, SimEvent, Zone } from '../sim/types';
import { icon, type IconName } from '../core/icons';
import { mountDustGame, type DustGame } from '../core/dustGame';
import { mountSealGame, type SealGame } from '../core/sealGame';
import { mountTestPanel } from '../core/testPanelGame';
import {
  mountAlgae, mountAntennaGame, mountBiosignature, mountHarvestGame, mountHealGame, mountNoisyMessage, mountPedal, PEDAL_PASS, type MiniCallbacks, type MiniGameHandle,
} from '../core/miniGames';
import { ACTION_ICON, RESOURCE_ICON, ROOM_ICON, taskIcon } from '../core/iconMap';

const PROP_TEXTURE_SCALE = 1.25; // los PNG de props se exportan a 1,25× del tamaño 1x
const PROP_SIZE = 0.95;          // tamaño en el mapa respecto del dibujo 1x (un casillero mide ~1,6 michis de alto)
const PROP_PAPER_MARGIN = 17.5;  // px de textura bajo el objeto (borde de papel de 14 px a 1x, exportado a 1,25×)
const MICHI_SCALE = 0.6;
const JUMP_V0 = 1.8;             // m/s: con g lunar sube ~1 m (en la Tierra serían ~16 cm)
const INTERACT_RADIUS = 210;     // px de mapa entre los pies del michi y los de la máquina
const OBSTACLE_R = { interactive: 85, deco: 52 } as const; // los adornos de pared no tienen
const MACHINE_FRONT = 130;        // el michi camina solo hasta este punto frente a la máquina
const HUD_HZ = 10;
const GHOSTS = 4;                // estela del impulso (pool)
const CAMERA_ZOOM = 0.8;         // cámara alejada: se ve más estación alrededor del michi
const CAMERA_LOOK_DOWN = -90;     // px de mapa que la cámara mira bajo los pies del michi (negativo: el michi queda más abajo en la pantalla)
const CAMERA_MARGIN = 450;       // la cámara puede pasar un poco del borde del mapa para que el michi no se quede arriba cerca de los bordes

interface Machine { room: RoomId; at: Point; sprite: Phaser.GameObjects.Image; prop: RoomProp; active?: boolean; }
/** Paso del tutorial: `guide` es el objeto al que apunta la flecha; `manual` pide pulsar «Entendido» (si no, avanza solo al cumplirse). */
interface TutorialStep { text: string; done: () => boolean; guide?: string; manual?: boolean; cta?: string; }

type Overlay = 'none' | 'pause' | 'settings' | 'map' | 'actions' | 'intro' | 'controls' | 'minigame';
/** Paneles que detienen el reloj de la misión. */
const PAUSING: ReadonlySet<Overlay> = new Set(['pause', 'settings', 'intro', 'controls', 'minigame']);

export class StationScene extends Phaser.Scene {
  private sim!: Simulation;
  private mission!: Mission;
  private difficulty!: Difficulty;
  private ui!: UiLayer;
  private timescale = 1;

  private michi!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private flareTint!: Phaser.GameObjects.Rectangle;
  private darkTint!: Phaser.GameObjects.Rectangle;
  private pos: Point = roomCenter(START_ROOM);
  private face = 1;
  private jumpT = -1;
  private helmet = false;
  private anim: MichiAnim = 'idle';
  private oneShot = false;
  private here: RoomId | null = START_ROOM;
  private zone: Zone = 'ship';
  private machines: Machine[] = [];
  private obstacles: Obstacle[] = [];
  private focused: Machine | null = null;
  private route: Point[] = [];
  private openOnArrival = false;
  private dash: DashState = createDash();
  private dashDir: Point = { x: 1, y: 0 };
  private ghostTimer = 0;
  private ghostPool!: Pool<Phaser.GameObjects.Image>;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private overlay: Overlay = 'none';
  private hudTimer = 0;
  private hudCache = new Map<string, string>();
  private floatPool!: Pool<Phaser.GameObjects.Text>;
  private alertTimer?: Phaser.Time.TimerEvent;
  private tipTimer?: Phaser.Time.TimerEvent;
  private tutorial: TutorialStep[] = [];
  private tutorialIndex = -1;
  private flags = { moved: false, opened: false, map: false, archive: false };
  private ending = false;
  private miniGame?: DustGame | SealGame | MiniGameHandle;
  /** El minijuego se juega afuera (superficie): el reloj no se detiene y el traje sigue gastando oxígeno. */
  private miniOutdoor = false;
  private breachProp?: Machine;
  private recycler?: { sprite: Phaser.GameObjects.Image; at: Point };
  private pulses = new Map<Machine, Phaser.Tweens.Tween>();
  private taskTab: 1 | 2 = 1;
  private disposers: (() => void)[] = [];

  constructor() {
    super(SCENES.station);
  }

  create(): void {
    const l = state.loadout;
    if (!l) {
      this.scene.start(SCENES.menu);
      return;
    }
    if (!this.textures.exists(MAP_TEXTURE) || !drawnPropsReady(this.textures)) {
      // normalmente los rasteriza la pantalla del cohete; esto cubre entradas directas (recarga en desarrollo)
      void Promise.all([addSvgTexture(this.textures, MAP_TEXTURE, stationSvg(), MAP_W, MAP_H, MAP_RASTER), addDrawnProps(this.textures)])
        .then(() => this.scene.restart());
      return;
    }
    this.mission = MISSIONS.find((m) => m.id === l.mission)!;
    this.difficulty = DIFFICULTIES.find((d) => d.id === l.difficulty)!;
    const scale = Number(new URLSearchParams(location.search).get('timescale'));
    this.timescale = Number.isFinite(scale) && scale >= 1 ? Math.min(scale, 50) : 1; // herramienta de QA (tests E2E)

    this.sim = new Simulation({
      days: MISSION_DAYS,
      dayLengthSec: this.difficulty.dayLengthSec,
      drain: this.difficulty.drain,
      tasks: this.mission.tasks,
      events: missionEvents(this.mission),
      seed: Date.now() & 0xffff,
    });
    Object.assign(this, { pos: roomCenter(START_ROOM), face: 1, jumpT: -1, helmet: false, anim: 'idle', oneShot: false, here: START_ROOM, zone: 'ship',
      focused: null, route: [], openOnArrival: false, dash: createDash(), dashDir: { x: 1, y: 0 }, ghostTimer: 0,
      overlay: 'none', hudTimer: 0, tutorialIndex: -1, ending: false, breachProp: undefined, recycler: undefined, miniGame: undefined, miniOutdoor: false, pulses: new Map(), taskTab: 1 });
    this.flags = { moved: false, opened: false, map: false, archive: false };
    this.hudCache.clear();
    this.machines = [];
    this.obstacles = [];
    this.disposers = [];

    fadeIn(this, 500);
    this.buildWorld();
    this.createMichi();
    this.darkTint = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tokenColor('space-900'), 0).setOrigin(0).setScrollFactor(0).setDepth(9000);
    this.darkTint.setAlpha(darknessFor(this.sim.res.energy));
    this.flareTint = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tokenColor('nebula-magenta'), 0).setOrigin(0).setScrollFactor(0).setDepth(9001);
    this.ghostPool = new Pool(
      // estela blanca: silueta del michi (tinte en modo relleno)
      () => this.add.image(0, 0, michiKey(false, 'walk')).setOrigin(MICHI_ANCHOR.x, MICHI_ANCHOR.y).setVisible(false).setTint(0xffffff).setTintMode(Phaser.TintModes.FILL),
      (g) => g.setVisible(false).setAlpha(1),
      GHOSTS,
    );
    this.floatPool = new Pool(
      () => this.add.text(0, 0, '', { fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: '700', stroke: tokenCss('space-900'), strokeThickness: 6 }).setOrigin(0.5).setDepth(9500).setVisible(false),
      (t) => t.setVisible(false).setAlpha(1),
      12,
    );
    const cam = this.cameras.main;
    cam.setBounds(0, -CAMERA_MARGIN, MAP_W, MAP_H + CAMERA_MARGIN * 2).setRoundPixels(true).setZoom(CAMERA_ZOOM);
    cam.startFollow(this.michi, true, 0.14, 0.14).setFollowOffset(0, -CAMERA_LOOK_DOWN);
    cam.centerOn(this.pos.x, this.pos.y + CAMERA_LOOK_DOWN);

    this.buildHud();
    this.splitCameras();
    this.bindInput();
    this.onLocation(START_ROOM, 'ship');
    this.startTutorial();

    this.events.on(Phaser.Scenes.Events.RESUME, () => this.ui.q('[data-overlay]').hidden || this.ui.focusFirst('.modal [data-action]'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.disposers.forEach((d) => d()));
  }

  /**
   * El zoom de la cámara principal también achicaría el HUD (DOM) y los velos de pantalla completa:
   * esos van en una cámara aparte sin zoom, y todo lo que se agregue al mundo después queda solo en la principal.
   */
  private splitCameras(): void {
    const screenOnly: Phaser.GameObjects.GameObject[] = [this.ui.dom, this.darkTint, this.flareTint];
    const hudCam = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    hudCam.inputEnabled = false; // los clics van a la cámara del mundo (máquinas y piso)
    this.cameras.main.ignore(screenOnly);
    hudCam.ignore(this.children.list.filter((o) => !screenOnly.includes(o)));
    const onAdded = (o: Phaser.GameObjects.GameObject): void => void (screenOnly.includes(o) || hudCam.ignore(o));
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded);
    this.disposers.push(() => this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdded));
  }

  // ======================================================== mundo (un solo plano continuo)
  private buildWorld(): void {
    this.add.image(0, 0, MAP_TEXTURE).setOrigin(0).setScale(1 / MAP_RASTER).setDepth(-1000);
    const k = PROP_SIZE / PROP_TEXTURE_SCALE;
    for (const room of ROOM_IDS) {
      for (const p of roomProps(room, this.mission.id)) {
        let at = propPosition(room, p);
        // el PNG trae un margen de papel bajo el objeto: se baja ese margen para que quede apoyado en el piso
        // los objetos de la jornada siempre llevan contorno
        const img = this.add.image(at.x, at.y + PROP_PAPER_MARGIN * k, propKey(textureAsset(p, !!p.missions))).setOrigin(0.5, 1).setScale(k).setDepth(at.y);
        // el objeto no se sale de su sala: su dibujo (sin el margen transparente) queda dentro del piso, sin montarse sobre las paredes
        const r = ROOM_RECTS[room];
        const half = img.displayWidth / 2 - PROP_PAPER_MARGIN * k;
        at = { x: Phaser.Math.Clamp(at.x, r.x + half, r.x + r.w - half), y: at.y };
        img.setX(at.x);
        if (p.asset === 'reciclador-aire') this.recycler = { sprite: img, at };
        if (p.kind === 'wall') {
          img.setDepth(at.y - 500); // colgado de la pared: siempre detrás del michi
          continue;
        }
        this.obstacles.push({ x: at.x, y: at.y, r: OBSTACLE_R[p.kind] });
        if (p.kind === 'interactive') this.addMachine(room, p, img, at);
      }
    }
  }

  private addMachine(room: RoomId, p: RoomProp, sprite: Phaser.GameObjects.Image, at: Point): void {
    const m: Machine = { room, at, sprite, prop: p };
    this.machines.push(m);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      if (this.overlay !== 'none' && this.overlay !== 'actions') return;
      audio.unlock();
      if (this.nearestMachine() === m) this.openActions();
      else this.walkTo({ x: m.at.x, y: m.at.y + MACHINE_FRONT }, true);
    });
  }

  /** Lista de tareas: las hechas quedan tachadas. */
  /** Lista de tareas en dos pestañas: las propias de la investigación y, solo cuando se terminan, "Avisar a la Tierra". */
  private renderTasks(): void {
    const unlocked = this.sim.stage2Unlocked && this.mission.tasks.some((t) => t.stage === 2);
    if (!unlocked && this.taskTab === 2) this.taskTab = 1;
    this.ui.q('[data-tab2]').hidden = !unlocked;
    this.ui.el.querySelectorAll<HTMLElement>('.hud__tab').forEach((b) => {
      const on = Number(b.dataset.tab) === this.taskTab;
      b.classList.toggle('is-current', on);
      b.setAttribute('aria-selected', String(on));
    });
    const html = this.mission.tasks.filter((t) => (t.stage ?? 1) === this.taskTab).map((t) => {
      const n = this.sim.taskProgress(t);
      const done = n >= t.count;
      return `<li class="mn-check ${done ? 'is-done' : ''}"><span class="mn-check__box" aria-hidden="true">${done ? icon('check') : ''}</span>
        <span class="mn-check__text">${icon(taskIcon(t))}${esc(t.label)}</span><span class="mn-check__meta">${n}/${t.count}</span></li>`;
    }).join('');
    this.setHtml('[data-tasks]', html);
  }

  /**
   * Avisos en los bordes: si un recurso está crítico (o hay una llamarada y no estás protegido),
   * una flecha en el borde de la pantalla apunta a la sala que lo resuelve; si la sala se ve, el aviso queda sobre su máquina.
   */
  private updateGuides(): void {
    const needs = new Map<string, string[]>(); // máquina (asset) → motivos
    const add = (asset: string, label: string): void => void needs.set(asset, [...(needs.get(asset) ?? []), label]);
    for (const key of this.sim.criticals) if (key !== 'radiation') add(key === 'energy' && !(this.sim.comp.dust > 0.05 && this.sim.light > 0) ? BIKE_ASSET : GUIDE_ASSET[key], RESOURCE_TEXT[key].label);
    if (this.sim.breach) add(BREACH_GUIDE, 'Fractura');
    const guide = this.tutorialIndex >= 0 ? this.tutorial[this.tutorialIndex]?.guide : undefined;
    if (guide) add(guide, 'Tutorial');
    const incoming = this.sim.incomingFlare;
    const outside = !this.sim.sheltered;
    if (outside && this.sim.flareActive) add(DOOR_ASSET, 'Llamarada');
    else if (outside && incoming) add(DOOR_ASSET, `Llamarada en ${Math.ceil(incoming.inSec)} s`);
    else if (outside && this.sim.suit <= SUIT_LOW && this.zone === 'surface') add(DOOR_ASSET, 'Oxígeno');
    for (const asset of needs.keys()) if (this.guideTarget(asset)?.room === this.here) needs.delete(asset); // ya estás ahí
    if (this.sim.ended || PAUSING.has(this.overlay)) needs.clear();

    const box = this.ui.q('[data-guides]');
    for (const el of [...box.children] as HTMLElement[]) if (!needs.has(el.dataset.guide!)) el.remove();
    const cam = this.cameras.main;
    const view = cam.worldView;
    const margin = { left: 70, right: GAME_WIDTH - 70, top: 150, bottom: GAME_HEIGHT - 70 };
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    for (const [asset, labels] of needs) {
      const m = this.guideTarget(asset);
      if (!m) continue;
      let el = box.querySelector<HTMLElement>(`[data-guide="${asset}"]`);
      if (!el) {
        el = document.createElement('div');
        el.className = 'hud__guide';
        el.dataset.guide = asset;
        el.innerHTML = `<span class="hud__guide-arrow">${icon('next')}</span><span class="hud__guide-label">${icon(ROOM_ICON[m.room])}<span data-text></span></span>`;
        box.append(el);
      }
      const text = `${labels.join(', ')} → ${m.name}`;
      const label = el.querySelector<HTMLElement>('.hud__guide-label [data-text]')!;
      if (label.textContent !== text) label.textContent = text;
      const sx = (m.at.x - view.x) * cam.zoom; // de mapa a pantalla (la cámara está alejada)
      const sy = (m.at.y - 290 - view.y) * cam.zoom;
      const onScreen = sx > margin.left && sx < margin.right && sy > margin.top && sy < margin.bottom;
      let x = sx;
      let y = sy;
      let angle = 90; // apunta hacia abajo, a la máquina
      if (!onScreen) {
        const dx = sx - cx;
        const dy = sy - cy;
        const tx = dx > 0 ? (margin.right - cx) / dx : dx < 0 ? (margin.left - cx) / dx : Infinity;
        const ty = dy > 0 ? (margin.bottom - cy) / dy : dy < 0 ? (margin.top - cy) / dy : Infinity;
        const t = Math.min(tx, ty);
        x = cx + dx * t;
        y = cy + dy * t;
        angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      }
      el.classList.toggle('is-onscreen', onScreen);
      el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
      el.style.setProperty('--angle', `${angle.toFixed(0)}deg`);
    }
  }

  /** Adónde guía una flecha: la máquina de ese objeto o, para la salida de la nave, la Esclusa. */
  private guideTarget(asset: string): { room: RoomId; at: Point; name: string } | null {
    if (asset === BREACH_GUIDE && this.breachProp) return { room: this.breachProp.room, at: this.breachProp.at, name: machineName(this.breachProp) };
    if (asset === DOOR_ASSET) return { room: 'esclusa', at: roomCenter('esclusa'), name: ROOMS.esclusa.name };
    const m = this.machines.find((x) => x.prop.asset === asset);
    return m ? { room: m.room, at: m.at, name: machineName(m) } : null;
  }

  /** Sin niebla alrededor: la estación solo se oscurece (pareja) a medida que baja la energía. */
  private updateDarkness(dt: number): void {
    const target = darknessFor(this.sim.res.energy);
    this.darkTint.setAlpha(this.darkTint.alpha + (target - this.darkTint.alpha) * Math.min(1, dt * 3));
  }

  private createMichi(): void {
    for (const helmet of [false, true]) {
      for (const [anim, cfg] of Object.entries(MICHI_ANIMS) as [MichiAnim, (typeof MICHI_ANIMS)[MichiAnim]][]) {
        const key = michiKey(helmet, anim);
        if (this.anims.exists(key)) this.anims.remove(key); // el tripulante pudo cambiar entre partidas
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: cfg.fps, repeat: cfg.loop ? -1 : 0 });
      }
    }
    this.shadow = this.add.ellipse(this.pos.x, this.pos.y, 70, 18, 0x000000, 0.3);
    this.michi = this.add.sprite(this.pos.x, this.pos.y, michiKey(false, 'idle')).setOrigin(MICHI_ANCHOR.x, MICHI_ANCHOR.y).setScale(MICHI_SCALE);
    this.michi.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => (this.oneShot = false));
    this.michi.play(michiKey(false, 'idle'));
  }

  private playAnim(anim: MichiAnim, oneShot = false): void {
    if (this.oneShot && !oneShot) return;
    if (anim === this.anim && !oneShot && this.michi.anims.isPlaying) return;
    this.anim = anim;
    this.oneShot = oneShot;
    this.michi.play(michiKey(this.helmet, anim));
  }

  // ======================================================== loop
  update(_time: number, deltaMs: number): void {
    if (!this.sim || this.ending) return;
    const dt = deltaMs / 1000;
    const paused = PAUSING.has(this.overlay);
    const simPaused = this.tutorialIndex >= 0 || (paused && !(this.overlay === 'minigame' && this.miniOutdoor)); // afuera el tiempo corre aunque se juegue; en el tutorial el reloj está detenido
    if (!simPaused) {
      this.sim.tick(dt * this.timescale);
      for (const ev of this.sim.drainEvents()) this.onSimEvent(ev);
      tickDash(this.dash, dt);
    }
    this.updatePlayer(dt, paused);
    this.updateDarkness(dt);
    this.updateGuides();
    this.hudTimer += dt;
    if (this.hudTimer >= 1 / HUD_HZ) {
      this.hudTimer = 0;
      this.renderHud();
    }
  }

  private updatePlayer(dt: number, paused: boolean): void {
    const k = this.keys;
    const canMove = !paused && this.overlay !== 'map' && !this.sim.ended;
    const input = { x: 0, y: 0 };
    if (canMove) {
      input.x = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
      input.y = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    }
    if (input.x !== 0 || input.y !== 0) {
      this.route = []; // el teclado manda: cancela la caminata automática
      this.openOnArrival = false;
      this.dashDir = { ...input };
    }
    const dashing = this.dash.remaining > 0;
    if (canMove && dashing && input.x === 0 && input.y === 0 && !this.route.length) Object.assign(input, this.dashDir);
    const speed = WALK_SPEED * dashSpeedFactor(this.dash);

    let moving = false;
    if (input.x !== 0 || input.y !== 0) {
      const next = moveOnMap(this.pos, input, speed, dt, this.obstacles);
      moving = next.x !== this.pos.x || next.y !== this.pos.y;
      this.pos = next;
      this.flags.moved ||= moving;
      if (input.x !== 0) this.face = Math.sign(input.x);
    } else if (canMove && this.route.length) {
      moving = this.followRoute(speed, dt);
    }

    if (this.jumpT >= 0) {
      this.jumpT += dt;
      if (this.jumpT > airTime(JUMP_V0, GRAVITY.moon)) this.jumpT = -1;
    }
    if (!this.oneShot) this.playAnim(moving ? 'walk' : this.sim.criticals.size ? 'hurt' : 'idle');

    const loc = roomAt(this.pos);
    const zone = zoneAt(this.pos);
    if (loc !== this.here || zone !== this.zone) this.onLocation(loc, zone);

    const lift = this.jumpT >= 0 ? jumpHeight(JUMP_V0, GRAVITY.moon, this.jumpT) * PX_PER_METER : 0;
    this.michi.setPosition(this.pos.x, this.pos.y - lift).setDepth(this.pos.y + 0.5);
    // giro de papel: la escala X se acerca suavemente a ±1
    const target = this.face * MICHI_SCALE;
    this.michi.scaleX += (target - this.michi.scaleX) * Math.min(1, dt * 14);
    this.shadow.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y - 0.5).setScale(1 - Math.min(0.5, lift / 120));
    if (dashing && moving) this.dropGhost(dt);

    this.updateFocus();
  }

  /** Avanza por la ruta automática; devuelve si se movió. Al llegar, abre la máquina si se pidió. */
  private followRoute(speed: number, dt: number): boolean {
    let step = speed * Math.min(dt, 0.1);
    while (step > 0 && this.route.length) {
      const t = this.route[0];
      const dx = t.x - this.pos.x;
      const dy = t.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 2) this.face = Math.sign(dx);
      if (d <= step) {
        this.pos = { ...t };
        this.route.shift();
        step -= d;
      } else {
        this.pos = { x: this.pos.x + (dx / d) * step, y: this.pos.y + (dy / d) * step };
        step = 0;
      }
    }
    if (!this.route.length && this.openOnArrival) {
      this.openOnArrival = false;
      if (this.nearestMachine()) this.openActions();
    }
    return true;
  }

  private walkTo(target: Point, openOnArrival: boolean): boolean {
    if (this.sim.ended) return false;
    const route = findRoute(this.pos, target);
    if (!route.length) return false;
    this.route = route;
    this.openOnArrival = openOnArrival;
    return true;
  }

  /** Cambio de sala, pasillo o zona al caminar: avisa a la simulación, pone o saca el casco y actualiza el HUD. */
  private onLocation(loc: RoomId | null, zone: Zone): void {
    const fromHall = this.here === null;
    const zoneChanged = zone !== this.zone;
    this.here = loc;
    this.zone = zone;
    this.sim.enter(loc, zone);
    if ((loc && fromHall) || zoneChanged) audio.play('door');
    this.setHelmet(zone === 'surface');
    this.ui.el.dataset.room = loc ?? 'pasillo';
    if (this.overlay === 'actions') this.closeOverlay();
  }

  /** Teletransporte de rescate (traje vacío): el michi aparece en la Esclusa. */
  private rescue(): void {
    this.route = [];
    this.openOnArrival = false;
    this.pos = roomCenter('esclusa');
    this.onLocation('esclusa', 'ship');
    this.cameras.main.centerOn(this.pos.x, this.pos.y + CAMERA_LOOK_DOWN);
  }

  private nearestMachine(): Machine | null {
    if (this.sim.inHall || this.sim.ended) return null;
    let best: Machine | null = null;
    let bestD = INTERACT_RADIUS;
    for (const m of this.machines) {
      if (m.room !== this.sim.room) continue;
      const d = Math.hypot(this.pos.x - m.at.x, this.pos.y - m.at.y);
      if (d < bestD) [best, bestD] = [m, d];
    }
    return best;
  }

  /**
   * Las máquinas se ven normales; cuando se puede interactuar con ellas (se pueden hacer, sirven de algo o una tarea las pide)
   * toman su contorno blanco y palpitan (los objetos propios de la jornada llevan el contorno siempre y solo palpitan al poder usarse).
   * Con movimiento reducido solo cambia el contorno.
   */
  private updateMachines(): void {
    const base = PROP_SIZE / PROP_TEXTURE_SCALE;
    for (const m of this.machines) {
      const want = !this.sim.ended && (m.prop.actions ?? []).some((a) => this.sim.available(a)
        && (this.sim.useful(a) || this.sim.tasks.some((t) => t.kind === 'action' && t.action === a && this.sim.taskProgress(t) < t.count && (t.stage !== 2 || this.sim.stage2Unlocked))));
      if (want === !!m.active) continue;
      m.active = want;
      m.sprite.setTexture(propKey(textureAsset(m.prop, want || !!m.prop.missions))); // los de la jornada mantienen el contorno
      const old = this.pulses.get(m);
      if (old) {
        old.stop();
        this.pulses.delete(m);
        m.sprite.setScale(base);
      }
      if (want && !state.calm) {
        this.pulses.set(m, this.tweens.add({ targets: m.sprite, scale: base * 1.03, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' }));
      }
    }
  }

  /** Resalta la máquina a mano (pulso suave) y muestra la pista de la tecla E. */
  private updateFocus(): void {
    const m = this.overlay === 'none' || this.overlay === 'actions' ? this.nearestMachine() : null;
    if (m !== this.focused) {
      this.focused?.sprite.clearTint();
      this.focused = m;
      m?.sprite.setTint(0xfff3c4);
      if (!m && this.overlay === 'actions') this.closeOverlay();
    }
    const prompt = this.ui.q('[data-prompt]');
    prompt.hidden = !m || this.overlay !== 'none';
    if (m) this.setText('[data-prompt-label]', `Usar: ${machineName(m)}`);
  }

  // ---------- impulso
  private tryDash(): void {
    if (this.overlay !== 'none' && this.overlay !== 'actions') return;
    if (this.sim.ended) return;
    if (!startDash(this.dash)) {
      audio.play('error'); // sin carga: el impulso se recarga solo
      return;
    }
    if (!this.route.length) this.dashDir = this.dashDir.x || this.dashDir.y ? this.dashDir : { x: this.face, y: 0 };
    this.ghostTimer = 0;
    audio.play('jump');
  }

  /** Estela del impulso: copias del michi que se desvanecen (pool; se omite en Ultra Ligero o con movimiento reducido). */
  private dropGhost(dt: number): void {
    if (state.calm || state.settings.ultraLight) return;
    this.ghostTimer -= dt;
    if (this.ghostTimer > 0) return;
    this.ghostTimer = 0.04;
    const g = this.ghostPool.acquire();
    if (!g) return;
    g.setTexture(this.michi.texture.key, this.michi.frame.name).setPosition(this.michi.x, this.michi.y)
      .setScale(this.michi.scaleX, this.michi.scaleY).setDepth(this.michi.depth - 0.2).setAlpha(0.65).setVisible(true);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => this.ghostPool.release(g) });
  }

  // ======================================================== simulación → pantalla
  private onSimEvent(ev: SimEvent): void {
    switch (ev.type) {
      case 'dayStart': {
        audio.play('day');
        const light = ev.light >= 1 ? 'Día lunar' : ev.light > 0 ? 'Atardecer: los paneles rinden la mitad' : 'Noche lunar: los paneles no producen';
        this.alert(`Día ${ev.day}, ${realDate(this.mission, ev.day)}. ${light}`, 'info');
        if (ev.light === 0 && ev.day === 5) this.tip('Empieza la noche lunar. Los paneles no producen: guarda energía y pedalea en la bicicleta si hace falta.');
        break;
      }
      case 'flareWarning': {
        audio.play('radio');
        const where = !this.sim.sheltered ? '¡Vuelve a la nave!' : this.sim.res.energy > 0 ? 'Estás dentro de la nave: el blindaje va a gastar energía.' : 'Sin energía, el blindaje protege la mitad.';
        this.alert(`⚠ Viene una llamarada ${flareName(ev.event.classType)}. ${where}`, 'danger', ev.inSec * 1000); // la cuenta regresiva va aparte; el aviso queda hasta que llega
        if (!this.sim.sheltered) this.tip(ev.forecasted ? 'El pronóstico te dio tiempo: vuelve a la nave por la Esclusa.' : '¡Corre a la nave! Si pides el pronóstico en Comunicaciones, el aviso llega mucho antes.');
        break;
      }
      case 'flareStart': {
        const sev = severity(ev.event.classType);
        this.alert(`¡Llamarada ${flareName(ev.event.classType)}! Pasó de verdad el ${realDate(this.mission, ev.event.day)}${!this.sim.sheltered ? '. ¡Vuelve a la nave!' : this.sim.res.energy > 0 ? '. Estás protegido: el blindaje gasta energía.' : '. Sin energía el blindaje protege la mitad.'}`, 'danger', FLARE_DURATION_SEC * 1000);
        audio.play('alarm');
        if (!state.calm && sev !== 'minor') this.cameras.main.shake(500, sev === 'severe' ? 0.006 : 0.003);
        this.flareTint.setAlpha(sev === 'severe' ? 0.22 : 0.14);
        if (!state.calm) this.tweens.add({ targets: this.flareTint, alpha: 0.06, duration: 800, yoyo: true, repeat: Math.floor(FLARE_DURATION_SEC / 1.6) });
        if (!this.sim.sheltered) this.tip(ev.forecasted ? '¡La llamarada del pronóstico! Entra a la nave lo antes posible.' : 'Llegó casi sin aviso. Con el pronóstico de Comunicaciones habrías tenido tiempo de volver a la nave.');
        break;
      }
      case 'flareEnd':
        this.tweens.killTweensOf(this.flareTint);
        this.flareTint.setAlpha(0);
        this.float(`+${ev.dose} ${RESOURCE_TEXT.radiation.short}`, 'nebula-magenta');
        if (ev.dose > 8) {
          audio.play('hurt');
          this.playAnim('hurt', true);
        }
        break;
      case 'actionDone':
        this.showDelta(ev.delta);
        this.playAnim('use', true);
        audio.play(ACTIONS_DELAYED.has(ev.action) ? 'radio' : 'confirm');
        if (ACTIONS_DELAYED.has(ev.action)) this.alert('Mensaje enviado. La Tierra está lejos: la respuesta tarda casi 3 segundos, aunque viaja a la velocidad de la luz.', 'info');
        break;
      case 'actionResolved':
        audio.play('radio');
        if (ev.message === 'forecast') {
          this.alert(ev.flares ? `Pronóstico de la Tierra: ${ev.flares === 1 ? 'viene 1 llamarada' : `vienen ${ev.flares} llamaradas`}. Te avisaremos 25 segundos antes de cada una.` : 'Pronóstico de la Tierra: el Sol está tranquilo. No se esperan llamaradas.', 'ok');
        }
        break;
      case 'stageUnlocked':
        audio.play('achievement');
        this.taskTab = 2;
        this.renderTasks();
        this.alert('¡Investigación lista! Ahora avisa a la Tierra: repara la antena.', 'ok');
        break;
      case 'taskDone': {
        audio.play('achievement'); // sin cartel: el avance se ve en la lista de tareas
        this.renderTasks();
        break;
      }
      case 'critical': {
        audio.play('error');
        const advice: Record<keyof Resources, string> = {
          energy: 'Queda poca energía. Pedalea en la bicicleta del Puente; si hay sol, limpia los paneles.',
          oxygen: 'Queda poco O₂. Ve al reciclador de CO₂ en Soporte vital.',
          food: 'Queda poca comida. Prepárala en la cocina de Soporte vital.',
          health: 'Tu salud está baja. Ve a la Enfermería y cúrate.',
          radiation: 'Tienes mucha radiación. Quédate dentro de la nave todo lo que puedas.',
        };
        this.alert(`⚠ ${RESOURCE_TEXT[ev.resource].label} en estado crítico`, 'danger');
        this.tip(advice[ev.resource]);
        break;
      }
      case 'breachOpened':
        audio.play('alarm');
        this.spawnBreach(ev.room);
        this.alert(`⚠ ¡Se rompió el reciclador de oxígeno! Se escapa el aire: el oxígeno de la nave baja hasta que lo repares.`, 'danger');
        this.tip(`Ve a ${ROOMS[ev.room].name}, al reciclador roto, y sella la grieta con el sellador.`);
        break;
      case 'breachRepaired':
        this.removeBreach();
        audio.play('confirm');
        break;
      case 'dustStorm':
        audio.play('error');
        this.alert('⚠ ¡Tormenta de polvo! El polvo lunar cubrió los paneles solares.', 'danger');
        this.tip('Sal a la superficie y limpia los paneles con el cepillo antes de que la energía baje.');
        break;
      case 'panelsFailing':
        audio.play('error');
        if (this.sim.light < 1) {
          // sin sol no hay nada que limpiar: solo queda la reserva y la bicicleta
          this.alert('⚠ Con poca luz los paneles generan menos de lo que gasta la nave: la energía empezó a bajar.', 'danger');
          this.tip('Sin sol solo queda la energía guardada. Pedalea en la bicicleta del Puente y gasta lo justo.');
        } else {
          this.alert('⚠ Los paneles solares fallan: están llenos de polvo y la energía empezó a bajar.', 'danger');
          this.tip('Sal a la superficie y limpia el polvo de los paneles para que la energía vuelva a renovarse.');
        }
        break;
      case 'panelsRestored':
        audio.play('confirm');
        break;
      case 'suitLow':
        audio.play('error');
        this.alert('⚠ Queda poco oxígeno en el traje. Vuelve a la nave o entra al invernadero.', 'danger');
        break;
      case 'suitEmpty':
        audio.play('hurt');
        if (this.overlay === 'minigame') this.closeOverlay(); // se acabó el oxígeno limpiando: se cancela, sin costo ni efecto
        this.rescue();
        this.alert(`Se acabó el oxígeno del traje: la tripulación te rescató (−${ev.oxygenLost} O₂ de la estación).`, 'danger');
        this.tip('Afuera el traje dura poco. Mira la barra de oxígeno y vuelve antes de que se vacíe.');
        break;
      case 'gameOver':
      case 'missionComplete':
        this.finish();
        break;
    }
  }

  private setHelmet(on: boolean): void {
    if (this.helmet === on) return;
    this.helmet = on;
    this.oneShot = false;
    this.michi.play(michiKey(on, this.anim));
  }

  private showDelta(d: ActionDelta): void {
    const colors: Record<string, string> = { energy: 'star-gold', oxygen: 'comet-cyan', food: 'solar-coral', health: 'aurora-teal', radiation: 'nebula-magenta', science: 'nebula-violet' };
    let i = 0;
    for (const [key, v] of Object.entries(d) as [keyof typeof RESOURCE_TEXT, number][]) {
      if (!v) continue;
      this.time.delayedCall(i++ * 220, () => this.float(`${v > 0 ? '+' : '−'}${Math.abs(Math.round(v))} ${RESOURCE_TEXT[key].short}`, colors[key]));
    }
  }

  /** Texto flotante sobre el michi, tomado del pool (sin crear objetos nuevos cada vez). */
  private float(text: string, color: string): void {
    const t = this.floatPool.acquire();
    if (!t) return;
    t.setText(text).setColor(tokenCss(color)).setPosition(this.michi.x, this.michi.y - 120).setVisible(true).setAlpha(1);
    if (state.calm) {
      this.time.delayedCall(1100, () => this.floatPool.release(t));
      return;
    }
    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 1200, ease: 'Quad.out', onComplete: () => this.floatPool.release(t) });
  }

  // ======================================================== acciones y caminatas
  private act(id: ActionId): void {
    const check = this.sim.canAct(id);
    if (!check.ok) {
      audio.play('error');
      this.alert(BLOCK_REASON[check.reason!], 'danger');
      return;
    }
    if (id === 'cleanDust') return this.openDustGame(id); // limpiar a mano: el costo se cobra al terminar
    if (id === 'cleanTestPanel') return this.openTestPanelGame();
    if (id === 'growLights') return this.openAlgaeGame();
    if (id === 'repair') return this.openSealGame();
    if (id === 'repairAntenna') return this.openAntennaFlow();
    if (id === 'pedal') return this.openPedalGame();
    if (id === 'eva') return this.openBiosignatureGame();
    if (id === 'harvest') return this.openHarvestGame();
    if (id === 'heal') return this.openHealGame();
    this.sim.act(id);
    for (const ev of this.sim.drainEvents()) this.onSimEvent(ev);
    this.renderActions();
  }

  // ---------- minijuegos: todos a pantalla completa y sin texto (el reloj se detiene; el costo y el efecto se aplican al terminar)
  /** Minijuego a pantalla completa: solo el juego y, los primeros segundos, una pista corta de qué hacer (se sale con Esc). Termina con un destello y una marca de listo. */
  private openFullMini(cfg: { hint: string; mount: (root: HTMLElement, cb: MiniCallbacks) => MiniGameHandle; finish: (result?: number) => void; outdoor?: boolean; next?: () => void; failed?: (result?: number) => string | null }): void {
    this.closeOverlay();
    this.miniOutdoor = !!cfg.outdoor;
    this.openModal(`
      <div class="mini-full" aria-label="Minijuego">
        <div class="mini-full__stage" data-dust-root></div>
        <div class="mini-full__done" data-dust-result hidden aria-hidden="true">${icon('check')}</div>
        <p class="mini-full__hint" data-mini-hint>${esc(cfg.hint)}</p>
      </div>
      ${cfg.outdoor ? `<div class="mini-suit" aria-label="Oxígeno del traje">${icon('helmet')}<div class="mini-suit__track"><div class="mini-suit__fill" data-mini-suit></div></div></div>` : ''}`, 'minigame', 'modal__panel--full');
    const hint = this.ui.q('[data-mini-hint]');
    this.time.delayedCall(MINI_HINT_MS, () => hint.isConnected && (hint.hidden = true));
    this.miniGame = cfg.mount(this.ui.q('[data-dust-root]'), {
      onProgress: () => undefined,
      onDone: (result) => {
        const failure = cfg.failed?.(result) ?? null; // no se alcanzó la meta: no hay marca de listo ni efecto
        if (failure) {
          audio.play('error');
          this.alert(failure, 'danger');
        } else {
          audio.play('achievement');
          this.ui.q('[data-dust-result]').hidden = false;
          this.ui.q('.mini-full').classList.add('is-done');
          cfg.finish(result);
        }
        for (const ev of this.sim.drainEvents()) this.onSimEvent(ev);
        this.time.delayedCall(1100, () => {
          if (this.overlay !== 'minigame') return;
          if (cfg.next) cfg.next(); // minijuego encadenado (p. ej. cables y después el mensaje)
          else this.closeOverlay();
        });
      },
    });
  }

  private openDustGame(action: 'cleanDust'): void {
    this.openFullMini({
      hint: 'Pasa el cepillo sobre el polvo',
      mount: (root, cb) => mountDustGame(root, { dust: this.sim.comp.dust, ...cb }),
      finish: () => void this.sim.act(action),
      outdoor: true, // en la superficie el traje sigue gastando oxígeno mientras limpias
    });
  }

  /** Panel de pruebas (Energía del Sol): limpiarlo y orientarlo al Sol. Se juega afuera: el traje sigue gastando. */
  private openTestPanelGame(): void {
    this.openFullMini({ hint: 'Limpia el panel y gíralo hacia el Sol', mount: (root, cb) => mountTestPanel(root, cb), finish: (r) => void this.sim.act('cleanTestPanel', quality(r ?? 1)), outdoor: true });
  }

  /** Cultivo de algas (Huerto lunar): mantener luz, nutrientes y temperatura en su franja (en Cadete, sin la temperatura). */
  private openAlgaeGame(): void {
    this.openFullMini({ hint: 'Mantén apretado para subir la aguja', mount: (root, cb) => mountAlgae(root, cb, this.difficulty.id === 'cadete' ? 2 : 3), finish: (r) => void this.sim.act('growLights', quality(r ?? 1)) });
  }

  private openSealGame(): void {
    this.openFullMini({ hint: 'Sigue la grieta con el sellador', mount: (root, cb) => mountSealGame(root, cb), finish: () => void this.sim.act('repair') });
  }

  /**
   * Avisar a la Tierra: si la señal está floja primero se conectan los cables; después se recupera el mensaje dañado por la estática.
   * El aviso (la acción) se cobra al terminar el mensaje; su calidad cuenta para la ganancia.
   */
  private openAntennaFlow(): void {
    const message = (): void => this.openFullMini({ hint: 'Elige el símbolo que sigue el patrón', mount: (root, cb) => mountNoisyMessage(root, cb), finish: (r) => void this.sim.act('repairAntenna', quality(r ?? 1)) });
    if (this.sim.comp.antenna < 0.7) this.openFullMini({ hint: 'Une los cables del mismo color', mount: (root, cb) => mountAntennaGame(root, cb), finish: () => undefined, next: message });
    else message();
  }

  /** Taladro de hielo: emparejar los picos del espectro; la ciencia ganada escala con la calidad. Se juega afuera: el traje sigue gastando. */
  private openBiosignatureGame(): void {
    this.openFullMini({ hint: 'Une cada pico con su huella', mount: (root, cb) => mountBiosignature(root, cb), finish: (r) => void this.sim.act('eva', quality(r ?? 1)), outdoor: true });
  }

  /** Bicicleta de energía: seguir el ritmo con los dos pedales. */
  private openPedalGame(): void {
    this.openFullMini({
      hint: 'Toca el pedal cuando llegue la nota',
      mount: (root, cb) => mountPedal(root, cb),
      finish: (r) => void this.sim.act('pedal', quality(r ?? 1)),
      failed: (r) => ((r ?? 1) > PEDAL_PASS ? null : 'No pedaleaste lo suficiente: hay que pasar la marca de la barra.'),
    });
  }

  /** Curarse: tratar cada herida manteniendo apretado. */
  private openHealGame(): void {
    this.openFullMini({ hint: 'Mantén apretada cada herida hasta cerrarla', mount: (root, cb) => mountHealGame(root, cb), finish: (r) => void this.sim.act('heal', quality(r ?? 1)) });
  }

  private openHarvestGame(): void {
    this.openFullMini({ hint: 'Toca solo las plantas maduras', mount: (root, cb) => mountHarvestGame(root, cb), finish: (result) => void this.sim.act('harvest', quality(result ?? 1)) });
  }

  /** La fractura sale del reciclador de oxígeno: el reciclador de la sala se cambia por su versión rota, que es lo que hay que reparar. */
  private spawnBreach(room: RoomId): void {
    const rec = this.recycler;
    if (!rec || room !== 'soporte' || this.breachProp) return;
    const k = PROP_SIZE / PROP_TEXTURE_SCALE;
    const prop: RoomProp = { asset: 'reciclador-roto', kind: 'interactive', x: 0, y: 0, actions: ['repair'], name: 'Reciclador de oxígeno roto' };
    rec.sprite.setVisible(false);
    const sprite = this.add.image(rec.at.x, rec.at.y + PROP_PAPER_MARGIN * k, propKey('reciclador-roto')).setOrigin(0.5, 1).setScale(k).setDepth(rec.at.y);
    const m: Machine = { room, at: rec.at, sprite, prop };
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      if (this.overlay !== 'none' && this.overlay !== 'actions') return;
      audio.unlock();
      if (this.nearestMachine() === m) this.openActions();
      else this.walkTo({ x: m.at.x, y: m.at.y + MACHINE_FRONT }, true);
    });
    this.machines.push(m);
    this.breachProp = m;
  }

  /** Reparado: el reciclador vuelve a verse entero. */
  private removeBreach(): void {
    const m = this.breachProp;
    if (!m) return;
    this.pulses.get(m)?.stop();
    this.pulses.delete(m);
    m.sprite.destroy();
    this.machines = this.machines.filter((x) => x !== m);
    if (this.focused === m) this.focused = null;
    this.recycler?.sprite.setVisible(true);
    this.breachProp = undefined;
  }


  // ======================================================== HUD (HTML)
  private buildHud(): void {
    const ch = CHARACTERS.find((c) => c.id === state.loadout!.character)!;
    const bar = (key: keyof Resources, cls: string): string => `
      <div class="mn-bar ${cls}" role="progressbar" aria-label="${RESOURCE_TEXT[key].label}" aria-valuemin="0" aria-valuemax="100" data-res="${key}">
        <span class="mn-bar__label">${icon(RESOURCE_ICON[key])}${RESOURCE_TEXT[key].label}</span>
        <div class="mn-bar__track"><div class="mn-bar__fill" data-fill></div></div>
        <span class="mn-bar__value" data-value>0</span>
      </div>`;
    const system = (key: string, ic: IconName, label: string): string => `
      <div class="hud__sys" data-sys="${key}">
        <span class="hud__sys-label">${icon(ic)}${label}</span>
        <span class="hud__sys-state" data-sys-state></span>
      </div>`;
    this.ui = new UiLayer(this, /* html */ `
      <div class="hud" data-hud>
        <div class="hud__clock mn-panel">
          <div class="hud__clock-row"><span class="mn-chip mn-chip--outline" data-day></span><span class="hud__light" data-light></span></div>
          <div class="hud__daybar" aria-hidden="true"><i data-daybar></i></div>
        </div>
        <div class="hud__guides" data-guides aria-live="polite"></div>
        <div class="hud__left">
          <section class="hud__stats mn-panel" aria-label="Estado de la misión">
            ${bar('energy', 'mn-bar--energy')}${bar('food', 'mn-bar--hunger')}${bar('health', 'mn-bar--health')}${bar('radiation', 'mn-bar--radiation')}
          </section>
          <section class="hud__suit mn-panel" data-suit hidden aria-label="Oxígeno">
            <div class="mn-bar mn-bar--oxygen" role="progressbar" aria-label="Oxígeno" aria-valuemin="0" aria-valuemax="100" data-suit-bar>
              <span class="mn-bar__label">${icon('helmet')}Oxígeno</span>
              <div class="mn-bar__track"><div class="mn-bar__fill" data-fill></div></div>
              <span class="mn-bar__value" data-value></span>
            </div>
          </section>
          <section class="hud__systems mn-panel" aria-label="Estado de los equipos">
            ${system('oxygen', 'oxygen', 'Aire de la nave')}${system('panels', 'panel', 'Paneles solares')}${system('radio', 'antenna', 'Radio')}
          </section>
        </div>
        <div class="hud__top-right">
          <section class="hud__tasks mn-panel" aria-label="Investigación">
            <span class="hud__tasks-name">${esc(this.mission.name)}</span>
            <div class="hud__tabs" role="tablist" aria-label="Tareas">
              <button class="hud__tab" role="tab" data-action="tasks-tab" data-tab="2" data-tab2 hidden>Avisar a la Tierra</button>
            </div>
            <ul class="mn-checklist" data-tasks></ul>
          </section>
          <span class="caption-mono hud__fps" data-fps hidden></span>
        </div>
        <div class="hud__alert" data-alert role="status" aria-live="polite" hidden></div>
        <div class="hud__countdown" data-countdown hidden>${icon('radiation')}<span data-countdown-text></span></div>
        <div class="hud__prompt" data-prompt hidden><span class="mn-key">E</span> <span data-prompt-label></span></div>
        <div class="hud__tip mn-dialogue" data-tip hidden>
          <div class="mn-dialogue__portrait hud__tip-portrait">${michiSvg({ ...ch, id: 'miu', name: 'Comandante Nébula', fur: '#f5f5f2', furDark: '#c4c2e0', antennae: undefined, eyeScale: undefined }, tokenCss('nebula-violet'))}</div>
          <div>
            <p class="mn-dialogue__name">Comandante Nébula</p>
            <p class="mn-dialogue__text" data-tip-text></p>
            <div class="hud__tip-actions" data-tip-actions hidden>
              <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="tutorial-skip">${icon('skip')}Saltar tutorial</button>
              <button class="mn-btn mn-btn--sm" data-action="tutorial-next">${icon('check')}Entendido</button>
            </div>
          </div>
        </div>
        <aside class="hud__actions mn-panel" data-actions hidden aria-label="Acciones de la sala"></aside>
      </div>
      <div class="modal" data-overlay hidden></div>`, 'screen screen--clear');

    this.ui
      .on('resume', () => this.closeOverlay())
      .on('close', () => (this.overlay === 'settings' || this.overlay === 'controls' ? this.openPause() : this.closeOverlay()))
      .on('controls', () => this.openControls())
      .on('tutorial-start', () => this.runTutorial())
      .on('tutorial-decline', () => {
        this.closeOverlay();
        this.endTutorial();
      })
      .on('settings', () => this.openSettings())
      .on('archive', () => this.openArchive())
      .on('quit', () => fadeTo(this, SCENES.menu))
      .on('act', (el) => this.act(el.dataset.id as ActionId))
      .on('close-actions', () => this.closeOverlay())
      .on('tasks-tab', () => { this.taskTab = this.taskTab === 2 ? 1 : 2; this.renderTasks(); }) // alterna entre la investigación y "Avisar a la Tierra"
      .on('tutorial-next', () => this.nextTutorial(true))
      .on('tutorial-skip', () => this.endTutorial());
    this.disposers.push(bindSettings(this.ui, () => undefined));
  }

  private renderHud(): void {
    const s = this.sim;
    for (const key of ['energy', 'food', 'health', 'radiation'] as (keyof Resources)[]) {
      const v = Math.round(s.res[key]);
      const id = `res-${key}`;
      if (this.hudCache.get(id) === String(v)) continue;
      this.hudCache.set(id, String(v));
      const el = this.ui.q(`[data-res="${key}"]`);
      el.setAttribute('aria-valuenow', String(v));
      (el.querySelector('[data-fill]') as HTMLElement).style.width = `${v}%`;
      (el.querySelector('[data-value]') as HTMLElement).textContent = key === 'radiation' ? `${v}%` : String(v);
      el.classList.toggle('is-critical', key === 'radiation' ? v >= 80 : v <= 20);
    }
    this.setText('[data-day]', `Día ${s.day}/${s.config.days}`);
    this.setText('[data-light]', s.light >= 1 ? '☀ Día' : s.light > 0 ? '◐ Atardecer' : '☾ Noche');
    (this.ui.q('[data-daybar]') as HTMLElement).style.width = `${Math.round(s.dayProgress * 100)}%`;
    this.renderSuit();
    this.renderSystems();
    this.renderMiniSuit();
    const incoming = s.incomingFlare;
    const countdown = this.ui.q('[data-countdown]');
    countdown.hidden = !incoming;
    if (incoming) {
      this.setText('[data-countdown-text]', `Llamarada ${flareName(incoming.event.classType)} en ${Math.ceil(incoming.inSec)} s`);
      countdown.classList.toggle('is-safe', s.sheltered);
    }
    this.renderTasks();
    this.updateMachines();

    const fps = this.ui.q('[data-fps]');
    fps.hidden = !state.settings.showFps;
    if (state.settings.showFps) fps.textContent = `${Math.round(this.game.loop.actualFps)} FPS`;
    if (this.overlay === 'actions') this.renderActions();
    if (this.overlay === 'map') this.renderMapMarker();
    this.checkTutorial();
  }

  /** Estado de los equipos bajo las stats: aire de la nave, paneles solares y radio. */
  private renderSystems(): void {
    const s = this.sim;
    const night = s.light === 0;
    const rows: Record<string, { text: string; bad: boolean }> = {
      oxygen: s.breach ? { text: 'Fuga', bad: true } : { text: `${Math.round(s.res.oxygen)}%`, bad: s.res.oxygen <= 20 },
      panels: { text: night ? 'Sin sol' : `${Math.round(s.panelEfficiency * 100)}%`, bad: !s.panelsOk },
      radio: { text: !s.radioOk ? 'Señal débil' : s.forecasted ? 'Con pronóstico' : 'Señal buena', bad: !s.radioOk },
    };
    for (const [key, row] of Object.entries(rows)) {
      const id = `sys-${key}`;
      const sig = `${row.text}|${row.bad}`;
      if (this.hudCache.get(id) === sig) continue;
      this.hudCache.set(id, sig);
      const el = this.ui.q(`[data-sys="${key}"]`);
      el.classList.toggle('is-bad', row.bad);
      (el.querySelector('[data-sys-state]') as HTMLElement).textContent = row.text;
    }
  }

  /** Barra del traje: aparece al salir de la nave y se esconde cuando vuelve a estar llena adentro. */
  /** Barra de oxígeno del traje dentro del minijuego de afuera (el HUD queda tapado), sin texto: se ve cuánto aire queda mientras limpias. */
  private renderMiniSuit(): void {
    if (this.overlay !== 'minigame' || !this.miniOutdoor) return;
    const fill = this.ui.el.querySelector<HTMLElement>('[data-mini-suit]');
    if (!fill) return;
    const v = Math.max(0, Math.min(100, this.sim.suit));
    fill.style.width = `${v}%`;
    fill.parentElement!.classList.toggle('is-critical', v <= SUIT_LOW);
  }

  /**
   * Barra de Oxígeno debajo de las stats: afuera muestra el del traje; adentro solo aparece si el oxígeno de la nave está bajo
   * o hay una fractura, y entonces muestra el de la nave. Sin textos.
   */
  private renderSuit(): void {
    const s = this.sim;
    const suitMode = this.zone === 'surface' || s.suit < 99.5;
    const stationMode = !suitMode && (!!s.breach || s.res.oxygen <= 30);
    const panel = this.ui.q('[data-suit]');
    panel.hidden = !suitMode && !stationMode;
    if (panel.hidden) return;
    const v = Math.round(suitMode ? s.suit : s.res.oxygen);
    const bar = this.ui.q('[data-suit-bar]');
    bar.setAttribute('aria-valuenow', String(v));
    (bar.querySelector('[data-fill]') as HTMLElement).style.width = `${v}%`;
    this.setText('[data-suit-bar] [data-value]', suitMode ? `${Math.ceil(s.suitSecondsLeft)} s` : `${v}`);
    bar.classList.toggle('is-critical', suitMode ? this.zone === 'surface' && v <= SUIT_LOW : v <= 20);
  }

  private setText(sel: string, text: string): void {
    if (this.hudCache.get(sel) === text) return;
    this.hudCache.set(sel, text);
    this.ui.q(sel).textContent = text;
  }

  private setHtml(sel: string, html: string): void {
    if (this.hudCache.get(sel) === html) return;
    this.hudCache.set(sel, html);
    this.ui.q(sel).innerHTML = html;
  }

  /** Aviso arriba al centro. `ms`: cuánto dura (los de llamarada duran hasta que pasa el evento). */
  private alert(text: string, tone: 'info' | 'ok' | 'danger', ms = ALERT_MS): void {
    const el = this.ui.q('[data-alert]');
    el.textContent = text;
    el.className = `hud__alert hud__alert--${tone}`;
    el.hidden = false;
    this.alertTimer?.remove();
    this.alertTimer = this.time.delayedCall(Math.max(ALERT_MS, ms / this.timescale), () => (el.hidden = true));
  }

  /** Consejo de la Comandante (solo en dificultades con pistas). */
  private tip(text: string): void {
    if (!this.difficulty.hints || this.tutorialIndex >= 0) return;
    this.ui.q('[data-tip-actions]').hidden = true;
    this.setText('[data-tip-text]', text);
    this.ui.q('[data-tip]').hidden = false;
    this.tipTimer?.remove();
    this.tipTimer = this.time.delayedCall(7000, () => (this.ui.q('[data-tip]').hidden = true));
  }

  // ---------- paneles ----------
  private openActions(): void {
    this.overlay = 'actions';
    this.flags.opened = true;
    this.ui.q('[data-actions]').hidden = false;
    this.renderActions();
    this.ui.focusFirst('[data-actions] [data-action="act"]:not([disabled])');
  }

  private renderActions(): void {
    const m = this.focused ?? this.nearestMachine();
    if (!m) return;
    const ids = this.machineActions();
    const chips = (d: ActionDelta): string =>
      (Object.entries(d) as [keyof typeof RESOURCE_TEXT, number][])
        .filter(([, v]) => v)
        .map(([k, v]) => {
          const good = k === 'radiation' ? v < 0 : v > 0;
          return `<span class="delta ${good ? 'delta--good' : 'delta--bad'}">${v > 0 ? '+' : '−'}${Math.abs(Math.round(v))} ${RESOURCE_TEXT[k].short}</span>`;
        })
        .join('') || '<span class="delta">Sin costo directo</span>';
    const items = ids.map((id, i) => {
      const check = this.sim.canAct(id);
      const pending = this.sim.isPending(id);
      return `<li class="action">
        <button class="mn-btn mn-btn--sm action__btn" data-action="act" data-id="${id}" ${check.ok ? '' : 'disabled'}><span class="mn-key">${i + 1}</span>${icon(ACTION_ICON[id])}${ACTION_TEXT[id].label}</button>
        <div class="action__deltas">${chips(this.sim.preview(id))}</div>
        <p class="body-sm action__why">${pending ? 'Esperando respuesta de la Tierra…' : check.ok ? ACTION_TEXT[id].why : BLOCK_REASON[check.reason!]}</p>
      </li>`;
    });
    this.setHtml('[data-actions]', `
      <div class="hud__actions-head"><h2 class="mn-panel__title">${icon(ROOM_ICON[m.room])}${esc(machineName(m))}</h2>
      <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="close-actions" aria-label="Cerrar">${icon('close')}</button></div>
      <ul class="action-list">${items.join('')}</ul>`);
  }

  /** Acciones de la máquina que tienes cerca (cada máquina tiene las suyas). */
  private machineActions(): ActionId[] {
    return (this.focused ?? this.nearestMachine())?.prop.actions ?? [];
  }

  /** Mapa (solo para mirar): el plano a escala y una carita de michi donde estás. */
  private toggleMap(): void {
    if (this.overlay === 'map') return this.closeOverlay();
    if (this.overlay !== 'none' && this.overlay !== 'actions') return;
    this.closeOverlay();
    this.overlay = 'map';
    this.flags.map = true;
    const k = MAP_SCALE;
    const halls = HALLS.map((h) => `<rect class="map__hall" x="${f(h.x * k)}" y="${f(h.y * k)}" width="${f(h.w * k)}" height="${f(h.h * k)}" rx="2"/>`).join('');
    const rooms = ROOM_IDS.map((id) => {
      const r = ROOM_RECTS[id];
      return `<div class="map__room ${id === this.here ? 'is-here' : ''}" data-room="${id}"
        style="left:${f(r.x * k)}px;top:${f((r.y - WALL_H) * k)}px;width:${f(r.w * k)}px;height:${f((r.h + WALL_H) * k)}px">
        ${icon(ROOM_ICON[id])}<span class="map__name">${esc(ROOMS[id].name)}</span></div>`;
    }).join('');
    const ch = CHARACTERS.find((c) => c.id === state.loadout!.character)!;
    this.openModal(`
      <h2 class="mn-panel__title">Mapa de la Estación Central</h2>
      <p class="mn-panel__body">Tu cara de michi marca dónde estás. La nave está arriba; los paneles solares y el invernadero, afuera.</p>
      <div class="map" style="width:${f(MAP_W * k)}px;height:${f(MAP_H * k)}px">
        <svg class="map__plan" viewBox="0 0 ${f(MAP_W * k)} ${f(MAP_H * k)}" aria-hidden="true">${halls}</svg>${rooms}
        <span class="map__me" data-map-me role="img" aria-label="Estás aquí">${michiFaceSvg(ch)}</span></div>
      <div class="mn-panel__footer"><button class="mn-btn mn-btn--sm" data-action="close">${icon('close')}Cerrar</button></div>`, 'map', 'modal__panel--wide');
    this.renderMapMarker();
  }

  private renderMapMarker(): void {
    const me = this.ui.el.querySelector<HTMLElement>('[data-map-me]');
    if (!me) return;
    me.style.left = `${f(this.pos.x * MAP_SCALE)}px`;
    me.style.top = `${f(this.pos.y * MAP_SCALE)}px`;
  }

  private openPause(): void {
    this.overlay = 'pause';
    this.openModal(`
      <h2 class="mn-panel__title">Pausa</h2>
      <div class="pause__actions">
        <button class="mn-btn" data-action="resume">${icon('play')}Continuar</button>
        <button class="mn-btn mn-btn--secondary" data-action="archive">${icon('book')}Archivo científico</button>
        <button class="mn-btn mn-btn--secondary" data-action="controls">${icon('keyboard')}Controles</button>
        <button class="mn-btn mn-btn--secondary" data-action="settings">${icon('gear')}Ajustes</button>
        <button class="mn-btn mn-btn--secondary" data-action="quit">${icon('home')}Salir al menú</button>
      </div>`, 'pause');
  }

  private openSettings(): void {
    this.openModal(settingsHtml(), 'settings');
  }

  private openArchive(entry?: string): void {
    this.flags.archive = true;
    if (this.overlay !== 'pause') this.openPause();
    this.scene.launch(SCENES.archive, { from: SCENES.station, entry });
    this.scene.pause();
  }

  private openModal(html: string, overlay: Overlay, extra = ''): void {
    this.overlay = overlay;
    this.ui.q('[data-actions]').hidden = true;
    const modal = this.ui.q('[data-overlay]');
    modal.innerHTML = `<div class="mn-panel modal__panel ${extra}" role="dialog" aria-modal="true">${html}</div>`;
    modal.hidden = false;
    this.ui.focusFirst('.modal [data-action]');
  }

  private closeOverlay(): void {
    this.miniGame?.destroy();
    this.miniGame = undefined;
    this.miniOutdoor = false;
    this.overlay = 'none';
    this.ui.q('[data-overlay]').hidden = true;
    this.ui.q('[data-actions]').hidden = true;
  }

  // ---------- tutorial ----------
  /** Entrenamiento de la primera vez (sesión aparte): muestra los controles y deja elegir entre el tutorial guiado o saltarlo. */
  private startTutorial(): void {
    if (!state.training) return;
    this.openModal(`
      <h2 class="mn-panel__title">Entrenamiento en la estación</h2>
      ${controlsHtml()}
      <p class="mn-panel__body">Esta es una estación de práctica: aquí no se pierde nada y el reloj está detenido. ¿Quieres que la Comandante Nébula te enseñe cómo se juega?</p>
      <div class="mn-panel__footer">
        <button class="mn-btn mn-btn--secondary" data-action="tutorial-decline">${icon('skip')}Saltar tutorial</button>
        <button class="mn-btn" data-action="tutorial-start">${icon('play')}Empezar tutorial</button>
      </div>`, 'intro', 'modal__panel--wide');
    this.ui.focusFirst('.modal [data-action="tutorial-start"]');
  }

  /** Pausa → Controles: lista de teclas y opción de repetir el tutorial. */
  private openControls(): void {
    this.openModal(`
      <h2 class="mn-panel__title">Controles de la estación</h2>
      ${controlsHtml()}
      <div class="mn-panel__footer">
        <button class="mn-btn mn-btn--secondary" data-action="close">${icon('back')}Volver</button>
        <button class="mn-btn" data-action="tutorial-start">${icon('retry')}Repetir tutorial</button>
      </div>`, 'controls', 'modal__panel--wide');
  }

  /**
   * Tutorial guiado, rápido y con el reloj detenido: el juego lleva al jugador a usar una vez el objeto de su investigación y la cosecha,
   * y explica en una frase los eventos y cómo se completa la jornada. Las acciones son reales y cuentan para las tareas.
   */
  private runTutorial(): void {
    this.closeOverlay();
    this.flags = { ...this.flags, moved: false, opened: false, map: false };
    const done = (action: ActionId): boolean => (this.sim.stats.actionsBy[action] ?? 0) >= 1;
    const own = this.mission.tutorial;
    this.tutorial = [
      { text: 'Camina con WASD o las flechas, o toca el piso. Shift es un impulso y Espacio, un salto.', done: () => this.flags.moved },
      { text: 'Cada acción cuesta: mira tus barras arriba a la izquierda. Abajo están el aire de la nave, los paneles y la radio.', done: () => false, manual: true },
      { text: own.text, done: () => own.handsOn && done(own.action), guide: own.asset, manual: !own.handsOn },
      { text: 'La cosecha: ve al Rack de plantas del invernadero y úsalo. Sales por la Esclusa; afuera el traje gasta oxígeno. Se cosecha una vez al día.', done: () => done('harvest'), guide: 'rack-plantas' },
      { text: 'Eventos: una tormenta de polvo cubre los paneles y los limpias afuera. Si viene una llamarada, vuelve a la nave.', done: () => false, manual: true },
      { text: 'Cumple las tareas de arriba a la derecha (algunas, una vez al día). Al terminar, repara la antena en Comunicaciones y vuelves a la Tierra.', done: () => false, guide: 'consola-antena', manual: true },
      state.training
        ? { text: '¡Entrenamiento completo, michinauta! Ahora elige tu tripulante y tu primera misión.', done: () => false, manual: true, cta: 'Elegir mi misión' }
        : { text: '¡Listo! Sigue con tus tareas. ¡Suerte!', done: () => false, manual: true },
    ];
    this.tutorialIndex = 0;
    this.showTutorial();
  }

  private showTutorial(): void {
    const step = this.tutorial[this.tutorialIndex];
    this.setText('[data-tip-text]', step.text);
    this.ui.q('[data-tip-actions]').hidden = false;
    const next = this.ui.q('[data-action="tutorial-next"]');
    next.hidden = !step.manual; // los pasos con tarea avanzan solos
    next.innerHTML = `${icon('check')}${esc(step.cta ?? 'Entendido')}`;
    this.ui.q('[data-tip]').hidden = false;
  }

  private checkTutorial(): void {
    if (this.tutorialIndex < 0) return;
    if (this.tutorial[this.tutorialIndex].done()) this.nextTutorial(false);
  }

  private nextTutorial(manual: boolean): void {
    if (this.tutorialIndex < 0) return;
    if (manual || this.tutorialIndex < this.tutorial.length) this.tutorialIndex++;
    if (this.tutorialIndex >= this.tutorial.length) return this.endTutorial();
    this.showTutorial();
  }

  private endTutorial(): void {
    this.tutorialIndex = -1;
    this.ui.q('[data-tip]').hidden = true;
    state.saveProgress({ tutorialDone: true });
    if (!state.training) return;
    // fin del entrenamiento: se descarta la estación de práctica y se elige la primera misión
    state.training = false;
    state.loadout = null;
    this.ending = true;
    fadeTo(this, SCENES.select);
  }

  // ---------- entrada ----------
  private bindInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown', (ev: KeyboardEvent) => {
      audio.unlock();
      const key = ev.key.toLowerCase();
      if (this.overlay === 'minigame' && key.startsWith('arrow')) {
        this.miniGame?.nudge?.(key === 'arrowright' ? 1 : key === 'arrowleft' ? -1 : 0, key === 'arrowdown' ? 1 : key === 'arrowup' ? -1 : 0);
        ev.preventDefault();
        return;
      }
      if (key === 'escape' || key === 'p') {
        if (this.overlay === 'none') this.openPause();
        else if (this.overlay === 'settings') this.openPause();
        else this.closeOverlay();
      } else if (key === 'm') this.toggleMap();
      else if (key === 'shift') this.tryDash();
      else if (key === ' ' && this.overlay === 'none' && this.jumpT < 0) {
        this.jumpT = 0;
        audio.play('jump');
        ev.preventDefault();
      } else if (key === 'e' && this.overlay === 'none') {
        if (this.nearestMachine()) this.openActions();
      } else if ((key === 'e' || key === '1' || key === '2') && this.overlay === 'actions') {
        const id = this.machineActions()[key === '2' ? 1 : 0]; // E (o 1) confirma la acción; 2 es la segunda, si la máquina la tiene
        if (id) this.act(id);
      }
    });
    // clic o toque en el piso: caminar hasta ahí (alternativa al teclado)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || this.overlay !== 'none') return;
      audio.unlock();
      const at = this.cameras.main.getWorldPoint(p.x, p.y); // la cámara del HUD no tiene zoom: se usa la del mundo
      if (isWalkable(at)) this.walkTo(at, false);
    });
  }

  // ---------- fin ----------
  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    const summary = this.sim.summary();
    const score = computeScore(summary);
    const earned = earnedAchievements(summary);
    const newAchievements = state.unlock(earned);
    const newBest = state.recordBest(this.mission.id, score.score, score.stars);
    state.lastResult = { loadout: state.loadout!, summary, score, newAchievements, newBest };
    audio.play(summary.won ? 'achievement' : 'hurt');
    this.playAnim(summary.won ? 'smile' : 'hurt', true);
    this.alert(summary.won ? '¡Investigación completa! Volviendo a la Tierra…' : 'La tripulación debe volver a la Tierra…', summary.won ? 'ok' : 'danger');
    this.time.delayedCall(1600, () => fadeTo(this, SCENES.returnTrip, 500)); // viaje de regreso a la Tierra y después el informe
  }
}

const ACTIONS_DELAYED = new Set<ActionId>(['repairAntenna', 'forecast']);
/** Sala que repara cada recurso crítico (avisos en los bordes). */
const GUIDE_ASSET: Record<Exclude<keyof Resources, 'radiation'>, string> = {
  energy: 'estacion-limpieza', oxygen: 'reciclador-aire', food: 'rack-plantas', health: 'camilla-medica',
};
/** Sin polvo que limpiar (o sin sol), la energía se recupera pedaleando. */
const BIKE_ASSET = 'bicicleta-estatica';
/** La Esclusa: adonde guía la flecha cuando hay que volver a la nave. */
const DOOR_ASSET = 'esclusa';
const BREACH_GUIDE = 'reciclador-roto';
/** Sala donde empieza cada jornada. */
const START_ROOM: RoomId = 'puente';
/** Nombre que se muestra de una máquina: el suyo propio o el de su sala. */
const machineName = (m: Machine): string => m.prop.name ?? ROOMS[m.room].name;

/** Tabla de controles (intro y Pausa → Controles). */
const controlsHtml = (): string => `
  <ul class="controls">${CONTROLS.map((c) => `<li class="controls__row">
    <span class="controls__keys">${c.keys.map((k) => `<span class="mn-key">${esc(k)}</span>`).join('')}${c.alt ? ` <span class="controls__alt">${esc(c.alt)}</span>` : ''}</span>
    <span class="controls__action">${esc(c.action)}</span></li>`).join('')}
  </ul>
  <p class="controls__pointer">${esc(POINTER_HINT)}</p>`;
const ALERT_MS = 4500;
const FLARE_SIZE = { minor: 'pequeña', moderate: 'mediana', severe: 'enorme' } as const;
/** Tamaño de la llamarada en palabras, con su clase GOES real entre paréntesis (p. ej. "enorme (X9.3)"). */
const flareName = (classType: string): string => `${FLARE_SIZE[severity(classType)]} (${classType})`;
/** Cuánto se ve la pista de cada minijuego. */
const MINI_HINT_MS = 4000;
/** Oscuridad según la energía: con 60 o más, luz plena; sin energía, casi a oscuras. */
const darknessFor = (energy: number): number => (Math.min(60, Math.max(0, 60 - energy)) / 60) * 0.72;
/** Escala del plano dentro del mapa (M). */
const MAP_SCALE = 0.2 / WORLD_SCALE; // el mapa del menú mide lo mismo aunque el plano sea más grande
const f = (n: number): string => n.toFixed(1);
