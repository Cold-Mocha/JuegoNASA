# Game Design Document — Michinautas (3 jornadas de 7 días, 5 barras, blindaje con costo y pronóstico solar)

> Cambios de esta iteración y su justificación frente al reto: ver `ESTUDIO-SIMPLIFICACION.md`.

**Género:** gestión de recursos y supervivencia en 2.5D · **Público:** 7–12 años (también sirve para familia y aula) · **Plataforma:** navegador, sin descarga ni cuenta · **Reto:** NASA Space Apps 2026, *Build a Junior Astronaut Mission Trainer*.

## 1. Fantasía y objetivo educativo
Eres un michi astronauta en la **Estación Central**, un puesto lunar ficticio, en una **jornada científica**: una investigación con una lista de tareas (por ejemplo, buscar hielo, cultivar algas o estudiar las llamaradas). Al cumplir todas las tareas, la tripulación **vuelve a la Tierra**. El plazo son 7 días lunares comprimidos, y de fondo se vive una **semana real del Sol** con sus llamaradas (archivo DONKI de la NASA). Los **5 recursos** (energía, oxígeno, comida, salud, radiación) son **secundarios**: hay que cuidarlos para poder investigar.
**Lo que el niño se lleva:** *ninguna decisión es gratis*. El blindaje contra una llamarada gasta energía; de noche los paneles no producen y pedalear cuesta comida; salir a la superficie avanza la investigación pero suma radiación; el pronóstico solar cuesta energía y solo llega si cuidas la antena.

## 2. Bucle principal
1. Mirar las 5 barras (energía, oxígeno, comida, salud y radiación) y la jornada (día / atardecer / noche). Los equipos (reciclador, paneles, radio) solo aparecen en el HUD cuando algo falla.
2. Caminar por la estación, que es **un solo plano continuo** (sin pantallas de carga): dentro de la nave están Soporte vital, Puente, Enfermería, Comunicaciones y Esclusa; afuera, el Invernadero (con aire) y la Superficie lunar (el traje gasta oxígeno). Se camina con el teclado, con un clic en el piso o con un clic en una máquina (el michi camina solo hasta ella). El mapa (M) es solo para mirar. **Caminar gasta tiempo.** **Luz:** la estación se oscurece pareja a medida que baja la energía.
3. Usar la máquina de la sala. Cada acción muestra su costo antes de elegirla.
4. Reaccionar a eventos: llamaradas reales, tormentas de polvo, fracturas del reciclador y recursos críticos.
5. Cumplir las tareas dentro de las 7 jornadas → puntaje, estrellas, logros y «lo que aprendiste», armado con lo que hizo el jugador.

## 3. Salas, objetos y minijuegos (`src/sim/rules.ts`, `src/data/rooms.ts`)
Todos los minijuegos son **a pantalla completa**: solo el juego, una pista de 5 a 8 palabras durante 4 s y un botón Salir (o Esc). Cada uno devuelve un puntaje 0–1 y la *calidad* `0,4 + 0,6 × puntaje` **[PROPUESTA]** escala solo las ganancias, nunca los costos ni la radiación: jugar mal no deja la acción en cero ni la regala.
| Sala | Objeto | Minijuego | Efecto |
|---|---|---|---|
| Superficie | Limpieza de polvo (siempre) y Panel de pruebas (*Energía del Sol*) | Cepillo: limpiar dos paneles con su pata | Paneles limpios: la energía se renueva; el oxígeno del traje sigue bajando mientras se limpia |
| Soporte vital | Reciclador de oxígeno: decorativo hasta que se rompe | Sellador: seguir la grieta | Con la fractura abierta el oxígeno de la nave se escapa; sellarla lo regenera |
| Invernadero | Rack de plantas (siempre) y Cultivo de algas (*Huerto lunar*) | Cosecha: tocar solo las plantas maduras. Cultivo de algas (*Huerto lunar*): mantener apretadas luz, nutrientes y temperatura en su franja verde (la luz calienta el tanque) | +20 comida × calidad; las algas dan O₂ y comida × calidad, una vez por día |
| Enfermería | Camilla | Curarse: mantener apretadas 4 heridas | +25 salud × calidad (más rápido, más calidad) |
| Superficie (a la izquierda) | Antena de la Tierra | Cables (si la señal está floja) y **Mensaje con ruido**: completar el patrón dañado por la estática. **Pedir el pronóstico solar** no tiene minijuego | Reparar la antena (−5 energía) se puede siempre; como tarea «Avisar a la Tierra» solo cuenta con la investigación terminada. El pronóstico (−3 energía) responde tras 2,56 s y adelanta los avisos de llamarada de 10 s a 25 s mientras la señal sea ≥ 60 % |
| Puente | Bicicleta de energía | Pedalear: seguir el ritmo con dos pedales | +10 energía × calidad, −3 comida, hasta 3 por jornada |
| Superficie | Taladro de hielo (*Hielo en la Luna*) | Biofirmas: emparejar picos del espectro con su huella; un pico es ruido | Cuenta para la tarea de muestras, una vez por día; los orgánicos solos no prueban vida |

**Energía [MODELO]:** parte en 50. El consumo es de 6 por jornada (por el multiplicador de dificultad). Los paneles generan 9 × su rendimiento × la luz (1 de día, 0,5 al atardecer, 0 de noche). De día sobran unos 4 en Cadete, 2 en Piloto y 1 en Comandante, y **de noche no producen nada**: solo queda la reserva y la bicicleta (energía por comida). Llegan **tormentas de polvo** (50 % por jornada, y seguras si pasaron 2 jornadas sin una) que bajan el rendimiento hasta limpiarlos.
**Oxígeno y comida [MODELO]:** el oxígeno se renueva solo (+10 por jornada) y se consume 11 por jornada. Una fractura (70 % por jornada desde el día 2, en el reciclador) corta la renovación y filtra 30 extra por jornada. La comida baja 14 por jornada: sin cosechar ni algas no alcanza para la semana. El multiplicador de dificultad escala el consumo pero no la renovación.
**Salud [MODELO]:** baja cuando el oxígeno o la comida llegan a 0, y con radiación sobre 30 %, de a poco y más rápido mientras más alta. **La radiación no se puede sacar.** Si una llamarada te encuentra afuera, recibes 20 de radiación de golpe (una vez por llamarada). Con salud 0 (o radiación 100 %) la tripulación vuelve a la Tierra.
**Límite diario:** la cosecha y las acciones propias de cada investigación (algas, taladro, panel de pruebas) se hacen una vez por jornada. Cada investigación tiene su propio minijuego en su objeto: algas (perillas de luz, nutrientes y temperatura), panel de pruebas (limpiarlo y orientarlo al Sol; solo mide, no limpia los paneles de la estación) y taladro de hielo (emparejar el espectro); la bicicleta, hasta 3.

## 4. Llamaradas (datos reales)
Cada llamarada aparece en su jornada y a su hora UTC real. La dosis de juego se calcula como `2 + 6·(log10(flujo/1e-6))^1.3`, con ×1,5 si hubo tormenta de partículas (SEP), y se reparte en 10 s. Dentro de la nave entra solo el 10 %, pero **el blindaje gasta energía** (0,4 por segundo, 4 por llamarada); con la energía en 0 entra la mitad. Al empezar una llamarada la pantalla se tiñe de magenta, suena una alarma y el michi se pone el casco. El HUD cita siempre «Clima solar real: NASA / NOAA, archivo histórico (no en vivo)» y, al terminar cada llamarada, compara lo recibido con lo que habría pasado en el otro lugar («Con el escudo recibiste 2. Afuera habrían sido 18.»). El tamaño se dice en palabras con la clase real entre paréntesis: «enorme (X9.0)».

**Aviso previo:** antes de cada llamarada aparece una alerta que dura hasta que llega, una cuenta regresiva y una flecha a la Esclusa: 25 s antes si se pidió el pronóstico y la señal es buena, y solo 10 s antes si no (`FLARE_WARNING_SEC` en `sim/rules.ts`).

## 5. Decisiones con costo
No hay power-ups gratis. Las cuatro decisiones que se repiten: **reserva o investigación** (la energía que se gasta en algas o en la antena es la que falta para el blindaje y la noche), **comida o energía** (pedalear), **investigación o radiación** (toda salida a la superficie suma dosis) y **pronóstico o ahorro** (cuesta energía y exige mantener la antena).

## 6. Jornadas científicas, puntaje y logros
- **Tareas en dos pestañas:** las 3 propias de cada jornada y «Avisar a la Tierra» (la antena), que cuenta solo cuando las otras están cumplidas. La misión se gana al cumplir las 4.
- **Jornadas** (`src/data/missions.ts`): tres, de 7 días cada una. **Huerto lunar** (nivel 1, Sol tranquilo de diciembre de 2019; trae el cultivo de algas), **Energía del Sol** (nivel 2, la tormenta de mayo de 2024 con 8 llamaradas X; trae un panel de pruebas) y **Hielo en la Luna** (nivel 3, octubre de 2024 con 2 llamaradas X; trae el taladro de hielo). El mapa base es fijo; cada jornada suma sus propios objetos interactivos (`only(...)` en `src/data/rooms.ts`).
- **Fin:** con todas las tareas cumplidas se vuelve a la Tierra (gana). Se pierde si se acaba el plazo con tareas pendientes, si la salud llega a 0 o si la radiación llega a 100 %.
- **Dificultad** (se elige después de la jornada): Cadete (día de 120 s, consumo ×0,85, tutorial y consejos), Piloto (90 s, ×1,15, consejos) y Comandante (72 s, ×1,35, sin consejos).
- **Estrellas:** ★ completar la investigación · ★★ además volver con salud ≥ 50 · ★★★ además salud ≥ 80 y todas las llamaradas pasadas con escudo.
- **Puntaje:** tareas×300 + llamaradas con escudo×100 + días ahorrados×100 + salud×2 + promedio de recursos sobrantes + estrellas×200.
- **Logros científicos (7):** A salvo a tiempo, Noche lunar (hacer una acción de noche), Exploración lunar, Señal fuerte, Investigación completa, Tripulación sana (salud ≥ 80) y Archivo leído. El avance se mide solo con la lista de tareas de la investigación (no hay puntos de ciencia).
- **Guardado local** (`localStorage`, sin datos personales): ajustes, mejor puntaje por jornada, logros, fichas leídas y tutorial visto.

## 7. Pantallas
Inicio (Jugar, Archivo científico, Logros, Ajustes, Créditos) → Historia → Selector (Tripulante: Miu, Tomás, Güiña o Zib, el michi marciano → Jornada científica → Dificultad) → Despegue (capas reales de la atmósfera; se puede saltar y «Reintentar» no lo repite) → **Estación** (HUD, mapa, panel de acciones, pausa, ajustes) → **Informe** (investigación completa o incompleta, con sus tareas). El **Archivo científico** se abre desde el menú y desde la pausa.

## 8. Tutorial adaptado a 7–12 años
La primera vez que se entra (después de la historia) el juego abre una **sesión de entrenamiento aparte**: una estación de práctica con el Huerto lunar, sin puntaje ni riesgo. Aparecen los 3 **controles** básicos (caminar, usar y pausa) y el jugador elige **Empezar tutorial** o **Saltar tutorial**. Al terminar (o saltarlo) se guarda como visto y se pasa al **selector** para elegir tripulante y primera misión; desde entonces la historia lleva directo al selector. El tutorial es **guiado dentro del mapa**, rápido y con el reloj detenido: 5 pasos cortos de la Comandante Nébula con una flecha que apunta al objetivo. Mover al michi, mirar las barras (cada acción cuesta), **usar una vez el objeto de la investigación elegida** (algas, taladro de hielo o panel de pruebas; en *Energía del Sol* solo se explica porque necesita una tormenta de polvo), **cosechar en el invernadero**, entender las tormentas de polvo y las llamaradas, y cómo se completa la jornada (tareas y antena en Comunicaciones), y cierra con «Elegir mi misión». Las acciones del tutorial son reales y cuentan para las tareas. Se puede repetir desde Pausa → Controles (dentro de una partida, sin salir de ella). En Cadete y Piloto, después, la Comandante da consejos puntuales ("Queda poco aire y comida: ve a Soporte vital"). Los textos son cortos, con frases simples, y los términos técnicos se explican en contexto.

## 9. Controles
Flechas/WASD para caminar · E para usar la máquina cercana · 1/2 para elegir la acción · Espacio para saltar (gravedad lunar real) · M para el mapa · Esc/P para pausar. Todo se puede hacer también con mouse o pantalla táctil: clic en el piso para caminar y en una máquina para ir y usarla; en pantallas táctiles aparecen botones de pausa, mapa, salto e impulso. Shift = impulso (dash) con su barra propia; 1 y 2 eligen la acción de la máquina.

## 10. Pendiente para la iteración 2
Verificar el archivo contra DONKI cuando la API responda (dos intentos fallidos, ver SOURCES.md), actualizar los tests de balance a las reglas nuevas, campaña «De la Luna a Marte» con demora de comunicaciones marciana y más animales.


## 11. Misión final «Casa» **[PROPUESTA]** (`src/sim/entry.ts`, `src/scenes/Reentry.ts`)
Se desbloquea al ganar las tres jornadas y aparece en el selector. Cinco fases casi sin texto, cada una un minijuego:
0. **Enlace con la Tierra:** apuntar la antena al planeta (flechas, botones o arrastrando) y elegir el canal que muestra la Tierra. Cuando la señal queda firme por un segundo, la fase termina. Los ángulos y canales son un modelo didáctico **[MODELO]**. Los canales equivocados restan poco y la rapidez es opcional (nunca baja de 0,4). Suma hasta 100 puntos.
1. **Giro e inspección:** la nave gira a 0,75 °/s **[REAL: R-bar Pitch Maneuver, JSC-63400]** (480 s por vuelta; en el juego 24 s). Cuando el vientre mira a las ventanas se tocan las losetas dañadas para fotografiarlas. Cada daño sin encontrar sube el calor del reingreso.
2. **Quemada:** alinear la nave con la marca verde y mantener el motor hasta llenar el indicador.
3. **Reingreso:** mantener la nave en un corredor en S con el alabeo sin llevar el calor al rojo; hay un tramo de apagón de plasma **[MODELO: duración simplificada, verificar]**.
4. **Planeo:** sin motor, controlar la nariz para tocar la pista de Mataveri, en Rapa Nui, que la NASA alargó en 1987 como aterrizaje de emergencia del transbordador **[REAL: UPI, 17-08-1987]**; antes de empezar se muestra una línea con ese dato justo al final.
Estrellas: ★ aterrizar · ★★ calor bajo el límite · ★★★ además inspección completa y todas las fases con buena calidad. Las fases usan un modelo 1-D educativo, no una simulación real **[MODELO]**.


## 12. Idiomas
Español e inglés (`src/core/i18n.ts`, diccionarios en `src/data/locales/`). El idioma inicial sale del navegador y se cambia en el menú o en Ajustes; los archivos de `data/` guardan claves, no textos.
