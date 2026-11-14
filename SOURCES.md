# Fuentes científicas — Michinautas

Todo dato real del juego viene de una fuente oficial verificable. Los mismos enlaces aparecen dentro del juego en el **Archivo científico**, en cada ficha **¿Sabías qué?** y en la pantalla de fin de misión.

- Auditoría automática de enlaces: `cd juego && npm run check:sources`. Última corrida: 14-11-2026, 24 de 24 enlaces del juego responden 200.
- Auditoría automática de datos: `tests/unit/data.test.ts` comprueba que cada URL sea de un dominio oficial (nasa.gov, esa.int, noaa.gov, caltech.edu, dlr.de), que las llamaradas tengan una clase GOES válida y que caigan dentro de su semana, y que **nada se presente como "en vivo"**.

## 1. Clima espacial: llamaradas reales de las misiones

| Misión | Semana real | Llamaradas usadas (pico UTC) | Verificación |
|---|---|---|---|
| Sol dormilón | 2–8 dic 2019 (mínimo solar) | ninguna M/X | [NASA: Solar Cycle 25 Is Here](https://www.nasa.gov/news-release/solar-cycle-25-is-here-nasa-noaa-scientists-explain-what-that-means/) |
| Doble destello | 29 sep – 5 oct 2024 | X7.1 (1 oct 22:20), X9.0 (3 oct 12:18) | [NASA Solar Cycle 25 blog](https://science.nasa.gov/blogs/solar-cycle-25/2024/10/03/sun-releases-strong-solar-flare-6/) |
| Septiembre furioso | 4–10 sep 2017 | M5.5 (4 sep 20:33, SEP), X2.2 (6 sep 09:10), X9.3 (6 sep 12:02), X1.3 (7 sep 14:36), M8.1 (8 sep 07:49), X8.2 (10 sep 16:06, SEP) | [NASA SVS 12706](https://svs.gsfc.nasa.gov/12706) |
| Tormenta de mayo | 8–14 may 2024 | X1.0, X2.2, X1.1, X3.9, X5.8 (11 may 01:23), X1.5, X1.0, X8.7 (14 may 16:51) | [NASA Science: tormenta de mayo de 2024](https://science.nasa.gov/science-research/heliophysics/how-nasa-tracked-the-most-intense-solar-storm-in-decades/) |

**Estado honesto de verificación.** El 14-11-2026 la API DONKI (`api.nasa.gov`, DEMO_KEY) devolvió HTTP 429 (límite de consultas) y el espejo CCMC no respondió desde la red del equipo. Por eso las horas y clases se tomaron de los reportes públicos de NASA y NOAA enlazados arriba, contrastados entre varias fuentes. Cada semana lleva `verifiedAgainstDonki: false`, y el juego dice "FUENTE: NASA / NOAA · archivo histórico (no en vivo)".
**Para verificar contra DONKI:** `NASA_API_KEY=<clave gratuita de api.nasa.gov> npm run data:donki`. El script reemplaza las llamaradas con los datos exactos de DONKI, marca la semana como verificada y el texto en pantalla pasa a "NASA DONKI".

Notas científicas:
- NOAA recalibró en 2020 el flujo de los satélites GOES anteriores a GOES-16, y con eso las clases antiguas suben (la X8.2 de 2017 queda como ~X11.9). El juego usa la clasificación publicada en su momento, que es la que aparece en las páginas de la NASA citadas.
- Hay pequeñas diferencias de minutos entre fuentes para algunas horas pico (p. ej. X8.2: 16:06 UTC en NASA y ESA, y otra hora en una página de SVS). Se usó la hora con más respaldo.
- Fuente base del clima espacial: [NASA Open APIs (DONKI)](https://api.nasa.gov/) · clases de llamaradas: [NOAA SWPC](https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts).

## 2. Constantes y datos físicos

| Dato | Valor | Dónde se usa | Fuente |
|---|---|---|---|
| Gravedad lunar | 1,62 m/s² | Salto del michi (`sim/physics.ts`) | [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) |
| Gravedad de Marte | 3,72 m/s² | Archivo científico | [NASA Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) |
| Gravedad terrestre | 9,81 m/s² | Comparación del salto | [NASA Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) |
| Día lunar (sinódico) | ≈ 29,5 días terrestres | Calendario de 7 jornadas: 3 día, 1 atardecer, 3 noche | [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) |
| Radiación en la superficie lunar | 1 369 µSv/día (ISS: 731 µSv/día) | Radiación de fondo; refugio | Zhang et al. 2020, *Science Advances* 6: eaaz1334, [doi:10.1126/sciadv.aaz1334](https://doi.org/10.1126/sciadv.aaz1334) · resumen: [DLR](https://www.dlr.de/en/latest/news/2020/03/20200925_how-intense-and-dangerous-is-cosmic-radiation-on-the-moon) |
| Demora Tierra–Luna | ~1,28 s por sentido (384 400 km / c) | Antena y pronóstico responden tras 2,56 s | [NASA: Communicating with Missions](https://www.nasa.gov/communicating-with-missions/) |
| Clases de llamaradas | A·B·C·M·X, cada una 10× la anterior | Dosis por llamarada (`sim/flares.ts`) | [NOAA SWPC](https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts) |

## 3. Vida en el espacio y misiones (Archivo científico)

- Radiación y blindaje: [NASA Space Radiation](https://www.nasa.gov/humans-in-space/space-radiation/)
- Cuerpo humano en el espacio: [NASA](https://www.nasa.gov/humans-in-space/the-human-body-in-space/) · datos abiertos: [NASA OSDR](https://osdr.nasa.gov/bio/)
- Algas que producen oxígeno: [ESA MELiSSA](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/A_decade-long_quest_to_build_an_ecosystem_in_a_room)
- Cultivos en el espacio: [NASA](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/)
- Polvo lunar: [NASA Science](https://science.nasa.gov/moon/moon-dust/)
- Artemis: [NASA](https://www.nasa.gov/humans-in-space/artemis/) · Perseverance: [NASA Science](https://science.nasa.gov/mission/mars-2020-perseverance/) · Webb: [NASA Science](https://science.nasa.gov/mission/webb/) · Voyager: [NASA Science](https://science.nasa.gov/mission/voyager/)
- Puntos de Lagrange: [NASA Science](https://science.nasa.gov/resource/what-is-a-lagrange-point/) · Cinturón de Kuiper: [NASA Science](https://science.nasa.gov/solar-system/kuiper-belt/)
- Exoplanetas: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) · TRAPPIST-1: [NASA Science](https://science.nasa.gov/exoplanets/trappist1/)
- Efemérides (referencia para futuras misiones orbitales): [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)

## 4. Qué es simulado (y se dice en el juego)

- La **escala de recursos** (0–100) y la **dosis de juego** de cada llamarada son simplificaciones. La dosis crece de forma logarítmica con el flujo real de rayos X (`flareDose`) para que una X9 pese más que una M5 sin volverse imposible. La barra de radiación es "% del límite de la misión", no mSv.
- La base **Estación Central** es ficticia (silueta inspirada en Lunar Palace 1, sin nombre ni logos reales).
- 7 jornadas comprimen un día lunar completo; el atardecer y la noche siguen la proporción real.
- No se usan logos ni insignias de la NASA (14 CFR 1221). Créditos: "Usa datos e imágenes abiertas de la NASA; la NASA no respalda este proyecto."
