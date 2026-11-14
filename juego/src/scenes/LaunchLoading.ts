import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../core/config';
import { state } from '../core/state';
import { tokenColor } from '../core/theme';
import { fadeIn, fadeTo } from '../core/fade';
import { sparkle } from '../core/starfield';
import { LAYERS, CISLUNAR, type Layer } from '../data/atmosphere';
import { audio } from '../core/audio';
import { queueStationAssets } from '../data/preload';
import { addSvgTexture } from '../core/art';
import { MAP_RASTER, MAP_TEXTURE, stationSvg } from '../core/stationArt';
import { addDrawnProps, drawnPropsReady } from '../core/propArt';
import { MAP_W, MAP_H } from '../sim/stationMap';

const BAND = GAME_HEIGHT;          // alto de cada capa en pantalla (no a escala)
const GROUND = GAME_HEIGHT - 70;

/**
 * Pantalla de carga: solo el cohete subiendo por las capas de la atmósfera, sin textos.
 * El avance = min(progreso real del loader, tiempo mínimo) para que la animación se luzca
 * y la carga real nunca se "adelante" a la pantalla.
 */
export class LaunchLoadingScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Container;
  private rocket!: Phaser.GameObjects.Image;
  private ready = false;
  private layers: Layer[] = [];
  private loadProgress = 0;
  private shown = 0;
  private elapsed = 0;
  private minMs = 3000;
  private done = false;

  constructor() {
    super(SCENES.launch);
  }

  create(): void {
    const loadout = state.loadout;
    if (!loadout) {
      this.scene.start(SCENES.select);
      return;
    }
    const reduced = state.calm;

    // Todas las misiones van a la Estación Central, en la superficie lunar
    this.layers = [...LAYERS, CISLUNAR];
    this.minMs = reduced ? 1200 : 3000;
    Object.assign(this, { loadProgress: 0, shown: 0, elapsed: 0, done: false, ready: true });

    fadeIn(this);
    this.buildWorld();
    this.buildRocket(reduced);

    // Carga real
    queueStationAssets(this.load, loadout);
    // el plano y los objetos dibujados se rasterizan en paralelo; la carga termina cuando está todo
    let files = 0;
    let map = this.textures.exists(MAP_TEXTURE) && drawnPropsReady(this.textures);
    const sync = (): void => void (this.loadProgress = Math.min(files, map ? 1 : 0.95));
    void Promise.all([addSvgTexture(this.textures, MAP_TEXTURE, stationSvg(), MAP_W, MAP_H, MAP_RASTER), addDrawnProps(this.textures)]).then(() => {
      map = true;
      sync();
    });
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => {
      files = v;
      sync();
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      files = 1;
      sync();
    });
    this.load.start();
    audio.play('thrust');
  }

  private buildWorld(): void {
    this.world = this.add.container(0, 0);
    const g = this.add.graphics();
    const n = this.layers.length;
    this.layers.forEach((layer, k) => {
      const top = GAME_HEIGHT - (k + 1) * BAND;
      const next = this.layers[k + 1]?.sky ?? tokenColor('space-900');
      g.fillGradientStyle(next, next, layer.sky, layer.sky, 1);
      g.fillRect(0, top, GAME_WIDTH, BAND);
      // estrellas: más densas y brillantes a mayor altura
      const rnd = new Phaser.Math.RandomDataGenerator([layer.id]);
      const count = k * 40;
      for (let i = 0; i < count; i++) {
        g.fillStyle(tokenColor('ink'), Math.min(0.25 + k * 0.2, 0.9));
        g.fillCircle(rnd.between(0, GAME_WIDTH), top + rnd.between(0, BAND), rnd.frac() > 0.9 ? 1.6 : 1);
      }
    });
    this.world.add(g);

    // nubes en la troposfera
    const rnd = new Phaser.Math.RandomDataGenerator(['clouds']);
    for (let i = 0; i < 9; i++) {
      const cx = rnd.between(60, GAME_WIDTH - 60);
      const cy = rnd.between(-BAND * 0.6, GAME_HEIGHT - 260);
      const cloud = this.add.graphics();
      cloud.fillStyle(0xffffff, 0.85);
      [[0, 0, 60], [50, 8, 46], [-50, 10, 42], [20, -24, 40]].forEach(([dx, dy, r]) => cloud.fillCircle(cx + dx, cy + dy, r));
      this.world.add(cloud);
    }

    // destellos en las capas altas
    for (let k = 2; k < n; k++) {
      for (let i = 0; i < 4; i++) {
        this.world.add(sparkle(this, Phaser.Math.Between(80, GAME_WIDTH - 80), GAME_HEIGHT - (k + 1) * BAND + Phaser.Math.Between(40, BAND - 40), 9));
      }
    }

    // suelo y plataforma
    const ground = this.add.graphics();
    ground.fillStyle(0x2e7d5b, 1).fillRect(0, GROUND, GAME_WIDTH, GAME_HEIGHT - GROUND + 10);
    ground.fillStyle(0x23624a, 1).fillEllipse(GAME_WIDTH * 0.2, GROUND + 6, 520, 60).fillEllipse(GAME_WIDTH * 0.85, GROUND + 10, 600, 70);
    ground.fillStyle(tokenColor('constellation'), 1).fillRect(GAME_WIDTH / 2 - 80, GROUND - 14, 160, 16);
    ground.fillStyle(tokenColor('line'), 1).fillRect(GAME_WIDTH / 2 + 60, GROUND - 190, 14, 180);
    this.world.add(ground);
  }

  private buildRocket(reduced: boolean): void {
    if (!this.textures.exists('spark')) {
      this.make.graphics({}, false).fillStyle(0xffffff, 1).fillCircle(8, 8, 8).generateTexture('spark', 16, 16).destroy();
    }
    const startY = GROUND - 64;
    this.rocket = this.add.image(GAME_WIDTH / 2, startY, 'rocket').setScale(0.5).setDepth(10);

    if (!state.settings.ultraLight) this.addFlame();

    // despegue: el cohete sube sin pausas de la plataforma hasta salir por arriba (su altura sigue al progreso, ver update)
    if (!reduced) {
      this.tweens.add({ targets: this.rocket, angle: { from: -2.5, to: 2.5 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.cameras.main.shake(500, 0.004);
    }
  }

  /** Llama del cohete (partículas con pool interno de Phaser; se omite en Ultra Ligero). */
  private addFlame(): void {
    const flame = this.add.particles(0, 0, 'spark', {
      speedY: { min: 160, max: 260 }, speedX: { min: -30, max: 30 },
      scale: { start: 0.9, end: 0 }, lifespan: 600, frequency: 16,
      tint: [tokenColor('star-gold'), tokenColor('solar-coral'), 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(9);
    flame.startFollow(this.rocket, 0, 60);
  }

  update(_time: number, delta: number): void {
    if (!this.ready) return;
    this.elapsed += delta;
    const target = Math.min(this.loadProgress, this.elapsed / this.minMs);
    this.shown += (target - this.shown) * Math.min(1, delta / 80);
    if (target >= 1 && this.shown > 0.995) this.shown = 1;

    const n = this.layers.length;
    this.world.y = Phaser.Math.Easing.Sine.InOut(this.shown) * (n - 1) * BAND + this.shown * 120;

    // el cohete solo sube: de la plataforma al borde de arriba, acelerando, sin quedarse flotando a mitad de camino
    const lift = Phaser.Math.Easing.Quadratic.In(this.shown);
    this.rocket.setY(Phaser.Math.Linear(GROUND - 64, -160, lift)).setScale(Phaser.Math.Linear(0.5, 0.3, this.shown));

    if (this.shown >= 1 && !this.done) this.arrive();
  }

  private arrive(): void {
    this.done = true;
    this.time.delayedCall(150, () => fadeTo(this, SCENES.station, 300));
  }
}
