import { t } from './i18n';
import { BIO_TESTS, DNA_PROBLEMS, STRAINS, bioScore, dnaCostFor, dnaEfficiencyFor, dnaFit, dnaScoreFor, makeSample, needsMoreTests,
  type BioTest, type DnaDesign, type DnaProblem, type Fn, type Sensor, type Strain, type StrainId, type Switch } from '../sim/dna';
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

const STRAIN_UI: Record<StrainId, { label: string; shape: string; trait: string }> = {
  brisa: { label: 'Brisa', shape: '☁', trait: 'Cepa Brisa: crece bien con poca luz y gasta poco; sufre con la radiación.' },
  escudo: { label: 'Escudo', shape: '⛨', trait: 'Cepa Escudo: aguanta la radiación; gasta lo normal.' },
  polar: { label: 'Polar', shape: '❄', trait: 'Cepa Polar: aguanta el frío; gasta un poco más.' },
};

export function mountDnaWorkshop(root: HTMLElement, opts: { mission: string; hard: boolean; onDone(score: number): void }): MiniGameHandle {
  const problem: DnaProblem = DNA_PROBLEMS[opts.mission] ?? DNA_PROBLEMS['huerto-lunar'];
  const design: Partial<DnaDesign> = {};
  let strain: Strain | undefined;
  let attempt = 1;
  let best = 0;
  let timer = 0;
  let dead = false;
  const full = (): boolean => !!(design.sensor && design.fn && design.sw && strain);
  const box = (inner: string, pad = 10): string => `<div style="width:${W}px;height:${H}px;background:#18144e;color:#f5f5f2;border:4px solid #0e0b33;border-radius:14px;padding:${pad}px;box-sizing:border-box;font:600 14px Arial,sans-serif;overflow:hidden">${inner}</div>`;
  const render = (extra = ''): void => {
    const d = design as Partial<DnaDesign>;
    const cost = d.fn && d.sw && strain ? Math.round(dnaCostFor(d as DnaDesign, strain) * 100) : 0;
    root.innerHTML = box(`
      <div style="font-size:15px">🧬 ${t('ADN de papel')} · ${t('Intento {n} de 2', { n: attempt })}</div>
      <p style="margin:4px 0">${t(PROBLEM_TEXT[problem.sensor])}</p>
      <div>${t('Cepa (¿qué microbio usas?)')}: ${STRAINS.map((s) => piece('strain', s.id, STRAIN_UI[s.id].label, STRAIN_UI[s.id].shape, strain?.id === s.id, !opts.hard && s.good === problem.sensor)).join('')}</div>
      <p style="margin:2px 0 4px;min-height:18px;font-size:12px;color:#cfeaff">${strain ? t(STRAIN_UI[strain.id].trait) : t('Cada cepa aguanta algo distinto: elige la que mejor sirve para el problema.')}</p>
      <div>${t('Sensor (¿qué detecta?)')}: ${SENSORS.map((s) => piece('sensor', s.id, s.label, s.shape, d.sensor === s.id, !opts.hard && s.id === problem.sensor)).join('')}</div>
      <div>${t('Función (¿qué hace?)')}: ${FNS.map((s) => piece('fn', s.id, s.label, s.shape, d.fn === s.id, false)).join('')}</div>
      <div>${t('Interruptor (¿cuándo?)')}: ${SWITCHES.map((s) => piece('sw', s.id, s.label, s.shape, d.sw === s.id, false)).join('')}</div>
      <div style="margin-top:6px">${t('Costo para el alga')}: <b>${cost} %</b>${opts.hard ? '' : ' · ' + t('Lo que pide el problema está marcado.')}</div>
      <div style="height:12px;background:#0e0b33;border-radius:6px;margin:4px 0"><i style="display:block;height:100%;width:${cost / 0.15}%;max-width:100%;background:${cost > 10 ? '#ff7a59' : '#5ad6b2'};border-radius:6px"></i></div>
      ${extra}
      <button class="mn-btn" data-test ${full() ? '' : 'disabled'} style="margin-top:6px;min-height:50px;width:100%">${t('Probar el circuito')}</button>`);
    root.querySelectorAll<HTMLButtonElement>('[data-k]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.k === 'strain') strain = STRAINS.find((x) => x.id === b.dataset.id);
      else (design as Record<string, string>)[b.dataset.k!] = b.dataset.id!;
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
      root.innerHTML = box(`
        <div>🧪 ${t('Cápsula')} · ${sec}/12 s</div><p>${t(PROBLEM_TEXT[problem.sensor])}</p>
        ${[0, 1, 2].map(() => `<div style="height:26px;margin:10px 0;border-radius:6px;border:3px solid #0e0b33;background:${responds ? '#5ad6b2' : '#c4c2e0'};transition:background .2s"></div>`).join('')}
        <p>${responds ? t('El circuito responde.') : t('El circuito espera…')}</p>`, 14);
      if (sec >= 12) { finishAttempt(); return; }
      timer = window.setTimeout(tick, 400); // 12 s de cápsula comprimidos a ~5 s de juego
    };
    tick();
  };
  /** Explica en una frase qué pasó, para que cada intento enseñe algo. */
  const reason = (d: DnaDesign, s: Strain): string => {
    if (d.sensor !== problem.sensor) return t('Tu sensor no detecta este problema: el circuito no se activó.');
    if (d.fn !== problem.fn) return t('Detectó el problema, pero esa función no lo resuelve.');
    if (s.good !== problem.sensor) return t('Funciona, pero esta cepa no es la más adecuada para este problema.');
    if (dnaCostFor(d, s) > 0.1) return t('Funciona, pero gasta mucha energía: prueba «Solo cuando detecta».');
    return t('Muy buen diseño: detecta, responde y ahorra energía.');
  };
  const finishAttempt = (): void => {
    const d = design as DnaDesign;
    const s = strain!;
    const score = dnaScoreFor(d, problem, s);
    best = Math.max(best, score);
    const msg = `${t('Ajuste al problema')}: ${Math.round(dnaFit(d, problem) * 100)} % · ${t('Eficiencia')}: ${Math.round(dnaEfficiencyFor(d, s) * 100)} %`;
    if (attempt >= 2) {
      root.innerHTML = box(`<p>${msg}</p><p>${reason(d, s)}</p><p>${t('Tomamos tu mejor intento.')}</p>`, 14);
      timer = window.setTimeout(() => { if (!dead) opts.onDone(best); }, 1800);
      return;
    }
    attempt = 2;
    render(`<p style="margin:2px 0">${msg}</p><p style="margin:2px 0;color:#cfeaff">${reason(d, s)}</p><button class="mn-btn mn-btn--secondary mn-btn--sm" data-keep>${t('Quedarme con este diseño')}</button>`);
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
