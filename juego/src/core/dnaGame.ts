import { t } from './i18n';
import { BIO_TESTS, DNA_PROBLEMS, bioScore, dnaCost, dnaEfficiency, dnaFit, dnaScore, makeSample, needsMoreTests,
  type BioTest, type DnaDesign, type DnaProblem, type Fn, type Sensor, type Switch } from '../sim/dna';
import type { MiniGameHandle } from './miniGames';
/**
 * Fase C en DOM (sin Phaser): «Taller de ADN de papel» (armar → probar → ajustar) y «Biofirmas» (tres pruebas).
 * Cada pieza lleva forma + texto, no solo color (accesible).
 */
const W = 380;
const H = 500;
export { DNA_PROBLEMS };

const SENSORS: { id: Sensor; label: string; shape: string }[] = [
  { id: 'light', label: 'Luz', shape: '☀' }, { id: 'radiation', label: 'Radiación', shape: '☢' }, { id: 'temperature', label: 'Temperatura', shape: '🌡' },
];
const FNS: { id: Fn; label: string; shape: string }[] = [
  { id: 'pigment', label: 'Pigmento protector', shape: '◐' }, { id: 'photosynthesis', label: 'Fotosíntesis eficiente', shape: '❋' }, { id: 'oxygen', label: 'Burbujas de oxígeno', shape: '○' },
];
const SWITCHES: { id: Switch; label: string; shape: string }[] = [
  { id: 'always', label: 'Siempre encendido', shape: '●' }, { id: 'onDetect', label: 'Solo cuando detecta', shape: '◌' },
];
const PROBLEM_TEXT: Record<Sensor, string> = {
  light: 'Poca luz en el invernadero.', radiation: 'Llega un pico de radiación.', temperature: 'Noche larga y mucho frío.',
};
const piece = (kind: string, id: string, label: string, shape: string, on: boolean, hint: boolean): string =>
  `<button class="mn-btn mn-btn--sm" data-k="${kind}" data-id="${id}" aria-pressed="${on}" style="min-width:104px;min-height:48px;margin:3px;${on ? 'outline:3px solid #ffcb47;' : ''}${hint ? 'box-shadow:0 0 0 2px #5ad6b2;' : ''}">${shape} ${t(label)}</button>`;

export function mountDnaWorkshop(root: HTMLElement, opts: { mission: string; hard: boolean; onDone(score: number): void }): MiniGameHandle {
  const problem: DnaProblem = DNA_PROBLEMS[opts.mission] ?? DNA_PROBLEMS['huerto-lunar'];
  const design: Partial<DnaDesign> = {};
  let attempt = 1;
  let best = 0;
  let timer = 0;
  let dead = false;
  const full = (): boolean => !!(design.sensor && design.fn && design.sw);
  const render = (extra = ''): void => {
    const d = design as Partial<DnaDesign>;
    const cost = d.fn && d.sw ? Math.round(dnaCost(d as DnaDesign) * 100) : 0;
    root.innerHTML = `<div style="width:${W}px;height:${H}px;background:#18144e;color:#f5f5f2;border:4px solid #0e0b33;border-radius:14px;padding:10px;box-sizing:border-box;font:600 14px Arial,sans-serif;overflow:hidden">
      <div style="font-size:15px">🧬 ${t('ADN de papel')} · ${t('Intento {n} de 2', { n: attempt })}</div>
      <p style="margin:6px 0">${t(PROBLEM_TEXT[problem.sensor])}</p>
      <div>${t('Sensor')}: ${SENSORS.map((s) => piece('sensor', s.id, s.label, s.shape, d.sensor === s.id, !opts.hard && s.id === problem.sensor)).join('')}</div>
      <div>${t('Función')}: ${FNS.map((s) => piece('fn', s.id, s.label, s.shape, d.fn === s.id, false)).join('')}</div>
      <div>${t('Interruptor')}: ${SWITCHES.map((s) => piece('sw', s.id, s.label, s.shape, d.sw === s.id, false)).join('')}</div>
      <div style="margin-top:8px">${t('Costo para el alga')}: <b>${cost} %</b>${opts.hard ? '' : ' · ' + t('Lo que pide el problema está marcado.')}</div>
      <div style="height:12px;background:#0e0b33;border-radius:6px;margin:4px 0"><i style="display:block;height:100%;width:${cost / 0.15}%;max-width:100%;background:${cost > 10 ? '#ff7a59' : '#5ad6b2'};border-radius:6px"></i></div>
      ${extra}
      <button class="mn-btn" data-test ${full() ? '' : 'disabled'} style="margin-top:8px;min-height:52px;width:100%">${t('Probar el circuito')}</button></div>`;
    root.querySelectorAll<HTMLButtonElement>('[data-k]').forEach((b) => b.addEventListener('click', () => {
      (design as Record<string, string>)[b.dataset.k!] = b.dataset.id!;
      render();
    }));
    root.querySelector('[data-test]')?.addEventListener('click', () => { if (full()) test(); });
  };
  const test = (): void => {
    const d = design as DnaDesign;
    let sec = 0;
    const tick = (): void => {
      if (dead) return;
      sec++;
      const active = d.sw === 'always' || [2, 6, 10].some((e) => Math.abs(sec - e) <= 1);
      const responds = d.sensor === problem.sensor && active;
      root.innerHTML = `<div style="width:${W}px;height:${H}px;background:#18144e;color:#f5f5f2;border:4px solid #0e0b33;border-radius:14px;padding:14px;box-sizing:border-box;font:600 15px Arial,sans-serif">
        <div>🧪 ${t('Cápsula')} · ${sec}/12 s</div><p>${t(PROBLEM_TEXT[problem.sensor])}</p>
        ${[0, 1, 2].map(() => `<div style="height:26px;margin:10px 0;border-radius:6px;border:3px solid #0e0b33;background:${responds ? '#5ad6b2' : '#c4c2e0'};transition:background .2s"></div>`).join('')}
        <p>${responds ? t('El circuito responde.') : t('El circuito espera…')}</p></div>`;
      if (sec >= 12) { finishAttempt(); return; }
      timer = window.setTimeout(tick, 400); // 12 s de cápsula comprimidos a ~5 s de juego
    };
    tick();
  };
  const finishAttempt = (): void => {
    const d = design as DnaDesign;
    const score = dnaScore(d, problem);
    best = Math.max(best, score);
    const msg = `${t('Ajuste al problema')}: ${Math.round(dnaFit(d, problem) * 100)} % · ${t('Eficiencia')}: ${Math.round(dnaEfficiency(d) * 100)} %`;
    if (attempt >= 2) {
      root.innerHTML = `<div style="width:${W}px;height:${H}px;background:#18144e;color:#f5f5f2;border:4px solid #0e0b33;border-radius:14px;padding:14px;box-sizing:border-box;font:600 15px Arial,sans-serif"><p>${msg}</p><p>${t('Toda mejora le cuesta energía al alga.')}</p></div>`;
      timer = window.setTimeout(() => { if (!dead) opts.onDone(best); }, 1400);
      return;
    }
    attempt = 2;
    render(`<p>${msg}</p><button class="mn-btn mn-btn--secondary mn-btn--sm" data-keep>${t('Quedarme con este diseño')}</button>`);
    root.querySelector('[data-keep]')?.addEventListener('click', () => opts.onDone(best));
  };
  render();
  return { destroy() { dead = true; clearTimeout(timer); } };
}

const TEST_LABEL: Record<BioTest, string> = { spectrum: 'Espectro', repeat: 'Repetir la medición', control: 'Comparar con el control' };

export function mountBiofirmas(root: HTMLElement, opts: { hard: boolean; seed: number; onDone(score: number): void }): MiniGameHandle {
  const sample = makeSample(opts.seed, opts.hard);
  const done = new Set<BioTest>();
  let picked = -1;
  let warned = false;
  let timer = 0;
  let dead = false;
  const box = (inner: string): string => `<div style="width:${W}px;height:${H}px;background:#18144e;color:#f5f5f2;border:4px solid #0e0b33;border-radius:14px;padding:12px;box-sizing:border-box;font:600 14px Arial,sans-serif;overflow:hidden">${inner}</div>`;
  const render = (note = ''): void => {
    const specDone = done.has('spectrum');
    root.innerHTML = box(`
      <div>🔬 ${t('Muestra de hielo')}: ${t('¿hay indicio de vida?')}</div>
      <div style="margin:8px 0">${BIO_TESTS.map((k) => `<button class="mn-btn mn-btn--sm" data-test="${k}" ${done.has(k) || (k !== 'spectrum' && !specDone) ? 'disabled' : ''} style="min-height:46px;margin:3px">${done.has(k) ? '✔' : '▶'} ${t(TEST_LABEL[k])}</button>`).join('')}</div>
      ${specDone ? `<div>${t('Elige la huella que coincide con el espectro')}: ${Array.from({ length: sample.options }, (_, i) => `<button class="mn-btn mn-btn--sm" data-peak="${i}" aria-pressed="${picked === i}" style="min-width:64px;min-height:44px;margin:3px;${picked === i ? 'outline:3px solid #ffcb47;' : ''}">${['▲', '■', '●', '◆'][i]}</button>`).join('')}</div>` : ''}
      <div style="margin-top:8px">${[...done].map((k) => `<div>${sample.result[k] ? '🟢' : '🔴'} ${t(TEST_LABEL[k])}: ${sample.result[k] ? t('coincide') : t('no coincide')}</div>`).join('')}</div>
      <p style="min-height:36px">${note}</p>
      <button class="mn-btn" data-report="1" style="min-height:48px;width:100%;margin-top:4px">${t('Informar: hay un indicio')}</button>
      <button class="mn-btn mn-btn--secondary" data-report="0" style="min-height:48px;width:100%;margin-top:6px">${t('Informar: sin indicio')}</button>`);
    root.querySelectorAll<HTMLButtonElement>('[data-test]').forEach((b) => b.addEventListener('click', () => { done.add(b.dataset.test as BioTest); render(); }));
    root.querySelectorAll<HTMLButtonElement>('[data-peak]').forEach((b) => b.addEventListener('click', () => { picked = Number(b.dataset.peak); render(); }));
    root.querySelectorAll<HTMLButtonElement>('[data-report]').forEach((b) => b.addEventListener('click', () => report(b.dataset.report === '1')));
  };
  const report = (alive: boolean): void => {
    if (needsMoreTests(done.size) && !warned) {
      warned = true;
      render(t('Falsa alarma posible: una sola prueba no basta. Haz al menos dos.'));
      return;
    }
    const score = bioScore(sample, picked, done.size, alive);
    root.innerHTML = box(`<p>${alive ? t('Informaste: indicio.') : t('Informaste: sin indicio.')}</p>
      <p>${t('Nunca decimos «hay vida»: decimos «indicio» o «sin indicio». Los orgánicos solos no prueban vida; se necesitan varias pruebas independientes.')}</p>`);
    timer = window.setTimeout(() => { if (!dead) opts.onDone(score); }, 2200);
  };
  render();
  return { destroy() { dead = true; clearTimeout(timer); } };
}
