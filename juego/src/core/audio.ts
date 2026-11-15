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

/**
 * Ambientes de música: cada lugar del juego suena distinto. Todo es procedural (escalas pentatónicas: nunca suena «mal»).
 * `drone`: notas graves sostenidas · `scale`: notas de la melodía al azar · `every`: ms entre notas · `pulse`: bajo rítmico opcional.
 */
export type Mood = 'menu' | 'station' | 'greenhouse' | 'surface' | 'space' | 'moon' | 'launch' | 'casa';

interface MoodDef {
  drone: number[];
  scale: number[];
  every: number;
  wave: OscillatorType;
  dur: number;
  gain: number;
  pulse?: { freqs: number[]; every: number; wave: OscillatorType; gain: number };
}

const MOODS: Record<Mood, MoodDef> = {
  // menú y pantallas de lectura: Do mayor, tranquilo
  menu: { drone: [65.41, 98], scale: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33], every: 1500, wave: 'triangle', dur: 1.6, gain: 0.05 },
  // dentro de la nave: La menor, suave y lento (máquinas zumbando)
  station: { drone: [55, 82.41], scale: [220, 261.63, 293.66, 329.63, 392, 440], every: 1900, wave: 'sine', dur: 2.2, gain: 0.055 },
  // invernadero: Fa mayor, más luminoso y frecuente
  greenhouse: { drone: [87.31, 130.81], scale: [349.23, 392, 440, 523.25, 587.33, 698.46], every: 1100, wave: 'triangle', dur: 1.3, gain: 0.045 },
  // superficie lunar: vacío, notas agudas y escasas sobre un zumbido muy grave
  surface: { drone: [41.2, 61.74], scale: [587.33, 659.25, 783.99, 880, 987.77], every: 2700, wave: 'sine', dur: 3, gain: 0.04 },
  // la sonda en el cinturón: Mi menor con bajo que empuja (tensión)
  space: { drone: [41.2], scale: [329.63, 392, 440, 493.88, 587.33, 659.25], every: 420, wave: 'square', dur: 0.32, gain: 0.03,
    pulse: { freqs: [82.41, 82.41, 98, 73.42], every: 300, wave: 'sawtooth', gain: 0.05 } },
  // el rover: Sol mayor saltarín
  moon: { drone: [49], scale: [392, 440, 493.88, 587.33, 659.25, 783.99], every: 520, wave: 'triangle', dur: 0.45, gain: 0.045,
    pulse: { freqs: [98, 146.83], every: 520, wave: 'triangle', gain: 0.06 } },
  // despegue: grave que sube de a poco
  launch: { drone: [36.71, 55], scale: [146.83, 196, 220, 293.66, 329.63], every: 800, wave: 'sawtooth', dur: 0.9, gain: 0.03 },
  // regreso a casa: Do lidio, esperanzador
  casa: { drone: [65.41, 98], scale: [261.63, 329.63, 369.99, 392, 493.88, 523.25], every: 1000, wave: 'triangle', dur: 1.4, gain: 0.05 },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private pulseTimer: number | null = null;
  private drone: { osc: OscillatorNode; gain: GainNode }[] = [];
  private mood: Mood = 'menu';
  private playing = false;

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

  /** Música ambiente del lugar actual (ver MOODS). Se llama tras el primer gesto del jugador. */
  startMusic(): void {
    if (!this.ctx || !this.musicBus || this.playing) return;
    this.playing = true;
    this.startMood(this.mood);
  }

  /** Cambia el ambiente con un fundido corto; si la música aún no arrancó, queda guardado para cuando arranque. */
  setMood(mood: Mood): void {
    if (mood === this.mood) return;
    this.mood = mood;
    if (!this.playing) return;
    this.stopMood(0.8);
    this.startMood(mood);
  }

  stopMusic(): void {
    this.playing = false;
    this.stopMood(0.3);
  }

  private startMood(mood: Mood): void {
    if (!this.ctx || !this.musicBus) return;
    const ctx = this.ctx;
    const bus = this.musicBus;
    const m = MOODS[mood];
    const t0 = ctx.currentTime;
    this.drone = m.drone.map((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.06, t0 + 1.2); // entra de a poco
      osc.connect(gain).connect(bus);
      osc.start();
      return { osc, gain };
    });
    this.musicTimer = window.setInterval(() => {
      const f = m.scale[Math.floor(Math.random() * m.scale.length)];
      this.tone(bus, f, ctx.currentTime, m.dur, m.wave, m.gain);
    }, m.every);
    if (m.pulse) {
      const p = m.pulse;
      let i = 0;
      this.pulseTimer = window.setInterval(() => this.tone(bus, p.freqs[i++ % p.freqs.length], ctx.currentTime, p.every / 1000 * 0.8, p.wave, p.gain), p.every);
    }
  }

  /** Apaga el ambiente actual con un fundido de `fade` segundos (sin cortes bruscos). */
  private stopMood(fade: number): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    if (this.pulseTimer !== null) window.clearInterval(this.pulseTimer);
    this.musicTimer = null;
    this.pulseTimer = null;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const { osc, gain } of this.drone) {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fade);
      osc.stop(t + fade + 0.05);
      osc.onended = () => gain.disconnect();
    }
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
