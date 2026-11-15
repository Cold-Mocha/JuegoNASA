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

- OSDR es **solo lectura recomendada**: ningún valor del juego sale de ese repositorio (la ficha del Archivo lo dice así).
- Radiación y blindaje: [NASA Space Radiation](https://www.nasa.gov/humans-in-space/space-radiation/)
- Cuerpo humano en el espacio: [NASA](https://www.nasa.gov/humans-in-space/the-human-body-in-space/) · datos abiertos: [NASA OSDR](https://osdr.nasa.gov/bio/)
- Algas que producen oxígeno: [ESA MELiSSA](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/A_decade-long_quest_to_build_an_ecosystem_in_a_room)
- Cultivos en el espacio: [NASA](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/)
- Polvo lunar: [NASA Science](https://science.nasa.gov/moon/moon-dust/)
- Artemis: [NASA](https://www.nasa.gov/humans-in-space/artemis/) · Perseverance: [NASA Science](https://science.nasa.gov/mission/mars-2020-perseverance/) · Webb: [NASA Science](https://science.nasa.gov/mission/webb/) · Voyager: [NASA Science](https://science.nasa.gov/mission/voyager/)
- Puntos de Lagrange: [NASA Science](https://science.nasa.gov/resource/what-is-a-lagrange-point/) · Cinturón de Kuiper: [NASA Science](https://science.nasa.gov/solar-system/kuiper-belt/)
- Exoplanetas: [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) · TRAPPIST-1: [NASA Science](https://science.nasa.gov/exoplanets/trappist1/)
- Efemérides (referencia para futuras misiones orbitales): [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)

## 4. Contexto chileno (fichas «Desde Chile» del Archivo)

Lo ocurrido en Chile no está en sitios de agencias espaciales: estas fichas citan a ESO y, donde no hay fuente oficial, prensa o divulgación con fecha.

| Dato | Dónde se usa | Fuente |
|---|---|---|
| Paranal a 2 635 m y ALMA a unos 5 000 m, en el desierto de Atacama, uno de los lugares más secos de la Tierra | Ficha «El cielo de Chile» | [ESO, Observatorio Paranal](https://www.eso.org/public/teles-instr/paranal-observatory/) · [ALMA](https://www.almaobservatory.org/en/about-alma/) |
| La NASA alargó la pista de Mataveri (Rapa Nui) como aterrizaje de emergencia del transbordador; se inauguró en agosto de 1987 y nunca se usó para eso | Ficha «Una pista para el transbordador en Rapa Nui» y rótulo de la fase de planeo de «Casa» | [UPI, 17-08-1987](https://www.upi.com/Archives/1987/08/17/Emergency-space-shuttle-landing-strip-opened/9293556171200/) (el sitio bloquea clientes automáticos: revisar a mano) |
| Auroras australes en Punta Arenas el 10 de mayo de 2024, durante la tormenta geomagnética G5 | Ficha «Auroras en el sur de Chile» y descripción de la jornada «Energía del Sol» | [Meganoticias, 10-05-2024](https://www.meganoticias.cl/nacional/447271-tormenta-solar-auroras-australes-boreales-polares-punta-arenas-brk-10-5-2024.html) |
| La güiña (*Leopardus guigna*) es el felino silvestre más pequeño de América; vive en Chile y Argentina | Ficha «La güiña» y tripulante Güiña | [Mongabay, 2018](https://news.mongabay.com/2018/01/smallest-wild-cat-in-the-americas-faces-big-problems-but-hope-exists/) |

## 5. Qué es simulado (y se dice en el juego)

- La **escala de recursos** (0–100) y la **dosis de juego** de cada llamarada son simplificaciones. La dosis crece de forma logarítmica con el flujo real de rayos X (`flareDose`) para que una X9 pese más que una M5 sin volverse imposible. La barra de radiación es "% del límite de la misión", no mSv.
- La base **Estación Central** es ficticia (silueta inspirada en Lunar Palace 1, sin nombre ni logos reales).
- 7 jornadas comprimen un día lunar completo; el atardecer y la noche siguen la proporción real.
- No se usan logos ni insignias de la NASA (14 CFR 1221). Créditos: "Usa datos e imágenes abiertas de la NASA; la NASA no respalda este proyecto."


## Objetos de la estación (referencias reales de los dibujos)
Los sprites de `herramientas/props_detallados.py` se inspiran en equipo real; son dibujos propios, no copias de imágenes.
- **Reciclador de CO₂:** unidad de remoción de CO₂ de la ISS (lechos de sorbente) y generación de oxígeno por electrólisis. NASA, *Environmental Control and Life Support System (ECLSS)*: https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss
- **Rack de plantas y algas:** Veggie y Advanced Plant Habitat (LED rojos, azules y verdes, "almohadillas" con semillas y depósito de agua). NASA Space Biology: https://science.nasa.gov/biological-physical/programs/space-biology/plant-biology/experiments
- **Cocina de la nave:** galera de la ISS con calentador de comida tipo maletín y estación de rehidratación con agua caliente y fría. NASA OCHMO, *Food and Nutrition*: https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf
- **Limpieza de polvo:** escudo electrodinámico de polvo (EDS) y "Moon duster". NASA: https://science.nasa.gov/technology/technology-highlights/new-moon-duster-will-help-clean-nasa-assets-in-space
- **Taladro y hielo:** taladro TRIDENT de PRIME-1 y VIPER. NASA PRIME-1: https://www.nasa.gov/?p=558300
- **Enfermería:** equipo de salud de la tripulación de la ISS (CHeCS: monitor, botiquín, sujeción). NASA ISS guide (2008).
- **Clima espacial:** clases de llamaradas C, M y X del GOES (NOAA SWPC).


## Misión «Casa» y minijuegos nuevos (referencias; marcar `[verificar]` antes de mostrarlas en pantalla)
- **Giro de 360° (R-bar Pitch Maneuver):** NASA JSC-63400 (rendezvous del transbordador), tras el Columbia: giro a 0,75 °/s con fotografía del vientre desde la ISS. Se usa como Fase 1 de «Casa»; el reingreso real es otra cosa. **[REAL]**
- **Reingreso, calor y planeo:** interfaz de entrada, ángulo de ataque, duración del apagón de plasma y velocidad de aterrizaje del transbordador son aproximaciones **[verificar]**; el modelo de «Casa» es educativo **[MODELO]**. Fuente a revisar: informe CAIB en nasa.gov.
- **Electrólisis y energía por noche lunar:** H₂O → 2 H₂ + O₂ (relación 2:1) y noche lunar de ~14 días terrestres **[REAL]**.
- **Tamaños y avisos de clima espacial:** Miteva et al. y Buzulukova y Tsurutani (tiempos de llamaradas, partículas y eyecciones de masa coronal; caso Carrington ~17 h 40 min) **[REAL]**; no se muestran en pantalla todavía.
- **Biofirmas:** los orgánicos solos no prueban vida; se necesitan varias pruebas independientes **[MODELO]**.
- **Opportunity (2018):** la tormenta de polvo bloqueó la luz solar; no afirmar que "cubrió los paneles" **[verificar]**.
