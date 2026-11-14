# Reporte de calidad y rendimiento: iteración 1 (14-11-2026)

## Resumen
| Verificación | Resultado |
|---|---|
| Unit tests (Vitest) | **89/89 ✓** · cobertura de `src/sim` + `missions.ts`: 99,4 % líneas, 96,3 % ramas, 98,6 % funciones |
| E2E / UI (Playwright, Chromium headless) | **11/11 ✓** |
| Typecheck (`tsc --noEmit`, strict) | ✓ sin errores |
| Auditoría de enlaces (`npm run check:sources`) | 27 enlaces, 0 rotos (1 DOI bloquea clientes automáticos; verificado a mano) |
| Consola | Sin errores ni warnings del juego (se filtran solo los avisos de rendimiento del driver GL) |

## Rendimiento (medido por Playwright, GPU integrada Intel Iris Xe, 1366×768)
| Métrica | Valor | Objetivo |
|---|---|---|
| FPS en la estación caminando | **60,3** | ≥ 60 |
| Peor frame | 16,8 ms | < 33 ms |
| Heap JS | **19,6 MB** | < 150 MB |
| Carga inicial hasta el menú | 0,63 s | < 5 s |
| Build total | 4,1 MB (Phaser 1,37 MB → 357 kB gzip; juego 92 kB) | — |
| Assets cargados por partida | ~0,6 MB (8 fondos JPG de 1152×720, 20 props PNG, 12 tiras del michi elegido) | — |

**Hallazgo:** Chromium headless sin flags usa WebGL por software (SwiftShader) y ahí incluso el menú baja a ~23 FPS. Pasa lo mismo en un PC sin drivers de GPU. Por eso:
1. Los E2E usan `--use-angle=gl-egl` para medir en la GPU integrada real, que es el perfil objetivo.
2. El modo **Ultra Ligero** cambia a renderizador **Canvas 2D** (además de quitar partículas, destellos y sacudidas). Se activa solo en equipos con ≤ 2 núcleos o ≤ 2 GB.

**Técnicas de optimización:** object pooling (`sim/Pool`, textos flotantes); partículas de Phaser con pool interno, apagadas en Ultra Ligero; física y simulación por delta-time con dt acotado (estable si la pestaña se congela); HUD HTML actualizado a 10 Hz y solo cuando cambia un valor; sin `new` por frame en el loop; nodos de Web Audio desconectados al terminar (`onended`); se carga solo la variante del tripulante elegido; texturas de la sala anterior destruidas al cambiar de sala; `powerPreference: 'low-power'`.

## Arquitectura
```
src/sim/      lógica pura (sin Phaser ni DOM), 100 % testeable
  simulation.ts  recursos, calendario lunar, llamaradas, acciones, fin de misión
  rules.ts       todos los números del diseño
  physics.ts     proyección 2.5D, movimiento y salto por delta-time, gravedades reales
  flares.ts      clases GOES, dosis, ubicación de llamaradas reales en jornadas
  graph.ts · pool.ts · rng.ts · score.ts · achievements.ts
src/data/     contenido: misiones, archivo DONKI, salas, textos, Archivo científico
src/core/     estado/guardado, audio procedural (Web Audio), panel de ajustes, UiLayer
src/scenes/   capa de render: Boot, MainMenu, Story, Select, LaunchLoading, Station, Encyclopedia, MissionReport
```
La escena `Station` solo traduce entrada → `sim.act()/travel()` y dibuja el estado. Los eventos de la simulación (`drainEvents()`) disparan sonido, alertas y animaciones.

## Bucle de calidad: lo que se encontró y corrigió
| # | Agente | Hallazgo | Corrección |
|---|---|---|---|
| 1 | QA (smoke) | La simulación leía `config` antes de crearse → la estación no cargaba | Orden de eventos por (jornada, hora); cubierto por tests |
| 2 | QA (balance) | No hacer nada **ganaba** 3 misiones: no había trade-off real | Recursos iniciales 60/70/60 y quedarse sin oxígeno daña 80/jornada |
| 3 | QA (balance) | Mayo 2024 era imposible incluso jugando bien: el Refugio queda a 5 salas de Energía y las llamaradas cada media jornada no dejaban recargar | Caminar 1,5 s/sala; paneles +3 rad; fondo 2/jornada (desviaciones del diseño v2 documentadas en el GDD) |
| 4 | QA (E2E) | Al cambiar de sala se destruía el sprite del michi (`removeAll(true)`) → error y sala sin actualizar | El michi y su sombra se sacan del contenedor antes de limpiar |
| 5 | QA (E2E) | Volver del Archivo podía dejar la estación pausada | Orden `resume` → `stop` |
| 6 | QA (E2E) | El canvas WebGL no se puede leer con `drawImage` | La verificación analiza una captura real |
| 7 | QA (edad) | Textos en femenino ("¡Bienvenida!", "Exploradora") aunque se puede elegir a Tomás | Forma neutra en tutorial y logros |
| 8 | Científico | La API DONKI devolvió 429 y el espejo CCMC no respondió | Archivo curado desde NASA/NOAA marcado `verifiedAgainstDonki: false` y texto "NASA / NOAA · no en vivo"; script `npm run data:donki` para verificar |
| 9 | Científico | 3 URLs candidatas rotas (ESA, blog NASA, DOI) | Reemplazadas por URLs que responden 200 |
| 10 | Dev | Checkbox de contraste siempre marcado (el tema es un string) | Comparación explícita |

## E2E: qué cubre
- Carga limpia: consola sin errores y canvas con contenido real.
- Navegación: menú → Logros, Ajustes (volumen, Ultra Ligero), Créditos (Esc cierra), Archivo científico (filtros, ficha, enlace oficial).
- Flujo completo: historia → selector → cohete → estación → pausa → ajustes → archivo → mapa → viaje → pronóstico (con demora) → costo de energía.
- Fin de misión (con `?timescale=50`): pantalla de resultado, puntaje y récord guardado.
- Resoluciones 1366×768, 1280×720, 1024×600 y 1920×1080: botones dentro de la pantalla, sin solapamiento del HUD, sin scroll y letra ≥ 13 px.
- Rendimiento: tiempo de carga, FPS, peor frame y heap.

## Auditoría de edad (7–12)
- **Vocabulario:** frases cortas; términos técnicos explicados en contexto (sol = jornada, llamarada, radiación, "ida y vuelta a la velocidad de la luz"). Las fichas del archivo tienen ≤ 260 caracteres (verificado en un test).
- **Dificultad:** Cadete → Piloto → Comandante es estrictamente creciente (verificado en un test), y la misión 1 no tiene llamaradas fuertes. Un bot con estrategia razonable gana las 12 combinaciones misión × dificultad, y no hacer nada pierde (verificado en un test).
- **Fracaso no punitivo:** la pantalla final explica la causa real y enlaza el dato científico. Se puede reintentar con un clic.
- **Legibilidad:** HUD ≥ 13 px a 1024×600 (escalado), cuerpo ≥ 15–18 px, contraste del design system ≥ 4,5:1, el color nunca es la única señal (⚠ + texto + sonido).

## Pendiente o deuda conocida
- **i18n:** el proyecto mantiene sus textos en `src/data/` y en las escenas, sin librería de i18n. Para no mezclar dos sistemas se siguió ese patrón; migrar a i18n merece un cambio aparte.
- `tsconfig` incluye los tipos de Node para compilar las configs de test; conviene un `tsconfig.node.json` separado.
- Verificar las llamaradas contra DONKI con una clave real (`npm run data:donki`).
- El tamaño del chunk de Phaser (1,37 MB) domina el peso del build.
- No hay repositorio git en la carpeta, así que no se hicieron commits.
