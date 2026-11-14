import Phaser from 'phaser';
import { tokenColor } from './theme';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

/** Fondo de estrellas + constelación decorativa (colores `constellation` / `ink-muted`). */
export function drawStarfield(scene: Phaser.Scene, seed = 'michi', twinkle = true): Phaser.GameObjects.Container {
  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  const c = scene.add.container(0, 0);
  const bg = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tokenColor('space-800')).setOrigin(0);
  c.add(bg);

  const g = scene.add.graphics();
  for (let i = 0; i < 140; i++) {
    const big = rnd.frac() > 0.85;
    g.fillStyle(big ? tokenColor('ink-muted') : tokenColor('constellation'), big ? 0.9 : 0.8);
    g.fillCircle(rnd.between(0, GAME_WIDTH), rnd.between(0, GAME_HEIGHT), big ? 1.6 : 1);
  }
  // una constelación punteada
  const pts = [
    [980, 120], [1050, 90], [1120, 140], [1180, 100], [1100, 210],
  ].map(([x, y]) => new Phaser.Math.Vector2(x, y));
  g.lineStyle(1.5, tokenColor('constellation'), 0.9);
  for (let i = 0; i < pts.length - 1; i++) dashed(g, pts[i], pts[i + 1]);
  g.fillStyle(tokenColor('ink-muted'), 1);
  pts.forEach((p) => g.fillCircle(p.x, p.y, 3));
  c.add(g);

  if (twinkle) {
    for (let i = 0; i < 6; i++) {
      const s = sparkle(scene, rnd.between(60, GAME_WIDTH - 60), rnd.between(40, GAME_HEIGHT - 40), rnd.between(8, 14));
      c.add(s);
      scene.tweens.add({ targets: s, alpha: 0.25, duration: rnd.between(900, 1800), yoyo: true, repeat: -1, delay: rnd.between(0, 1200) });
    }
  }
  return c;
}

function dashed(g: Phaser.GameObjects.Graphics, a: Phaser.Math.Vector2, b: Phaser.Math.Vector2, dash = 4, gap = 6): void {
  const len = a.distance(b);
  const dir = b.clone().subtract(a).normalize();
  for (let d = 0; d < len; d += dash + gap) {
    const s = a.clone().add(dir.clone().scale(d));
    const e = a.clone().add(dir.clone().scale(Math.min(d + dash, len)));
    g.lineBetween(s.x, s.y, e.x, e.y);
  }
}

/** Destello de cuatro puntas (firma del design system). */
export function sparkle(scene: Phaser.Scene, x: number, y: number, r: number, color = tokenColor('star-gold')): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(color, 1);
  const k = r * 0.22;
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(k, -k); g.lineTo(r, 0); g.lineTo(k, k); g.lineTo(0, r); g.lineTo(-k, k); g.lineTo(-r, 0); g.lineTo(-k, -k);
  g.closePath();
  g.fillPath();
  return g;
}
