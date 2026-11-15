import { createRng } from './rng';
/**
 * Fase C: «ADN de papel» y biofirmas (lógica pura, sin DOM).
 * [MODELO] Los porcentajes de costo son del juego, no mediciones. [REAL en concepto] La NASA diseña microbios (p. ej. levadura) para que fabriquen
 * nutrientes a pedido. Sin bioseguridad: un diseño malo solo rinde poco y nunca causa un desastre.
 */
export type Sensor = 'light' | 'radiation' | 'temperature';
export type Fn = 'pigment' | 'photosynthesis' | 'oxygen';
export type Switch = 'always' | 'onDetect';
export interface DnaDesign { sensor: Sensor; fn: Fn; sw: Switch; }
export interface DnaProblem { sensor: Sensor; fn: Fn; }

/** Cada jornada tiene su problema en el invernadero (la clave es el id de la investigación). */
export const DNA_PROBLEMS: Record<string, DnaProblem> = {
  'huerto-lunar': { sensor: 'light', fn: 'photosynthesis' },      // poca luz
  'paneles-solares': { sensor: 'radiation', fn: 'pigment' },      // pico de radiación (llamarada)
  'hielo-lunar': { sensor: 'temperature', fn: 'oxygen' },         // noche larga y frío
};

/** Carga metabólica de cada función para el alga; «solo cuando detecta» paga el 40 %. */
export const FN_COST: Record<Fn, number> = { pigment: 0.10, photosynthesis: 0.15, oxygen: 0.15 };
export const ON_DETECT_FACTOR = 0.4;
const MAX_COST = 0.15;

export const dnaCost = (d: DnaDesign): number => FN_COST[d.fn] * (d.sw === 'always' ? 1 : ON_DETECT_FACTOR);
/** La función solo ayuda si el sensor coincide con el problema («sentir → responder»). */
export const dnaFit = (d: DnaDesign, p: DnaProblem): number => (d.sensor !== p.sensor ? 0.15 : d.fn === p.fn ? 1 : 0.45);
export const dnaEfficiency = (d: DnaDesign): number => Math.max(0, Math.min(1, 1 - dnaCost(d) / MAX_COST));
/** 0,6 × ajuste al problema + 0,4 × eficiencia (menor costo). */
export const dnaScore = (d: DnaDesign, p: DnaProblem): number => 0.6 * dnaFit(d, p) + 0.4 * dnaEfficiency(d);
/** Multiplica la cosecha: entre 0,7 (diseño pobre) y 1,0. Un diseño malo rinde poco, nunca castiga más. */
export const dnaYield = (score: number): number => 0.7 + 0.3 * Math.max(0, Math.min(1, score));

// ------------------------------------------------------------------ biofirmas: tres pruebas independientes
export type BioTest = 'spectrum' | 'repeat' | 'control';
export const BIO_TESTS: readonly BioTest[] = ['spectrum', 'repeat', 'control'];
export interface BioSample {
  /** ¿La muestra tiene indicio biológico? (si no, son orgánicos sin vida, que también aparecen en el espectro) */
  alive: boolean;
  /** Resultado de cada prueba: true = «coincide» (apunta a vida). */
  result: Record<BioTest, boolean>;
  /** Cuántas huellas hay para elegir en el espectro y cuál es la correcta. */
  options: number;
  answer: number;
}

/**
 * [MODELO] Con vida: las tres pruebas coinciden. Sin vida: el espectro «coincide» igual (los orgánicos solos no prueban vida),
 * pero no se repite y no se distingue del control. Por eso una sola prueba no basta.
 * Nivel Ingeniero: más huellas para elegir en el espectro (4 en vez de 2).
 */
export function makeSample(seed: number, hard: boolean): BioSample {
  const rnd = createRng(seed);
  const alive = rnd() < 0.5;
  const options = hard ? 4 : 2;
  return { alive, result: { spectrum: true, repeat: alive, control: alive }, options, answer: Math.floor(rnd() * options) };
}

/** 0,5 × huella bien elegida + 0,3 × pruebas hechas antes de informar (máx. 3) + 0,2 × clasificación final correcta. */
export function bioScore(sample: BioSample, pickedPeak: number, testsDone: number, reportedAlive: boolean): number {
  return 0.5 * (pickedPeak === sample.answer ? 1 : 0) + 0.3 * (Math.min(3, testsDone) / 3) + 0.2 * (reportedAlive === sample.alive ? 1 : 0);
}
/** Informar con menos de dos pruebas da un aviso amistoso («falsa alarma posible»), sin castigo. */
export const needsMoreTests = (testsDone: number): boolean => testsDone < 2;
