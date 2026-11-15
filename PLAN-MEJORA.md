# Plan de mejora — Michinautas frente al desafío «Junior Astronaut Mission Trainer»

## Contexto

Los cinco agentes del repo (`desafio-tradeoffs`, `desafio-publico-infantil`, `desafio-datos-nasa`, `desafio-accesibilidad-web`, `desafio-cobertura-final`) dieron el mismo veredicto: **cumple parcial**. El juego funciona, `tsc` pasa limpio y es honesto con sus fuentes, pero el corazón del desafío (que ninguna decisión sea gratis) está flojo y el juego le promete al niño cosas que no existen.

Lo que más pesa, verificado en el código:

| Brecha | Evidencia |
|---|---|
| Ningún recurso aprieta: energía (100, −5/día) y comida (70, −7/día) no pueden agotarse en 7 días | `sim/simulation.ts:53`, `sim/rules.ts:10` |
| La noche lunar no afecta a los paneles, aunque el juego dice «los paneles no producen» | `simulation.ts:335` no usa `light`; `Station.ts:561` |
| El blindaje es gratis: basta estar en la nave | `rules.ts:61`, `simulation.ts:159` |
| El pronóstico solar no existe (`forecasted = false` fijo), pero los avisos mandan a «pedirlo en el Puente» | `simulation.ts:379`, `Station.ts:570,580` |
| La demora Tierra–Luna (2,56 s) solo bloquea un botón; la antena débil no cuesta nada | `simulation.ts:279`, `noLink` nunca se devuelve |
| 2 de 3 jornadas usan una semana sin llamaradas: el dato real de NASA casi no se juega | `missions.ts:41,53`, `donki-archive.ts:29` |
| La fuente NASA no sale en el HUD (`sourceCredit` solo se usa en tests) | `missions.ts:99` |
| En táctil no se puede salir de un minijuego, pausar, abrir el mapa ni saltar | `Station.ts:717,1256-1264` |
| El despegue dura ~25 s, no se salta y se repite en cada «Reintentar» | `LaunchLoading.ts:529,785` |
| README dice «pendiente» sobre cosas ya hechas; GDD contradice al código | `README.md:46,109`, `GDD.md:1,12,38,48` |

Decisiones tuyas ya tomadas: **se mantienen las 5 barras** y **el juego se traduce al inglés**.

Patrones que se respetan: Phaser 4 + TypeScript strict; reglas numéricas solo en `sim/rules.ts`; textos en `data/`; HUD en HTML con clases `mn-*`; colores solo por tokens (`design/tokens.json` → `npm run tokens`, nunca editar `tokens.css` a mano); comentarios en español, identificadores en inglés; Conventional Commits en inglés con scope, sin coautor.

Las fases van en orden de impacto. Si el tiempo se acaba, se corta desde abajo: las fases 1 a 3 son las que mueven el veredicto.

---

## Fase 1 — Que cada decisión cueste (simulación)

Archivos: `sim/rules.ts`, `sim/simulation.ts`, `sim/types.ts`, `data/actions.ts`, `data/rooms.ts`, `data/missions.ts`, `scenes/Station.ts` (solo textos de avisos).

1. **Noche lunar real.** En `advance`, la regeneración pasa a `PANEL_REGEN_PER_DAY * panelEfficiency * light`; `panelsOk` usa el mismo factor. Subir `PANEL_REGEN_PER_DAY` (≈9) para que el día siga sobrando, y bajar la energía inicial (≈60). Así pedalear (energía por comida) deja de ser opcional de noche.
2. **Comida y aire que aprietan.** `PASSIVE_PER_DAY.food` ≈ −12 y `OXYGEN_REGEN_PER_DAY` ≈ 10: sin cosechar ni algas, la comida se acaba hacia el día 5. Curarse deja de ser inútil.
3. **Blindaje con costo de energía** (el ejemplo literal del desafío). Nueva constante `SHIELD_ENERGY_PER_SEC`: durante una llamarada, estar protegido gasta energía; con energía en 0, `SHELTER_FACTOR` sube a 0,5. La decisión queda aguas arriba: guardar reserva para la tormenta o gastarla en ciencia.
4. **Pronóstico solar con demora.** Acción nueva `forecast` en la antena de Comunicaciones (`cost: { energy: -3 }, delayed: true`), reutilizando `pending`/`resolvePending` y `EARTH_MOON_ROUND_TRIP_SEC`. Al resolverse activa el pronóstico por el resto de la jornada: `forecasted = true` y aviso de `FLARE_WARNING_SEC.forecasted` (25 s en vez de 10 s). `canAct` devuelve `noLink` si `!radioOk` (el texto ya existe en `data/actions.ts`).
   - Para que la antena se pueda reparar antes del final, `stageLocked` (`simulation.ts:130`) deja de bloquear la acción `repairAntenna`; la tarea de etapa 2 «Avisar a la Tierra» solo cuenta las reparaciones hechas con la etapa 1 completa.
   - Corregir los avisos de `Station.ts:570,580` y `MissionReport.ts:23`: el pronóstico se pide en Comunicaciones, no en el Puente.
5. **Más clima real.** «Energía del Sol» pasa de `quiet-2019` a `may-2024` (ya cargada en `donki-archive.ts`), con `tagline: 'Sol de mayo de 2024'`. «Huerto lunar» sigue con el Sol tranquilo como jornada de entrada.
6. **Limpieza de lo que quedó muerto:** razones `leak` y `night` sin uso, `MACHINE_INFO` vacío, logro `lunar-night` (hoy se da por sobrevivir 5 días; pasa a exigir una acción hecha de noche).

Los valores con ≈ son estimaciones de los agentes sin probar: se ajustan en tu prueba de juego entre fases.

Commits:
- `fix(sim): cut solar panel output during lunar night`
- `feat(sim): charge energy for flare shielding`
- `feat(sim): add solar forecast request with Earth-Moon delay`
- `feat(missions): run solar energy mission on May 2024 storm week`
- `chore(sim): retune food, oxygen and starting energy; drop unused block reasons`

## Fase 2 — Que un niño de 7 años llegue a jugar y entienda

Archivos: `scenes/LaunchLoading.ts`, `scenes/MissionReport.ts`, `scenes/Station.ts`, `scenes/Select.ts`, `data/controls.ts`, `data/actions.ts`, `sim/flares.ts`, `core/miniGames.ts`, `styles/app.css`.

1. **Despegue saltable.** Clic, Espacio o Esc llaman a `arrive()` cuando la carga terminó; botón «Saltar» igual al de `Story.ts:35`. «Reintentar» va directo a la estación.
2. **Llamaradas en palabras.** `flareName` (`Station.ts:1320`) devuelve «pequeña / mediana / enorme» según `severity()` y deja la clase real entre paréntesis: «Llamarada enorme (X9.0)». Fuera «UTC» del aviso; las alertas duran hasta que pasa el evento en vez de 4,5 s.
3. **Una pista dentro de cada minijuego**, 5 a 8 palabras durante 4 s en `openFullMini` (`Station.ts:718`): «Mantén apretado para subir la aguja», «Toca el pedal cuando llegue la nota», «Une cada pico con su huella».
4. **Minijuegos que frustran:** pedal con margen más ancho y umbral de 75 % → 50 % (`Station.ts:788`); algas con 2 agujas en Cadete.
5. **Tutorial más corto:** el modal inicial muestra 3 controles (caminar, usar, pausa); los pasos 2, 5 y 6 (`Station.ts:1197-1201`) se funden en uno. El selector abre con Miu, Huerto lunar y Cadete ya elegidos.
6. **HUD con 5 barras, sin duplicados:** la barra «Oxígeno» del traje y el estado «Aire de la nave» son lo mismo dos veces; los tres estados de equipos solo se muestran cuando algo falla.
7. **Informe que cuenta lo que hizo el niño.** La lección de victoria (`MissionReport.ts:25`) se arma con `s.stats`: salidas, radiación recibida, veces que pedaleó, llamaradas pasadas con escudo. En derrota, «la salud llegó a cero» → «la tripulación necesitó volver».

Commits:
- `feat(launch): allow skipping liftoff and skip it on retry`
- `feat(station): plain-language flare alerts and in-game minigame hints`
- `fix(minigames): widen pedal timing and simplify algae on cadet`
- `feat(tutorial): shorten onboarding and preselect first mission`
- `feat(report): build the lesson from what the player did`

## Fase 3 — Datos NASA visibles y contexto chileno

Archivos: `scenes/Station.ts`, `scenes/MissionReport.ts`, `data/encyclopedia.ts`, `data/characters.ts`, `data/missions.ts`, `core/casaGames.ts`, `SOURCES.md`.

1. **Fuente en pantalla.** `sourceCredit(this.mission)` en el pie del HUD y en el aviso de llamarada.
2. **Decisión ligada al dato real.** Al terminar cada llamarada: «Con el escudo recibiste 2. Afuera habrían sido 18.» (`flareEnd` ya trae `dose` y `total`).
3. **OSDR honesto.** La ficha `encyclopedia.ts:119` dice que el límite «se inspira en» OSDR sin que ningún valor venga de ahí: se reescribe como referencia de lectura.
4. **Verificar DONKI.** Correr `NASA_API_KEY=… npm run data:donki` (necesita tu clave; la API devolvía 429 sin ella) y revisar el diff. Si no se puede, el estado queda escrito en README y SOURCES.
5. **Contexto chileno**, siempre con fuente antes de afirmarlo:
   - Güiña: `trait` → «Felino chileno, pequeño y ágil» y ficha nueva en el Archivo.
   - Ficha «El cielo de Chile»: observatorios del norte (ALMA, Paranal) y por qué el desierto de Atacama sirve para mirar el espacio.
   - Ficha y línea en la fase de planeo de «Casa»: la pista de Mataveri, en Rapa Nui, ampliada por la NASA como aterrizaje de emergencia del transbordador. Hoy está como `[verificar]` en el GDD y no aparece en el juego.
   - En «Energía del Sol»: la tormenta de mayo de 2024 se vio como auroras en el sur de Chile (confirmar fuente antes de escribirlo).
   - Español de Chile: «ratón» → «mouse» (`controls.ts:18`), «Cosechar el invernadero» → «Cosechar las plantas».

Commits:
- `feat(station): show NASA source and shielded vs unshielded dose`
- `feat(archive): add Chilean entries and fix OSDR claim`
- `chore(data): verify flare archive against DONKI`

## Fase 4 — Diseño: quitar lo que suena a plantilla

Revisado con `antislop-ui` y `antislop-copywriting`. Archivos: `styles/app.css`, `styles/components.css`, `design/tokens.json`, `scenes/MainMenu.ts`, `scenes/MissionReport.ts`, `scenes/Select.ts`, `scenes/Encyclopedia.ts`, `scenes/Station.ts`, `core/settingsPanel.ts`.

Texto y rótulos redundantes:
- **Menú:** fuera el pie «Proyecto creado para el NASA Space Apps Challenge 2026» (ya está en Créditos); Logros, Ajustes y Créditos pasan a una fila secundaria más chica, «Jugar» queda como único botón dominante.
- **Informe:** el chip «Investigación completa» repite el título; la casilla «Tareas 3/4» repite la lista de arriba; «Sin logros nuevos esta vez.» y el rótulo «Logro nuevo» sobran. Quedan puntaje, estrellas y la lección. «Llamaradas dentro de la nave» → «Llamaradas con escudo».
- **Selector:** el título «Elige tu tripulante» repite el paso activo; «Nivel 2» repite las estrellas; la vista previa repite nombre y rol de la tarjeta.
- **Archivo:** fuera el subtítulo «¿Sabías qué? Los datos reales detrás del juego»; la categoría sale dos veces (lista y chip).
- **Estación:** fuera el título «Pausa», el párrafo del mapa («Tu cara de michi marca dónde estás…»), el chip «Sin costo directo» y el emoji ⚠ del aviso (ya hay icono).
- **Ajustes:** «Mostrar FPS» es una herramienta de desarrollo: se oculta tras `?debug`.
- Los `why` de las acciones bajan de 40-50 palabras a una frase: costo, ganancia, límite.
- Prefijos en mayúsculas «FUENTE:» y «DATO REAL:» → «Fuente:» y «Dato real:».

Estilo:
- **Vidrio en todo el HUD** (`backdrop-filter: blur` en paneles, tareas, acciones, consejos y modal, `app.css:284-297`): paneles sólidos. Además alivia los notebooks de colegio.
- **Mayúsculas con tracking** en botones, barras, chips, pasos y grupos: quedan solo en los botones; el resto pasa a minúsculas.
- **Brillos** en pistas, opción elegida y estrellas: queda uno solo, el de las estrellas ganadas.
- **Icono en todos los botones:** se quitan de «Cerrar», «Listo», «Volver», «Siguiente» y «Atrás».
- **Space Mono** queda para números (reloj, puntaje, valores de barra); los textos de fuente pasan a Fredoka.
- El planeta del menú deja de flotar en bucle.

Commits:
- `refactor(ui): remove redundant labels and filler copy`
- `style(ui): solid panels, single glow, calmer type`

## Fase 5 — Táctil e inglés

Archivos: `scenes/Station.ts`, `styles/app.css`, `index.html`, nuevo `core/i18n.ts`, nuevos `data/locales/es.ts` y `data/locales/en.ts`, todas las escenas y `data/*.ts` con texto.

1. **Táctil:** botón de salir en `openFullMini`; botones de Pausa, Mapa, Salto e Impulso en el HUD, visibles con `@media (pointer: coarse)` (reutiliza el CSS huérfano `.hud__dash`); el aviso «E» pasa a ser un botón. `#game` a `100dvh`, `viewport-fit=cover`, aviso de girar el teléfono en vertical, texto mínimo del HUD de 13 a 15 px.
2. **Inglés.** `core/i18n.ts` con `t(key)` tipado contra el diccionario español; idioma en `state.settings` (inicial según `navigator.language`), selector ES/EN en el menú y en Ajustes, que reinicia la escena igual que el cambio de tema. Va al final a propósito: se traduce el texto ya recortado en las fases 2 a 4.
   - Los textos de `data/` (acciones, misiones, logros, historia, controles, dificultades, personajes, enciclopedia, despegue) se mueven a los diccionarios; los archivos de datos guardan claves.
   - Los textos sueltos en escenas (`Station.ts`, `MissionReport.ts`, `Select.ts`, `MainMenu.ts`, `settingsPanel.ts`) y los carteles dibujados en el canvas de `LaunchLoading.ts` también.
   - `realDate` usa el locale activo en vez de `es-CL` fijo; `<html lang>` se actualiza.
   - La enciclopedia (26 fichas) es el bloque más largo: si falta tiempo, se entrega en inglés todo menos el Archivo, con una nota visible.

Commits:
- `feat(station): touch controls and minigame exit`
- `feat(i18n): add translation layer and language switch`
- `feat(i18n): move game texts to es and en dictionaries`

## Fase 6 — Documentos para los jueces y despliegue

1. **README:** tabla «Datos usados» al inicio (dataset, qué hace en el juego, en qué pantalla se ve, enlace), con DONKI, Zhang 2020 (radiación lunar), Moon Fact Sheet, demora Tierra–Luna y OSDR como lectura. Fuera los «pendiente de implementar» (`README.md:46,109,141`). Versión en inglés `README.en.md`.
2. **GDD y SOURCES:** alinear con el código: 3 jornadas de 7 días, 5 barras, estrellas por salud, 8 logros, sin «Refugio» ni envíos de la Tierra; 3 misiones y no 4; un solo conteo de enlaces. Cerrar o quitar los `[verificar]`.
3. **`.gitignore`:** hoy no existe en la raíz del repo; `juego/coverage`, `juego/test-results`, `juego/dist` y `node_modules` deben quedar ignorados. Borrar `tests/e2e/zz-smoke.tmp.spec.ts`.
4. **Despliegue** a `/var/www/michinautas`, con `gzip` para JS, CSS y SVG en nginx (Phaser pesa 1,4 MB sin comprimir). Sigue servido por HTTP e IP: un dominio con HTTPS quitaría el aviso «No seguro», queda a tu decisión.

Commits:
- `docs(readme): add datasets table and English version`
- `docs(gdd): align design doc and sources with the code`
- `chore(repo): add gitignore and drop temp smoke test`

---

## Verificación

- Tras cada fase: `npm run typecheck` y `npm run build` dentro de `juego/`. Sin Playwright ni capturas, según tu indicación.
- Después de cada fase me detengo para que pruebes el juego. Qué mirar:
  - **Fase 1:** en Cadete, ¿se llega al día 7 sin pedalear ni cosechar? No debería. ¿La noche (días 5 a 7) obliga a elegir entre ciencia y reserva? ¿El pronóstico cambia el aviso de 10 s a 25 s? ¿Una llamarada con poca energía duele?
  - **Fase 2:** primera partida desde cero: tiempo hasta controlar al michi en la misión real.
  - **Fase 5:** recorrido completo en un teléfono, y en inglés.
- Los tests unitarios de balance (`tests/unit/balance.test.ts`, `simulation.test.ts`) y el e2e `navigation.spec.ts:95` van a quedar desfasados con la fase 1. Siguiendo tu instrucción de no correr suites no se actualizan en este plan; queda anotado como deuda.
- Despliegue final al VPS y revisión del sitio publicado.
