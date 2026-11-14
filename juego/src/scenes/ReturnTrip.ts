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
const TRIP_MS = 4600;
const FLIP_AT = 1500;   // cuándo empieza la voltereta
const FLIP_MS = 1150;

/**
 * Viaje de regreso a la Tierra (sin textos): la nave sale de la Luna, hace una voltereta a mitad de camino,
 * se pone de cara a la Tierra y entra a la atmósfera. Después sigue el informe.
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
    const rocket = this.add.image(MOON.x + 70, MOON.y + 30, 'rocket').setScale(0.4).setDepth(10);
    const glow = this.add.circle(0, 0, 60, tokenColor('solar-coral'), 0).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    if (!state.settings.ultraLight) {
      const flame = this.add.particles(0, 0, 'spark', {
        speed: { min: 30, max: 70 }, scale: { start: 0.8, end: 0 }, lifespan: 500, frequency: 24,
        tint: [tokenColor('star-gold'), tokenColor('solar-coral'), 0xffffff], blendMode: Phaser.BlendModes.ADD,
        angle: { min: 0, max: 360 },
      }).setDepth(9);
      flame.startFollow(rocket, 0, 0);
    }
    audio.play('thrust');

    // trayectoria curva de la Luna a la Tierra
    const start = new Phaser.Math.Vector2(rocket.x, rocket.y);
    const end = new Phaser.Math.Vector2(EARTH.x - 80, EARTH.y - EARTH_R + 30);
    const ctrl = new Phaser.Math.Vector2(620, 80);
    const curve = new Phaser.Curves.QuadraticBezier(start, ctrl, end);
    const p = new Phaser.Math.Vector2();
    const flip = { v: 0 };
    const trip = { t: 0 };
    this.tweens.add({
      targets: trip, t: 1, duration: calm ? 1400 : TRIP_MS, ease: 'Sine.inOut',
      onUpdate: () => {
        curve.getPoint(trip.t, p);
        const ahead = curve.getPoint(Math.min(1, trip.t + 0.02));
        rocket.setPosition(p.x, p.y);
        // la nariz mira hacia donde va (el dibujo apunta hacia arriba) + la voltereta
        rocket.setRotation(Math.atan2(ahead.y - p.y, ahead.x - p.x) + Math.PI / 2 + flip.v * Math.PI * 2);
        rocket.setScale(0.4 - trip.t * 0.14);
        const heat = Phaser.Math.Clamp((trip.t - 0.78) / 0.22, 0, 1); // entrada a la atmósfera: brilla y se calienta
        glow.setPosition(p.x, p.y).setAlpha(heat * 0.8).setScale(1 + heat * 1.4);
      },
      onComplete: () => {
        this.cameras.main.flash(300, 255, 255, 255);
        this.time.delayedCall(250, () => fadeTo(this, SCENES.report, 500));
      },
    });
    if (!calm) {
      // voltereta: una vuelta completa sobre sí misma, con un pequeño salto de escala
      this.tweens.add({ targets: flip, v: 1, duration: FLIP_MS, delay: FLIP_AT, ease: 'Sine.inOut', onStart: () => audio.play('jump') });
      this.tweens.add({ targets: rocket, scaleX: '+=0.06', scaleY: '+=0.06', duration: FLIP_MS / 2, delay: FLIP_AT, yoyo: true, ease: 'Sine.inOut' });
      this.time.delayedCall(TRIP_MS * 0.78, () => this.cameras.main.shake(900, 0.004));
    }
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
