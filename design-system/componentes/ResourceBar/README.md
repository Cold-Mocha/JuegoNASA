# ResourceBar
Barra de recurso del HUD con etiqueta, pista segmentada y valor numérico en mono.

## Recursos (color fijo por recurso, nunca intercambiar)
| Clase | Recurso | Color |
|---|---|---|
| `.mn-bar--oxygen` | Oxígeno | `comet-cyan` |
| `.mn-bar--energy` | Energía / combustible | `star-gold` |
| `.mn-bar--suit` | Integridad del traje | `aurora-teal` |

## Estado crítico
`.is-critical` (≤20%): borde, relleno y valor pasan a `danger`, la etiqueta lleva icono de alerta y el juego emite un sonido. El color nunca es la única señal.

## Reglas
- El valor numérico siempre visible (estilo `readout`); los segmentos cada 10% ayudan a estimar sin leer.
- En motor: el ancho del relleno es `valor/max`; expone `role="meter"` o equivalente para lectores de pantalla en web.
