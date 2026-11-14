# StatusPanel
Tablet modal con pestañas **Tripulante** y **Nave** que muestra todos los recursos; se abre con TabletButton y pausa el movimiento del personaje.

## Pestaña Tripulante (persona)
| Barra | Clase | Color | Crítico |
|---|---|---|---|
| Salud | `.mn-bar--health` | `aurora-teal` | ≤20 |
| Hambre | `.mn-bar--hunger` | `solar-coral` | ≤20 |
| Sed | `.mn-bar--thirst` | `comet-cyan` | ≤20 |
| Radiación (dosis acumulada) | `.mn-bar--rad` | `nebula-magenta` | **≥70** (invertida: más es peor) |

Incluye retrato (`variantes/michi-<id>.svg`), nombre, rol y una nota que explica la causa de lo que se ve.

## Pestaña Nave
- **Radio** (`.mn-radio`): 5 barras de señal + estado en mono (CONECTADA / INTERFERENCIA / SIN ENLACE) + demora de comunicación. `.is-bad` bajo 35 %.
- **Energía** (`.mn-bar--energy`) y señal (`.mn-bar--signal`).
- Chips de condición (paneles, clima espacial, órbita).

## Reglas
- Hambre y salud usan coral y teal como **color de recurso**, no de estado; el estado crítico siempre pasa a `danger` + icono ⚠.
- Cada nota termina explicando el trade-off ("Orientar paneles recarga, pero expone a radiación").
- Si un valor viene de datos reales de la NASA, se cita en `caption-mono` dentro del panel; si es simulado, se dice.
- Pestañas con flechas ←/→; Esc o ✕ cierra; clic fuera cierra.
