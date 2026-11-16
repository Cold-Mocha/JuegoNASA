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

## Capa «Laboratorio Chile» (fichas de `category: 'chile'` en `src/data/encyclopedia.ts`)
Solo fuentes oficiales; el juego no nombra instituciones. Verificar con `npm run check:sources` (requiere red).
- **Acuerdos Artemis:** NASA, «NASA Welcomes Chile as Newest Artemis Accords Signatory» (25 oct 2024, país n.º 47). https://www.nasa.gov/news-release/nasa-welcomes-chile-as-newest-artemis-accords-signatory **[REAL]**
- **Seguimiento de satélites (Minitrack, Santiago):** NASA, historia de las redes de comunicación con misiones. https://www.nasa.gov/communicating-with-missions/history-of-the-networks/ **[REAL]**
- **Telescopio Cosmológico de Atacama (ACT):** NASA LAMBDA. https://lambda.gsfc.nasa.gov/product/act/ **[REAL]**
- **ARADS (róver en Atacama):** NASA. https://www.nasa.gov/?p=427586 **[REAL]**
- **Ayuda tras el terremoto de 1960:** U.S. Department of State, Office of the Historian (FRUS 1958–60, vol. V). https://history.state.gov/historicaldocuments/frus1958-60v05mSupp/ch_d37 **[REAL]**
- **Alianza para el Progreso (1961):** U.S. Department of State, Office of the Historian. https://history.state.gov/milestones/1969-1976/allende **[verificar]**: la página trata los años de Allende y el golpe, no es apta para niños; la página `.../1961-1968/alliance-for-progress` no menciona a Chile ni a Kennedy. Buscar una fuente oficial más adecuada.
- **Cerro Tololo:** NOIRLab, línea de tiempo. https://noirlab.edu/public/about/timeline **[REAL]**
- **Mensajes de la Dra. Almendra:** personaje ficticio **[RECREACIÓN]**.
- **Contenedor chileno en la ISS / base lunar:** el contenedor real está en órbita baja; la base lunar es ficción (se dice en pantalla).

## Fase C: «ADN de papel» y biofirmas (fichas `synthetic-biology-light`, `biosignature`, `radiation-microbe`)
Todas las URLs son de dominios NASA (consultadas el 15 nov 2026). Correr `npm run check:sources` (requiere red) antes de publicar.
- **Biología sintética (diseñar un microbio para una función):** NASA, Space Synthetic Biology (SynBio), Ames. https://www.nasa.gov/space-synthetic-biology-synbio/ — BioNutrients: levadura de panadería modificada para producir betacaroteno y zeaxantina a pedido; lanzada a la ISS en abril de 2019. **[REAL]**
  - Apoyo: NASA, «What is BioNutrients?» https://www.nasa.gov/general/what-is-bionutrients/ (levadura que forma esporas: forma dormida muy estable y tolerante a la radiación). **[REAL]**
  - Apoyo: NASA Ames, Synthetic Biology. https://www.nasa.gov/ames/space-biosciences/bioengineering-branch/synthetic-biology/ (Space Algae: la radiación y la microgravedad aumentan las mutaciones en microalgas; en Space Algae-1 hubo ~50 % más de polimorfismos de ADN que en el control en tierra). **[REAL]**
  - Apoyo: NTRS 20240001989, «Synthetic Biology to Support Human Exploration of Deep Space». https://ntrs.nasa.gov/citations/20240001989 (LEIA llevaría levadura al polo sur lunar para medir radiación). **[REAL]**
- **Biofirma:** NASA Science, «What is a Potential Biosignature?». https://science.nasa.gov/resource/what-is-a-potential-biosignature/ — una biofirma posible necesita más datos antes de concluir. **[REAL]**
  - Apoyo: NASA Astrobiology, «What is a biosignature?». https://astrobiology.nasa.gov/education/alp/what-is-a-biosignature/ (evidencia de vida pasada o presente que no puede formarse sin vida). **[REAL]**
  - Apoyo: NASA/JPL, «NASA Asks: Will We Know Life When We See It?». https://www.jpl.nasa.gov/news/nasa-asks-will-we-know-life-when-we-see-it/ (ver o no ver una sola biofirma no basta; importa el contexto). **[REAL]**
- **Microbio resistente a la radiación:** NASA Astrobiology, «Life in the Extreme: Radiation». https://astrobiology.nasa.gov/news/life-in-the-extreme-radiation/ — *Deinococcus radiodurans* sobrevive dosis ~500 veces mayores que las humanas; guarda copias de su ADN y lo repara. **[REAL]**
  - Apoyo: NTRS 20120016257 (5 kGy de radiación ionizante). https://ntrs.nasa.gov/citations/20120016257 **[REAL]**
- **Reglas del juego (costos 10/15/15 %, «solo cuando detecta» 40 %, pruebas de biofirma):** diseño propio **[MODELO]**; los porcentajes no son mediciones. Las piezas protectoras están *inspiradas* en microbios extremos; las algas del huerto no son esos microbios.

## Capítulo final: reingreso del orbitador, sonda de control remoto y línea de hábitat (consultadas el 15 nov 2026)
- **Reingreso (modelo de 1 dimensión: energía, calor, g, corredor, alabeo):** `juego/src/sim/reentry.ts`, módulo aportado por el equipo (`reingreso_1.zip`). Sus constantes de entrada (122 km, 7,8 km/s) y el perfil de arrastre del transbordador están marcadas **[verificar]** en el propio código; los valores del vehículo (β, L/D) son de orden de magnitud **[MODELO]**. Pendiente: contrastarlos con la documentación oficial del transbordador en nasa.gov antes de presentarlos como datos.
  - **Apagón de comunicaciones por plasma:** NASA/TM-2010-216220, «Review of Leading Approaches for Mitigating Hypersonic Vehicle Communications Blackout…». https://ntrs.nasa.gov/api/citations/20100008938/downloads/20100008938.pdf — el apagón fue un problema de las cápsulas; en el transbordador, el plasma se forma sobre el vientre y las superficies superiores quedan más libres. **[REAL]**
  - Apoyo: NASA TN D-2732, «Plasma Effects on Apollo Re-entry Communication» (1965). https://ntrs.nasa.gov/api/citations/19650019316/downloads/19650019316.pdf **[REAL]**
  - Apoyo (no oficial, solo contexto): Space Academy, «Reentry blackout» https://www.spaceacademy.net.au/spacelink/blackout.htm (duración típica 12–13 min). **[verificar]**
  - Duración del apagón y su ventana de velocidad/altura en el juego: **[MODELO]**, el tiempo se comprime ~15×.
- **Sonda tipo New Horizons (control remoto con retardo):** JHU/APL, «Spacecraft Systems and Components». https://pluto.jhuapl.edu/Mission/Spacecraft/Systems-and-Components.php — antena de alta ganancia de 2,1 m; ida y vuelta de la señal ≈ 9 h cerca de Plutón. **[REAL]**
  - Apoyo: NASA Science, «New Horizons wakes from hibernation». https://science.nasa.gov/missions/new-horizons/nasas-new-horizons-spacecraft-wakes-from-hibernation-in-good-health/ (señal de ~8 h 52 min a 9,5 mil millones de km). **[REAL]**
  - Apoyo: arXiv 0709.4288 (diseño de la nave: un solo RTG, menos de 200 W). https://www.arxiv.org/pdf/0709.4288 **[REAL]**
  - El retardo del juego (0,22 s) es **[MODELO]** y se avisa en pantalla. El dibujo de la sonda (vista trasera, RTG, plato) es **[DIBUJO]** inspirado, no un plano.
- **Saturno al fondo, cometas y destellos:** son **[DIBUJO]** procedurales. Referencia de imagen real: NASA/JPL/Space Science Institute, «The Greatest Saturn Portrait…Yet» (PIA06193). https://images.nasa.gov/details/PIA06193 — **no incluida**: este equipo no pudo descargar archivos de nasa.gov; para usarla, bajarla y guardar en `assets/nasa/` con el crédito «NASA/JPL/Space Science Institute».
- **Camino de carretera (OutRun):** solo la idea de perspectiva de carriles; sin arte ni sonidos de terceros.
- **Primer laboratorio chileno en el espacio:** texto aportado por el equipo (contenedor a la ISS; experimentos biológicos y tecnológicos en microgravedad y radiación; proyecto Anillo **ATE220057** (el código «AD…» era un error de tipeo), ANID). **[REAL, verificado 2026-11]** Fuentes oficiales: nota de prensa de la institución líder, https://uchile.cl/noticias/239728/u-de-chile-recibe-primeros-datos-de-su-mision-en-la-eei y https://uchile.cl/noticias/239764/u-de-chile-recibe-primeros-datos-desde-la-estacion-espacial-internacional (lanzamiento 11 abr 2026 en Cygnus/Falcon 9; captura por la ISS 13 abr; contenedor operando ~6 meses). Financiamiento ANID: Anillo ATE220057 y Fondecyt 1251703 (https://portal.usach.cl/en/news/space-research-2026-usach-leads-study-extremophile-microorganisms-orbit). En el juego no se nombran las instituciones.
- **Laboratorios naturales (Atacama, Antártica):** texto aportado por el equipo; los datos de ALMA, Paranal y La Silla son públicos en sus sitios oficiales. **[REAL, verificar enlaces]**
- **«Tres pasos hacia un hábitat»:** orden de las jornadas, **[PROPUESTA]**, no es un plan de ninguna agencia. El juego dice que la Luna hoy no es habitable.

## Regreso «Rueda detenida» (etapa 1: diálogos y escenas 1–5) — guion del equipo, 14 nov 2026
Guion y fuentes aportados por el equipo (`Michinautas — Misión final: Rueda detenida`). Todo lo numérico del juego es **[MODELO]/[PROPUESTA]**.
- NASA JSC-63400, *History of Space Shuttle Rendezvous* (maniobra R-bar pitch, 0,75°/s, STS-114). https://ntrs.nasa.gov/citations/20110023479 **[REAL, verificar cifras en el documento]**
- Apollo 13, adaptador de CO₂ (filtros redondos/cuadrados): https://www.nasa.gov/history/afj/ap13fj/15day4-mailbox.html y https://www.nasa.gov/history/alsj/a13/a13_LIOH_Adapter.html **[REAL]**
- NASA, podcast Mission Control (CAPCOM y director de vuelo): https://www.nasa.gov/podcasts/houston-we-have-a-podcast/mission-control-eye-of-the-storm/ **[REAL]**
- Informe CAIB resumido por CRS RS21606: https://www.everycrsreport.com/reports/RS21606.html **[REAL]** (solo en tarjeta informativa y con respeto; etapa 2)
- Apagón de radio del transbordador: informe STS-39 (JSC-08250) registra ~12 min 40 s sin enlace TDRS; Goddard habla de «10+ minutos»; Space Academy 12–13 min. **[REAL]** como rango «10–13 min» (tras TDRS, 1988, algunas misiones tuvieron huecos más cortos). https://ibiblio.org/apollo/Shuttle/Reports/Mission%20Reports/STS-39%20Space%20Shuttle%20Mission%20Report.pdf y https://phys.org/news/2011-09-shuttle-era-goddard-critical-path.pdf
- **Nombre de la nave «Küyen»** (= «luna» y también «mes» en mapudungun), elegido por el equipo. Fuentes: Currículum Nacional (MINEDUC), glosario (Küyen, Wagülen, Wenu lewfü). https://www.curriculumnacional.cl/614/articles-89653_recurso_pdf.pdf y Meteored, «La cosmovisión mapuche y su conexión con las estrellas». https://www.meteored.cl/noticias/astronomia/la-cosmovision-mapuche-y-su-conexion-con-las-estrellas.html **[REAL]**. Varias grafías (kuyen/küyen): **[verificar con hablantes]**. Está solo en `SHIP_NAME` (`src/data/voyageScript.ts`).
- Regreso desde la Luna en ficción (orbitador en «dos tramos»): la nave queda en órbita baja y reingresa como transbordador. Un regreso lunar real entra mucho más rápido y en cápsula; el juego lo dice en pantalla **[PROPUESTA]**.
- **Tarjeta del Columbia (escena de la voltereta):** CAIB / CRS RS21606. Se menciona con respeto, sin representar el accidente ni inventar palabras de la tripulación. **[REAL]**
- Tarjetas del Modo Ingeniero, verificadas: **122 km (400.000 ft)**, entrada a **25.898 km/h**, quema de desorbitación **60 min** antes del aterrizaje (26.498 km/h), inicio de maniobras a 13.716 m (45.000 ft) y toque a **346 km/h** → NASA KSC Fact Sheet «Landing the Space Shuttle Orbiter» https://www3.nasa.gov/centers/kennedy/pdf/167415main_LandingatKSC06.pdf (PDF 2003/2005 en https://webarchive.library.unt.edu/web/20080925021417/http://www-pao.ksc.nasa.gov/kscpao/nasafact/pdf/LandingSS-2005.pdf). **Apollo 16: apagón ≈ 3,5 min** → NASA History, «50 Years Ago: Apollo 16 Splashes Down» https://www.nasa.gov/history/50-years-ago-apollo-16-splashes-down/ (el PAD previsto era 3 min 17 s). Corrección: «~26.000 km/h» pasó a «~25.900 km/h». Pendiente: giro de 0,75 °/s (JSC-63400).

## Prólogo (carta, Academia y base lunar)
- Texto y arte del prólogo: aportados por el equipo (`dialogo-michinautas_1.zip`: guion, retratos y fondos de Atacama, la ISS y la base lunar). Código en `src/data/prologueScript.ts`; cajas de diálogo estilo RPG en `src/core/dialogue.ts`.
- Reemplaza las láminas 4–7 de la historia anterior (`story.ts`, archivado en `_to_delete/`). Sus avisos [REAL]/[PROPUESTA] pasaron al campo `note` de cada línea.
- **Laboratorio chileno en la ISS [REAL]:** ver la sección de la misión chilena (notas de prensa oficiales). El crédito «Anillo AD220057, ANID» del guion original se quitó del juego; el código correcto es ATE220057 y queda solo aquí.
- **Atacama [REAL]:** ALMA, Paranal y La Silla se nombran como sitios públicos de observación; sin instituciones ni financiamiento en pantalla. **[verificar enlaces oficiales]**
- «Cada orden tarda poco más de un segundo» (luz Tierra–Luna ≈ 1,3 s): **[verificar]** con una fuente de la NASA antes de publicar.
