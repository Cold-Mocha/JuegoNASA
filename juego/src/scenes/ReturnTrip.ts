import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { tokenColor } from '../core/theme';
import { drawStarfield } from '../core/starfield';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';

const MOON = new Phaser.Math.Vector2(190, 170);
const EARTH = new Phaser.Math.Vector2(930, 640);
const EARTH_R = 230;
const TRIP_MS = 10500;
const TURN_AT = 1800;    // giro lento de media vuelta para quedar cola hacia adelante (como antes de frenar para volver)
const TURN_MS = 2600;
const BURN_AT = 4500;    // encendido de frenado (sin aire: solo motor), de 1,3 s
const BURN_MS = 1300;
const TURN_BACK_AT = 5900;  // media vuelta de regreso y nariz arriba para entrar a la atmósfera

/**
 * Viaje de regreso a la Tierra (sin textos): el orbitador sale de la Luna, gira despacio de cola, enciende el motor para frenar,
 * vuelve a girar de cara a la Tierra y entra a la atmósfera. Después sigue el informe. Se puede saltar con un toque o con Esc.
 * [DIBUJO] orbitador de diseño propio, distinto del cohete del despegue.
 */
export class ReturnTripScene extends Phaser.Scene {
  constructor() {
    super(SCENES.returnTrip);
  }

  create(): void {
    const calm = state.calm;
    fadeIn(this, 400);
    drawStarfield(this, 'return', !calm);
    this.drawMoon();
    this.drawEarth();

    if (!this.textures.exists('spark')) {
      this.make.graphics({}, false).fillStyle(0xffffff, 1).fillCircle(8, 8, 8).generateTexture('spark', 16, 16).destroy();
    }
    this.ensureOrbiter();
    const rocket = this.add.image(MOON.x + 70, MOON.y + 30, 'orbiter').setScale(0.62).setDepth(10);
    const glow = this.add.circle(0, 0, 60, tokenColor('solar-coral'), 0).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    let flame: Phaser.GameObjects.Particles.ParticleEmitter | undefined;
    if (!state.settings.ultraLight) {
      flame = this.add.particles(0, 0, 'spark', {
        speed: { min: 30, max: 70 }, scale: { start: 0.8, end: 0 }, lifespan: 500, frequency: 24,
        tint: [tokenColor('star-gold'), tokenColor('solar-coral'), 0xffffff], blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 },
      }).setDepth(9);
      flame.startFollow(rocket, 0, 0);
      flame.stop();
    }
    audio.play('thrust');

    // trayectoria curva de la Luna a la Tierra
    const start = new Phaser.Math.Vector2(rocket.x, rocket.y);
    const end = new Phaser.Math.Vector2(EARTH.x - 80, EARTH.y - EARTH_R + 30);
    const ctrl = new Phaser.Math.Vector2(620, 80);
    const curve = new Phaser.Curves.QuadraticBezier(start, ctrl, end);
    const p = new Phaser.Math.Vector2();
    const flip = { v: 0 }; // 0→1: media vuelta (cola adelante); 1→2: media vuelta de regreso
    const trip = { t: 0 };
    this.tweens.add({
      targets: trip, t: 1, duration: calm ? 1400 : TRIP_MS, ease: 'Sine.inOut',
      onUpdate: () => {
        curve.getPoint(trip.t, p);
        const ahead = curve.getPoint(Math.min(1, trip.t + 0.02));
        rocket.setPosition(p.x, p.y);
        // la nariz mira hacia donde va (el dibujo apunta hacia arriba) + la voltereta
        rocket.setRotation(Math.atan2(ahead.y - p.y, ahead.x - p.x) + Math.PI / 2 + flip.v * Math.PI);
        rocket.setScale(0.62 - trip.t * 0.26);
        const heat = Phaser.Math.Clamp((trip.t - 0.78) / 0.22, 0, 1); // entrada a la atmósfera: brilla y se calienta
        glow.setPosition(p.x, p.y).setAlpha(heat * 0.8).setScale(1 + heat * 1.4);
      },
      onComplete: () => {
        this.cameras.main.flash(300, 255, 255, 255);
        this.time.delayedCall(250, () => fadeTo(this, SCENES.report, 500));
      },
    });
    if (!calm) {
      // maniobra de desorbitado, despacio: media vuelta, encendido de frenado, media vuelta de regreso
      this.tweens.add({ targets: flip, v: 1, duration: TURN_MS, delay: TURN_AT, ease: 'Sine.inOut' });
      this.tweens.add({ targets: flip, v: 2, duration: TURN_MS, delay: TURN_BACK_AT, ease: 'Sine.inOut' });
      this.time.delayedCall(BURN_AT, () => { audio.play('thrust'); flame?.start(); });
      this.time.delayedCall(BURN_AT + BURN_MS, () => flame?.stop());
      this.time.delayedCall(TRIP_MS * 0.8, () => { flame?.start(); this.cameras.main.shake(1200, 0.003); });
    }
    // saltar el viaje con un toque o Esc
    const skip = (): void => { this.tweens.killAll(); fadeTo(this, SCENES.report, 300); };
    this.time.delayedCall(1500, () => { this.input.once('pointerdown', skip); this.input.keyboard?.once('keydown-ESC', skip); });
  }

  /** [DIBUJO] Orbitador visto desde arriba (diseño propio, sin logos): ala delta, morro negro y deriva. */
  private ensureOrbiter(): void {
    if (this.textures.exists('orbiter')) return;
    const g = this.make.graphics({}, false);
    const ink = 0x0e0b33;
    g.fillStyle(0xe9e8f2, 1).lineStyle(6, ink, 1);
    g.fillTriangle(100, 70, 10, 190, 190, 190).strokeTriangle(100, 70, 10, 190, 190, 190);       // ala delta
    g.fillRoundedRect(78, 20, 44, 176, 20).strokeRoundedRect(78, 20, 44, 176, 20);               // fuselaje
    g.fillStyle(ink, 1).fillTriangle(100, 12, 80, 52, 120, 52);                                   // morro con losetas negras
    g.fillStyle(0x4cc3f5, 1).fillRoundedRect(90, 52, 20, 12, 4);                                  // ventanas
    g.fillStyle(0x6f6c8c, 1).fillRect(86, 192, 8, 10).fillRect(106, 192, 8, 10);                  // motores
    g.generateTexture('orbiter', 200, 210);
    g.destroy();
  }

  private drawMoon(): void {
    const g = this.add.graphics();
    g.fillStyle(0xc4c2e0, 1).fillCircle(MOON.x, MOON.y, 96);
    g.lineStyle(5, 0x0e0b33, 1).strokeCircle(MOON.x, MOON.y, 96);
    g.fillStyle(0x9a98c8, 1);
    [[-30, -24, 20], [28, 10, 26], [-8, 44, 14], [44, -38, 12]].forEach(([dx, dy, r]) => g.fillCircle(MOON.x + dx, MOON.y + dy, r));
    g.fillStyle(0x0e0b33, 0.18).fillCircle(MOON.x + 22, MOON.y + 22, 96);
    // la estación, un puntito sobre la superficie
    g.fillStyle(0xf5f5f2, 1).fillRoundedRect(MOON.x + 52, MOON.y + 26, 26, 14, 4).lineStyle(3, 0x0e0b33, 1).strokeRoundedRect(MOON.x + 52, MOON.y + 26, 26, 14, 4);
  }

  private drawEarth(): void {
    const g = this.add.graphics();
    g.fillStyle(0x4cc3f5, 0.18).fillCircle(EARTH.x, EARTH.y, EARTH_R + 38);   // atmósfera
    g.fillStyle(0x4cc3f5, 0.3).fillCircle(EARTH.x, EARTH.y, EARTH_R + 16);
    g.fillStyle(0x3a8de0, 1).fillCircle(EARTH.x, EARTH.y, EARTH_R);
    g.lineStyle(6, 0x0e0b33, 1).strokeCircle(EARTH.x, EARTH.y, EARTH_R);
    g.fillStyle(0x5ad6b2, 1);
    [[-110, -120, 64], [-70, -90, 46], [60, -140, 52], [120, -60, 40], [-30, -30, 34]].forEach(([dx, dy, r]) => g.fillCircle(EARTH.x + dx, EARTH.y + dy, r));
    g.fillStyle(0xffffff, 0.75);
    [[-40, -170, 34], [30, -150, 28], [150, -100, 24]].forEach(([dx, dy, r]) => g.fillCircle(EARTH.x + dx, EARTH.y + dy, r));
    g.fillStyle(0x0e0b33, 0.2).fillCircle(EARTH.x + 40, EARTH.y + 40, EARTH_R);
  }
}
