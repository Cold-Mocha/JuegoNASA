import type { RoomId } from '../sim/types';
import { localize } from '../core/i18n';

/**
 * Archivo Científico / ¿Sabías qué?: datos reales detrás de cada mecánica.
 * Regla: cada ficha cita una fuente oficial verificable (NASA, ESA, NOAA o artículo científico).
 * Las URLs se auditan con `npm run check:sources` (ver SOURCES.md).
 */
export type EntryCategory = 'luna' | 'sol' | 'vida' | 'misiones' | 'universo' | 'chile';

export interface Entry {
  id: string;
  category: EntryCategory;
  title: string;
  fact: string;        // el dato, corto y con número
  text: string;        // explicación para 7–12 años
  inGame: string;      // cómo aparece en el juego
  source: string;
  url: string;
  room?: RoomId;       // sala donde aparece como "¿Sabías qué?"
}

export const CATEGORIES: Record<EntryCategory, string> = localize({
  luna: 'La Luna',
  sol: 'El Sol',
  vida: 'Vivir en el espacio',
  misiones: 'Misiones reales',
  universo: 'Más allá',
  chile: 'Chile y EE. UU.',
});

export const ENTRIES: Entry[] = localize([
  {
    id: 'moon-gravity', category: 'luna', title: 'Gravedad lunar',
    fact: '1,62 m/s² (la Tierra: 9,81 m/s²)',
    text: 'En la Luna pesas como un sexto de lo que pesas en la Tierra. Por eso los astronautas del Apolo avanzaban a saltitos.',
    inGame: 'Presiona Espacio: tu michi salta con la gravedad real de la Luna.',
    source: 'NASA, Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
  },
  {
    id: 'lunar-day', category: 'luna', title: 'Un día lunar dura un mes',
    fact: '≈ 29,5 días terrestres de amanecer a amanecer',
    text: 'Casi en toda la Luna hay unas dos semanas de sol seguidas y luego unas dos semanas de noche. Sin sol, los paneles solares no producen nada.',
    inGame: 'Las 7 jornadas son ese ciclo comprimido: 3 de día, 1 de atardecer y 3 de noche.',
    source: 'NASA, Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html', room: 'exterior',
  },
  {
    id: 'moon-radiation', category: 'luna', title: 'Radiación en la superficie lunar',
    fact: '1 369 µSv por día (en la ISS: 731 µSv)',
    text: 'La Luna no tiene aire ni campo magnético que la proteja. El módulo chino Chang’e 4 midió que allí la radiación es unas 200 veces mayor que en la superficie de la Tierra.',
    inGame: 'La barra de radiación sube un poco cada jornada, aunque no haya llamaradas.',
    source: 'Zhang et al. 2020, Science Advances (vía DLR)', url: 'https://www.dlr.de/en/latest/news/2020/03/20200925_how-intense-and-dangerous-is-cosmic-radiation-on-the-moon', room: 'esclusa',
  },
  {
    id: 'moon-dust', category: 'luna', title: 'Polvo lunar',
    fact: 'Granos filosos que se pegan a todo',
    text: 'El polvo de la Luna (regolito) no se desgasta con viento ni agua, así que sus granos son filosos. Los astronautas del Apolo lo encontraban pegado en trajes y equipos.',
    inGame: 'En la Luna real el polvo tapa los paneles; en el juego lo dejamos fuera para que sea más simple.',
    source: 'NASA Science, Moon Dust', url: 'https://science.nasa.gov/moon/moon-dust/', room: 'exterior',
  },
  {
    id: 'flare-classes', category: 'sol', title: 'Clases de llamaradas',
    fact: 'A, B, C, M y X: cada letra es 10 veces más fuerte',
    text: 'Una llamarada es un destello enorme del Sol. Se clasifica por sus rayos X: una X1 es diez veces más fuerte que una M1, y una X9 es nueve veces más fuerte que una X1.',
    inGame: 'Cuanto mayor es la clase de la llamarada, más sube tu radiación si estás afuera de la nave.',
    source: 'NOAA SWPC, Solar Flares', url: 'https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts',
  },
  {
    id: 'donki', category: 'sol', title: 'DONKI: el diario del clima espacial',
    fact: 'Base de datos de clima espacial de la NASA',
    text: 'DONKI guarda cada llamarada, eyección de masa coronal y tormenta de partículas que detectan los científicos de la NASA. Las misiones del juego usan semanas reales de ese archivo.',
    inGame: 'Cada llamarada del juego es una llamarada real, con su fecha y hora. Son datos históricos, no en vivo.',
    source: 'NASA Open APIs, DONKI', url: 'https://api.nasa.gov/', room: 'puente',
  },
  {
    id: 'sep-2017', category: 'sol', title: 'La tormenta de septiembre de 2017',
    fact: 'X9.3 el 6 de sept. y X8.2 el 10 de sept.',
    text: 'En pocos días, una sola mancha solar lanzó varias llamaradas X. La del 10 de septiembre trajo además una tormenta de partículas que llegó hasta la superficie de la Tierra.',
    inGame: 'Misión “Septiembre furioso”.',
    source: 'NASA Scientific Visualization Studio', url: 'https://svs.gsfc.nasa.gov/12706',
  },
  {
    id: 'may-2024', category: 'sol', title: 'La gran tormenta de mayo de 2024',
    fact: 'La tormenta geomagnética más intensa en unos 20 años',
    text: 'La región 13664 lanzó llamaradas X durante una semana entera. En la Tierra se vieron auroras en lugares donde casi nunca aparecen.',
    inGame: 'Misión “Tormenta de mayo”.',
    source: 'NASA Science, Heliophysics', url: 'https://science.nasa.gov/science-research/heliophysics/how-nasa-tracked-the-most-intense-solar-storm-in-decades/',
  },
  {
    id: 'oct-2024', category: 'sol', title: 'La llamarada X9.0',
    fact: '3 de octubre de 2024, 12:18 UTC',
    text: 'Fue la llamarada más fuerte en siete años. El observatorio SDO de la NASA la fotografió mientras ocurría.',
    inGame: 'Misión “Doble destello”.',
    source: 'NASA Science, Solar Cycle 25 blog', url: 'https://science.nasa.gov/blogs/solar-cycle-25/2024/10/03/sun-releases-strong-solar-flare-6/',
  },
  {
    id: 'solar-min', category: 'sol', title: 'El Sol también descansa',
    fact: 'Ciclo de ~11 años; mínimo en diciembre de 2019',
    text: 'La actividad del Sol sube y baja en ciclos de unos 11 años. En el mínimo casi no hay manchas ni llamaradas.',
    inGame: 'Misión “Sol dormilón”, ideal para practicar.',
    source: 'NASA, Solar Cycle 25 Is Here', url: 'https://www.nasa.gov/news-release/solar-cycle-25-is-here-nasa-noaa-scientists-explain-what-that-means/',
  },
  {
    id: 'water-shield', category: 'vida', title: 'Escudos contra la radiación',
    fact: 'Los materiales con mucho hidrógeno, como el agua, frenan bien la radiación',
    text: 'Los científicos estudian cómo proteger a los astronautas en viajes largos. Un refugio con paredes gruesas, por ejemplo de agua, es una buena opción durante una tormenta solar.',
    inGame: 'Dentro de la nave las paredes dejan pasar solo el 10 % de la radiación.',
    source: 'NASA, Space Radiation', url: 'https://www.nasa.gov/humans-in-space/space-radiation/', room: 'esclusa',
  },
  {
    id: 'body-in-space', category: 'vida', title: 'El cuerpo en el espacio',
    fact: 'Con menos gravedad, huesos y músculos se debilitan',
    text: 'En el espacio los huesos pierden fuerza si no hacen ejercicio. La NASA estudia la salud de los astronautas, y sus datos están abiertos en el repositorio OSDR.',
    inGame: 'En la Enfermería puedes leer cómo cambia el cuerpo en la Luna.',
    source: 'NASA, The Human Body in Space', url: 'https://www.nasa.gov/humans-in-space/the-human-body-in-space/', room: 'enfermeria',
  },
  {
    id: 'osdr', category: 'vida', title: 'Datos abiertos de biología espacial',
    fact: 'OSDR: repositorio de ciencia biológica espacial de la NASA',
    text: 'Allí se guardan experimentos con plantas, microbios, ratones y astronautas para que cualquier científico pueda estudiarlos.',
    inGame: 'El límite de radiación del juego se inspira en estos estudios.',
    source: 'NASA, Open Science Data Repository', url: 'https://osdr.nasa.gov/bio/', room: 'enfermeria',
  },
  {
    id: 'algae-oxygen', category: 'vida', title: 'Algas que fabrican oxígeno',
    fact: 'El proyecto MELiSSA de la ESA usa microalgas',
    text: 'Las algas usan luz y el CO₂ que exhalamos para crecer y liberar oxígeno. La ESA probó un sistema así que mantuvo con aire a “tripulaciones” de ratas por meses.',
    inGame: 'En el invernadero, las algas dan aire y comida: un poco al instante y más al terminar el día.',
    source: 'ESA, MELiSSA', url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/A_decade-long_quest_to_build_an_ecosystem_in_a_room', room: 'invernadero',
  },
  {
    id: 'plants-space', category: 'vida', title: 'Huertos espaciales',
    fact: 'En la ISS ya se cultivaron lechugas',
    text: 'La NASA cultiva plantas en la Estación Espacial para aprender a producir comida fresca en viajes largos.',
    inGame: 'El invernadero, afuera de la nave.',
    source: 'NASA, Growing Plants in Space', url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/', room: 'invernadero',
  },
  {
    id: 'comm-delay', category: 'vida', title: 'Mensajes que tardan',
    fact: 'Luna: ~1,3 s por sentido; Marte: de 3 a 22 minutos',
    text: 'Las señales de radio viajan a la velocidad de la luz, pero las distancias son enormes. Hablar con la Tierra desde Marte es como mandar una carta, no como una llamada.',
    inGame: 'La antena y el pronóstico responden después de ~2,6 s: la ida y vuelta real a la Luna.',
    source: 'NASA, Communicating with Missions', url: 'https://www.nasa.gov/communicating-with-missions/', room: 'comunicaciones',
  },
  {
    id: 'mars-gravity', category: 'universo', title: 'Gravedad de Marte',
    fact: '3,72 m/s², un poco más de un tercio de la terrestre',
    text: 'Marte es más pequeño que la Tierra. Allí saltarías más alto que en casa, pero menos que en la Luna.',
    inGame: 'Próximo destino de la campaña: de la Luna a Marte.',
    source: 'NASA, Mars Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
  },
  {
    id: 'artemis', category: 'misiones', title: 'Programa Artemis',
    fact: 'La NASA vuelve a la Luna para quedarse',
    text: 'Artemis busca llevar astronautas a la Luna, incluida la primera mujer, y aprender a vivir allí antes de viajar a Marte.',
    inGame: 'La Estación Central imagina una base así, pero es ficticia.',
    source: 'NASA, Artemis', url: 'https://www.nasa.gov/humans-in-space/artemis/',
  },
  {
    id: 'perseverance', category: 'misiones', title: 'Perseverance',
    fact: 'Llegó al cráter Jezero, en Marte, el 18 de febrero de 2021',
    text: 'Este róver busca señales de vida antigua y guarda muestras de roca que una misión futura podría traer a la Tierra.',
    inGame: 'Como tus muestras de hielo en la superficie: recoger muestras es ciencia.',
    source: 'NASA Science, Mars 2020', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/', room: 'esclusa',
  },
  {
    id: 'webb', category: 'misiones', title: 'Telescopio James Webb',
    fact: 'Observa desde el punto de Lagrange L2, a 1,5 millones de km',
    text: 'Webb mira el universo en luz infrarroja. Trabaja lejos de la Tierra, en un punto donde puede mantenerse sin gastar casi combustible.',
    inGame: 'Archivo: más allá de la Luna.',
    source: 'NASA Science, Webb', url: 'https://science.nasa.gov/mission/webb/',
  },
  {
    id: 'lagrange', category: 'universo', title: 'Puntos de Lagrange',
    fact: '5 puntos de equilibrio entre dos astros',
    text: 'En estos lugares, la gravedad del Sol y la de la Tierra se equilibran con el movimiento de la nave. Son como estacionamientos en el espacio.',
    inGame: 'Archivo: más allá de la Luna.',
    source: 'NASA Science, What is a Lagrange Point?', url: 'https://science.nasa.gov/resource/what-is-a-lagrange-point/',
  },
  {
    id: 'voyager', category: 'misiones', title: 'Voyager 1',
    fact: 'Entró al espacio interestelar el 25 de agosto de 2012',
    text: 'Lanzada en 1977, es el objeto hecho por humanos más lejano. Sus mensajes tardan más de un día en llegar a la Tierra.',
    inGame: 'Archivo: más allá de la Luna.',
    source: 'NASA Science, Voyager', url: 'https://science.nasa.gov/mission/voyager/',
  },
  {
    id: 'kuiper', category: 'universo', title: 'Cinturón de Kuiper',
    fact: 'Una región helada más allá de Neptuno',
    text: 'Allí giran miles de mundos pequeños y helados, como Plutón. Es como un gran anillo de restos de cuando se formó el sistema solar.',
    inGame: 'Archivo: más allá de la Luna.',
    source: 'NASA Science, Kuiper Belt', url: 'https://science.nasa.gov/solar-system/kuiper-belt/',
  },
  {
    id: 'trappist', category: 'universo', title: 'TRAPPIST-1',
    fact: '7 planetas rocosos alrededor de una estrella pequeña',
    text: 'Está a unos 40 años luz. Varios de sus planetas están a una distancia de su estrella en la que podría haber agua líquida.',
    inGame: 'Archivo: más allá de la Luna.',
    source: 'NASA Science, TRAPPIST-1', url: 'https://science.nasa.gov/exoplanets/trappist1/',
  },
  {
    id: 'exoplanets', category: 'universo', title: 'Exoplanetas',
    fact: 'Más de 6 000 confirmados',
    text: 'Un exoplaneta es un planeta que gira alrededor de otra estrella. La NASA mantiene un archivo público con todos los confirmados.',
    inGame: 'Archivo: más allá de la Luna.',
    source: 'NASA Exoplanet Archive', url: 'https://exoplanetarchive.ipac.caltech.edu/',
  },
  // ---- Chile y EE. UU. (hechos reales de cooperación; cada ficha cita su fuente oficial) ----
  {
    id: 'chile-artemis', category: 'chile', title: 'Chile y los Acuerdos Artemis',
    fact: 'Chile firmó el 25 de octubre de 2024: país n.º 47',
    text: 'Los Acuerdos Artemis son principios para que los países cooperen al explorar el espacio de forma segura y responsable, compartiendo datos científicos. Chile los firmó en la sede de la NASA, en Washington.',
    inGame: 'La Estación Central es ficticia, pero Artemis y estos acuerdos son reales.',
    source: 'NASA, Chile signs the Artemis Accords', url: 'https://www.nasa.gov/news-release/nasa-welcomes-chile-as-newest-artemis-accords-signatory',
  },
  {
    id: 'chile-seguimiento', category: 'chile', title: 'Una antena en Chile para seguir satélites',
    fact: 'Red Minitrack: 10 estaciones, de Santiago a Grand Turk',
    text: 'Al comenzar la era espacial, EE. UU. armó una red de antenas para seguir satélites, y una de sus estaciones estaba en Santiago de Chile. En 1958 la NASA heredó esa red.',
    inGame: 'Como la antena de Comunicaciones: hablar con el espacio necesita estaciones en la Tierra.',
    source: 'NASA, History of the Networks', url: 'https://www.nasa.gov/communicating-with-missions/history-of-the-networks/',
  },
  {
    id: 'chile-act', category: 'chile', title: 'Un telescopio del desierto, con datos para todos',
    fact: 'Telescopio de 6 m en Cerro Toco; sus mapas son públicos',
    text: 'El Telescopio Cosmológico de Atacama observó el cielo hasta 2022 desde el norte de Chile. Sus mapas del fondo cósmico de microondas están abiertos en LAMBDA, el archivo de la NASA.',
    inGame: 'Medir, anotar y compartir los datos: como tus tareas de investigación.',
    source: 'NASA LAMBDA, Atacama Cosmology Telescope', url: 'https://lambda.gsfc.nasa.gov/product/act/',
  },
  {
    id: 'chile-arads', category: 'chile', title: 'ARADS: un róver que busca vida en el desierto',
    fact: 'Atacama: de los lugares más parecidos a Marte',
    text: 'La NASA probó en el desierto de Atacama un róver que perfora el suelo y analiza las muestras con instrumentos que buscan vida. Estudian los pocos microbios que sobreviven allí para saber dónde buscar en Marte.',
    inGame: 'Como tus muestras de hielo y tu huerto: la ciencia empieza con muestras.',
    source: 'NASA, Atacama Rover Astrobiology Drilling Studies', url: 'https://www.nasa.gov/?p=427586',
  },
  {
    id: 'chile-1960', category: 'chile', title: 'Ayuda por aire tras el terremoto de 1960',
    fact: '2 hospitales de campaña y 10 helicópteros',
    text: 'Después del terremoto de mayo de 1960, EE. UU. envió por aire dos hospitales de campaña, diez helicópteros, carpas, frazadas y medicinas para llegar a lugares aislados.',
    inGame: 'Cuidar a la tripulación: en la Enfermería también se cuida a las personas.',
    source: 'U.S. Department of State, Office of the Historian (FRUS 1958–1960)', url: 'https://history.state.gov/historicaldocuments/frus1958-60v05mSupp/ch_d37',
  },
  {
    id: 'chile-alianza', category: 'chile', title: 'La Alianza para el Progreso (1961)',
    fact: 'Programa de EE. UU. para América Latina; Chile recibió mucha ayuda',
    text: 'En 1961 el presidente Kennedy lanzó la Alianza para el Progreso, que llevó inversión a infraestructura, educación y gobiernos de América Latina. Chile fue uno de los países que más ayuda recibió.',
    inGame: 'Parte de la historia de cooperación entre Chile y EE. UU.',
    source: 'U.S. Department of State, Office of the Historian (Chile y la Alianza)', url: 'https://history.state.gov/milestones/1969-1976/allende',
  },
  {
    id: 'chile-tololo', category: 'chile', title: 'Cerro Tololo: un observatorio en los Andes',
    fact: 'Elegido en 1962; inaugurado en noviembre de 1967',
    text: 'Astrónomos de EE. UU. y Chile eligieron Cerro Tololo para mirar el cielo del sur. El Observatorio Interamericano se inauguró en 1967 y sigue siendo uno de los grandes observatorios de Chile.',
    inGame: 'Mirar el cielo desde lo alto: igual que desde tu base en la Luna.',
    source: 'NSF NOIRLab, Timeline', url: 'https://noirlab.edu/public/about/timeline',
  },
  {
    id: 'synthetic-biology-light', category: 'vida', title: 'Microbios diseñados para una función',
    fact: 'La NASA prueba en la ISS levadura que fabrica nutrientes',
    text: 'Desde 2019, la NASA prueba en la Estación Espacial levadura de panadería modificada para producir nutrientes a pedido. Diseñar un microbio para una función se llama biología sintética.',
    inGame: 'En el Taller de ADN de papel cada pieza le cuesta energía al alga: ese costo es un modelo del juego.',
    source: 'NASA, Space Synthetic Biology (SynBio)', url: 'https://www.nasa.gov/space-synthetic-biology-synbio/',
  },
  {
    id: 'biosignature', category: 'vida', title: 'Biofirma: una señal posible de vida',
    fact: 'Una biofirma posible necesita más datos antes de concluir',
    text: 'Una biofirma posible es una sustancia o estructura que podría venir de la vida, pero hace falta más estudio antes de decir si hay vida o no. Por eso se usan varias pruebas.',
    inGame: 'En Biofirmas haces tres pruebas antes de informar un indicio.',
    source: 'NASA, What is a Potential Biosignature?', url: 'https://science.nasa.gov/resource/what-is-a-potential-biosignature/',
  },
  {
    id: 'radiation-microbe', category: 'vida', title: 'Un microbio que aguanta la radiación',
    fact: 'Deinococcus radiodurans resiste 500 veces la dosis de un humano',
    text: 'La bacteria Deinococcus radiodurans guarda varias copias de su ADN y lo repara muy bien, así resiste radiación extrema. Los astrobiólogos la estudian para saber qué vida podría aguantar en Marte.',
    inGame: 'Las piezas protectoras del ADN de papel se inspiran en microbios así; las algas del huerto no son ese microbio.',
    source: 'NASA Astrobiology, Life in the Extreme: Radiation', url: 'https://astrobiology.nasa.gov/news/life-in-the-extreme-radiation/',
  },
]);

/** Ficha "¿Sabías qué?" de una sala (la primera que la mencione). */
export const entryForRoom = (room: RoomId): Entry | undefined => ENTRIES.find((e) => e.room === room);
