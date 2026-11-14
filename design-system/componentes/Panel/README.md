# Panel
Superficie redondeada (`space-700`, `radius-lg`) que agrupa contenido: tarjetas de misión, modales de pausa, confirmaciones.

## Anatomía
`.mn-panel` › `.mn-panel__title` (estilo `title`) › `.mn-panel__body` (estilo `body`, `ink-muted`) › `.mn-panel__footer` (botones alineados a la derecha, primario al final).

## Reglas
- Un modal va sobre el velo `overlay` en `z-modal`.
- Padding `space-5`; no anidar paneles: dentro usa filas `space-600`.
- Máximo ~60 caracteres por línea de cuerpo; textos cortos para lectores junior.
