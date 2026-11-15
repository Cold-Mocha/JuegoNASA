import Phaser from 'phaser';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/app.css';

import { GAME_WIDTH, GAME_HEIGHT } from './core/config';
import { BootScene } from './scenes/Boot';
import { MainMenuScene } from './scenes/MainMenu';
import { StoryScene } from './scenes/Story';
import { SelectScene } from './scenes/Select';
import { LaunchLoadingScene } from './scenes/LaunchLoading';
import { StationScene } from './scenes/Station';
import { EncyclopediaScene } from './scenes/Encyclopedia';
import { ReturnTripScene } from './scenes/ReturnTrip';
import { ReentryScene } from './scenes/Reentry';
import { MissionReportScene } from './scenes/MissionReport';
import { audio } from './core/audio';
import { state } from './core/state';
import { applyComfort } from './core/theme';
import { setLang } from './core/i18n';

applyComfort({ calm: state.calm, solid: state.settings.ultraLight });
setLang(state.settings.lang);

const game = new Phaser.Game({
  // Ultra Ligero usa el renderizador Canvas 2D: en equipos sin GPU (WebGL por software) rinde mucho mejor
  type: state.settings.ultraLight ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0e0b33',
  dom: { createContainer: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  fps: { target: 60, smoothStep: true },
  // GPU integrada: pedir el modo de bajo consumo y sin buffers extra
  render: { powerPreference: 'low-power', antialias: true, clearBeforeRender: true },
  banner: false,
  scene: [BootScene, MainMenuScene, StoryScene, SelectScene, LaunchLoadingScene, StationScene, EncyclopediaScene, ReturnTripScene, ReentryScene, MissionReportScene],
});

// El audio solo puede arrancar tras un gesto del jugador (política de autoplay de los navegadores).
const unlockAudio = (): void => {
  audio.unlock();
  audio.startMusic();
};
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

// Acceso de depuración solo en desarrollo
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
