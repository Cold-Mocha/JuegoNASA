# Game Design Document — Michinautas (iteración 1 restaurada: 5 barras, salud, polvo y 5 jornadas; nave compacta y exterior con oxígeno del traje)

> Cambios de esta iteración y su justificación frente al reto: ver `ESTUDIO-SIMPLIFICACION.md`.

**Género:** gestión de recursos y supervivencia en 2.5D · **Público:** 7–12 años (también sirve para familia y aula) · **Plataforma:** navegador, sin descarga ni cuenta · **Reto:** NASA Space Apps 2026, *Build a Junior Astronaut Mission Trainer*.

## 1. Fantasía y objetivo educativo
Eres un michi astronauta en la **Estación Central**, un puesto lunar ficticio, en una **jornada científica**: una investigación con una lista de tareas (por ejemplo, buscar hielo, cultivar algas o estudiar las llamaradas). Al cumplir todas las tareas, la tripulación **vuelve a la Tierra**. El plazo son 7 días lunares comprimidos, y de fondo se vive una **semana real del Sol** con sus llamaradas (archivo DONKI de la NASA). Los **5 recursos** (energía, oxígeno, comida, salud, radiación) son **secundarios**: hay que cuidarlos para poder investigar.
**Lo que el niño se lleva:** *ninguna decisión es gratis*. Ahorrar energía hoy cuesta aire mañana; salir a hacer ciencia da puntos pero también radiación; el pronóstico solar solo llega si cuidas la antena.

## 2. Bucle principal
1. Mirar las 3 barras (energía, aire y comida, radiación), la señal de la antena y la jornada (día / atardecer / noche).
2. Caminar a una sala por la estación, que es **un solo plano continuo** (vista cenital, sin pantallas de carga): Soporte vital, Cultivo y Energía arriba; un pasillo central con el Refugio en un extremo y Comunicaciones en el otro; Puente, Esclusa y Enfermería abajo. Se camina con el teclado, con un clic en el piso o con un clic en una máquina (el michi camina solo hasta ella). El mapa (M) es solo para mirar: muestra el plano y una carita de michi donde estás. **Caminar gasta tiempo:** el Refugio queda en el extremo opuesto a Energía y Comunicaciones. **Luz:** no hay niebla; la estación se oscurece pareja a medida que baja la energía.
3. Usar la máquina de la sala. Cada acción muestra su costo antes de elegirla.
4. Reaccionar a eventos: llamaradas reales, envíos de la Tierra y recursos críticos.
5. Terminar las 7 jornadas → puntaje, estrellas, logros y "lo que aprendiste".

## 3. Salas, objetos y minijuegos (`src/sim/rules.ts`, `src/data/rooms.ts`)
Todos los minijuegos son **a pantalla completa, sin título, texto ni botones** (se sale con Esc). Cada uno devuelve un puntaje 0–1 y la *calidad* `0,4 + 0,6 × puntaje` **[PROPUESTA]** escala solo las ganancias, nunca los costos ni la radiación: jugar mal no deja la acción en cero ni la regala.
| Sala | Objeto | Minijuego | Efecto |
|---|---|---|---|
| Superficie | Limpieza de polvo (siempre) y Panel de pruebas (*Energía del Sol*) | Cepillo: limpiar dos paneles con su pata | Paneles limpios: la energía se renueva; el oxígeno del traje sigue bajando mientras se limpia |
| Soporte vital | Reciclador de oxígeno: decorativo hasta que se rompe | Sellador: seguir la grieta | Con la fractura abierta el oxígeno de la nave se escapa; sellarla lo regenera |
| Invernadero | Rack de plantas (siempre) y Cultivo de algas (*Huerto lunar*) | Cosecha: tocar solo las plantas maduras. Cultivo de algas (*Huerto lunar*): mantener apretadas luz, nutrientes y temperatura en su franja verde (la luz calienta el tanque) | +20 comida × calidad; las algas dan O₂ y comida × calidad, una vez por día |
| Enfermería | Camilla | Curarse: mantener apretadas 4 heridas | +25 salud × calidad (más rápido, más calidad) |
| Comunicaciones | Antena | Cables (si la señal está floja) y **Mensaje con ruido**: completar el patrón dañado por la estática | "Avisar a la Tierra": solo disponible al terminar las tareas de la investigación |
| Puente | Bicicleta de energía | Pedalear: seguir el ritmo con dos pedales | +10 energía × calidad, −3 comida, hasta 3 por jornada |
| Superficie | Taladro de hielo (*Hielo en la Luna*) | Biofirmas: emparejar picos del espectro con su huella; un pico es ruido | +2 ciencia × calidad, una vez por día; los orgánicos solos no prueban vida |

**Energía [MODELO]:** consumo de 5 por jornada y los paneles generan 7 × su rendimiento: con los paneles limpios la energía se renueva **lento** (sobran 2 por jornada). El polvo ya no sube solo: llegan **tormentas de polvo al azar** (50 % por jornada, seguras si pasaron 2 jornadas sin una) que suman 20–35 % de polvo y ensucian el panel de pruebas; solo entonces se pueden limpiar los paneles; cuando generan menos de lo que gasta la nave, los paneles "fallan" y la energía baja. Pedalear recupera mucho más rápido (+10 por vuelta, hasta +30 por jornada) a costa de comida.
**Oxígeno [MODELO]:** se renueva solo (+14 por jornada, −9 de consumo). Una fractura (60 % por jornada desde el día 2, en el reciclador) lo corta y lo filtra (−30 extra por jornada).
**Salud [MODELO]:** baja cuando el oxígeno o la comida llegan a 0, y con radiación sobre 50 %, de a poco y más rápido mientras más alta. **La radiación no se puede sacar.** Con salud 0 (o radiación 100 %) la tripulación vuelve a la Tierra.
**Límite diario:** la cosecha y las acciones propias de cada investigación (algas, taladro, panel de pruebas) se hacen una vez por jornada. Cada investigación tiene su propio minijuego en su objeto: algas (perillas de luz, nutrientes y temperatura), panel de pruebas (limpiarlo y orientarlo al Sol; solo mide, no limpia los paneles de la estación) y taladro de hielo (emparejar el espectro); la bicicleta, hasta 3.

## 4. Llamaradas (datos reales)
Cada llamarada aparece en su jornada y a su hora UTC real. La dosis de juego se calcula como `2 + 6·(log10(flujo/1e-6))^1.3`, con ×1,5 si hubo tormenta de partículas (SEP), y se reparte en 10 s. Con el blindaje activo entra solo el 10 %. Al empezar una llamarada la pantalla se tiñe de magenta, suena una alarma y el michi se pone el casco. El HUD cita "FUENTE: … · archivo histórico (no en vivo)".

**Aviso previo:** antes de cada llamarada aparece una alerta, una cuenta regresiva y una flecha al Refugio: 25 s antes si hay pronóstico vigente y solo 10 s antes si no (`FLARE_WARNING_SEC` en `sim/rules.ts`).

## 5. Power-up con costo de oportunidad
En las jornadas 3 y 6 llega un **envío de la Tierra** solo si la antena está al ≥ 60 %. El cohete trae **una** caja: aire y comida, o energía (+25). El reloj se detiene mientras eliges. Si la antena está mal, el envío se pierde y la Comandante explica por qué.

## 6. Jornadas científicas, puntaje y logros
- **Tareas en dos pestañas:** las 3 propias de cada jornada y, solo cuando se terminan, "Avisar a la Tierra" (la antena). La misión se gana al cumplir las 4.
- **Jornadas** (`src/data/missions.ts`): tres. **Huerto lunar** (nivel 1, Sol tranquilo de diciembre de 2019; trae el cultivo de algas y el rack de plantas), **Energía del Sol** (nivel 2, Sol tranquilo; trae un panel de pruebas) y **Hielo en la Luna** (nivel 3, octubre de 2024 con llamaradas; trae el taladro de hielo). El mapa base es fijo; cada jornada suma sus propios objetos interactivos, que solo aparecen al elegirla (`only(...)` en `src/data/rooms.ts`). Los textos son propuestas del equipo; sus fuentes se revisarán.
- **Fin:** con todas las tareas cumplidas se vuelve a la Tierra (gana). Se pierde si se acaba el plazo con tareas pendientes, si el soporte vital llega a 0 o si la radiación llega a 100 %.
- **Dificultad** (se elige después de la jornada): Cadete (día de 120 s, consumo ×0,7, tutorial y consejos), Piloto (90 s, ×1, consejos) y Comandante (72 s, ×1,15, sin consejos).
- **Estrellas:** ★ completar la investigación · ★★ además volver con radiación < 50 % · ★★★ además pasar todas las llamaradas en el Refugio.
- **Puntaje:** tareas×300 + ciencia×100 + llamaradas en el Refugio×100 + días ahorrados×100 + estrellas×200.
- **Logros científicos (9):** Pronóstico experto, Refugio a tiempo, Noche lunar, Exploración lunar, Señal fuerte, Investigación completa, Tripulación sana (radiación < 30 %), Ciencia de campo (4+ de ciencia), Archivo leído.
- **Guardado local** (`localStorage`, sin datos personales): ajustes, mejor puntaje por jornada, logros, fichas leídas y tutorial visto.

## 7. Pantallas
Inicio (Jugar, Archivo científico, Logros, Ajustes, Créditos) → Historia → Selector (Tripulante: Miu, Leo (leopardo de las nieves), Güiña o Zib, el michi marciano → Jornada científica → Dificultad) → Carga con cohete (capas reales de la atmósfera) → **Estación** (HUD, mapa, panel de acciones, pausa, ajustes, envío) → **Informe** (investigación completa o incompleta, con sus tareas). El **Archivo científico** se abre desde el menú y desde la pausa.

## 8. Tutorial adaptado a 7–12 años
La primera vez que se entra (después de la historia) el juego abre una **sesión de entrenamiento aparte**: una estación de práctica con el Huerto lunar, sin puntaje ni riesgo. Aparece la tabla de **controles** y el jugador elige **Empezar tutorial** o **Saltar tutorial**. Al terminar (o saltarlo) se guarda como visto y se pasa al **selector** para elegir tripulante y primera misión; desde entonces la historia lleva directo al selector. El tutorial es **guiado dentro del mapa**, rápido y con el reloj detenido: 6 pasos cortos de la Comandante Nébula con una flecha que apunta al objetivo. Mover al michi, mirar las barras (cada acción cuesta), **usar una vez el objeto de la investigación elegida** (algas, taladro de hielo o panel de pruebas; en *Energía del Sol* solo se explica porque necesita una tormenta de polvo), **cosechar en el invernadero**, entender las tormentas de polvo y las llamaradas, y cómo se completa la jornada (tareas y antena en Comunicaciones), y cierra con «Elegir mi misión». Las acciones del tutorial son reales y cuentan para las tareas. Se puede repetir desde Pausa → Controles (dentro de una partida, sin salir de ella). En Cadete y Piloto, después, la Comandante da consejos puntuales ("Queda poco aire y comida: ve a Soporte vital"). Los textos son cortos, con frases simples, y los términos técnicos se explican en contexto.

## 9. Controles
Flechas/WASD para caminar · E para usar la máquina cercana · 1/2 para elegir la acción · Espacio para saltar (gravedad lunar real) · M para el mapa · Esc/P para pausar. Todo se puede hacer también con ratón o pantalla táctil: clic en el piso para caminar y en una máquina para ir y usarla. Shift = impulso (dash) con su barra propia; 1 y 2 eligen la acción de la máquina.

## 10. Pendiente para la iteración 2
Verificar el archivo contra DONKI con una clave de API, agregar datos de OSDR a la Enfermería, minijuego de 60 s en la Esclusa, campaña "De la Luna a Marte" con demora de comunicaciones marciana, más animales e i18n (ver REPORTE-CALIDAD.md).


## 11. Misión final «Casa» **[PROPUESTA]** (`src/sim/entry.ts`, `src/scenes/Reentry.ts`)
Se desbloquea al ganar las tres jornadas y aparece en el selector. Cuatro fases sin texto, cada una un minijuego:
1. **Giro e inspección:** la nave gira a 0,75 °/s **[REAL: R-bar Pitch Maneuver, JSC-63400]** (480 s por vuelta; en el juego 24 s). Cuando el vientre mira a las ventanas se tocan las losetas dañadas para fotografiarlas. Cada daño sin encontrar sube el calor del reingreso.
2. **Quemada:** alinear la nave con la marca verde y mantener el motor hasta llenar el indicador.
3. **Reingreso:** mantener la nave en un corredor en S con el alabeo sin llevar el calor al rojo; hay un tramo de apagón de plasma **[MODELO: duración simplificada, verificar]**.
4. **Planeo:** sin motor, controlar la nariz para tocar la pista (Isla de Pascua, Mataveri **[verificar]**) justo al final.
Estrellas: ★ aterrizar · ★★ calor bajo el límite · ★★★ además inspección completa y todas las fases con buena calidad. Las fases usan un modelo 1-D educativo, no una simulación real **[MODELO]**.

## 12. Capa narrativa «Laboratorio Chile» (`src/data/chapters.ts`, `src/scenes/MissionReport.ts`, `Reentry.ts`)
**Premisa:** toda la trama es la misión que se planea en la base lunar con los insumos que llegan para investigación científica chilena, hasta el regreso a la Tierra. No hay mecánicas nuevas: es una capa de contexto sobre las 3 jornadas y «Casa».
- **Cuatro capítulos:** Aire y comida (huerto lunar), Energía y señal (paneles solares), Datos para todos (hielo lunar) y De vuelta a casa («Casa»). Cada uno muestra, en el informe de misión o al aterrizar, un mensaje de la Dra. Almendra (Control Tierra-Chile) y un botón «Leer la ficha real» que abre el Archivo.
- **Mensajes de la Tierra:** etiqueta **[RECREACIÓN]**; personaje ficticio (Ley 19.628: no hay personas reales como personajes).
- **Archivo «Chile y EE. UU.»:** 7 fichas con fuente oficial (Acuerdos Artemis, red de seguimiento, ACT, ARADS, ayuda de 1960, Alianza para el Progreso, Cerro Tololo).
- **Carteles en la estación:** 6 carteles de pared (`cartel-*.svg`, generados con `herramientas/carteles_chile.py`) que abren la ficha correspondiente; no estorban al caminar.
- **Honestidad:** el juego dice que el contenedor chileno real está en la ISS (órbita baja) y que la base lunar es ficción. No nombra instituciones; no afirma que las algas sean los extremófilos chilenos ni que experimentos chilenos hayan volado a la Luna.
- **Idiomas:** selector español/inglés (`src/core/i18n.ts`; el texto en español es la clave del diccionario). Cambiar de idioma recarga la página.
- **Fuera de alcance (ola 2):** ALMA + EHT, Mataveri, POLARIS.

## 13. Fase E: la sonda (`src/sim/finale.ts`, `src/core/finaleGames.ts`, `Station.runFinale`) — versión con recortes
Con todas las demás tareas hechas, la antena de Comunicaciones muestra «Llamar a la sonda». Cadena: **contacto** (cables de la antena, juego existente) → **cinturón** (40 s, tres carriles fijos, esquiva rocas y recoge baterías, chips y algas) → **entrega** (4 s, frena con cohetes) → **rover lunar** (60 s + 4 s por batería hasta +16 s; avanza solo, se controlan freno y salto; 8 rocas; un cráter sin saltar vuelca: −3 s). Nunca se pierde.
- **Nota:** `0,2 × contacto + 0,3 × cinturón + 0,5 × luna`; cinturón `0,6 × ítems/aparecidos + 0,4 × casco/3`; luna `0,75 × rocas/8 + 0,25 × (1 − min(vuelcos,3)/3)`.
- **Cierre:** tarea `probe` (etapa 2, última) por jornada; `Simulation.otherTasksDone()` / `completeProbe(score, rocas, carga)`. El reporte suma «Rocas lunares x/8» y «Carga entregada», y el mensaje 4 reescrito [RECREACIÓN].
- **Honestidad:** [DIBUJO] los asteroides están muy juntos (en la vida real el cinturón está casi vacío); [DIBUJO] sonda propia, sin logo; el rover teleoperado es inventado.
- **Recortes aplicados:** cinturón en 3 carriles, rover que avanza solo, sin flecha de chips en pantalla completa (solo el contador), sin fichas nuevas aún (`asteroid-belt`, `moon-rocks`, etc. esperan fuente nasa.gov).
- **Pendiente:** fichas de la sección 7 del doc v2 (cada una con fuente oficial), prueba con niños y ajuste de dificultad, arte final de la sonda.

## 14. Fase C: «ADN de papel» y biofirmas (`src/sim/dna.ts`, `src/core/dnaGame.ts`) — implementada
- **Taller de ADN de papel:** antes de cosechar (una vez por jornada) se arma sensor + función + interruptor, se prueba una cápsula de 12 s (comprimida) y se puede ajustar una vez. Nota `0,6 × ajuste + 0,4 × eficiencia`; la cosecha se multiplica por `0,7 + 0,3 × nota` (un diseño malo rinde poco, nunca castiga más). Problema por jornada: poca luz / pico de radiación / noche fría. Explorador ve resaltado el sensor correcto; Ingeniero no.
- **Biofirmas:** tras el espectro del taladro de hielo hay tres pruebas (espectro, repetir, control). Con vida las tres coinciden; sin vida el espectro coincide igual pero las otras no. El juego nunca dice «hay vida»: dice «indicio» o «sin indicio». Informar con menos de dos pruebas avisa «falsa alarma posible» una vez, sin castigo. La calidad del taladro es el promedio del espectro y las pruebas.
- **Reporte:** línea «Circuito de ADN de papel x %».
- **Fichas nuevas (fuente NASA):** `synthetic-biology-light`, `biosignature`, `radiation-microbe`.
- **Recortes:** las 8 piezas están disponibles desde la primera jornada (sin desbloqueo 3/6/9); sin Cuaderno con balance de energía (no existe en el repo); sin descifrar el Diario con el código genético; sin segunda cepa. Pendiente: probar con niños y ajustar números.

## 15. Personajes: morro y boca felina (`herramientas/michi_papel.py`, `juego/src/core/art.ts`)
Los cuatro tripulantes (Miu, Leo, Güiña, Zib) llevan un morro algo más grande (parche claro bajo la nariz y nariz ~35 % mayor) y boca felina caricaturizada en «ω» (neutral, sonrisa abierta con lengüita, «ω» invertida al dolerse). **Tomás pasa a llamarse Leo** y se explicita como **leopardo de las nieves** (aparece en el selector). Los sprites se regeneran con `RENDERER=cairosvg python3 herramientas/render_michi_papel.py <carpeta>` si no hay Chromium, y se exportan con `herramientas/exportar_juego.py`.

**Ojos estilo anime.** Los ojos son más grandes en proporción a la boca (la boca se reduce ~10 %) y están más separados (±7,6 u. en la hoja de sprites, antes ±6), con doble brillo. Güiña conserva el iris de color y la pupila vertical; Zib mantiene ojos algo mayores (×1,22). Se actualizaron también los avatares SVG de `art.ts` (`michiSvg`, `michiFaceSvg`).

**Sonda dibujada (Fase E).** La «entrega» pasa de rectángulo a **alunizaje de 4,2 s**: la sonda ([DIBUJO] propia, sin logo: cuerpo dorado, ojo-cámara, antena, paneles, 4 patas) frena hasta velocidad cero con su motor, despliega las patas, toca sin rebotar (amortiguan las patas), el polvo vuela en arcos bajos y no queda flotando (sin aire) y el rover sale por una rampa. En el **cinturón** la nave es la misma sonda con patas plegadas: se desliza entre carriles con amortiguación, se inclina hacia donde va y suelta chorritos de gas frío; las rocas son irregulares y giran. Solo cambió el dibujo (`finaleGames.ts`); la lógica, las notas y los tiempos de juego no.

**Revisión de maquetación y accesibilidad.** Causa del fallo del selector: las tarjetas fijaban `min-height: 360 px` y la rejilla no tenía `min-height: 0` ni scroll, así que con 5 jornadas empujaba Atrás/Siguiente fuera del lienzo de 1280×720. Ahora título, pasos y pie son fijos y solo la rejilla se desplaza (barra visible, `align-content: safe center`). Mismo arreglo preventivo en paneles de ventana (ajustes, logros, créditos), informe final y archivo. Accesibilidad: paso actual con `aria-current`, grupo de opciones nombrado por su título (que se anuncia al cambiar), diálogos con `aria-labelledby`, botones pequeños de 44 px mínimo y fichas de 12 px. **Pendiente:** comprobar en navegador real (1280×720 y pantallas pequeñas) el aspecto de las barras de desplazamiento; no se pudo capturar la pantalla en este entorno.


## 16. Capítulo final reforzado (reingreso, carretera espacial, hábitat)
- **Reingreso:** fase 2 de «Casa» usa `sim/reentry.ts` + `core/reentryGame.ts` (orbitador con alabeo, calor, g, apagón). El viaje de regreso (`ReturnTrip`) ahora es más lento y con orbitador. Datos reales pendientes de verificar (ver SOURCES.md).
- **Cinturón:** `mountBelt` ahora es una «carretera» pseudo-3D vista desde detrás de una sonda tipo New Horizons; estrellas que se abren, Saturno, cometa y destellos **[DIBUJO]**; las órdenes llegan con retardo **[MODELO]**. La lógica de `sim/finale.ts` no cambió.
- **Narrativa:** la historia y los capítulos apuntan a investigar si la Luna podría ser habitable (aire y comida, energía y señal, agua), conectada a la misión real chilena en la ISS y a los laboratorios naturales; indicador «n/4» en el reporte. Sin verificar visualmente en navegador.

## 17. Regreso «Rueda detenida» — etapa 1 (`sim/voyage.ts`, `core/dialogue.ts`, `core/voyageGames.ts`, `core/voyageArt.ts`, `data/voyageScript.ts`, `scenes/Reentry.ts`)
- Casa ahora empieza con el tramo 1: GO/NO-GO (estado de la nave según las estrellas de las 3 jornadas), la vista, señal perdida (sintonía de radio), el aire (adaptador de CO₂) y apagar para volver (presupuesto de energía). Luego siguen inspección, quema, reingreso y planeo.
- Tres finales: A «Rueda detenida», B «El rescate», C «Silencio» (siempre se puede reintentar). Reglas **[PROPUESTA]** en `endingFor`.
- Diálogos estilo máquina de escribir con aviso accesible, `calm` quita temblor y estática, subtítulos siempre visibles.
- Pendiente (etapas 2 y 3): voltereta, quema y apagón con arte por capas y más mecánica; mejorar el cinturón, la entrega y el rover; tarjetas de datos en Modo Ingeniero; elegir el nombre final de la nave. Sin verificar en navegador.
