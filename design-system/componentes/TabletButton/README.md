# TabletButton
Botón cuadrado de la esquina superior derecha del HUD que abre el StatusPanel; es la única forma de ver el estado completo.

## Estados
- Normal: relleno `star-gold`, icono de tablet.
- `.is-alert`: punto `danger` cuando cualquier valor está en nivel crítico (salud, hambre o sed ≤20, radiación ≥70, energía ≤20, señal <35) o hay tormenta solar. Va acompañado de un sonido corto; el color nunca es la única señal.
- `:active` / `:focus-visible` como Button.

## Reglas
- Atajo de teclado **Tab**; en mando, botón Select/View.
- Tamaño 76×76 px: zona táctil generosa en tablet.
- Etiqueta visible debajo ("Estado") y `aria-label` que cambia a "hay alertas".
