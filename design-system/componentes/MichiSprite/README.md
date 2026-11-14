# MichiSprite
Personaje jugable: michi astronauta original, animado con spritesheets (tiras horizontales de frames cuadrados) y armado como rig de 13 capas.

## Animaciones
| Animación | Frames | FPS | Bucle | Uso |
|---|---|---|---|---|
| `idle` | 8 | 8 | sí | Quieto: respira, mueve la cola, parpadea. |
| `walk` | 8 | 12 | sí | Caminar por la nave. |
| `interact` | 6 | 10 | no | Usar una consola (brazo delantero presiona + chispa cyan). |
| `hurt` | 4 | 10 | no | Recibir daño (tinte rojo, ojos en X, squash). |
| `celebrate` | 8 | 12 | no | Tarea o día completado (salto con destellos). |

- Frame: 128×128 (1x) o 256×256 (@2x). Pies en (64, 121). Mira a la **derecha**; para la izquierda se voltea (`.is-flip` / `setFlipX(true)`).
- Variantes de color: Miu (naranja), Tomás (gris), Luna (oscura). Solo cambian pelaje y color de la franja.
- En web: `.mn-sprite` con `--frames` y `--dur` (frames ÷ fps). En Phaser: `this.load.spritesheet(key, url, { frameWidth: 256, frameHeight: 256 })` y `anims.create({ frameRate: fps, repeat: loop ? -1 : 0 })`.

## Reglas
- No copiar el tripulante de Among Us: el michi se reconoce por casco redondo con orejas, cara visible en el visor, mochila y cola.
- Otros animales reutilizan el rig: se cambian `orejas`, `cara` y `cola`; traje, casco y animaciones se mantienen.
- Contorno `space-900` de 3 px en todas las capas, para leerse sobre cualquier piso.
