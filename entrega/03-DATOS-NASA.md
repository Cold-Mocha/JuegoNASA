# Datos de la NASA usados

Los datos vienen de la sección Resources del desafío y de fuentes oficiales de la NASA y sus agencias socias. Cada uno se cita dentro del juego: en el pie de la pantalla, en los avisos, en el Archivo científico y en el informe final. El detalle completo está en [`../SOURCES.md`](../SOURCES.md).

## Texto para el formulario

> We used NASA DONKI space weather records (solar flares), cross checked with NASA and NOAA SWPC reports, for three real weeks of solar activity: December 2019, May 2024 and October 2024. Each flare arrives in the game on its real day and hour, and its GOES class sets the radiation dose. Lunar surface radiation comes from Zhang et al. 2020 (Chang'e 4, Science Advances). Lunar gravity and the length of the lunar day come from the NASA Moon Fact Sheet. The Earth and Moon signal delay (2.56 seconds round trip) follows NASA's Communicating with Missions page. NASA OSDR is listed as recommended reading only and no number in the game comes from it. Optional biology activities are based on NASA Space Synthetic Biology (BioNutrients yeast on the ISS), NASA Science's "What is a Potential Biosignature?" and NASA Astrobiology's page on radiation-resistant microbes. Chile and U.S. cooperation fact sheets cite NASA (Artemis Accords, the Minitrack tracking network, LAMBDA's Atacama Cosmology Telescope data and the ARADS rover), the U.S. State Department Office of the Historian and NOIRLab. The flares are a historical archive, not live data, and the game says so on screen.

## Tabla

| Dato | Qué hace en el juego | Dónde se ve | Enlace |
|---|---|---|---|
| NASA DONKI (llamaradas) y reportes de NASA y NOAA SWPC | Tres semanas reales del Sol. Cada llamarada llega a su hora real y su clase fija la dosis | Aviso de llamarada, pie de la pantalla, comparación con escudo y afuera, informe, Archivo | https://api.nasa.gov/ y https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts |
| Zhang et al. 2020, Science Advances (Chang'e 4) | Radiación de fondo en la superficie lunar (1 369 µSv por día) | Barra de radiación y ficha del Archivo | https://doi.org/10.1126/sciadv.aaz1334 |
| NASA Moon Fact Sheet | Gravedad lunar del salto (1,62 m/s²) y ciclo de luz de 7 jornadas | Salto del michi, reloj, fichas | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html |
| NASA Communicating with Missions | Demora entre la Tierra y la Luna: la antena responde a los 2,56 s | Comunicaciones y ficha «Mensajes que tardan» | https://www.nasa.gov/communicating-with-missions/ |
| NASA OSDR | Solo lectura recomendada | Archivo científico | https://osdr.nasa.gov/bio/ |
| NASA Space Synthetic Biology (BioNutrients) | Idea del taller opcional de «ADN de papel»: diseñar un microbio para una función. Los costos de cada pieza son un modelo del juego | Rack de plantas y ficha del Archivo | https://www.nasa.gov/space-synthetic-biology-synbio/ |
| NASA Science: What is a Potential Biosignature? | Analizar una muestra con tres pruebas antes de informar «indicio» o «sin indicio» | Roca de hielo y ficha del Archivo | https://science.nasa.gov/resource/what-is-a-potential-biosignature/ |
| NASA Astrobiology: Life in the Extreme, Radiation | *Deinococcus radiodurans* resiste unas 500 veces la dosis humana | Ficha del Archivo | https://astrobiology.nasa.gov/news/life-in-the-extreme-radiation/ |
| NASA (Acuerdos Artemis, red Minitrack, LAMBDA/ACT, ARADS), Office of the Historian y NOIRLab | Fichas reales de cooperación Chile–EE. UU. que abren los capítulos y los carteles de la estación | Capítulos, carteles y Archivo | Ver `SOURCES.md`, sección 4 |

## Semanas de llamaradas

| Jornada | Semana real | Llamaradas | Referencia |
|---|---|---|---|
| Huerto lunar | 2 al 8 de diciembre de 2019 | Ninguna M ni X | NASA: Solar Cycle 25 Is Here |
| Energía del Sol | 8 al 14 de mayo de 2024 | 8 de clase X (la mayor, X8.7) | NASA Science: tormenta de mayo de 2024 |
| Hielo en la Luna | 29 de septiembre al 5 de octubre de 2024 | X7.1 y X9.0 | NASA Solar Cycle 25 blog |

## Qué es real y qué es simulado

- Las llamaradas son un archivo histórico. No son datos en vivo y el juego lo dice en pantalla.
- La API de DONKI no respondió en dos intentos (errores 429 y 404). Las horas y clases salen de reportes públicos de NASA y NOAA. El archivo queda marcado como no verificado contra DONKI. El comando `npm run data:donki` lo reemplaza por los datos exactos cuando la API responda.
- La escala de 0 a 100 de las barras y la dosis de juego son simplificaciones. El juego las declara así.
- Los ángulos y canales del minijuego de antena son un modelo para enseñar. No son telemetría real.
- En el cinturón de asteroides las rocas están mucho más juntas que en la realidad, donde casi nunca se ven dos a la vez. Es un dibujo.
- La Dra. Almendra, que envía los mensajes de cada capítulo, es un personaje ficticio. Las fichas a las que lleva son reales.
- No se usan logos de la NASA. Créditos: «Proyecto creado para el NASA Space Apps Challenge 2026. Usa datos e imágenes abiertas de la NASA. La NASA no respalda este proyecto.»
