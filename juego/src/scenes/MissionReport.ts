import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { MISSIONS, archiveFor } from '../data/missions';
import { ACHIEVEMENTS } from '../data/achievements';
import { ENTRIES } from '../data/encyclopedia';
import { chapterFor } from '../data/chapters';
import type { DeathCause } from '../sim/types';
import { taskProgress } from '../sim/simulation';
import { icon } from '../core/icons';
import { localize, t } from '../core/i18n';
import { ACHIEVEMENT_ICON, MISSION_ICON, taskIcon } from '../core/iconMap';

const STAR = '<svg class="mn-star is-earned" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C26 16 32 22 45 24C32 26 26 32 24 45C22 32 16 26 3 24C16 22 22 16 24 3Z"/></svg>';
const STAR_OFF = STAR.replace(' is-earned', '');

/** Qué enseña cada final: el error se explica con la causa real, sin castigar. */
const LESSONS: Record<DeathCause | 'won', { text: string; entry: string }> = localize({
  oxygen: { text: 'Se acabó el oxígeno y la salud llegó a cero. Las máquinas de aire y las algas necesitan energía: si la energía falla, el oxígeno también.', entry: 'algae-oxygen' },
  food: { text: 'Se acabó la comida y la salud llegó a cero. En una base real, el invernadero y las raciones se planifican con días de anticipación.', entry: 'algae-oxygen' },
  mixed: { text: 'Faltaron varias cosas a la vez (oxígeno, comida o protección) y la salud llegó a cero. Revisar las barras con frecuencia evita que un problema arrastre a los otros.', entry: 'algae-oxygen' },
  radiation: { text: 'La radiación acumulada fue demasiada. La Luna no tiene aire ni campo magnético que la protejan: por eso las bases tienen paredes gruesas. Dentro de la nave estás a salvo, y el pronóstico del Sol te da tiempo de volver.', entry: 'moon-radiation' },
  timeout: { text: 'Se acabó el plazo antes de terminar la investigación. Planear el orden de las tareas ahorra camino y tiempo, como hacen los equipos de misión.', entry: 'lunar-day' },
  won: { text: 'Terminaste la investigación cuidando los recursos justo lo necesario para hacer ciencia de verdad en la Luna. Así trabajan los equipos de misión.', entry: 'donki' },
});

/** Fin de la jornada científica (investigación completa o no): tareas, puntaje, estrellas, logros y lo aprendido. */
export class MissionReportScene extends Phaser.Scene {
  constructor() {
    super(SCENES.report);
  }

  create(): void {
    const r = state.lastResult;
    if (!r) {
      this.scene.start(SCENES.menu);
      return;
    }
    const mission = MISSIONS.find((m) => m.id === r.loadout.mission)!;
    const s = r.summary;
    const lesson = LESSONS[s.won ? 'won' : (s.cause ?? 'timeout')];
    const entry = ENTRIES.find((e) => e.id === lesson.entry)!;
    const week = archiveFor(mission);
    const chapter = s.won ? chapterFor(mission.id) : undefined;
    const chapterHtml = chapter ? `<div class="report__chapter"><span class="mn-chip mn-chip--science">${t('Capítulo {n}', { n: chapter.number })} · ${esc(chapter.title)}</span>
          <p class="caption-mono">${t('Mensaje de la Tierra (RECREACIÓN: personaje ficticio)')}</p>
          <p class="mn-panel__body"><strong>${esc(chapter.from)}:</strong> ${esc(chapter.message)}</p>
          <p class="body-sm">🌙 ${esc(chapter.habitat)} · ${chapter.number}/4</p>
          <button class="mn-btn mn-btn--secondary mn-btn--sm" data-action="chapter" data-entry="${esc(chapter.entry)}">${icon('book')}${t('Leer la ficha real')}</button></div>` : '';

    const tasks = mission.tasks.map((task) => {
      const n = taskProgress(task, s.stats, s.science);
      return `<li class="mn-check ${n >= task.count ? 'is-done' : ''}"><span class="mn-check__box" aria-hidden="true">${n >= task.count ? icon('check') : ''}</span>
        <span class="mn-check__text">${icon(taskIcon(task))}${esc(task.label)}</span><span class="mn-check__meta">${n}/${task.count}</span></li>`;
    }).join('');

    fadeIn(this);
    drawStarfield(this, 'report', !state.calm);
    const achievements = r.newAchievements.length
      ? r.newAchievements.map((id) => `<li class="mn-toast"><span class="mn-toast__medal" aria-hidden="true">${icon(ACHIEVEMENT_ICON[id])}</span><span><span class="mn-toast__kicker">${t('Logro nuevo')}</span><br><span class="mn-toast__title">${esc(ACHIEVEMENTS[id].title)}</span></span></li>`).join('')
      : `<li class="body-sm report__muted">${t('Sin logros nuevos esta vez.')}</li>`;

    const ui = new UiLayer(this, /* html */ `
      <div class="report" data-report="${s.won ? 'won' : 'lost'}">
        <div class="mn-panel report__main">
          <span class="mn-chip ${s.won ? 'mn-chip--eva' : 'mn-chip--bonus'}">${s.won ? t('Investigación completa') : t('Investigación incompleta')}</span>
          <h1 class="display-lg report__title">${s.won ? t('¡De vuelta a la Tierra!') : t('Hay que volver a la Tierra')}</h1>
          <p class="mn-panel__body report__question">${icon(MISSION_ICON[mission.id])}${esc(mission.name)}: ${esc(mission.question)}</p>
          <ul class="mn-checklist report__tasks">${tasks}</ul>
          <div class="mn-stars report__stars" aria-label="${t('{n} de 3 estrellas', { n: r.score.stars })}">${STAR.repeat(r.score.stars)}${STAR_OFF.repeat(3 - r.score.stars)}</div>
          <div class="report__stats">
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('Puntaje')}</span><span class="mn-telemetry__value" data-score>${r.score.score}</span></div>
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('Tareas')}</span><span class="mn-telemetry__value">${s.tasksDone}/${s.tasksTotal}</span></div>
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('Días')}</span><span class="mn-telemetry__value">${s.daysSurvived}/${s.days}</span></div>
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('Llamaradas dentro de la nave')}</span><span class="mn-telemetry__value">${s.stats.shelteredFlares}/${s.stats.shelteredFlares + s.stats.unshieldedFlares}</span></div>
            ${s.stats.dna ? `<div class="mn-telemetry"><span class="mn-telemetry__label">${t('Circuito de ADN de papel')}</span><span class="mn-telemetry__value">${Math.round(s.stats.dna * 100)} %</span></div>` : ''}
            ${s.stats.probe ? `<div class="mn-telemetry"><span class="mn-telemetry__label">${t('Rocas lunares')}</span><span class="mn-telemetry__value">${s.stats.probeRocks}/8</span></div>
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('Carga entregada')}</span><span class="mn-telemetry__value">${s.stats.probeCargo}</span></div>` : ''}
          </div>
          ${r.newBest ? `<p class="heading report__best">${t('¡Nuevo récord en esta jornada!')}</p>` : ''}
          ${chapterHtml}
          ${s.won && s.stats.probe ? `<p class="body-sm report__chapter">${esc(t('Aquí Santiago. El eco era la sonda: su señal viene de muy lejos y llega con retraso. Gracias por traer las rocas. Se estudiarán en tierra; aún no sabemos qué dirán. [RECREACIÓN]'))}</p>
          <p class="caption-mono">${t('[DIBUJO] En la vida real casi nunca ves dos asteroides a la vez: el cinturón está casi vacío.')}</p>` : ''}
          <h2 class="heading report__h">${t('Lo que aprendiste')}</h2>
          <p class="mn-panel__body">${esc(lesson.text)}</p>
          <p class="caption-mono report__source">${t('DATO REAL')}: ${esc(entry.fact)}. ${t('Fuente')}: <a href="${esc(entry.url)}" target="_blank" rel="noopener noreferrer">${esc(entry.source)}</a></p>
          <p class="caption-mono report__source">${t('Clima solar real ({tagline})', { tagline: esc(mission.tagline.toLowerCase()) })}: ${week.flares.map((f) => esc(f.classType)).join(', ') || t('sin llamaradas fuertes')} ${t('(archivo histórico).')}</p>
        </div>
        <aside class="report__side">
          <ul class="report__achievements">${achievements}</ul>
          <div class="report__buttons">
            <button class="mn-btn" data-action="retry">${icon('retry')}${t('Reintentar')}</button>
            <button class="mn-btn mn-btn--secondary" data-action="select">${icon('list')}${t('Otra jornada')}</button>
            <button class="mn-btn mn-btn--secondary" data-action="menu">${icon('home')}${t('Menú')}</button>
          </div>
        </aside>
      </div>`);
    ui.on('chapter', (el) => fadeTo(this, SCENES.archive, 300, { from: SCENES.report, entry: el.dataset.entry }))
      .on('retry', () => fadeTo(this, SCENES.launch))
      .on('select', () => fadeTo(this, SCENES.select))
      .on('menu', () => fadeTo(this, SCENES.menu));
    ui.focusFirst();
  }
}
