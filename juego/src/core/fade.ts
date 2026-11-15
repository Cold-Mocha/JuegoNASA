import Phaser from 'phaser';

export function fadeTo(scene: Phaser.Scene, key: string, ms = 300, data?: object): void {
  const cam = scene.cameras.main;
  cam.fadeOut(ms, 14, 11, 51);
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
}

export function fadeIn(scene: Phaser.Scene, ms = 300): void {
  scene.cameras.main.fadeIn(ms, 14, 11, 51);
}
