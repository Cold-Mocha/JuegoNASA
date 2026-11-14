# MissionChecklist
Lista ordenada de pasos de una misión de entrenamiento, al estilo de las checklists de vuelo reales.

## Estados por fila
| Clase | Significado |
|---|---|
| (base) | Pendiente: casilla vacía con borde `line`. |
| `.is-active` | Paso actual: anillo `star-gold` y meta en dorado. Solo uno a la vez. |
| `.is-done` | Completado: casilla `aurora-teal` con check, texto tachado en `ink-muted`. |

## Reglas
- Los pasos son verbos en infinitivo, una acción por paso.
- La meta (derecha) usa `caption-mono`: estado o número de paso.
- Completar un paso dispara una pequeña animación de check (≤200ms) y sonido.
