import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../core/config';
import { state } from '../core/state';
import { tokenColor } from '../core/theme';
import { UiLayer } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { t, type TKey } from '../core/i18n';
import { michiFaceSvg } from '../core/art';
import { CHARACTERS } from '../data/characters';

const SHIP_X = 190;
const SHIP_SCALE = 0.8;             // cápsula + módulo de servicio (112 px de textura): lo que queda del cohete sin los tanques inferiores
const SHIP_SPEED = 380;             // px/s hacia arriba o abajo (la nave nunca avanza ni retrocede)
const SCROLL = 430;                 // px/s: las estrellas y las rocas avanzan hacia la izquierda
const FLIGHT_SEC = 28;              // tiempo hasta cruzar la órbita de la Luna
const FLIGHT_SEC_CALM = 14;         // con menos movimiento: viaje más corto y con menos rocas
const HIT_PENALTY = 0.03;           // cada choque también atrasa un poco el avance
const HP_MAX = 4;                   // vida de la nave: cada choque quita una; sin vida se repara y se vuelve a empezar el vuelo
const INVULN_SEC = 1.2;
const TOP = 56;
const BOTTOM = GAME_HEIGHT - 56;
const MOON_X0 = GAME_WIDTH + 560;
const MOON_Y = GAME_HEIGHT + 340;
const MOON_R = 620;
const MOON_TEX = 'flight-moon';
const LANDED_SCALE = 0.25;
const STAR_LAYERS = [{ key: 'flight-stars-far', speed: 0.25, n: 90, r: 1 }, { key: 'flight-stars-mid', speed: 0.55, n: 50, r: 1.6 }, { key: 'flight-stars-near', speed: 1, n: 22, r: 2.4 }] as const;

type RockKind = 'rock' | 'iron' | 'ice';
type PickKind = 'battery' | 'chip' | 'algae';
/** `speed`: multiplica el avance (el hierro es rápido y el hielo, lento); `drift`: vaivén vertical del hielo. */
interface Rock { sprite: Phaser.GameObjects.Image; r: number; spin: number; speed: number; drift: number; phase: number; baseY: number; }
interface Pickup { sprite: Phaser.GameObjects.Image; kind: PickKind; }
interface Cloud { sprite: Phaser.GameObjects.Image; s: number; }
/** Cinturones de Van Allen [REAL]: el viaje a la Luna los atraviesa. Aquí son bandas de color que se cruzan sin riesgo (dibujo). */
const BELTS = [
  { a: 0.12, b: 0.32, key: 'flight-belt-in', c1: '#ee5fd6', c2: '#ff7a59', name: 'flight.belt.in' as TKey },
  { a: 0.4, b: 0.6, key: 'flight-belt-out', c1: '#5ad6b2', c2: '#4cc3f5', name: 'flight.belt.out' as TKey },
] as const;
const VIG_AT = [0.6, 0.8] as const;  // progreso al que sale cada viñeta antes de aterrizar
const EARTH_ICON = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#4cc3f5" stroke="#0e0b33" stroke-width="2.5"/><path d="M8 11 Q13 7 17 11 Q13 16 9 15Z M18 17 Q25 15 26 20 Q22 26 18 23Z" fill="#7ed957"/><path d="M6 22 Q11 19 15 22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg>';

/**
 * Vuelo a la Luna (entre el despegue y la estación): la nave va a la izquierda mirando a la derecha y solo sube o baja.
 * Las estrellas avanzan de derecha a izquierda y las rocas del espacio llegan desde el borde derecho a distintas alturas.
 * Al cruzar la órbita de la Luna, la nave desciende y aterriza en su superficie. Un choque solo atrasa un poco el avance.
 */
export class FlightScene extends Phaser.Scene {
  private ui!: UiLayer;
  private ship!: Phaser.GameObjects.Image;
  private moon!: Phaser.GameObjects.Image;
  private moonGlow!: Phaser.GameObjects.Arc;
  private hp = HP_MAX;
  private layers: Phaser.GameObjects.TileSprite[] = [];
  private rocks: Rock[] = [];
  private bar!: Phaser.GameObjects.Graphics;
  private keys!: Record<'up' | 'down' | 'w' | 's', Phaser.Input.Keyboard.Key>;
  private targetY = GAME_HEIGHT / 2;
  private progress = 0;
  private spawnIn = 1.2;
  private invuln = 0;
  private total = FLIGHT_SEC;
  private phase: 'fly' | 'land' | 'done' = 'fly';
  private calm = false;
  private elapsed = 0;
  private shield = 0;
  private heartPulse = 0;
  private dustOn = false;
  private spawnPickIn = 3;
  private spawnCloudIn = 5;
  private spawnDecorIn = 0.6;
  private smokeIn = 0;
  private vigShown = [false, false];
  private capShown = [false, false];
  private pickups: Pickup[] = [];
  private clouds: Cloud[] = [];
  private decor: Phaser.GameObjects.Image[] = [];
  private nebulae: Phaser.GameObjects.TileSprite[] = [];
  private earth!: Phaser.GameObjects.Image;
  private beltImgs: Phaser.GameObjects.Image[] = [];
  private beltFx?: Phaser.GameObjects.Particles.ParticleEmitter;
  private beltOn = false;
  private flame?: Phaser.GameObjects.Particles.ParticleEmitter;
  private smoke?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks?: Phaser.GameObjects.Particles.ParticleEmitter;
  private ring!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENES.flight);
  }

  create(): void {
    audio.setMood('space');
    this.calm = state.calm;
    this.total = this.calm ? FLIGHT_SEC_CALM : FLIGHT_SEC;
    this.progress = 0;
    this.rocks = [];
    this.layers = [];
    this.invuln = 0;
    this.spawnIn = 1.2;
    this.phase = 'fly';
    this.hp = HP_MAX;
    this.elapsed = 0; this.shield = 0; this.heartPulse = 0; this.dustOn = false;
    this.spawnPickIn = 3; this.spawnCloudIn = 5; this.spawnDecorIn = 0.6; this.smokeIn = 0;
    this.vigShown = [false, false]; this.capShown = [false, false]; this.beltOn = false;
    this.pickups = []; this.clouds = []; this.decor = []; this.nebulae = []; this.beltImgs = [];
    this.targetY = GAME_HEIGHT / 2;
    fadeIn(this, 400);
    this.cameras.main.setZoom(1);
    this.makeTextures();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tokenColor('space-800')).setOrigin(0);
    // nebulosas lejanas (colores suaves que se mueven muy despacio): el espacio entre la Tierra y la Luna no es negro liso
    for (const [key, speed] of [['flight-neb-a', 0.05], ['flight-neb-b', 0.09]] as const) {
      const neb = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD);
      this.nebulae.push(neb);
      neb.setData('speed', speed);
    }
    for (const l of STAR_LAYERS) this.layers.push(this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, l.key).setOrigin(0));
    this.earth = this.add.image(170, GAME_HEIGHT - 20, 'flight-earth').setDepth(1).setScale(1.5); // la Tierra se aleja y se hace pequeña
    this.beltImgs = BELTS.map((b) => this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, b.key).setDepth(4).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
    this.moonGlow = this.add.circle(MOON_X0, MOON_Y, MOON_R + 46, 0x9fd8f5, 0.16).setDepth(1);
    this.moon = this.add.image(MOON_X0, MOON_Y, MOON_TEX).setDepth(2);
    this.ship = this.add.image(SHIP_X, this.targetY, 'csm').setRotation(Math.PI / 2).setScale(SHIP_SCALE).setDepth(10);
    this.ring = this.add.graphics().setDepth(11);
    if (!state.settings.ultraLight && !this.calm) {
      this.flame = this.add.particles(0, 0, 'spark', {
        speed: { min: 60, max: 140 }, angle: { min: 170, max: 190 }, scale: { start: 0.7, end: 0 }, lifespan: 380, frequency: 30,
        tint: [tokenColor('star-gold'), tokenColor('solar-coral'), 0xffffff], blendMode: Phaser.BlendModes.ADD,
      }).setDepth(9);
      this.flame.startFollow(this.ship, -50, 0);
      // humo y chispas cuando la nave queda dañada
      this.smoke = this.add.particles(0, 0, 'spark', { lifespan: 800, speed: { min: 10, max: 40 }, angle: { min: 150, max: 210 }, scale: { start: 0.5, end: 1.2 }, alpha: { start: 0.55, end: 0 }, tint: [0x68668f, 0x9a98c8], emitting: false }).setDepth(9);
      this.sparks = this.add.particles(0, 0, 'spark', { lifespan: 320, speed: { min: 80, max: 170 }, scale: { start: 0.4, end: 0 }, tint: [0xffcb47, 0xff7a59], blendMode: Phaser.BlendModes.ADD, emitting: false }).setDepth(12);
      // partículas que cruzan la pantalla dentro de los cinturones de Van Allen
      this.beltFx = this.add.particles(GAME_WIDTH + 10, 0, 'spark', {
        y: { min: 40, max: GAME_HEIGHT - 40 }, speedX: { min: -620, max: -420 }, speedY: { min: -24, max: 24 }, scale: { start: 0.34, end: 0 }, lifespan: 2400, frequency: 40,
        tint: [0xee5fd6, 0xff7a59, 0x5ad6b2, 0x4cc3f5], alpha: 0.85, blendMode: Phaser.BlendModes.ADD, emitting: false,
      }).setDepth(4);
    }
    this.bar = this.add.graphics().setDepth(20);
    this.ui = new UiLayer(this, `<div class="flight">
      <p class="mini-msg mini-msg--hint flight__hint"><span>${t('flight.hint')}</span><span class="mini-keys"><kbd>↑</kbd><kbd>↓</kbd></span></p>
      <div class="flight__cap" data-cap></div><div class="flight__vig" data-vig aria-live="polite"></div></div>`, 'screen screen--clear');
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ up: 'UP', down: 'DOWN', w: 'W', s: 'S' }) as typeof this.keys;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { audio.unlock(); this.targetY = p.y; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.isDown) this.targetY = p.y; });
    audio.play('thrust');
    this.time.delayedCall(6000, () => this.tweens.add({ targets: this.ui.el.querySelector('.flight__hint'), opacity: 0, duration: 600 }));
  }

  /** Texturas de la escena (estrellas en tres capas y rocas), una sola vez por partida del navegador. */
  private makeTextures(): void {
    for (const l of STAR_LAYERS) {
      if (this.textures.exists(l.key)) continue;
      const rnd = new Phaser.Math.RandomDataGenerator([l.key]);
      const g = this.make.graphics({}, false);
      for (let i = 0; i < l.n; i++) {
        g.fillStyle(i % 5 === 0 ? tokenColor('ink-muted') : tokenColor('constellation'), l.r > 2 ? 1 : 0.8);
        g.fillCircle(rnd.between(0, GAME_WIDTH), rnd.between(0, GAME_HEIGHT), l.r);
      }
      g.generateTexture(l.key, GAME_WIDTH, GAME_HEIGHT).destroy();
    }
    this.makeSpaceTextures();
    for (let v = 0; v < 2; v++) {
      const key = `flight-rock-${v}`;
      if (this.textures.exists(key)) continue;
      const rnd = new Phaser.Math.RandomDataGenerator([key]);
      const g = this.make.graphics({}, false);
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const rad = 46 + rnd.between(-9, 6);
        pts.push(new Phaser.Math.Vector2(60 + Math.cos(a) * rad, 60 + Math.sin(a) * rad));
      }
      g.fillStyle(v ? 0xb8a28a : 0x9a98c8, 1).fillPoints(pts, true);
      g.lineStyle(5, 0x0e0b33, 1).strokePoints(pts, true, true);
      g.fillStyle(0x0e0b33, 0.22).fillCircle(46, 52, 11).fillCircle(76, 74, 8).fillCircle(72, 40, 6);
      g.generateTexture(key, 120, 120).destroy();
    }
    if (!this.textures.exists(MOON_TEX)) this.makeMoonTexture();
    if (!this.textures.exists('spark')) this.make.graphics({}, false).fillStyle(0xffffff, 1).fillCircle(8, 8, 8).generateTexture('spark', 16, 16).destroy();
  }

  /** Rocas de hierro e hielo, polvo, recogibles, satélites, chatarra, la Tierra, nebulosas y cinturones de Van Allen (todo dibujado). */
  private makeSpaceTextures(): void {
    const poly = (key: string, fill: number, light: number, n: number, seedName: string, sharp: boolean): void => {
      if (this.textures.exists(key)) return;
      const rnd = new Phaser.Math.RandomDataGenerator([seedName]);
      const g = this.make.graphics({}, false);
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rad = sharp ? (i % 2 ? 34 : 50) + rnd.between(-4, 4) : 46 + rnd.between(-9, 6);
        pts.push(new Phaser.Math.Vector2(60 + Math.cos(a) * rad, 60 + Math.sin(a) * rad));
      }
      g.fillStyle(fill, 1).fillPoints(pts, true);
      g.fillStyle(light, 0.55).fillTriangle(40, 38, 74, 30, 62, 62).fillTriangle(70, 74, 88, 56, 90, 84);
      g.lineStyle(5, 0x0e0b33, 1).strokePoints(pts, true, true);
      g.fillStyle(0x0e0b33, 0.25).fillCircle(48, 76, 7).fillCircle(78, 48, 5);
      g.generateTexture(key, 120, 120).destroy();
    };
    poly('flight-rock-iron', 0xc2603f, 0xf2a65a, 9, 'iron', false);   // hierro: rojizo, con brillos metálicos
    poly('flight-rock-ice', 0x9fd8f5, 0xffffff, 10, 'ice', true);     // hielo: azul claro y puntiagudo
    const gfx = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({}, false);
      draw(g);
      g.generateTexture(key, w, h).destroy();
    };
    gfx('flight-dust', 240, 160, (g) => { // nube de polvo: manchas tostadas, sin contorno duro
      g.fillStyle(0xb8a28a, 0.34).fillEllipse(120, 80, 220, 120).fillStyle(0xd8c8a0, 0.3).fillEllipse(90, 70, 130, 80).fillEllipse(150, 92, 120, 70);
      g.fillStyle(0xe6d8b8, 0.25).fillCircle(70, 96, 22).fillCircle(172, 62, 26).fillCircle(120, 50, 18);
    });
    gfx('flight-pk-battery', 48, 48, (g) => {
      g.fillStyle(0xffffff, 0.22).fillCircle(24, 24, 23);
      g.fillStyle(0xffcb47, 1).fillRoundedRect(13, 10, 22, 30, 5).lineStyle(3, 0x0e0b33, 1).strokeRoundedRect(13, 10, 22, 30, 5);
      g.fillStyle(0x0e0b33, 1).fillRect(20, 6, 8, 5).fillTriangle(26, 16, 19, 27, 24, 27).fillTriangle(22, 36, 29, 25, 24, 25);
    });
    gfx('flight-pk-chip', 48, 48, (g) => {
      g.fillStyle(0xffffff, 0.22).fillCircle(24, 24, 23);
      g.lineStyle(3, 0x0e0b33, 1);
      for (let i = 0; i < 4; i++) { g.lineBetween(15 + i * 6, 8, 15 + i * 6, 14).lineBetween(15 + i * 6, 34, 15 + i * 6, 40); }
      g.fillStyle(0x4cc3f5, 1).fillRoundedRect(11, 13, 26, 22, 4).strokeRoundedRect(11, 13, 26, 22, 4);
      g.fillStyle(0x0e0b33, 1).fillRect(19, 20, 10, 8);
    });
    gfx('flight-pk-algae', 48, 48, (g) => {
      g.fillStyle(0xffffff, 0.22).fillCircle(24, 24, 23);
      g.fillStyle(0x7ed957, 1).fillPoints([new Phaser.Math.Vector2(11, 36), new Phaser.Math.Vector2(14, 16), new Phaser.Math.Vector2(30, 8), new Phaser.Math.Vector2(38, 14), new Phaser.Math.Vector2(34, 32), new Phaser.Math.Vector2(20, 40)], true);
      g.lineStyle(3, 0x0e0b33, 1).strokePoints([new Phaser.Math.Vector2(11, 36), new Phaser.Math.Vector2(14, 16), new Phaser.Math.Vector2(30, 8), new Phaser.Math.Vector2(38, 14), new Phaser.Math.Vector2(34, 32), new Phaser.Math.Vector2(20, 40)], true, true);
      g.lineBetween(14, 34, 32, 14);
    });
    gfx('flight-sat', 110, 60, (g) => { // satélite: cuerpo dorado y dos paneles solares
      g.fillStyle(0x2a2d5c, 1).fillRect(4, 18, 36, 24).fillRect(70, 18, 36, 24).lineStyle(3, 0x0e0b33, 1).strokeRect(4, 18, 36, 24).strokeRect(70, 18, 36, 24);
      g.lineStyle(2, 0x4cc3f5, 1).lineBetween(16, 18, 16, 42).lineBetween(28, 18, 28, 42).lineBetween(82, 18, 82, 42).lineBetween(94, 18, 94, 42);
      g.fillStyle(0xffcb47, 1).fillRect(40, 14, 30, 32).lineStyle(3, 0x0e0b33, 1).strokeRect(40, 14, 30, 32).lineBetween(55, 14, 55, 4).strokeCircle(55, 3, 3);
    });
    gfx('flight-junk', 90, 60, (g) => { // chatarra: un trozo de cohete suelto
      g.fillStyle(0xc4c2e0, 1).fillPoints([new Phaser.Math.Vector2(6, 30), new Phaser.Math.Vector2(30, 8), new Phaser.Math.Vector2(78, 14), new Phaser.Math.Vector2(84, 40), new Phaser.Math.Vector2(40, 54)], true);
      g.lineStyle(3, 0x0e0b33, 1).strokePoints([new Phaser.Math.Vector2(6, 30), new Phaser.Math.Vector2(30, 8), new Phaser.Math.Vector2(78, 14), new Phaser.Math.Vector2(84, 40), new Phaser.Math.Vector2(40, 54)], true, true);
      g.fillStyle(0xff6b7a, 1).fillRect(46, 12, 12, 40).fillStyle(0x0e0b33, 0.3).fillCircle(24, 30, 6);
    });
    gfx('flight-earth', 320, 320, (g) => {
      g.fillStyle(0x7fd0ff, 0.35).fillCircle(160, 160, 158); // atmósfera
      g.fillStyle(0x2f7fd0, 1).fillCircle(160, 160, 140);
      g.fillStyle(0x4fae5b, 1).fillEllipse(110, 120, 90, 60).fillEllipse(205, 190, 70, 90).fillEllipse(180, 95, 50, 32).fillEllipse(120, 220, 40, 26);
      g.fillStyle(0xffffff, 0.8).fillEllipse(95, 175, 80, 18).fillEllipse(210, 130, 90, 16).fillEllipse(150, 245, 70, 14);
      g.fillStyle(0x0e0b33, 0.16).fillEllipse(210, 190, 90, 150); // lado en sombra, dentro del disco
      g.lineStyle(6, 0x0e0b33, 1).strokeCircle(160, 160, 140);
    });
    const canvasTex = (key: string, draw: (ctx: CanvasRenderingContext2D) => void): void => {
      if (this.textures.exists(key)) return;
      const tex = this.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT)!;
      draw(tex.getContext());
      tex.refresh();
    };
    const blob = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number): void => {
      for (const dx of [-GAME_WIDTH, 0, GAME_WIDTH]) { // se repite a los lados para que el mosaico no tenga costura
        const gr = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
        gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = gr; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }
    };
    canvasTex('flight-neb-a', (c) => { blob(c, 260, 160, 300, '120,60,170', 0.5); blob(c, 760, 520, 340, '60,90,190', 0.4); blob(c, 1100, 220, 260, '200,70,170', 0.32); });
    canvasTex('flight-neb-b', (c) => { blob(c, 500, 420, 280, '40,170,160', 0.3); blob(c, 960, 110, 240, '90,70,200', 0.35); blob(c, 120, 560, 260, '220,110,90', 0.22); });
    for (const b of BELTS) {
      canvasTex(b.key, (c) => {
        const g = c.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, b.c1); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = 0.28; c.fillStyle = g; c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); c.globalAlpha = 1;
        c.shadowBlur = 26; c.shadowColor = b.c2; c.lineCap = 'round';
        for (let k = 0; k < 3; k++) { // cintas onduladas, como las líneas del campo magnético
          c.beginPath(); c.strokeStyle = b.c2; c.globalAlpha = 0.5; c.lineWidth = 5 + k * 4;
          for (let x = 0; x <= GAME_WIDTH; x += 16) { const y = GAME_HEIGHT * (0.32 + 0.18 * k) + Math.sin(x / 140 + k * 2) * 46; if (x) c.lineTo(x, y); else c.moveTo(x, y); }
          c.stroke();
        }
      });
    }
  }

  /** La Luna con detalle: mares oscuros, muchos cráteres con borde y sombra, rayos y un borde que oscurece como una esfera. */
  private makeMoonTexture(): void {
    const size = MOON_R * 2 + 20;
    const c = size / 2;
    const rnd = new Phaser.Math.RandomDataGenerator(['luna']);
    const g = this.make.graphics({}, false);
    g.fillStyle(0xc4c2e0, 1).fillCircle(c, c, MOON_R);
    // mares: manchas grandes y oscuras (se recortan al disco con un anillo exterior al final)
    for (const [dx, dy, rx, ry] of [[-210, -150, 190, 130], [90, -250, 150, 110], [240, 40, 170, 120], [-120, 180, 140, 100], [20, -40, 110, 80]]) {
      g.fillStyle(0x9a98c8, 0.85).fillEllipse(c + dx, c + dy, rx * 2, ry * 2);
      g.fillStyle(0x8886b8, 0.55).fillEllipse(c + dx + 18, c + dy + 12, rx * 1.4, ry * 1.3);
    }
    // cráteres: sombra interior, piso y borde iluminado
    for (let i = 0; i < 34; i++) {
      const a = rnd.frac() * Math.PI * 2;
      const d = Math.sqrt(rnd.frac()) * (MOON_R - 70);
      const x = c + Math.cos(a) * d;
      const y = c + Math.sin(a) * d;
      const r = rnd.between(14, 62);
      g.fillStyle(0x7a78a8, 0.9).fillCircle(x, y, r);
      g.fillStyle(0xa4a2cf, 1).fillCircle(x + r * 0.1, y + r * 0.12, r * 0.78);
      g.lineStyle(Math.max(3, r * 0.1), 0xe6e4f6, 0.9).beginPath().arc(x, y, r, Math.PI * 0.85, Math.PI * 1.75).strokePath();
      g.lineStyle(Math.max(2, r * 0.07), 0x5f5d8c, 0.8).beginPath().arc(x, y, r, -Math.PI * 0.2, Math.PI * 0.7).strokePath();
    }
    // un cráter grande con rayos
    g.lineStyle(5, 0xe6e4f6, 0.5);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2;
      g.beginPath().moveTo(c - 250 + Math.cos(a) * 80, c + 200 + Math.sin(a) * 80).lineTo(c - 250 + Math.cos(a) * (130 + (i % 3) * 40), c + 200 + Math.sin(a) * (130 + (i % 3) * 40)).strokePath();
    }
    // esfera: el borde se oscurece de a poco y un contorno firme
    for (let i = 0; i < 22; i++) g.lineStyle(7, 0x0e0b33, 0.012 + i * 0.006).strokeCircle(c, c, MOON_R - i * 7);
    g.lineStyle(10, 0x0e0b33, 1).strokeCircle(c, c, MOON_R);
    g.generateTexture(MOON_TEX, size, size).destroy();
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.elapsed += dt;
    const slow = this.phase === 'fly' ? 1 : 0.25;
    this.layers.forEach((l, i) => (l.tilePositionX += SCROLL * STAR_LAYERS[i].speed * dt * slow));
    this.nebulae.forEach((n) => (n.tilePositionX += SCROLL * (n.getData('speed') as number) * dt * slow));
    if (this.phase !== 'fly') return;
    this.dustOn = this.inDust();
    this.moveShip(dt);
    this.progress = Math.min(1, this.progress + (dt / this.total) * (this.dustOn ? 0.55 : 1)); // el polvo frena el avance
    this.moveRocks(dt);
    this.moveClouds(dt);
    this.movePickups(dt);
    this.moveDecor(dt);
    this.spawn(dt);
    this.drawEarth();
    this.drawBelts();
    this.drawMoon();
    this.heartPulse = Math.max(0, this.heartPulse - dt);
    this.drawBar();
    this.checkVignettes();
    this.shipLook(dt);
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.ship.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 3) % 2 ? 0.35 : 1); // parpadeo de 1,5 por segundo
    }
    if (this.progress >= 1) this.land();
  }

  /** Escudo, humo y chispas según la vida, y el color del casco si está en una nube de polvo o muy dañada. */
  private shipLook(dt: number): void {
    this.ring.clear();
    if (this.shield > 0) {
      this.shield -= dt;
      const pulse = 0.6 + 0.3 * Math.sin(this.elapsed * 9);
      this.ring.lineStyle(5, 0x4cc3f5, pulse).strokeCircle(this.ship.x, this.ship.y, 48);
      this.ring.fillStyle(0x4cc3f5, 0.12 * pulse).fillCircle(this.ship.x, this.ship.y, 48);
    }
    this.ship.setTint(this.dustOn ? 0xd8c8a0 : this.hp <= 1 ? 0xffc2b8 : 0xffffff);
    if (!this.smoke || !this.sparks) return;
    this.smokeIn -= dt;
    if (this.hp <= 2 && this.smokeIn <= 0) {
      this.smoke.emitParticleAt(this.ship.x - 20, this.ship.y + Phaser.Math.Between(-10, 10), 1);
      this.smokeIn = this.hp <= 1 ? 0.06 : 0.16;
    }
    if (this.hp <= 1 && Math.random() < 0.05) this.sparks.emitParticleAt(this.ship.x + Phaser.Math.Between(-16, 16), this.ship.y + Phaser.Math.Between(-16, 16), 4);
  }

  private moveShip(dt: number): void {
    const dir = (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0) - (this.keys.up.isDown || this.keys.w.isDown ? 1 : 0);
    if (dir !== 0) this.targetY = this.ship.y + dir * 200;
    const step = SHIP_SPEED * dt * (this.dustOn ? 0.6 : 1);
    const goal = Phaser.Math.Clamp(this.targetY, TOP, BOTTOM);
    this.ship.y += Phaser.Math.Clamp(goal - this.ship.y, -step, step);
    this.ship.setRotation(Math.PI / 2 + Phaser.Math.Clamp((goal - this.ship.y) / 400, -0.18, 0.18)); // se inclina un poco al subir o bajar
  }

  private pickKind(): RockKind {
    const r = Math.random();
    if (this.calm) return r < 0.7 ? 'rock' : 'ice';
    return r < 0.5 ? 'rock' : r < 0.78 ? 'ice' : 'iron';
  }

  private spawn(dt: number): void {
    if (this.progress > 0.9) return;
    this.spawnPickIn -= dt;
    if (this.spawnPickIn <= 0) { this.addPickup(); this.spawnPickIn = Phaser.Math.FloatBetween(3.6, 5.2); }
    this.spawnCloudIn -= dt;
    if (this.spawnCloudIn <= 0 && !this.calm) { this.addCloud(); this.spawnCloudIn = Phaser.Math.FloatBetween(5, 7.5); }
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    const hard = this.calm ? 0.5 : 1;
    this.spawnIn = (0.95 - this.progress * 0.3) / hard;
    const r = Math.random();
    if (!this.calm && r < 0.12) {
      // dos rocas con un hueco cerca de donde está la nave, para que siempre se pueda pasar
      const gap = Phaser.Math.Clamp(this.ship.y + Phaser.Math.Between(-130, 130), TOP + 170, BOTTOM - 170);
      this.addRock(gap - 170);
      this.addRock(gap + 170);
    } else if (!this.calm && r < 0.22) {
      // lluvia de meteoros de hierro: tres rocas pequeñas y rápidas en diagonal (cuidado con el hueco entre ellas)
      const y0 = Phaser.Math.Between(TOP + 40, BOTTOM - 330);
      for (let k = 0; k < 3; k++) this.addRock(y0 + k * 120, 'iron', 0.62, k * 110);
    } else {
      this.addRock(Phaser.Math.Between(TOP, BOTTOM));
    }
  }

  private addRock(y: number, kind: RockKind = this.pickKind(), scaleOverride?: number, xOff = 0): void {
    const [lo, hi] = kind === 'iron' ? [0.62, 0.95] : kind === 'ice' ? [0.9, 1.35] : [0.7, 1.35];
    const scale = scaleOverride ?? Phaser.Math.FloatBetween(lo, hi);
    const key = kind === 'rock' ? `flight-rock-${Math.random() < 0.5 ? 0 : 1}` : `flight-rock-${kind}`;
    const sprite = this.add.image(GAME_WIDTH + 80 + xOff, y, key).setScale(scale).setDepth(8);
    this.rocks.push({
      sprite, r: 44 * scale, spin: Phaser.Math.FloatBetween(-1.2, 1.2), baseY: y, phase: Math.random() * 6.28,
      speed: kind === 'iron' ? 1.5 : kind === 'ice' ? 0.72 : 1, drift: kind === 'ice' ? 55 : 0, // hierro rápido, hielo lento y con vaivén
    });
  }

  private addCloud(): void {
    const s = Phaser.Math.FloatBetween(1, 1.6);
    const sprite = this.add.image(GAME_WIDTH + 200, Phaser.Math.Between(TOP + 60, BOTTOM - 60), 'flight-dust').setScale(s).setDepth(7).setAlpha(0.9);
    this.clouds.push({ sprite, s });
  }

  private addPickup(): void {
    const all: PickKind[] = ['battery', 'chip', 'algae'];
    const kind = this.hp < HP_MAX && Math.random() < 0.5 ? 'battery' : all[Phaser.Math.Between(0, 2)];
    const sprite = this.add.image(GAME_WIDTH + 60, Phaser.Math.Between(TOP + 30, BOTTOM - 30), `flight-pk-${kind}`).setDepth(9);
    this.tweens.add({ targets: sprite, scale: 1.18, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.pickups.push({ sprite, kind });
  }

  private moveRocks(dt: number): void {
    const parts = [-22, 0, 22].map((dx) => ({ x: SHIP_X + dx, y: this.ship.y, r: 15 }));
    for (const rock of [...this.rocks]) {
      rock.sprite.x -= SCROLL * rock.speed * dt;
      if (rock.drift) rock.sprite.y = rock.baseY + Math.sin(this.elapsed * 1.6 + rock.phase) * rock.drift;
      rock.sprite.rotation += rock.spin * dt;
      if (rock.sprite.x < -120) { this.removeRock(rock); continue; }
      if (this.invuln > 0 || rock.sprite.x > SHIP_X + 140) continue;
      if (parts.some((p) => Phaser.Math.Distance.Between(p.x, p.y, rock.sprite.x, rock.sprite.y) < p.r + rock.r * 0.82)) {
        if (this.shield > 0) this.shatter(rock); else this.hit(rock); // con escudo la roca se rompe sin daño
      }
    }
  }

  private moveClouds(dt: number): void {
    for (const c of [...this.clouds]) {
      c.sprite.x -= SCROLL * 0.85 * dt;
      if (c.sprite.x < -260) { c.sprite.destroy(); this.clouds = this.clouds.filter((x) => x !== c); }
    }
  }

  private inDust(): boolean {
    return this.clouds.some((c) => ((SHIP_X - c.sprite.x) / (105 * c.s)) ** 2 + ((this.ship.y - c.sprite.y) / (62 * c.s)) ** 2 < 1);
  }

  private movePickups(dt: number): void {
    for (const p of [...this.pickups]) {
      p.sprite.x -= SCROLL * dt;
      if (p.sprite.x < -60) { this.dropPickup(p); continue; }
      if (Phaser.Math.Distance.Between(SHIP_X, this.ship.y, p.sprite.x, p.sprite.y) < 46) this.collect(p);
    }
  }

  private dropPickup(p: Pickup): void {
    this.tweens.killTweensOf(p.sprite);
    p.sprite.destroy();
    this.pickups = this.pickups.filter((x) => x !== p);
  }

  private collect(p: Pickup): void {
    const { x, y } = p.sprite;
    this.dropPickup(p);
    audio.play('confirm');
    if (p.kind === 'battery') { this.hp = Math.min(HP_MAX, this.hp + 1); this.heartPulse = 0.5; }
    else if (p.kind === 'chip') this.shield = 4;
    else this.progress = Math.min(0.97, this.progress + 0.03);
    this.cameras.main.flash(120, 90, 214, 178);
    const txt = this.add.text(x, y - 20, t(`flight.pick.${p.kind}` as TKey), { fontFamily: 'Fredoka, sans-serif', fontSize: '26px', color: '#ffffff', stroke: '#0e0b33', strokeThickness: 6 }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: txt, y: y - 70, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  /** Decorado del espacio cercano a la Tierra (satélites y chatarra): pasa despacio por detrás y no choca. */
  private moveDecor(dt: number): void {
    if (this.progress < 0.3) {
      this.spawnDecorIn -= dt;
      if (this.spawnDecorIn <= 0) {
        this.spawnDecorIn = Phaser.Math.FloatBetween(1.6, 2.8);
        const sat = Math.random() < 0.5;
        const sprite = this.add.image(GAME_WIDTH + 80, Phaser.Math.Between(TOP + 20, BOTTOM - 20), sat ? 'flight-sat' : 'flight-junk').setDepth(3).setScale(Phaser.Math.FloatBetween(0.6, 1)).setRotation(Math.random() * 6.28);
        sprite.setData('spin', Phaser.Math.FloatBetween(-0.6, 0.6));
        this.decor.push(sprite);
      }
    }
    for (const d of [...this.decor]) {
      d.x -= SCROLL * 0.45 * dt;
      d.rotation += (d.getData('spin') as number) * dt;
      if (d.x < -140) { d.destroy(); this.decor = this.decor.filter((x) => x !== d); }
    }
  }

  private removeRock(rock: Rock): void {
    rock.sprite.destroy();
    this.rocks = this.rocks.filter((x) => x !== rock);
  }

  private shatter(rock: Rock): void {
    this.rocks = this.rocks.filter((x) => x !== rock);
    audio.play('hit');
    this.tweens.add({ targets: rock.sprite, alpha: 0, scale: rock.sprite.scale * 1.5, duration: 240, onComplete: () => rock.sprite.destroy() });
  }

  private hit(rock: Rock): void {
    this.invuln = INVULN_SEC;
    this.hp--;
    this.heartPulse = 0.5; // el corazón late al perder vida
    this.progress = Math.max(0, this.progress - HIT_PENALTY);
    if (this.hp <= 0) this.crash();
    audio.play('hurt');
    if (!this.calm) this.cameras.main.shake(260, 0.006);
    this.cameras.main.flash(180, 255, 122, 89);
    this.tweens.add({ targets: rock.sprite, alpha: 0, scale: rock.sprite.scale * 1.6, duration: 260, onComplete: () => this.removeRock(rock) });
    rock.spin = 0;
    this.rocks = this.rocks.filter((x) => x !== rock); // ya no choca
  }

  /** Sin vida: la nave se repara y el vuelo empieza de nuevo (sin castigo más allá del tiempo). */
  private crash(): void {
    audio.play('alarm');
    this.cameras.main.flash(500, 255, 107, 122);
    this.rocks.forEach((r) => r.sprite.destroy());
    this.rocks = [];
    this.pickups.forEach((p) => this.dropPickup(p));
    this.hp = HP_MAX;
    this.shield = 0;
    this.vigShown = [false, false];
    this.progress = 0;
    this.invuln = 2;
    this.spawnIn = 1.6;
  }

  /** La Luna sube desde abajo a la derecha durante el último tramo. */
  private drawMoon(): void {
    const k = Phaser.Math.Clamp((this.progress - 0.72) / 0.28, 0, 1);
    const e = Phaser.Math.Easing.Sine.InOut(k);
    const scale = Phaser.Math.Linear(0.6, 1, e);
    this.moon.setPosition(Phaser.Math.Linear(MOON_X0, GAME_WIDTH - 360, e), Phaser.Math.Linear(MOON_Y, GAME_HEIGHT + 120, e)).setScale(scale);
    this.moonGlow.setPosition(this.moon.x, this.moon.y).setScale(scale).setAlpha(0.1 + 0.12 * e);
  }

  /** La Tierra se aleja y se hace pequeña hacia la esquina. */
  private drawEarth(): void {
    const e = Phaser.Math.Easing.Sine.Out(Phaser.Math.Clamp(this.progress / 0.85, 0, 1));
    this.earth.setPosition(Phaser.Math.Linear(170, 70, e), Phaser.Math.Linear(GAME_HEIGHT - 20, 150, e)).setScale(Phaser.Math.Linear(1.5, 0.22, e));
  }

  /** Dos cinturones de Van Allen: se funden de color al cruzarlos y sale un rótulo breve la primera vez de cada uno. */
  private drawBelts(): void {
    let strongest = 0;
    BELTS.forEach((b, i) => {
      const k = this.progress > b.a && this.progress < b.b ? Math.sin(Math.PI * (this.progress - b.a) / (b.b - b.a)) : 0;
      this.beltImgs[i].setAlpha(this.calm ? 0.45 * k : 0.8 * k);
      strongest = Math.max(strongest, k);
      if (k > 0.3 && !this.capShown[i]) { this.capShown[i] = true; this.caption(b.name); }
    });
    const on = strongest > 0.2 && !this.calm;
    if (this.beltFx && on !== this.beltOn) { this.beltOn = on; if (on) this.beltFx.start(); else this.beltFx.stop(); }
  }

  private caption(name: TKey): void {
    const el = this.ui.el.querySelector<HTMLElement>('[data-cap]');
    if (!el) return;
    el.innerHTML = `<b>${t(name)}</b><span>${t('flight.belt.sub')}</span>`;
    el.classList.add('is-on');
    this.time.delayedCall(3200, () => el.classList.remove('is-on'));
  }

  /** Dos viñetas de cómic que entran por la esquina (sin pausar el vuelo) para preparar la llegada a la Luna. */
  private checkVignettes(): void {
    VIG_AT.forEach((at, i) => {
      if (this.progress < at || this.vigShown[i]) return;
      this.vigShown[i] = true;
      const el = this.ui.el.querySelector<HTMLElement>('[data-vig]');
      if (!el) return;
      const crew = CHARACTERS.find((c) => c.id === state.loadout?.character) ?? CHARACTERS[0];
      el.innerHTML = `<div class="vig__face">${i === 0 ? EARTH_ICON : michiFaceSvg(crew)}</div><div class="vig__body"><b>${i === 0 ? t('flight.vig.control') : crew.name}</b><span>${t(i === 0 ? 'flight.vig1' : 'flight.vig2')}</span></div>`;
      el.classList.remove('is-out'); void el.offsetWidth; el.classList.add('is-in');
      audio.play('confirm');
      this.time.delayedCall(3300, () => { el.classList.remove('is-in'); el.classList.add('is-out'); });
    });
  }

  private drawBar(): void {
    const x = 380;
    const y = 30;
    const w = GAME_WIDTH - 760;
    this.bar.clear();
    this.bar.fillStyle(0x0e0b33, 0.7).fillRoundedRect(x - 4, y - 4, w + 8, 20, 10);
    this.bar.fillStyle(tokenColor('aurora-teal'), 1).fillRoundedRect(x, y, Math.max(8, w * this.progress), 12, 6);
    this.bar.fillStyle(0xf5f5f2, 1).fillCircle(x + w + 14, y + 6, 12).lineStyle(3, 0x0e0b33, 1).strokeCircle(x + w + 14, y + 6, 12);
    this.bar.fillStyle(0x4cc3f5, 1).fillCircle(x - 14, y + 6, 10).lineStyle(3, 0x0e0b33, 1).strokeCircle(x - 14, y + 6, 10);
    this.drawHealth();
  }

  /** Vida de la nave: un corazón y cuatro tramos que se apagan con cada choque (abajo a la izquierda). */
  private drawHealth(): void {
    const x = 28;
    const y = GAME_HEIGHT - 52;
    const seg = 56;
    this.bar.fillStyle(0x0e0b33, 0.75).fillRoundedRect(x - 6, y - 8, 52 + seg * HP_MAX + 14, 38, 12);
    // corazón de una sola pieza (curva clásica), con latido al perder o ganar vida
    const k = 0.78 * (1 + this.heartPulse * 0.6);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      pts.push(new Phaser.Math.Vector2(x + 20 + 16 * Math.sin(a) ** 3 * k, y + 11 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * k + 1));
    }
    this.bar.fillStyle(this.hp <= 1 ? 0xff3d4f : 0xff6b7a, 1).fillPoints(pts, true);
    this.bar.fillStyle(0xffffff, 0.45).fillCircle(x + 13, y + 5, 2.6);
    this.bar.lineStyle(3, 0x0e0b33, 1).strokePoints(pts, true, true);
    for (let i = 0; i < HP_MAX; i++) {
      const on = i < this.hp;
      const color = this.hp <= 1 ? 0xff6b7a : this.hp === 2 ? 0xffcb47 : tokenColor('aurora-teal');
      this.bar.fillStyle(on ? color : 0x2a2d5c, 1).fillRoundedRect(x + 46 + i * seg, y + 2, seg - 8, 20, 6);
      this.bar.lineStyle(2, 0x0e0b33, 1).strokeRoundedRect(x + 46 + i * seg, y + 2, seg - 8, 20, 6);
    }
  }

  /**
   * Se cruza la órbita y se aterriza: la nave frena, gira de nariz hacia abajo, baja en arco con los retrocohetes encendidos (la cámara se
   * acerca a la Luna), levanta polvo al tocar y se asienta con un pequeño rebote.
   */
  private land(): void {
    if (this.phase !== 'fly') return;
    this.phase = 'land';
    this.ship.setAlpha(1).clearTint();
    this.ring.clear();
    this.bar.clear();
    this.flame?.stop();
    this.beltFx?.stop();
    this.beltImgs.forEach((b) => this.tweens.add({ targets: b, alpha: 0, duration: 400 }));
    this.tweens.add({ targets: this.ui.el.querySelector('.flight__hint'), opacity: 0, duration: 200 });
    for (const sprite of [...this.rocks.map((r) => r.sprite), ...this.clouds.map((c) => c.sprite), ...this.pickups.map((q) => q.sprite), ...this.decor]) {
      this.tweens.add({ targets: sprite, alpha: 0, duration: 400, onComplete: () => sprite.destroy() });
    }
    this.rocks = []; this.clouds = []; this.pickups = []; this.decor = [];
    audio.play('thrust');
    const fast = this.calm;
    const surfaceY = this.moon.y - (this.moon.displayHeight / 2 - 10);
    const padX = this.moon.x - 150;
    const x0 = this.ship.x;
    const y0 = this.ship.y;
    const cx = padX - 260;                          // punto de control de la curva: entra desde la izquierda y baja en arco
    const cy = Math.min(y0, surfaceY - 300);
    if (!fast) this.cameras.main.zoomTo(1.1, 3200, 'Sine.inOut');
    const retro = !fast && !state.settings.ultraLight
      ? this.add.particles(0, 0, 'spark', {
        speed: { min: 60, max: 150 }, angle: { min: 250, max: 290 }, scale: { start: 0.6, end: 0 }, lifespan: 420, frequency: 26,
        tint: [tokenColor('star-gold'), tokenColor('solar-coral'), 0xffffff], blendMode: Phaser.BlendModes.ADD, emitting: false,
      }).setDepth(9)
      : undefined;
    retro?.startFollow(this.ship, 0, -34);          // la nave va de nariz hacia abajo: los motores quedan arriba
    const touchdown = (): void => {
      retro?.stop();
      this.cameras.main.flash(260, 255, 255, 255);
      audio.play('confirm');
      if (!fast && !state.settings.ultraLight) {
        for (const [a0, a1] of [[185, 215], [325, 355]]) { // nubes de polvo hacia los dos lados (en la Luna no hay aire: viaja en arco bajo)
          this.add.particles(padX, surfaceY, 'spark', {
            speed: { min: 50, max: 150 }, angle: { min: a0, max: a1 }, scale: { start: 0.55, end: 0 }, lifespan: 1100, gravityY: 70,
            tint: [0xc4c2e0, 0x9a98c8, 0xe6e4f6], emitting: false,
          }).setDepth(11).explode(18);
        }
        this.cameras.main.shake(180, 0.004);
      }
      this.tweens.add({ targets: this.ship, y: surfaceY - 14, duration: 140, yoyo: true, ease: 'Quad.out' }); // pequeño rebote al apoyar las patas
      this.time.delayedCall(fast ? 450 : 1300, () => this.arrive());
    };
    const descend = (): void => {
      retro?.start();
      const path = { k: 0 };
      this.tweens.add({
        targets: path, k: 1, duration: fast ? 900 : 3000, ease: 'Sine.inOut',
        onUpdate: () => {
          const k = path.k, a = 1 - k;
          this.ship.setPosition(a * a * x0 + 2 * a * k * cx + k * k * padX, a * a * y0 + 2 * a * k * cy + k * k * (surfaceY - 6));
          this.ship.setScale(Phaser.Math.Linear(SHIP_SCALE, LANDED_SCALE, k));
        },
        onComplete: touchdown,
      });
    };
    this.tweens.add({ targets: this.ship, rotation: Math.PI, duration: fast ? 350 : 900, ease: 'Sine.inOut', onComplete: descend });
  }

  private arrive(): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.tweens.killAll();
    fadeTo(this, SCENES.station, 400);
  }
}
