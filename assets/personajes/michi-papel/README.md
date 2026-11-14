# Michi astronauta — estilo papel (versión oficial)

Personaje jugable en estilo **recorte de papel 2.5D**: dibujo plano con contorno oscuro, borde blanco de papel alrededor de la silueta y animaciones de pocos frames con poses claras. Se voltea con un "giro de hoja" (scaleX de 1 → 0 → −1) y la sombra la pone el motor sobre el piso.

**La cara no cambia de tamaño con el casco:** el casco es una burbuja de vidrio que se dibuja *encima* de la misma cabeza.

## Variantes
| ID | Nombre | Gato | Banda |
|---|---|---|---|
| `miu` | Miu | naranja | dorada |
| `tomas` | Tomás | gris | cyan |
| `luna` | Güiña | amarillo ocre con manchas negras | magenta |

Cada una existe **con casco** (`casco`) y **sin casco** (`sin-casco`). Sugerencia de uso: sin casco dentro de la nave; con casco en la esclusa, afuera o durante una llamarada solar.

## Animaciones
| Animación | Frames | FPS | Bucle | Qué hace |
|---|---|---|---|---|
| `idle` | 2 | 2 | sí | Quieto, respira |
| `blink` | 3 | 12 | no | Parpadeo: insertarlo sobre `idle` cada 2–4 s |
| `walk` | 2 | 6 | sí | Caminar con balanceo de papel |
| `use` | 3 | 8 | no | Usar una consola: se inclina, presiona y sale una chispa |
| `hurt` | 3 | 10 | no | Recibir daño: sacudón con tinte rojo y ojos en X |
| `smile` | 2 | 4 | sí | Sonreír: ojos felices y saltitos |

## Carpetas
| Carpeta | Contenido |
|---|---|
| `variantes/<id>/` | Pose neutral de cada variante con y sin casco (SVG + PNG @2x con borde de papel). |
| `animaciones/spritesheets/<id>/<casco>/` | Tiras horizontales por animación: 1x (128 px por frame) y @2x (256 px). |
| `animaciones/frames/<casco>/<anim>/` | Frames sueltos de Miu (1x). |
| `animaciones/gif/` | Vistas previas de Miu sobre fondo azul (para presentaciones). |
| `animaciones/animaciones.json` | Frames, FPS, bucle y ancla de pies. |
| `capas/svg|png/<casco>/` | Capas separadas en el mismo lienzo: cola, pierna-trasera, mochila, cuerpo, pierna-delantera, cuello, cabeza, casco. |
| `capas/rig.json` | Orden de capas, ancla de pies y notas del rig. |

**Ancla de pies:** (66, 112.5) en 1x, o (132, 225) en @2x. Mira a la derecha.

## Phaser 4
```ts
// preload
for (const anim of ['idle','blink','walk','use','hurt','smile'])
  this.load.spritesheet(`miu-sin-casco-${anim}`, `assets/personajes/michi-papel/animaciones/spritesheets/miu/sin-casco/michi-miu-sin-casco-${anim}@2x.png`, { frameWidth: 256, frameHeight: 256 });
// create
this.anims.create({ key: 'miu-walk', frames: this.anims.generateFrameNumbers('miu-sin-casco-walk'), frameRate: 6, repeat: -1 });
const michi = this.add.sprite(x, y, 'miu-sin-casco-idle').setOrigin(132 / 256, 225 / 256).setScale(0.6);
// giro de papel al cambiar de dirección
this.tweens.add({ targets: michi, scaleX: dir * 0.6, duration: 160, ease: 'Sine.inOut' });
```

Regenerar o crear otro animal: `herramientas/michi_papel.py` + `python herramientas/render_michi_papel.py`.
