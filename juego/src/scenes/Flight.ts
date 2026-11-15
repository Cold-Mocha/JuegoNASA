import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../core/config';
import { state } from '../core/state';
import { tokenColor } from '../core/theme';
import { UiLayer } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { t } from '../core/i18n';

const SHIP_X = 190;
const SHIP_SCALE = 0.4;
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
const LANDED_SCALE = 0.14;
const STAR_LAYERS = [{ key: 'flight-stars-far', speed: 0.25, n: 90, r: 1 }, { key: 'flight-stars-mid', speed: 0.55, n: 50, r: 1.6 }, { key: 'flight-stars-near', speed: 1, n: 22, r: 2.4 }] as const;

interface Rock { sprite: Phaser.GameObjects.Image; r: number; spin: number; }

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

  constructor() {
    super(SCENES.flight);
  }

  create(): void {
    this.calm = state.calm;
    this.total = this.calm ? FLIGHT_SEC_CALM : FLIGHT_SEC;
    this.progress = 0;
    this.rocks = [];
    this.layers = [];
    this.invuln = 0;
    this.spawnIn = 1.2;
    this.phase = 'fly';
    this.hp = HP_MAX;
    this.targetY = GAME_HEIGHT / 2;
    fadeIn(this, 400);
    this.makeTextures();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tokenColor('space-800')).setOrigin(0);
    for (const l of STAR_LAYERS) this.layers.push(this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, l.key).setOrigin(0));
    this.moonGlow = this.add.circle(MOON_X0, MOON_Y, MOON_R + 46, 0x9fd8f5, 0.16).setDepth(1);
    this.moon = this.add.image(MOON_X0, MOON_Y, MOON_TEX).setDepth(2);
    this.ship = this.add.image(SHIP_X, this.targetY, 'rocket').setRotation(Math.PI / 2).setScale(SHIP_SCALE).setDepth(10);
    if (!state.settings.ultraLight && !this.calm) {
      const flame = this.add.particles(0, 0, 'spark', {
        speed: { min: 60, max: 140 }, angle: { min: 170, max: 190 }, scale: { start: 0.7, end: 0 }, lifespan: 380, frequency: 30,
        tint: [tokenColor('star-gold'), tokenColor('solar-coral'), 0xffffff], blendMode: Phaser.BlendModes.ADD,
      }).setDepth(9);
      flame.startFollow(this.ship, -52, 0);
    }
    this.bar = this.add.graphics().setDepth(20);
    this.ui = new UiLayer(this, `<div class="flight">
      <p class="mini-msg mini-msg--hint flight__hint"><span>${t('flight.hint')}</span><span class="mini-keys"><kbd>↑</kbd><kbd>↓</kbd></span></p></div>`, 'screen screen--clear');
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
    const slow = this.phase === 'fly' ? 1 : 0.25;
    this.layers.forEach((l, i) => (l.tilePositionX += SCROLL * STAR_LAYERS[i].speed * dt * slow));
    if (this.phase !== 'fly') return;
    this.moveShip(dt);
    this.progress = Math.min(1, this.progress + dt / this.total);
    this.moveRocks(dt);
    this.spawn(dt);
    this.drawMoon();
    this.drawBar();
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.ship.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 3) % 2 ? 0.35 : 1); // parpadeo de 1,5 por segundo
    }
    if (this.progress >= 1) this.land();
  }

  private moveShip(dt: number): void {
    const dir = (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0) - (this.keys.up.isDown || this.keys.w.isDown ? 1 : 0);
    if (dir !== 0) this.targetY = this.ship.y + dir * 200;
    const step = SHIP_SPEED * dt;
    const goal = Phaser.Math.Clamp(this.targetY, TOP, BOTTOM);
    this.ship.y += Phaser.Math.Clamp(goal - this.ship.y, -step, step);
    this.ship.setRotation(Math.PI / 2 + Phaser.Math.Clamp((goal - this.ship.y) / 400, -0.18, 0.18)); // se inclina un poco al subir o bajar
  }

  private spawn(dt: number): void {
    if (this.progress > 0.9) return;
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    const hard = this.calm ? 0.5 : 1;
    this.spawnIn = (0.95 - this.progress * 0.3) / hard;
    if (!this.calm && Math.random() < 0.15) {
      // dos rocas con un hueco cerca de donde está la nave, para que siempre se pueda pasar
      const gap = Phaser.Math.Clamp(this.ship.y + Phaser.Math.Between(-130, 130), TOP + 170, BOTTOM - 170);
      this.addRock(gap - 170);
      this.addRock(gap + 170);
    } else {
      this.addRock(Phaser.Math.Between(TOP, BOTTOM));
    }
  }

  private addRock(y: number): void {
    const scale = Phaser.Math.FloatBetween(0.7, 1.35);
    const sprite = this.add.image(GAME_WIDTH + 80, y, `flight-rock-${Math.random() < 0.5 ? 0 : 1}`).setScale(scale).setDepth(8);
    this.rocks.push({ sprite, r: 44 * scale, spin: Phaser.Math.FloatBetween(-1.2, 1.2) });
  }

  private moveRocks(dt: number): void {
    const parts = [-30, 0, 30].map((dx) => ({ x: SHIP_X + dx, y: this.ship.y, r: 16 }));
    for (const rock of [...this.rocks]) {
      rock.sprite.x -= SCROLL * dt;
      rock.sprite.rotation += rock.spin * dt;
      if (rock.sprite.x < -120) { this.removeRock(rock); continue; }
      if (this.invuln > 0 || rock.sprite.x > SHIP_X + 140) continue;
      if (parts.some((p) => Phaser.Math.Distance.Between(p.x, p.y, rock.sprite.x, rock.sprite.y) < p.r + rock.r * 0.82)) this.hit(rock);
    }
  }

  private removeRock(rock: Rock): void {
    rock.sprite.destroy();
    this.rocks = this.rocks.filter((x) => x !== rock);
  }

  private hit(rock: Rock): void {
    this.invuln = INVULN_SEC;
    this.hp--;
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
    this.hp = HP_MAX;
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
    this.bar.fillStyle(0xff6b7a, 1).fillCircle(x + 9, y + 9, 8).fillCircle(x + 23, y + 9, 8).fillTriangle(x + 1, y + 13, x + 31, y + 13, x + 16, y + 29);
    this.bar.lineStyle(3, 0x0e0b33, 1).strokeCircle(x + 9, y + 9, 8).strokeCircle(x + 23, y + 9, 8);
    for (let i = 0; i < HP_MAX; i++) {
      const on = i < this.hp;
      const color = this.hp <= 1 ? 0xff6b7a : this.hp === 2 ? 0xffcb47 : tokenColor('aurora-teal');
      this.bar.fillStyle(on ? color : 0x2a2d5c, 1).fillRoundedRect(x + 46 + i * seg, y + 2, seg - 8, 20, 6);
      this.bar.lineStyle(2, 0x0e0b33, 1).strokeRoundedRect(x + 46 + i * seg, y + 2, seg - 8, 20, 6);
    }
  }

  /** Se cruza la órbita: la nave se pone de nariz hacia abajo, desciende y aterriza en la base. */
  private land(): void {
    if (this.phase !== 'fly') return;
    this.phase = 'land';
    this.ship.setAlpha(1);
    this.bar.clear();
    this.tweens.add({ targets: this.ui.el.querySelector('.flight__hint'), opacity: 0, duration: 200 });
    this.rocks.forEach((r) => this.tweens.add({ targets: r.sprite, alpha: 0, duration: 400, onComplete: () => r.sprite.destroy() }));
    this.rocks = [];
    audio.play('thrust');
    // la nave aterriza directo sobre la superficie de la Luna (la estación no está en la Luna)
    const surfaceY = this.moon.y - (this.moon.displayHeight / 2 - 10);
    const padX = this.moon.x - 150;
    this.tweens.add({
      targets: this.ship, x: padX, y: surfaceY - 6, rotation: Math.PI, scale: LANDED_SCALE,
      duration: this.calm ? 900 : 2400, ease: 'Sine.inOut',
      onComplete: () => {
        this.cameras.main.flash(300, 255, 255, 255);
        audio.play('confirm');
        if (!this.calm && !state.settings.ultraLight) {
          this.add.particles(padX, surfaceY, 'spark', {
            speed: { min: 25, max: 90 }, angle: { min: 195, max: 345 }, scale: { start: 0.45, end: 0 }, lifespan: 800, gravityY: 40,
            tint: [0xc4c2e0, 0x9a98c8, 0xe6e4f6], emitting: false,
          }).setDepth(11).explode(26);
        }
        this.time.delayedCall(this.calm ? 450 : 1100, () => this.arrive());
      },
    });
  }

  private arrive(): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.tweens.killAll();
    fadeTo(this, SCENES.station, 400);
  }
}
