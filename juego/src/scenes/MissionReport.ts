import Phaser from 'phaser';
import { SCENES } from '../core/config';
import { state } from '../core/state';
import { drawStarfield } from '../core/starfield';
import { UiLayer, esc } from '../core/ui';
import { fadeIn, fadeTo } from '../core/fade';
import { MISSIONS, archiveFor, missionTasks, missionText, taskLabel } from '../data/missions';
import { achievementTitle } from '../data/achievements';
import { ENTRIES, entryText, type EntryId } from '../data/encyclopedia';
import { t, type TKey } from '../core/i18n';
import type { DeathCause } from '../sim/types';
import { taskProgress, type MissionSummary } from '../sim/simulation';
import { icon } from '../core/icons';
import { ACHIEVEMENT_ICON, MISSION_ICON, taskIcon } from '../core/iconMap';

const STAR = '<svg class="mn-star is-earned" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3C26 16 32 22 45 24C32 26 26 32 24 45C22 32 16 26 3 24C16 22 22 16 24 3Z"/></svg>';
const STAR_OFF = STAR.replace(' is-earned', '');

/** Qué enseña cada final: el error se explica con la causa real, sin castigar. La victoria se cuenta con lo que hizo el jugador (ver `wonLesson`). */
const LESSON_ENTRY: Record<DeathCause, EntryId> = { oxygen: 'algae-oxygen', food: 'algae-oxygen', mixed: 'algae-oxygen', radiation: 'moon-radiation', timeout: 'lunar-day' };
const WON_ENTRY: EntryId = 'donki';

/** Frase con número: usa la clave en singular o en plural según la cantidad (`{n}`). */
const counted = (one: TKey, many: TKey, n: number, vars: Record<string, number> = {}): string => t(n === 1 ? one : many, { n, ...vars });

/** Lección de la victoria armada con las decisiones de esta partida: salidas, bicicleta, llamaradas y radiación. */
function wonLesson(s: MissionSummary): string {
  const by = s.stats.actionsBy;
  const outings = (by.eva ?? 0) + (by.cleanDust ?? 0) + (by.cleanTestPanel ?? 0);
  const flares = s.stats.shelteredFlares + s.stats.unshieldedFlares;
  const parts = [counted('lesson.won.days.one', 'lesson.won.days.many', s.daysSurvived)];
  if (outings) parts.push(counted('lesson.won.outings.one', 'lesson.won.outings.many', outings));
  if (by.pedal) parts.push(counted('lesson.won.pedal.one', 'lesson.won.pedal.many', by.pedal));
  if (flares) {
    parts.push(counted('lesson.won.flares.one', 'lesson.won.flares.many', flares,
      { shielded: s.stats.shelteredFlares, dose: Math.round(s.stats.flareDose), outside: Math.round(s.stats.flareDoseOutside) }));
  }
  parts.push(t('lesson.won.radiation', { n: Math.round(s.resources.radiation) }));
  return parts.join(' ');
}

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
    const cause = s.cause ?? 'timeout';
    const lesson = s.won ? { text: wonLesson(s), entry: WON_ENTRY } : { text: t(`lesson.${cause}`), entry: LESSON_ENTRY[cause] };
    const entry = ENTRIES.find((e) => e.id === lesson.entry)!;
    const week = archiveFor(mission);

    const tasks = missionTasks(mission, !!r.training).map((t) => {
      const n = taskProgress(t, s.stats);
      return `<li class="mn-check ${n >= t.count ? 'is-done' : ''}"><span class="mn-check__box" aria-hidden="true">${n >= t.count ? icon('check') : ''}</span>
        <span class="mn-check__text">${icon(taskIcon(t))}${esc(taskLabel(t))}</span><span class="mn-check__meta">${n}/${t.count}</span></li>`;
    }).join('');

    fadeIn(this);
    drawStarfield(this, 'report', !state.calm);
    const achievements = r.newAchievements.length
      ? `<ul class="report__achievements" aria-label="${t('report.newAchievements')}">${r.newAchievements.map((id) => `<li class="mn-toast"><span class="mn-toast__medal" aria-hidden="true">${icon(ACHIEVEMENT_ICON[id])}</span><span class="mn-toast__title">${esc(achievementTitle(id))}</span></li>`).join('')}</ul>`
      : '';

    const ui = new UiLayer(this, /* html */ `
      <div class="report" data-report="${s.won ? 'won' : 'lost'}">
        <div class="mn-panel report__main">
          <h1 class="display-lg report__title">${s.won ? t('report.title.won') : cause === 'radiation' ? t('report.title.radiation') : t('report.title.lost')}</h1>
          <p class="mn-panel__body report__question">${icon(MISSION_ICON[mission.id])}${esc(missionText(mission.id, 'name'))}: ${esc(missionText(mission.id, 'question'))}</p>
          <ul class="mn-checklist report__tasks">${tasks}</ul>
          <div class="mn-stars report__stars" aria-label="${t('report.stars', { n: r.score.stars })}">${STAR.repeat(r.score.stars)}${STAR_OFF.repeat(3 - r.score.stars)}</div>
          <div class="report__stats">
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('report.score')}</span><span class="mn-telemetry__value" data-score>${r.score.score}</span></div>
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('report.days')}</span><span class="mn-telemetry__value">${s.daysSurvived}/${s.days}</span></div>
            <div class="mn-telemetry"><span class="mn-telemetry__label">${t('report.shielded')}</span><span class="mn-telemetry__value">${s.stats.shelteredFlares}/${s.stats.shelteredFlares + s.stats.unshieldedFlares}</span></div>
          </div>
          ${r.newBest ? `<p class="heading report__best">${t('report.best')}</p>` : ''}
          <h2 class="heading report__h">${t('report.learned')}</h2>
          <p class="mn-panel__body">${esc(lesson.text)}</p>
          <p class="report__source">${t('report.fact')} ${esc(entryText(entry.id, 'fact'))}. ${t('common.source')} <a href="${esc(entry.url)}" target="_blank" rel="noopener noreferrer">${esc(entryText(entry.id, 'source'))}</a></p>
          <p class="report__source">${esc(t('report.weather', { week: missionText(mission.id, 'tagline'), flares: week.flares.map((f) => f.classType).join(', ') || t('report.noFlares') }))}</p>
        </div>
        <aside class="report__side">
          ${achievements}
          ${r.training
            ? `<p class="mn-panel__body report__training">${t('report.training')}</p>
          <div class="report__buttons"><button class="mn-btn" data-action="select">${icon('play')}${t('tutorial.choose')}</button></div>`
            : `<div class="report__buttons">
            <button class="mn-btn" data-action="retry">${icon('retry')}${t('common.retry')}</button>
            <button class="mn-btn mn-btn--secondary" data-action="select">${icon('list')}${t('report.other')}</button>
            <button class="mn-btn mn-btn--secondary" data-action="menu">${icon('home')}${t('common.menu')}</button>
          </div>`}
        </aside>
      </div>`);
    ui.on('retry', () => fadeTo(this, SCENES.station)) // reintentar va directo a la estación: el despegue ya se vio
      .on('select', () => {
        if (r.training) { // fin del entrenamiento: se descarta la estación de práctica y se elige la primera misión
          state.training = false;
          state.loadout = null;
        }
        fadeTo(this, SCENES.select);
      })
      .on('menu', () => fadeTo(this, SCENES.menu));
    ui.focusFirst();
  }
}
