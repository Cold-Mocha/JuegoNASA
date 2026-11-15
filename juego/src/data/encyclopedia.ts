import type { RoomId } from '../sim/types';

/**
 * Archivo Científico / ¿Sabías qué?: datos reales detrás de cada mecánica.
 * Regla: cada ficha cita una fuente verificable: oficial (NASA, ESA, ESO, NOAA o artículo científico) o, para lo ocurrido en Chile, prensa o divulgación con fecha.
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

export const CATEGORIES: Record<EntryCategory, string> = {
  luna: 'La Luna',
  sol: 'El Sol',
  vida: 'Vivir en el espacio',
  misiones: 'Misiones reales',
  universo: 'Más allá',
  chile: 'Desde Chile',
};

export const ENTRIES: Entry[] = [
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
    inGame: 'Las tormentas de polvo del juego cubren los paneles: hay que salir a limpiarlos con el cepillo.',
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
    inGame: 'Esta semana está guardada en el archivo del juego; hoy ninguna jornada la usa.',
    source: 'NASA Scientific Visualization Studio', url: 'https://svs.gsfc.nasa.gov/12706',
  },
  {
    id: 'may-2024', category: 'sol', title: 'La gran tormenta de mayo de 2024',
    fact: 'La tormenta geomagnética más intensa en unos 20 años',
    text: 'La región 13664 lanzó llamaradas X durante una semana entera. En la Tierra se vieron auroras en lugares donde casi nunca aparecen.',
    inGame: 'Es el clima solar de la jornada «Energía del Sol»: sus 8 llamaradas X caen en los mismos días y horas.',
    source: 'NASA Science, Heliophysics', url: 'https://science.nasa.gov/science-research/heliophysics/how-nasa-tracked-the-most-intense-solar-storm-in-decades/',
  },
  {
    id: 'oct-2024', category: 'sol', title: 'La llamarada X9.0',
    fact: '3 de octubre de 2024, 12:18 UTC',
    text: 'Fue la llamarada más fuerte en siete años. El observatorio SDO de la NASA la fotografió mientras ocurría.',
    inGame: 'Es una de las dos llamaradas de la jornada «Hielo en la Luna».',
    source: 'NASA Science, Solar Cycle 25 blog', url: 'https://science.nasa.gov/blogs/solar-cycle-25/2024/10/03/sun-releases-strong-solar-flare-6/',
  },
  {
    id: 'solar-min', category: 'sol', title: 'El Sol también descansa',
    fact: 'Ciclo de ~11 años; mínimo en diciembre de 2019',
    text: 'La actividad del Sol sube y baja en ciclos de unos 11 años. En el mínimo casi no hay manchas ni llamaradas.',
    inGame: 'Es el clima solar de la jornada «Huerto lunar»: una semana sin llamaradas fuertes, ideal para empezar.',
    source: 'NASA, Solar Cycle 25 Is Here', url: 'https://www.nasa.gov/news-release/solar-cycle-25-is-here-nasa-noaa-scientists-explain-what-that-means/',
  },
  {
    id: 'water-shield', category: 'vida', title: 'Escudos contra la radiación',
    fact: 'Los materiales con mucho hidrógeno, como el agua, frenan bien la radiación',
    text: 'Los científicos estudian cómo proteger a los astronautas en viajes largos. Un refugio con paredes gruesas, por ejemplo de agua, es una buena opción durante una tormenta solar.',
    inGame: 'Dentro de la nave pasa solo el 10 % de una llamarada, pero el blindaje gasta energía; sin energía pasa la mitad.',
    source: 'NASA, Space Radiation', url: 'https://www.nasa.gov/humans-in-space/space-radiation/', room: 'esclusa',
  },
  {
    id: 'body-in-space', category: 'vida', title: 'El cuerpo en el espacio',
    fact: 'Con menos gravedad, huesos y músculos se debilitan',
    text: 'En el espacio los huesos pierden fuerza si no hacen ejercicio. La NASA estudia la salud de los astronautas, y sus datos están abiertos en el repositorio OSDR.',
    inGame: 'En la Enfermería recuperas salud; cuesta energía y comida.',
    source: 'NASA, The Human Body in Space', url: 'https://www.nasa.gov/humans-in-space/the-human-body-in-space/', room: 'enfermeria',
  },
  {
    id: 'osdr', category: 'vida', title: 'Datos abiertos de biología espacial',
    fact: 'OSDR: repositorio de ciencia biológica espacial de la NASA',
    text: 'Allí se guardan experimentos con plantas, microbios, ratones y astronautas para que cualquier científico pueda estudiarlos.',
    inGame: 'Ningún número del juego sale de OSDR: es una lectura recomendada para saber cómo se estudia la vida en el espacio.',
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
    inGame: 'La antena y el pronóstico solar responden después de ~2,6 s: la ida y vuelta real a la Luna.',
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
  {
    id: 'chile-sky', category: 'chile', title: 'El cielo de Chile',
    fact: 'Paranal está a 2 635 m de altura; ALMA, a unos 5 000 m',
    text: 'El desierto de Atacama es uno de los lugares más secos de la Tierra: casi no hay nubes ni humedad, y está lejos de las luces de las ciudades. Por eso allí están los telescopios de Paranal y las 66 antenas de ALMA.',
    inGame: 'La estación del juego mira el Sol desde la Luna; en Chile, los observatorios del norte miran el resto del universo.',
    source: 'ESO, Observatorio Paranal', url: 'https://www.eso.org/public/teles-instr/paranal-observatory/',
  },
  {
    id: 'mataveri', category: 'chile', title: 'Una pista para el transbordador en Rapa Nui',
    fact: 'En 1987 la NASA alargó la pista de Mataveri',
    text: 'El aeropuerto de Rapa Nui (Isla de Pascua) quedó con una pista lo bastante larga para que un transbordador espacial aterrizara allí en una emergencia. Nunca hizo falta usarla: hoy sirve a los aviones que llegan a la isla.',
    inGame: 'En la misión final «Casa», el planeo termina en la pista de Mataveri.',
    source: 'UPI, 17 de agosto de 1987', url: 'https://www.upi.com/Archives/1987/08/17/Emergency-space-shuttle-landing-strip-opened/9293556171200/',
  },
  {
    id: 'chile-auroras', category: 'chile', title: 'Auroras en el sur de Chile',
    fact: '10 de mayo de 2024: auroras australes en Punta Arenas',
    text: 'La gran tormenta solar de mayo de 2024 fue tan fuerte que las auroras, que casi siempre se ven solo cerca de los polos, aparecieron en el cielo de Magallanes.',
    inGame: 'Es la misma semana de la jornada «Energía del Sol»: las llamaradas que esquivas en la Luna encendieron el cielo del sur de Chile.',
    source: 'Meganoticias, 10 de mayo de 2024', url: 'https://www.meganoticias.cl/nacional/447271-tormenta-solar-auroras-australes-boreales-polares-punta-arenas-brk-10-5-2024.html',
  },
  {
    id: 'guina', category: 'chile', title: 'La güiña',
    fact: 'El felino silvestre más pequeño de América: pesa poco más de 2 kg',
    text: 'La güiña vive en los bosques del centro y sur de Chile y en una franja de Argentina. Es pequeña, ágil y pasa mucho tiempo en los árboles. Está amenazada porque su bosque se achica.',
    inGame: 'Güiña, la piloto que puedes elegir como tripulante, es una de ellas.',
    source: 'Mongabay, 2018', url: 'https://news.mongabay.com/2018/01/smallest-wild-cat-in-the-americas-faces-big-problems-but-hope-exists/',
  },
];

/** Ficha "¿Sabías qué?" de una sala (la primera que la mencione). */
export const entryForRoom = (room: RoomId): Entry | undefined => ENTRIES.find((e) => e.room === room);
