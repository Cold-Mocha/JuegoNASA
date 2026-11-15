import { state } from './state';

/**
 * Audio 100 % procedural con Web Audio API: cero archivos, cero latencia de carga.
 * El AudioContext se crea con el primer gesto del jugador (requisito de los navegadores).
 */
export type Sfx = 'click' | 'confirm' | 'error' | 'alarm' | 'achievement' | 'door' | 'thrust' | 'hurt' | 'jump' | 'radio' | 'day' | 'hit' | 'miss' | 'beat' | 'page';

type Note = [freq: number, start: number, dur: number, type?: OscillatorType, gain?: number];

const SFX: Record<Sfx, Note[]> = {
  click: [[660, 0, 0.05, 'square', 0.15]],
  confirm: [[523, 0, 0.08, 'triangle'], [784, 0.07, 0.12, 'triangle']],
  error: [[220, 0, 0.12, 'sawtooth', 0.15], [165, 0.1, 0.16, 'sawtooth', 0.15]],
  alarm: [[880, 0, 0.18, 'square', 0.18], [660, 0.2, 0.18, 'square', 0.18], [880, 0.4, 0.18, 'square', 0.18], [660, 0.6, 0.18, 'square', 0.18]],
  achievement: [[523, 0, 0.1, 'triangle'], [659, 0.1, 0.1, 'triangle'], [784, 0.2, 0.1, 'triangle'], [1047, 0.3, 0.3, 'triangle']],
  door: [[180, 0, 0.25, 'sine', 0.25], [120, 0.05, 0.3, 'sine', 0.2]],
  thrust: [[70, 0, 1.4, 'sawtooth', 0.12]],
  hurt: [[300, 0, 0.1, 'square', 0.2], [200, 0.08, 0.15, 'square', 0.2]],
  jump: [[330, 0, 0.12, 'sine', 0.2], [495, 0.06, 0.14, 'sine', 0.15]],
  radio: [[1200, 0, 0.04, 'square', 0.08], [900, 0.06, 0.04, 'square', 0.08], [1500, 0.12, 0.05, 'square', 0.08]],
  day: [[392, 0, 0.2, 'sine', 0.2], [523, 0.18, 0.35, 'sine', 0.2]],
  // minijuegos: acierto, error y tic de ritmo (cortos para no tapar el juego)
  hit: [[784, 0, 0.06, 'triangle', 0.2], [1175, 0.05, 0.09, 'triangle', 0.18]],
  miss: [[196, 0, 0.14, 'triangle', 0.22]],
  beat: [[1046, 0, 0.03, 'square', 0.07]],
  page: [[240, 0, 0.16, 'sawtooth', 0.035], [170, 0.06, 0.2, 'triangle', 0.04]], // pasar la hoja: un roce corto
};

/** Escala pentatónica (Do mayor) para la música ambiente: nunca suena “mal”, ideal para generar al azar. */
const PENTA = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private drone: OscillatorNode[] = [];

  /** Llamar desde un gesto del usuario (clic/tecla). Seguro de llamar muchas veces. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.sfxBus = this.ctx.createGain();
    this.musicBus = this.ctx.createGain();
    this.sfxBus.connect(this.ctx.destination);
    this.musicBus.connect(this.ctx.destination);
    this.applyVolumes();
  }

  applyVolumes(): void {
    if (!this.ctx || !this.sfxBus || !this.musicBus) return;
    this.sfxBus.gain.value = state.settings.sfxVolume;
    this.musicBus.gain.value = state.settings.musicVolume * 0.5;
  }

  play(name: Sfx): void {
    if (!this.ctx || !this.sfxBus || state.settings.sfxVolume <= 0) return;
    const t0 = this.ctx.currentTime;
    for (const [freq, start, dur, type = 'sine', gain = 0.3] of SFX[name]) this.tone(this.sfxBus, freq, t0 + start, dur, type, gain);
  }

  /** Sonido de voz de un personaje al «hablar» (una letra): pitido corto de tono casi igual, como en Undertale. */
  blip(base = 640): void {
    if (!this.ctx || !this.sfxBus || state.settings.sfxVolume <= 0) return;
    this.tone(this.sfxBus, base * (0.92 + Math.random() * 0.3), this.ctx.currentTime, 0.055, 'square', 0.07);
  }

  /** Música ambiente: un zumbido grave + notas suaves al azar (cada ~1,5 s). */
  startMusic(): void {
    if (!this.ctx || !this.musicBus || this.musicTimer !== null) return;
    const ctx = this.ctx;
    const bus = this.musicBus;
    this.drone = [65.41, 98].map((f) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.value = 0.06;
      o.connect(g).connect(bus);
      o.start();
      return o;
    });
    const step = (): void => {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)];
      this.tone(bus, f, ctx.currentTime, 1.6, 'triangle', 0.05);
    };
    this.musicTimer = window.setInterval(step, 1500);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.drone.forEach((o) => o.stop());
    this.drone = [];
  }

  private tone(bus: GainNode, freq: number, start: number, dur: number, type: OscillatorType, gain: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(bus);
    o.start(start);
    o.stop(start + dur + 0.02);
    o.onended = () => g.disconnect(); // libera nodos: sin fugas de memoria
  }
}

export const audio = new AudioEngine();
