/**
 * Efectos de pantalla de una tormenta solar: parpadeo de aviso, filtro de color según la intensidad
 * (amarillo, naranja, rojo) y estática de ruido blanco por milisegundos al impactar (la interferencia).
 * Todo se dibuja en una capa DOM sobre `host`; con `calm` no hay parpadeo ni estática, solo un tinte suave y fijo.
 */
export type FxLevel = 'minor' | 'moderate' | 'severe';

const COLOR: Record<FxLevel, string> = { minor: '255,210,63', moderate: '255,138,31', severe: '255,59,59' };
const ALPHA: Record<FxLevel, number> = { minor: 0.16, moderate: 0.26, severe: 0.38 };
/** Ráfagas de estática [duración, pausa] en ms: cuanto más intensa la llamarada, más interferencia. */
const BURSTS: Record<FxLevel, Array<[number, number]>> = {
  minor: [[160, 0]],
  moderate: [[200, 140], [120, 0]],
  severe: [[260, 120], [160, 100], [120, 0]],
};

export interface SolarFx {
  /** Aviso previo: el color de la intensidad parpadea unas veces y se apaga. */
  warn(level: FxLevel): void;
  /** Impacto: filtro de color mantenido + estática breve que se recupera. */
  start(level: FxLevel): void;
  /** Solo la interferencia (p. ej. el apagón de radio en la misión final). */
  interfere(level?: FxLevel): void;
  /** Quita el filtro de color. */
  end(): void;
  destroy(): void;
}

export function mountSolarFx(host: HTMLElement, calm: boolean): SolarFx {
  const layer = document.createElement('div');
  layer.className = 'sfx';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="sfx__tint"></div><canvas class="sfx__noise" width="128" height="72"></canvas>';
  host.appendChild(layer);
  const tint = layer.querySelector<HTMLElement>('.sfx__tint')!;
  const noise = layer.querySelector<HTMLCanvasElement>('.sfx__noise')!;
  const ctx = noise.getContext('2d');
  const timers: number[] = [];
  let hum = 0;

  const later = (fn: () => void, ms: number): void => { timers.push(window.setTimeout(fn, ms)); };
  const paint = (level: FxLevel, alpha: number): void => {
    tint.style.background = `radial-gradient(ellipse at center, rgba(${COLOR[level]},${alpha * 0.45}) 0%, rgba(${COLOR[level]},${alpha}) 100%)`;
  };
  const drawNoise = (): void => {
    if (!ctx) return;
    const img = ctx.createImageData(noise.width, noise.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };
  const burst = (ms: number): void => {
    noise.style.opacity = '0.55';
    drawNoise();
    hum = window.setInterval(drawNoise, 45);
    later(() => { window.clearInterval(hum); noise.style.opacity = '0'; }, ms);
  };
  const static_ = (level: FxLevel): void => {
    if (calm) return;
    let at = 0;
    for (const [ms, pause] of BURSTS[level]) { later(() => burst(ms), at); at += ms + pause; }
  };

  return {
    warn(level) {
      paint(level, ALPHA[level]);
      tint.classList.remove('is-blink', 'is-hold', 'is-fade');
      void tint.offsetWidth; // reinicia la animación
      tint.classList.add(calm ? 'is-fade' : 'is-blink');
      later(() => tint.classList.remove('is-blink', 'is-fade'), calm ? 1200 : 1500);
    },
    start(level) {
      paint(level, ALPHA[level]);
      tint.classList.remove('is-blink', 'is-fade');
      tint.classList.add('is-hold');
      static_(level);
    },
    interfere(level = 'moderate') { static_(level); },
    end() { tint.classList.remove('is-blink', 'is-hold'); tint.classList.add('is-fade'); later(() => tint.classList.remove('is-fade'), 900); },
    destroy() { timers.forEach((x) => window.clearTimeout(x)); window.clearInterval(hum); layer.remove(); },
  };
}
