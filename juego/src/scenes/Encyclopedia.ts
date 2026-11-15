import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { audio } from '../core/audio';
import { ENTRIES, categoryName, entryText } from '../data/encyclopedia';
import { DONKI_ARCHIVE } from '../data/donki-archive';
import { READER_GOAL } from '../sim/achievements';
import { achievementTitle } from '../data/achievements';
import { icon } from '../core/icons';
import { CATEGORY_ICON } from '../core/iconMap';
import { ARCHIVE_IMAGES } from '../data/archive-images';
import { t } from '../core/i18n';

interface ArchiveData { from?: string; entry?: string; }

/** Secciones (una por categoría) y fichas en orden: cada ficha es una doble página; las hojas son físicas (dos caras). */
const SECTIONS = [...new Set(ENTRIES.map((e) => e.category))];
const PAGES = SECTIONS.flatMap((c) => ENTRIES.filter((e) => e.category === c));
const LEAVES = PAGES.length - 1;       // la hoja k lleva a la derecha la ficha k y, al girar, a la izquierda la ficha k+1
const FLIP_MS = 950;
const STAGGER_MS = 110;                // desfase entre hojas en la cascada de pestañas
const CASCADE_MAX_MS = 1300;           // la cascada completa no pasa de esto, aunque haya muchas hojas
const TAB_STEP = 56;
const firstOf = (c: string): number => PAGES.findIndex((e) => e.category === c);

const CHILE_STAR = '<svg class="chile-star" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="3" fill="#1f3f9e" stroke="#0e0b33" stroke-width="2"/><path d="M12 4.5l2.2 4.9 5.3.6-3.9 3.6 1.1 5.3L12 16.2l-4.7 2.7 1.1-5.3-3.9-3.6 5.3-.6z" fill="#fff"/></svg>';

/** Esquema ilustrativo de las 66 antenas de ALMA (54 de 12 m y 12 de 7 m): posiciones en espiral, no las reales. */
const almaDiagram = (): string => {
  const dots = Array.from({ length: 66 }, (_, i) => {
    const small = i >= 54;
    const arm = i % 3;
    const r = 10 + Math.sqrt((i + 1) / 66) * 62;
    const a = (arm * 2 * Math.PI) / 3 + (r / 62) * 2.6 + (small ? 0.35 : 0);
    return `<circle cx="${(80 + Math.cos(a) * r).toFixed(1)}" cy="${(80 + Math.sin(a) * r).toFixed(1)}" r="${small ? 2.2 : 3.4}" fill="${small ? '#c8860a' : '#2a2140'}" stroke="#2a2140" stroke-width=".8"/>`;
  }).join('');
  return `<figure class="book__diagram"><svg viewBox="0 0 160 160" role="img" aria-label="${t('archive.diagram')}">
    <circle cx="80" cy="80" r="76" fill="rgba(42,33,64,.05)" stroke="#2a2140" stroke-width="1.2" stroke-dasharray="3 4"/>
    <circle cx="80" cy="80" r="46" fill="none" stroke="#2a2140" stroke-width=".6" stroke-dasharray="2 4" opacity=".5"/>${dots}</svg>
    <figcaption>${esc(t('archive.almaLegend'))}<br>${esc(t('archive.diagram'))}</figcaption></figure>`;
};

/** Fondo del espacio profundo: nebulosas suaves y constelaciones reales (Orión, la Cruz del Sur y la Osa Mayor), con estrellas y líneas punteadas. */
const SKY_SVG = (() => {
  const con = (stars: [number, number][], lines: [number, number][]): string =>
    `<g>${lines.map(([a, b]) => `<line x1="${stars[a][0]}" y1="${stars[a][1]}" x2="${stars[b][0]}" y2="${stars[b][1]}" stroke="#9fd8f5" stroke-opacity=".38" stroke-width="1.4" stroke-dasharray="3 6"/>`).join('')}${stars.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 3.4 : 2.4}" fill="#f5f5f2"/>`).join('')}</g>`;
  const orion = con([[770, 26], [846, 30], [782, 64], [806, 61], [830, 58], [776, 96], [850, 98]], [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1]]);
  const crux = con([[1060, 24], [1064, 98], [1028, 62], [1102, 56], [1088, 80]], [[0, 1], [2, 3]]);
  const dipper = con([[440, 50], [438, 92], [492, 98], [496, 62], [544, 50], [590, 62], [640, 86]], [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]]);
  return `<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">${orion}${crux}${dipper}</svg>`;
})();

/**
 * Archivo Científico como un libro de hojas 3D (estilo grimorio): cada hoja gira sobre el lomo con dos caras y su pestaña
 * va pegada al borde exterior (pasa de la derecha a la izquierda con ella). Al tocar una pestaña lejana, las hojas intermedias
 * se voltean en cascada. Eventos para sonido: `page-turn` (escena) y la clase `is-flying` en la hoja que vuela.
 */
export class EncyclopediaScene extends Phaser.Scene {
  private ui!: UiLayer;
  private from: string = SCENES.menu;
  private index = 0;                   // ficha a la vista = cantidad de hojas ya giradas
  private busy = 0;                    // hojas en vuelo
  private alive = true;
  private leaves: HTMLElement[] = [];
  private timers: number[] = [];

  constructor() {
    super(SCENES.archive);
  }

  create(data: ArchiveData): void {
    this.from = data?.from ?? SCENES.menu;
    if (this.from !== SCENES.station) audio.setMood('menu');
    this.alive = true;
    this.busy = 0;
    this.timers = [];
    const overlay = this.from === SCENES.station;
    if (!overlay) fadeIn(this);
    drawStarfield(this, 'archive', false);
    // todas las fotos se piden de una vez (las de las hojas lejanas no esperan a verse)
    [...PAGES.map((e) => e.id), 'chile-sky-alma'].forEach((id) => { const im = new Image(); im.src = `game/archive/${id}.jpg`; });
    const start = PAGES.findIndex((e) => e.id === data?.entry);
    this.index = start < 0 ? 0 : start;

    const leaves = Array.from({ length: LEAVES }, (_, k) => this.leafHtml(k)).join('');
    this.ui = new UiLayer(this, /* html */ `
      <div class="archive">
        <div class="archive__sky" aria-hidden="true">${SKY_SVG}<i class="sky__earth"></i></div>
        <header class="archive__head">
          <div><h1 class="display-lg archive__title">${t('archive.title')}</h1>
          <p class="body archive__subtitle">${t('archive.read')} <span data-read></span>/${ENTRIES.length}</p></div>
          <button class="mn-btn mn-btn--secondary" data-action="back">${t('common.back')}</button>
        </header>
        <div class="book-wrap" data-wrap>
          <div class="book" data-book>
            <div class="book__edge book__edge--left" data-edge-l></div>
            <div class="book__edge book__edge--right" data-edge-r></div>
            <div class="book__block">
              <section class="page page--left page--base" data-base-left>${this.leftPage(0)}</section>
              <section class="page page--right page--base" data-base-right>${this.rightPage(PAGES.length - 1)}</section>
              ${leaves}
              <div class="book__cast book__cast--left" data-cast-l></div>
              <div class="book__cast book__cast--right" data-cast-r></div>
              <div class="book__fold" aria-hidden="true"></div>
            </div>
          </div>
        </div>
        <p class="archive__note">${t('archive.note', { n: DONKI_ARCHIVE.length })}</p>
        <p class="sr-only" data-live aria-live="polite"></p>
      </div>`);
    this.leaves = [...this.ui.el.querySelectorAll<HTMLElement>('[data-leaf]')];
    // las fotos se decodifican desde el principio: así las de las hojas que aún no se ven no aparecen en blanco al girar
    this.ui.el.querySelectorAll<HTMLImageElement>('img').forEach((img) => void img.decode().catch(() => undefined));

    this.ui
      .on('back', () => this.back())
      .on('prev', () => this.goTo(this.index - 1))
      .on('next', () => this.goTo(this.index + 1))
      .on('tab', (el) => this.goTo(firstOf(el.dataset.cat!)));
    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.back());
    kb?.on('keydown-LEFT', () => this.goTo(this.index - 1));
    kb?.on('keydown-RIGHT', () => this.goTo(this.index + 1));
    kb?.on('keydown-PAGE_UP', () => this.goTo(this.index - 1));
    kb?.on('keydown-PAGE_DOWN', () => this.goTo(this.index + 1));
    if (!state.calm) { // un poco de parallax 3D del libro según el mouse
      const book = this.ui.q('[data-book]');
      this.ui.q('[data-wrap]').addEventListener('pointermove', (ev) => {
        const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
        book.style.setProperty('--px', (((ev.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
        book.style.setProperty('--py', (((ev.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
      });
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.alive = false; this.timers.forEach((id) => window.clearTimeout(id)); });
    this.applyStacks();
    this.settle();
  }

  // ---------- contenido de las páginas
  /** Foto con su crédito y licencia (clic en el crédito abre la página original). */
  private figure(key: string, alt: string): string {
    const im = ARCHIVE_IMAGES[key];
    if (!im) return '';
    return `<figure class="book__figure"><img src="game/archive/${key}.jpg" alt="${esc(alt)}">
      <figcaption><a href="${esc(im.url)}" target="_blank" rel="noopener noreferrer">${esc(im.credit)}</a> · ${esc(im.license)}</figcaption></figure>`;
  }

  /** Pie de cada página: número de página en la esquina exterior y «ficha k de n» en la interior. */
  private foot(i: number, side: 'left' | 'right'): string {
    const e = PAGES[i];
    const inSection = PAGES.filter((x) => x.category === e.category);
    return `<span class="book__section book__section--${side}">${t('archive.pageOf', { n: inSection.indexOf(e) + 1, total: inSection.length })}</span>
      <span class="book__num book__num--${side}">${t('archive.page', { n: i * 2 + (side === 'left' ? 1 : 2) })}</span>`;
  }

  private leftPage(i: number): string {
    const e = PAGES[i];
    const alma = e.id === 'chile-sky'; // la ficha de Chile abre con ALMA: su foto y un esquema de las antenas
    const chip = `<span class="mn-chip mn-chip--science">${icon(CATEGORY_ICON[e.category])}${esc(categoryName(e.category))}</span>`;
    if (alma) {
      return `<div class="page__in">${chip}
        <h2 class="book__title book__title--long">${esc(t('entry.chile-sky.almaTitle'))}</h2>
        <div class="book__rule" aria-hidden="true"><i></i></div>
        <div class="book__pair">${this.figure('chile-sky-alma', t('entry.chile-sky.almaTitle'))}${almaDiagram()}</div>
        <p class="book__desc">${esc(t('entry.chile-sky.almaText'))}</p>
        <p class="book__source">${t('archive.sourceLabel')} ${esc(t('entry.chile-sky.almaSource'))}</p>
        ${this.foot(i, 'left')}</div>`;
    }
    return `<div class="page__in">${chip}
      <h2 class="book__title">${esc(entryText(e.id, 'title'))}</h2>
      <div class="book__rule" aria-hidden="true"><i></i></div>
      ${this.figure(e.id, entryText(e.id, 'title'))}
      <p class="book__fact">${esc(entryText(e.id, 'fact'))}</p>
      ${this.foot(i, 'left')}</div>`;
  }

  private rightPage(i: number): string {
    const e = PAGES[i];
    return `<div class="page__in">
      <p class="book__text">${esc(entryText(e.id, 'text'))}</p>
      <div class="book__rule book__rule--thin" aria-hidden="true"><i></i></div>
      <p class="book__ingame"><strong>${t('archive.inGame')}</strong> ${esc(entryText(e.id, 'inGame'))}</p>
      ${e.id === 'chile-sky' ? this.figure('chile-sky', entryText(e.id, 'source')) : ''}
      <p class="book__source">${t('archive.sourceLabel')} <a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(entryText(e.id, 'source'))}</a></p>
      ${this.foot(i, 'right')}</div>`;
  }

  /** Una hoja: frente (derecha: ficha k) y dorso (izquierda: ficha k+1). La pestaña de la sección va pegada al borde exterior de cada cara. */
  private leafHtml(k: number): string {
    const sec = SECTIONS.findIndex((c) => firstOf(c) === k);
    const tab = (side: 'r' | 'l'): string => {
      if (sec < 0) return '';
      const cat = SECTIONS[sec];
      const chile = cat === 'chile'; // la solapa de Chile va aparte, abajo, de tela y con la estrella de la bandera
      return `<button class="tab tab--${side} tab--c${sec % 6} ${chile ? 'tab--chile' : ''}" style="--ty:${12 + sec * TAB_STEP}px" data-action="tab" data-cat="${cat}" aria-label="${esc(categoryName(cat))}" title="${esc(categoryName(cat))}">${chile ? CHILE_STAR : icon(CATEGORY_ICON[cat])}<span>${esc(t(`category.tab.${cat}`))}</span></button>`;
    };
    return `<div class="leaf" data-leaf="${k}" style="z-index:${PAGES.length - k}">
      <div class="leaf__face leaf__face--front"><section class="page page--right">${this.rightPage(k)}</section>${tab('r')}
        <button class="leaf__corner leaf__corner--r" data-action="next" aria-label="${t('archive.next')}"></button></div>
      <div class="leaf__face leaf__face--back"><section class="page page--left">${this.leftPage(k + 1)}</section>${tab('l')}
        <button class="leaf__corner leaf__corner--l" data-action="prev" aria-label="${t('archive.prev')}"></button></div>
    </div>`;
  }

  // ---------- pila de hojas
  private restZ(k: number, turned: boolean): number {
    return turned ? k + 1 : PAGES.length - k;
  }

  /** Estado de reposo: hojas giradas a la izquierda, el resto a la derecha; grosor de cada bloque según las hojas que tiene. */
  private applyStacks(): void {
    this.leaves.forEach((leaf, k) => {
      const turned = k < this.index;
      leaf.classList.toggle('is-turned', turned);
      leaf.classList.toggle('is-top', k === this.index || k === this.index - 1);
      leaf.style.zIndex = String(this.restZ(k, turned));
    });
    this.updateEdges();
  }

  /** Canto de las hojas: el bloque de la izquierda crece al avanzar y el de la derecha se adelgaza. */
  private updateEdges(): void {
    const turned = this.leaves.filter((l) => l.classList.contains('is-turned')).length;
    const width = (n: number): string => `${(2 + (n / Math.max(1, LEAVES)) * 26).toFixed(1)}px`;
    this.ui.q('[data-edge-l]').style.width = width(turned);
    this.ui.q('[data-edge-r]').style.width = width(LEAVES - turned);
  }

  // ---------- navegación
  /** Va a la ficha `target`: una hoja con giro normal, o varias en cascada con un pequeño desfase. */
  private goTo(target: number): void {
    const t0 = Math.max(0, Math.min(PAGES.length - 1, target));
    if (this.busy > 0 || t0 === this.index) return;
    const dir = t0 > this.index ? 1 : -1;
    const ks = dir > 0 ? range(this.index, t0 - 1, 1) : range(this.index - 1, t0, -1);
    this.index = t0;
    const gap = Math.min(STAGGER_MS, CASCADE_MAX_MS / Math.max(1, ks.length));
    ks.forEach((k, n) => this.flip(k, dir, n * gap));
  }

  /** Gira la hoja k: se eleva sobre ambos bloques, se arquea un poco, proyecta sombra y se posa del otro lado (z-index de reposo al terminar). */
  private flip(k: number, dir: 1 | -1, delay: number): void {
    this.busy++;
    const leaf = this.leaves[k];
    const rest = (): void => {
      leaf.style.transition = 'none';
      leaf.classList.toggle('is-turned', dir > 0);
      leaf.classList.remove('is-flying');
      leaf.style.zIndex = String(this.restZ(k, dir > 0));
      void leaf.offsetWidth;
      leaf.style.transition = '';
      this.leaves.forEach((l, i) => l.classList.toggle('is-top', i === this.index || i === this.index - 1));
      this.updateEdges();
      if (--this.busy === 0) this.settle();
    };
    this.timers.push(window.setTimeout(() => {
      if (!this.alive) return;
      audio.play('page');
      this.events.emit('page-turn', { leaf: k, dir });
      if (state.calm || typeof leaf.animate !== 'function') return rest();
      leaf.classList.add('is-flying');
      leaf.style.zIndex = '1000';
      const bend = dir > 0 ? -2.6 : 2.6;
      const from = dir > 0 ? 0 : -180;
      const to = dir > 0 ? -180 : 0;
      const opts: KeyframeAnimationOptions = { duration: FLIP_MS, easing: 'cubic-bezier(.45, .05, .2, 1)', fill: 'both' };
      const anim = leaf.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(-90deg) skewY(${bend}deg) scaleX(.985)`, offset: 0.5 }, { transform: `rotateY(${to}deg)` }], opts);
      const first = dir > 0 ? '[data-cast-r]' : '[data-cast-l]';
      const second = dir > 0 ? '[data-cast-l]' : '[data-cast-r]';
      const cast = (sel: string, keys: Keyframe[]): void => void this.ui.q(sel).animate(keys, { duration: FLIP_MS, easing: 'linear' });
      cast(first, [{ opacity: 0 }, { opacity: 0.6, offset: 0.3 }, { opacity: 0, offset: 0.55 }, { opacity: 0 }]);
      cast(second, [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 0.5, offset: 0.72 }, { opacity: 0 }]);
      void anim.finished.then(() => { anim.cancel(); rest(); }).catch(() => rest());
    }, delay));
  }

  /** La hoja se asienta: se marca la ficha como leída, se actualizan los contadores y el contenido «se escribe» como tinta. */
  private settle(): void {
    const e = PAGES[this.index];
    const count = state.markRead(e.id);
    this.ui.q('[data-read]').textContent = String(count);
    this.ui.q('[data-live]').textContent = entryText(e.id, 'title');
    this.leaves.forEach((leaf) => {
      const tab = leaf.querySelectorAll<HTMLElement>('.tab');
      tab.forEach((b) => b.classList.toggle('is-done', ENTRIES.filter((x) => x.category === b.dataset.cat).every((x) => state.progress.readEntries.includes(x.id))));
    });
    if (count >= READER_GOAL && state.unlock(['reader']).length) {
      audio.play('achievement');
      this.ui.q('.archive__note').textContent = t('archive.unlocked', { title: achievementTitle('reader') });
    }
  }

  private back(): void {
    if (this.from === SCENES.station) {
      this.scene.resume(SCENES.station);
      this.scene.stop();
      return;
    }
    fadeTo(this, SCENES.menu);
  }
}

/** Enteros de `a` a `b` (incluidos) con paso 1 o −1. */
function range(a: number, b: number, step: 1 | -1): number[] {
  const out: number[] = [];
  for (let i = a; step > 0 ? i <= b : i >= b; i += step) out.push(i);
  return out;
}
