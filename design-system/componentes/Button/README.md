# Button
Botón grueso tipo "cartoon" con canto inferior que se hunde al presionar; es la acción principal del jugador.

## Variantes
| Clase | Uso |
|---|---|
| `.mn-btn` | Acción primaria: **una por pantalla** (Despegar, Continuar). Relleno `star-gold`, texto `ink-dark` (11:1). |
| `.mn-btn--secondary` | Volver, opciones. Relleno `space-600` con borde `line`. |
| `.mn-btn--danger` | Abortar misión, borrar partida. Siempre pide confirmación en un Panel. |
| `.mn-btn--sm` | Dentro de paneles o diálogos. Altura 44px (objetivo táctil mínimo). |
| `.mn-btn--icon` | Pausa, ajustes, audio. Requiere `aria-label` / etiqueta accesible. |

## Estados
`:hover`, `:active`/`.is-pressed` (baja 4px, canto a 2px), `:focus-visible`/`.is-focus` (anillo doble ground + ink, visible con mando), `[disabled]`.

## Reglas
- Área táctil mínima 56×56px en la variante normal (público junior, pantallas táctiles).
- Texto en mayúsculas, verbo de acción, máximo 2 palabras.
- La navegación con mando/teclado debe mover el foco entre botones; el anillo de foco nunca se oculta.
- El consumidor aporta: texto, icono SVG opcional y el handler.
