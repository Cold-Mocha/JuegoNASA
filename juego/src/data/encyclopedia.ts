import type { RoomId } from '../sim/types';
import { t } from '../core/i18n';

/**
 * Archivo Científico: datos reales detrás de cada mecánica. Aquí van el orden, la categoría y el enlace; los textos, en data/locales.
 * Regla: cada ficha cita una fuente verificable: oficial (NASA, ESA, ESO, NOAA o artículo científico) o, para lo ocurrido en Chile, prensa o divulgación con fecha.
 * Las URLs se auditan con `npm run check:sources` (ver SOURCES.md).
 */
export type EntryCategory = 'luna' | 'sol' | 'vida' | 'misiones' | 'universo' | 'chile';

export type EntryId =
  | 'moon-gravity' | 'lunar-day' | 'moon-radiation' | 'moon-dust' | 'flare-classes'
  | 'donki' | 'sep-2017' | 'may-2024' | 'oct-2024' | 'solar-min'
  | 'water-shield' | 'body-in-space' | 'osdr' | 'algae-oxygen' | 'plants-space'
  | 'comm-delay' | 'mars-gravity' | 'artemis' | 'perseverance' | 'webb'
  | 'lagrange' | 'voyager' | 'kuiper' | 'trappist' | 'exoplanets'
  | 'chile-sky' | 'mataveri' | 'chile-auroras' | 'guina'
  | 'chile-artemis' | 'chile-seguimiento' | 'chile-act' | 'chile-arads' | 'chile-1960' | 'chile-tololo';

export interface Entry {
  id: EntryId;
  category: EntryCategory;
  url: string;
  room?: RoomId;       // sala donde aparece como "¿Sabías qué?"
}

/** `fact`: el dato, corto y con número · `text`: explicación para 7–12 años · `inGame`: cómo aparece en el juego · `source`: nombre de la fuente. */
export type EntryField = 'title' | 'fact' | 'text' | 'inGame' | 'source';
export const entryText = (id: EntryId, field: EntryField): string => t(`entry.${id}.${field}`);
export const categoryName = (category: EntryCategory): string => t(`category.${category}`);

export const ENTRIES: Entry[] = [
  { id: 'moon-gravity', category: 'luna', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
  { id: 'lunar-day', category: 'luna', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html', room: 'exterior' },
  { id: 'moon-radiation', category: 'luna', url: 'https://www.dlr.de/en/latest/news/2020/03/20200925_how-intense-and-dangerous-is-cosmic-radiation-on-the-moon', room: 'esclusa' },
  { id: 'moon-dust', category: 'luna', url: 'https://science.nasa.gov/moon/moon-dust/', room: 'exterior' },
  { id: 'flare-classes', category: 'sol', url: 'https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts' },
  { id: 'donki', category: 'sol', url: 'https://api.nasa.gov/', room: 'puente' },
  { id: 'sep-2017', category: 'sol', url: 'https://svs.gsfc.nasa.gov/12706' },
  { id: 'may-2024', category: 'sol', url: 'https://science.nasa.gov/science-research/heliophysics/how-nasa-tracked-the-most-intense-solar-storm-in-decades/' },
  { id: 'oct-2024', category: 'sol', url: 'https://science.nasa.gov/blogs/solar-cycle-25/2024/10/03/sun-releases-strong-solar-flare-6/' },
  { id: 'solar-min', category: 'sol', url: 'https://www.nasa.gov/news-release/solar-cycle-25-is-here-nasa-noaa-scientists-explain-what-that-means/' },
  { id: 'water-shield', category: 'vida', url: 'https://www.nasa.gov/humans-in-space/space-radiation/', room: 'esclusa' },
  { id: 'body-in-space', category: 'vida', url: 'https://www.nasa.gov/humans-in-space/the-human-body-in-space/', room: 'enfermeria' },
  { id: 'osdr', category: 'vida', url: 'https://osdr.nasa.gov/bio/', room: 'enfermeria' },
  { id: 'algae-oxygen', category: 'vida', url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/A_decade-long_quest_to_build_an_ecosystem_in_a_room', room: 'invernadero' },
  { id: 'plants-space', category: 'vida', url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/', room: 'invernadero' },
  { id: 'comm-delay', category: 'vida', url: 'https://www.nasa.gov/communicating-with-missions/', room: 'exterior' },
  { id: 'mars-gravity', category: 'universo', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html' },
  { id: 'artemis', category: 'misiones', url: 'https://www.nasa.gov/humans-in-space/artemis/' },
  { id: 'perseverance', category: 'misiones', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/', room: 'esclusa' },
  { id: 'webb', category: 'misiones', url: 'https://science.nasa.gov/mission/webb/' },
  { id: 'lagrange', category: 'universo', url: 'https://science.nasa.gov/resource/what-is-a-lagrange-point/' },
  { id: 'voyager', category: 'misiones', url: 'https://science.nasa.gov/mission/voyager/' },
  { id: 'kuiper', category: 'universo', url: 'https://science.nasa.gov/solar-system/kuiper-belt/' },
  { id: 'trappist', category: 'universo', url: 'https://science.nasa.gov/exoplanets/trappist1/' },
  { id: 'exoplanets', category: 'universo', url: 'https://exoplanetarchive.ipac.caltech.edu/' },
  { id: 'chile-sky', category: 'chile', url: 'https://www.eso.org/public/teles-instr/paranal-observatory/' },
  { id: 'mataveri', category: 'chile', url: 'https://www.upi.com/Archives/1987/08/17/Emergency-space-shuttle-landing-strip-opened/9293556171200/' },
  { id: 'chile-auroras', category: 'chile', url: 'https://www.meganoticias.cl/nacional/447271-tormenta-solar-auroras-australes-boreales-polares-punta-arenas-brk-10-5-2024.html' },
  { id: 'guina', category: 'chile', url: 'https://news.mongabay.com/2018/01/smallest-wild-cat-in-the-americas-faces-big-problems-but-hope-exists/' },
  // cooperación Chile–EE. UU. (capa «Laboratorio Chile»): cada capítulo y cada cartel de la estación lleva a una de estas
  { id: 'chile-artemis', category: 'chile', url: 'https://www.nasa.gov/news-release/nasa-welcomes-chile-as-newest-artemis-accords-signatory' },
  { id: 'chile-seguimiento', category: 'chile', url: 'https://www.nasa.gov/communicating-with-missions/history-of-the-networks/' },
  { id: 'chile-act', category: 'chile', url: 'https://lambda.gsfc.nasa.gov/product/act/' },
  { id: 'chile-arads', category: 'chile', url: 'https://www.nasa.gov/?p=427586' },
  { id: 'chile-1960', category: 'chile', url: 'https://history.state.gov/historicaldocuments/frus1958-60v05mSupp/ch_d37' },
  { id: 'chile-tololo', category: 'chile', url: 'https://noirlab.edu/public/about/timeline' },
];

/** Ficha "¿Sabías qué?" de una sala (la primera que la mencione). */
export const entryForRoom = (room: RoomId): Entry | undefined => ENTRIES.find((e) => e.room === room);
