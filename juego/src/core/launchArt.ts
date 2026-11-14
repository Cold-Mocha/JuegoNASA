import Phaser from 'phaser';

/** Arte procedural de la pantalla de despegue: público de animales, gaviotas, humo y brillos (sin archivos). */

const INK = 0x0e0b33;
const SHIRTS = [0xff7a59, 0x4cc3f5, 0xffcb47, 0x9b7bff, 0x5ad6b2];

type Ear = 'tri' | 'round' | 'long' | 'floppy' | 'none';
interface Species {
  id: string;
  fur: number;
  ear: Ear;
  earColor?: number;
  muzzle?: number;
  patch?: number;   // manchas alrededor de los ojos (panda)
}

const SPECIES: Species[] = [
  { id: 'cat', fur: 0xf2a65a, ear: 'tri', muzzle: 0xfbe1c0 },
  { id: 'bear', fur: 0x9a6a43, ear: 'round', muzzle: 0xdcb98f },
  { id: 'rabbit', fur: 0xf3ecf0, ear: 'long', earColor: 0xf3ecf0, muzzle: 0xffd1dc },
  { id: 'dog', fur: 0xd9b27c, ear: 'floppy', earColor: 0x7a5232, muzzle: 0xf3dcb8 },
  { id: 'panda', fur: 0xf5f5f2, ear: 'round', earColor: 0x2b2a45, patch: 0x2b2a45 },
  { id: 'mouse', fur: 0xb8b6c8, ear: 'round', earColor: 0xffb3c6, muzzle: 0xe4e2ee },
  { id: 'fox', fur: 0xe4742f, ear: 'tri', muzzle: 0xfff1e0 },
  { id: 'penguin', fur: 0x2b2a45, ear: 'none', muzzle: 0xf5f5f2 },
];

export const CROWD_KEYS: string[] = SPECIES.flatMap((s) => [0, 1].map((v) => `crowd-${s.id}-${v}`));
export const ANIMAL_W = 66;
export const ANIMAL_H = 88;

/** Relleno + contorno grueso (estilo del design system: trazo #0e0b33). */
const outline = (g: Phaser.GameObjects.Graphics, fill: number, draw: (stroke: boolean) => void): void => {
  g.fillStyle(fill, 1).lineStyle(2.6, INK, 1);
  draw(false);
  draw(true);
};

function drawAnimal(g: Phaser.GameObjects.Graphics, s: Species, shirt: number): void {
  const cx = ANIMAL_W / 2;
  const penguin = s.id === 'penguin';

  // brazo levantado (saludando) detrás del cuerpo
  outline(g, penguin ? s.fur : shirt, (st) => (st ? g.strokeRoundedRect(cx + 14, 34, 9, 24, 4) : g.fillRoundedRect(cx + 14, 34, 9, 24, 4)));
  outline(g, s.fur, (st) => (st ? g.strokeCircle(cx + 18.5, 33, 5) : g.fillCircle(cx + 18.5, 33, 5)));

  // orejas
  const ec = s.earColor ?? s.fur;
  if (s.ear === 'tri') {
    outline(g, ec, (st) => (st ? g.strokeTriangle(cx - 19, 24, cx - 13, 3, cx - 2, 18) : g.fillTriangle(cx - 19, 24, cx - 13, 3, cx - 2, 18)));
    outline(g, ec, (st) => (st ? g.strokeTriangle(cx + 19, 24, cx + 13, 3, cx + 2, 18) : g.fillTriangle(cx + 19, 24, cx + 13, 3, cx + 2, 18)));
  } else if (s.ear === 'round') {
    outline(g, ec, (st) => (st ? g.strokeCircle(cx - 15, 20, 8) : g.fillCircle(cx - 15, 20, 8)));
    outline(g, ec, (st) => (st ? g.strokeCircle(cx + 15, 20, 8) : g.fillCircle(cx + 15, 20, 8)));
  } else if (s.ear === 'long') {
    outline(g, ec, (st) => (st ? g.strokeEllipse(cx - 9, 9, 11, 30) : g.fillEllipse(cx - 9, 9, 11, 30)));
    outline(g, ec, (st) => (st ? g.strokeEllipse(cx + 9, 9, 11, 30) : g.fillEllipse(cx + 9, 9, 11, 30)));
  } else if (s.ear === 'floppy') {
    outline(g, ec, (st) => (st ? g.strokeEllipse(cx - 20, 34, 12, 26) : g.fillEllipse(cx - 20, 34, 12, 26)));
    outline(g, ec, (st) => (st ? g.strokeEllipse(cx + 20, 34, 12, 26) : g.fillEllipse(cx + 20, 34, 12, 26)));
  }

  // cuerpo (camiseta de colores; el pingüino lleva su propio traje)
  outline(g, penguin ? s.fur : shirt, (st) => (st ? g.strokeRoundedRect(cx - 15, 52, 30, 34, 9) : g.fillRoundedRect(cx - 15, 52, 30, 34, 9)));
  if (penguin) g.fillStyle(0xf5f5f2, 1).fillEllipse(cx, 70, 17, 26);
  // brazo izquierdo
  outline(g, penguin ? s.fur : shirt, (st) => (st ? g.strokeRoundedRect(cx - 24, 54, 9, 22, 4) : g.fillRoundedRect(cx - 24, 54, 9, 22, 4)));

  // cabeza
  outline(g, s.fur, (st) => (st ? g.strokeCircle(cx, 36, 19) : g.fillCircle(cx, 36, 19)));
  if (penguin) g.fillStyle(0xf5f5f2, 1).fillEllipse(cx, 40, 28, 22);
  else if (s.muzzle !== undefined) g.fillStyle(s.muzzle, 1).fillEllipse(cx, 44, 18, 11);
  if (s.patch !== undefined) g.fillStyle(s.patch, 1).fillEllipse(cx - 8, 35, 9, 12).fillEllipse(cx + 8, 35, 9, 12);

  // cara
  g.fillStyle(penguin ? INK : s.patch !== undefined ? 0xf5f5f2 : INK, 1);
  g.fillCircle(cx - 7, 35, 2.4).fillCircle(cx + 7, 35, 2.4);
  if (penguin) g.fillStyle(0xff9a3d, 1).fillTriangle(cx - 4, 42, cx + 4, 42, cx, 48);
  else g.fillStyle(INK, 1).fillTriangle(cx - 3, 41, cx + 3, 41, cx, 45);
}

/** Texturas del público: 8 especies × 2 colores de camiseta. */
export function ensureCrowdTextures(scene: Phaser.Scene): void {
  SPECIES.forEach((s, i) => {
    [0, 1].forEach((v) => {
      const key = `crowd-${s.id}-${v}`;
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({}, false);
      drawAnimal(g, s, SHIRTS[(i + v * 2) % SHIRTS.length]);
      g.generateTexture(key, ANIMAL_W, ANIMAL_H);
      g.destroy();
    });
  });
}

/** Gaviota de perfil mirando a la derecha: posada y con las alas arriba / abajo. */
export function ensureGullTextures(scene: Phaser.Scene): void {
  const make = (key: string, wings: 'perch' | 'up' | 'down'): void => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({}, false);
    if (wings === 'perch') g.fillStyle(0xff9a3d, 1).fillRect(17, 26, 2, 6).fillRect(23, 26, 2, 6);
    else if (wings === 'up') g.fillStyle(0xdcdcec, 1).lineStyle(2, INK, 1).fillTriangle(14, 20, 30, 20, 10, 2).strokeTriangle(14, 20, 30, 20, 10, 2);
    else g.fillStyle(0xdcdcec, 1).lineStyle(2, INK, 1).fillTriangle(14, 20, 30, 20, 8, 38).strokeTriangle(14, 20, 30, 20, 8, 38);
    // cuerpo, cabeza y pico
    g.fillStyle(0xf5f5f2, 1).lineStyle(2, INK, 1).fillEllipse(21, 20, 30, 14).strokeEllipse(21, 20, 30, 14);
    if (wings === 'perch') g.fillStyle(0xb8b6c8, 1).fillEllipse(18, 19, 18, 8);
    g.fillStyle(0xf5f5f2, 1).fillCircle(34, 14, 6).strokeCircle(34, 14, 6);
    g.fillStyle(0xff9a3d, 1).fillTriangle(39, 12, 39, 17, 46, 15);
    g.fillStyle(INK, 1).fillCircle(35, 13, 1.3);
    g.generateTexture(key, 48, 40);
    g.destroy();
  };
  make('gull-perch', 'perch');
  make('gull-up', 'up');
  make('gull-down', 'down');
}

/** Signo de exclamación sobre fondo dorado (susto de las gaviotas). */
export function ensureBangTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('bang')) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(0xffcb47, 1).lineStyle(3, INK, 1).fillCircle(16, 16, 14).strokeCircle(16, 16, 14);
  g.fillStyle(INK, 1).fillRoundedRect(14, 7, 5, 12, 2).fillCircle(16.5, 24, 2.6);
  g.generateTexture('bang', 32, 32);
  g.destroy();
}

/** Mancha suave con degradado radial: humo, vapor, brillos y llama (se tiñe según el uso). */
export function ensureSoftTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('puff')) return;
  const tex = scene.textures.createCanvas('puff', 128, 128);
  if (!tex) return;
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  tex.refresh();
}
