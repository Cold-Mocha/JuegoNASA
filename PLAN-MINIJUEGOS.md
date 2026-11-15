# Plan de mejora de los minijuegos — Michinautas

## Contexto

El juego tiene **14 minijuegos**: 10 en la estación (`core/miniGames.ts`, `dustGame.ts`, `sealGame.ts`, `testPanelGame.ts`) y 4 en la misión final «Casa» (`core/casaGames.ts`, con su modelo en `sim/entry.ts`). Los revisé uno por uno en el código. Funcionan, pero comparten cuatro problemas:

1. **Varios no se pueden jugar mal.** No hay nada que decidir ni que aprender: se hace clic hasta que termina.
2. **En tres, el resultado no cambia nada.** `quality()` solo escala ganancias, y `cleanDust`, `repair` y `repairAntenna` no tienen ganancia (`sim/rules.ts:104-111`).
3. **El jugador no ve cómo le fue.** Todos terminan con la misma marca verde, saque 0,2 o 1.
4. **En PC con teclado quedan a medias.** `Station.ts` solo reenvía las flechas; lo demás exige mouse o Tab + Enter.

Lo que encontré en cada uno:

| Minijuego | Problema verificado | Evidencia |
|---|---|---|
| Limpiar paneles | Exige limpiar el 96 %: el final es buscar motas que casi no se ven. Sin reloj ni puntaje: siempre vale 1 | `dustGame.ts:14,162` |
| Panel de pruebas | Repite la limpieza completa con polvo fijo y después apunta a un Sol quieto: arrastrar lo alinea al instante. No muestra cuánta energía da el panel, que es la pregunta de la investigación | `testPanelGame.ts:112`, `:43` |
| Cultivo de algas | Con mouse solo se puede sostener una aguja a la vez y no hay teclas para las otras | `miniGames.ts:476-481` |
| Sellar la fractura | Basta pasar cerca: garabatear encima sella igual. Siempre vale 1 | `sealGame.ts:136-138` |
| Cables de la antena | Cada cable y su enchufe tienen el mismo color y la misma figura. Equivocarse no cuesta y el resultado se descarta | `miniGames.ts:41-42`, `Station.ts:801` |
| Mensaje con ruido | 2 casillas dañadas de 6, con 2 opciones cada una, sobre un patrón de 3: se resuelve sin mirar | `miniGames.ts:316-318,331` |
| Biofirmas (taladro) | Los picos están pintados del color de su huella y el de ruido es gris: es emparejar colores. La idea de «no sobreinterpretar» no llega a jugarse | `miniGames.ts:380`, `app.css:577` |
| Pedalear | 14 notas siempre alternadas al mismo ritmo. Apretar de más no penaliza: aporrear los dos pedales acierta todo | `miniGames.ts:240,278-287` |
| Curarse | 4 puntos que se mantienen 0,9 s. Puntúa por rapidez: castiga justo a los más chicos | `miniGames.ts:157,205` |
| Cosechar | Las 12 plantas están a la vista desde el inicio y las maduras llevan fruta roja y una estrella: es tocar lo rojo | `miniGames.ts:98-110` |
| Casa 1, inspección | Las losetas dañadas brillan; solo se pueden tocar el 39 % del tiempo (vientre visible). Sin teclado | `casaGames.ts:44-46`, `entry.ts:17` |
| Casa 2, quemada | La nave sigue al puntero: mantenerla alineada no cuesta | `casaGames.ts:107-110` |
| Casa 3, reingreso | El mejor del grupo. Le falta avisar el apagón antes de que empiece | `casaGames.ts:167` |
| Casa 4, planeo | Seguir un punto guía con dos botones; correcto pero plano | `casaGames.ts:230-232` |

Además, ninguno tiene sonido propio (solo suena el final, desde `Station.ts`), y los de «Casa» no tienen pista ni botón de salir como los de la estación.

Patrones que se respetan: Phaser 4 + TypeScript strict; los minijuegos son DOM y canvas sin Phaser; números de juego en `sim/`; textos en `data/locales/` vía `t()`; colores por tokens; comentarios en español, identificadores en inglés; Conventional Commits en inglés con scope, sin coautor.

---

## Decisiones que necesito de ti

Tomo la opción recomendada si no dices otra cosa.

1. **Dificultad por nivel.** Recomiendo que Cadete, Piloto y Comandante cambien cada minijuego (hoy solo las algas). Alternativa: una sola dificultad, más simple de balancear.
2. **Fallar un minijuego.** Recomiendo que nunca se pierda el turno: jugar mal da menos, como hoy. La excepción actual es el pedal, que puede dar cero; propongo quitarla.
3. **Cables de la antena.** Recomiendo fundirlos con el mensaje en un solo minijuego de dos pasos, en vez de dos pantallas seguidas.

---

## Fase A — Base común (primero, porque todo lo demás la usa)

Archivos: `core/miniGames.ts` (interfaz), `scenes/Station.ts`, `scenes/Reentry.ts`, `core/audio.ts`, nuevo `sim/minigames.ts`, `sim/rules.ts`, `sim/simulation.ts`, `styles/app.css`, `data/locales/*`.

1. **Que el resultado importe siempre.** Tres acciones pasan a depender de la calidad:
   - `cleanDust`: con calidad baja queda un resto de polvo (`dust = 0,15 × (1 − puntaje)`), en vez de quedar siempre en 0.
   - `repair`: el sello devuelve algo del aire perdido (`+8 oxígeno × calidad`).
   - `repairAntenna`: la antena queda entre 0,75 y 1 según la calidad; una reparación floja vuelve a fallar antes.
2. **Resultado visible.** Al terminar, 1 a 3 estrellas según el puntaje y la ganancia real («+8 energía»), en lugar de la marca verde igual para todos.
3. **Teclado completo en PC.** `MiniGameHandle` gana `key?(key, down)`; `Station.ts` y `Reentry.ts` reenvían Espacio, Enter, 1-4 y A/S/D además de las flechas. Cada minijuego declara sus teclas y la pista las muestra.
4. **Pista animada.** La frase de 4 s se acompaña de una demostración corta del gesto, como ya hace el cepillo (`dust__brush.is-demo`). Se omite con movimiento reducido.
5. **Sonido propio.** Tres efectos nuevos generados por código en `core/audio.ts`: acierto, error y tic de ritmo.
6. **Puntaje fuera del DOM.** Las fórmulas de puntaje y los parámetros por dificultad pasan a `sim/minigames.ts` (TypeScript puro), igual que `sim/entry.ts` hace con «Casa».
7. **Marco único.** Los cuatro de «Casa» usan el mismo marco que los de la estación: pista, botón Salir y resultado.

Commits:
- `feat(sim): make dust, seal and antenna quality affect the outcome`
- `feat(minigames): show stars and real gain at the end`
- `feat(minigames): full keyboard support and animated hints`
- `feat(audio): add hit, miss and beat sounds for minigames`
- `refactor(minigames): move scoring and difficulty tables to sim`

## Fase B — Los 10 de la estación

Cada punto dice qué cambia y qué aprende el niño.

1. **Limpiar paneles.** Termina al 90 % y las últimas motas brillan para que se encuentren. Aparece un medidor de energía del panel que sube mientras se limpia. Puntaje por pasadas: menos trazos, más estrellas. Como se juega afuera, demorarse ya cuesta oxígeno del traje.
   *Aprende:* el polvo tapa la luz; limpiar bien rinde más.
2. **Panel de pruebas.** Tres lecturas en vez de dos tareas sueltas: medir sucio, limpiar una franja (no el panel entero) y medir limpio; después seguir al Sol, que se mueve despacio, durante unos segundos. Al final muestra los tres números lado a lado.
   *Aprende:* la respuesta de la investigación: cuánto quita el polvo y cuánto el ángulo.
3. **Cultivo de algas.** Teclas A, S y D para sostener cada aguja. La relación luz → temperatura se dibuja con una flecha entre las dos columnas. Piloto: 3 agujas; Comandante: franjas más angostas.
   *Aprende:* subir una cosa mueve otra.
4. **Sellar la fractura.** Puntaje por precisión: el sellador se gasta (barra) y lo que se aplica lejos de la grieta se pierde. El aire que escapa se ve y se apaga tramo a tramo.
   *Aprende:* el material es limitado; se sella donde está la fuga.
5. **Antena (cables + mensaje, fundidos).** Paso 1: cables cruzados donde el enchufe muestra solo la figura, sin color; cada error baja la señal. Paso 2: el mensaje, con dificultad real (Cadete 2 huecos y 2 opciones; Piloto 3 y 3; Comandante 3 huecos, 4 opciones y patrón de 4). La señal del paso 1 decide cuántas casillas llegan dañadas.
   *Aprende:* con mala señal llega menos mensaje; la repetición permite recuperarlo.
6. **Biofirmas.** Los picos dejan de estar pintados: se distinguen por su posición en el espectro, y cada tarjeta muestra la posición de su huella. El pico de ruido tiene una forma distinta (angosto e irregular) y hay un botón «es ruido» para descartarlo, que cuenta como acierto.
   *Aprende:* un pico solo no prueba nada; hay que comparar con la referencia y saber descartar.
7. **Pedalear.** Apretar sin nota cuesta (resta de la barra). Patrones con dobles en Piloto y Comandante, y tempo según el nivel. Tic sonoro por nota. La barra de energía de la estación se ve subir. Se quita el fallo total (decisión 2).
   *Aprende:* el ritmo constante rinde más que el apuro.
8. **Curarse.** Cada herida pide un tiempo distinto, marcado en su anillo: se suelta dentro de la marca. Pasarse o quedarse corto baja la calidad. Deja de puntuar por rapidez.
   *Aprende:* cada cosa necesita su tiempo justo.
9. **Cosechar.** Las plantas maduran durante el juego: verde → madura → pasada. Cosechar verde da poco, madura da todo y pasada no da nada. Fuera la estrella que marca las maduras.
   *Aprende:* esperar el momento, sin esperar de más.
10. **Coherencia.** Todos muestran el reloj y el progreso en el mismo lugar y con la misma forma.

Commits, uno por minijuego:
- `feat(minigames): dust cleaning with power meter and stroke score`
- `feat(minigames): test panel measures dirty, clean and angle`
- `feat(minigames): algae keys and visible light-heat link`
- `feat(minigames): seal precision with limited sealant`
- `feat(minigames): merge antenna wires and noisy message`
- `feat(minigames): biosignature by spectrum position with noise discard`
- `feat(minigames): pedal patterns and empty-press cost`
- `feat(minigames): heal by timing instead of speed`
- `feat(minigames): harvest with ripening plants`

## Fase C — Los 4 de «Casa»

Archivos: `core/casaGames.ts`, `sim/entry.ts`, `scenes/Reentry.ts`.

1. **Inspección.** Las grietas dejan de brillar: se ven como marcas oscuras entre losetas sanas con manchas parecidas. Tocar una sana gasta una de 6 fotos. Flechas y Enter para moverse entre losetas.
2. **Quemada.** La nave tiene inercia: no salta al puntero, se acelera hacia él. El combustible es limitado y lo que sobra suma al puntaje.
3. **Reingreso.** Aviso 2 s antes del apagón y, durante el apagón, se oculta el corredor que viene: hay que recordar la curva.
4. **Planeo.** Indicador de velocidad con franja segura y viento lateral que empuja la trayectoria. Aterrizar muy rápido o muy lento baja el puntaje.

Commits:
- `feat(casa): hidden cracks with limited photos`
- `feat(casa): burn with inertia and fuel budget`
- `feat(casa): blackout warning and hidden corridor`
- `feat(casa): glide with speed band and crosswind`

---

## Orden y corte

La fase A va primero y completa. En la fase B el orden por impacto es: antena, biofirmas, pedal, cosecha, panel de pruebas, limpieza, sellado, curarse, algas. La fase C es la última: «Casa» se desbloquea después de ganar las tres jornadas, así que es lo que menos jugadores ven. Si el tiempo se acaba, se corta desde abajo.

## Verificación

- Tras cada commit: `npm run typecheck` y `npm run build` en `juego/`. Sin Playwright ni capturas.
- Los textos nuevos entran a `es.ts` y `en.ts` en el mismo commit (el tipo de `en` no compila si falta una clave).
- Qué mirar al probar:
  - **Fase A:** ¿se entiende el resultado sin leer? ¿Se puede jugar todo sin tocar el mouse?
  - **Fase B:** jugar cada uno mal a propósito: ¿da menos, y se nota por qué?
  - **Cadete:** ¿un niño de 7 años termina cada uno al primer intento?
- Riesgos:
  - Todos los valores nuevos (tiempos, márgenes, penalizaciones) son estimaciones sin probar.
  - Los cambios de la fase A en `sim/` alteran el balance de la partida; los tests de balance ya están desfasados desde el plan anterior.
