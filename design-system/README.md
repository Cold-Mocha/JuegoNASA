# Michinautas

Design system de **Michinautas**, el videojuego del equipo UFRO para el reto *Build a Junior Astronaut Mission Trainer* del NASA Space Apps Challenge 2026 (Temuco). Público: niñas y niños que entrenan como astronautas junior. El tono combina la ilustración lúdica de la plantilla de referencia (azul marino, nebulosas, planetas redondos) con una capa sobria de **control de misión** (telemetría monoespaciada, checklists de vuelo).

> Estado: v1, armado durante la hackatón. Los tokens son agnósticos de motor: `tokens.json` es la fuente de verdad para Unity, Godot o web.

## Marca y uso legal (leer antes de diseñar)

- **No usar la insignia ("meatball"), el logotipo ("worm") ni el sello de la NASA**, ni recrearlos o imitarlos. Están protegidos por 14 CFR 1221 y no se pueden usar sin permiso explícito de la NASA. Participar en Space Apps **no** da ese permiso.
- **El branding de Space Apps sí existe para los participantes**: si el juego o el pitch mencionan el evento, usar el logo oficial de *NASA Space Apps Challenge* descargado de spaceappschallenge.org/brand, sin modificarlo y según su guía. No está incluido en este sistema; colócalo en la pantalla de créditos.
- No escribir "NASA" de forma que sugiera que la NASA aprueba o respalda el juego. Fórmula segura en créditos: *"Proyecto creado para el NASA Space Apps Challenge 2026. Usa datos e imágenes abiertas de la NASA."*
- **Imágenes y datos de la NASA**: se pueden usar (salvo que indiquen copyright), siempre con crédito en `caption-mono`, p. ej. `FUENTE: NASA/JPL-Caltech`. No usar fotos donde aparezcan personas identificables para promocionar algo.
- **Ilustraciones de la plantilla Canva de referencia**: no se incluyen ni se extraen. El sistema replica el *estilo*; los personajes y escenarios los dibuja el equipo.
- No hay logo de Michinautas todavía: hasta que exista, el nombre se escribe en `display-xl`.

## Voz y contenido

- **Tú, cercano y animoso**: "¡Bien hecho, cadete!", "Revisa tu casco". Nunca condescendiente.
- **Frases cortas** (≤15 palabras), un verbo de acción por instrucción. Botones: 1–2 palabras en mayúsculas (`DESPEGAR`, `CONTINUAR`).
- **Ciencia real, explicada simple**: un dato breve por pantalla, con su fuente. Los números van en `readout` con unidad en la etiqueta.
- Los errores no castigan: "Casi lo logras. Intenta conectar primero el oxígeno."
- Español de Chile neutro, sin modismos que confundan a un público internacional del jurado. Los términos técnicos (EVA, O2, kPa) se acompañan de su significado la primera vez.

## Fundamentos visuales

**Color.** El suelo de todo es `space-800` (el azul marino de la referencia); los paneles suben a `space-700` y `space-600`. Sobre ese azul, los colores brillantes salen de los objetos celestes: `star-gold` (acción y recompensa), `comet-cyan` (oxígeno, información), `aurora-teal` (éxito), `nebula-violet` y `nebula-magenta` (identidad y logros) y `solar-coral` (solo ilustración). Los rellenos brillantes llevan texto `ink-dark`; las superficies oscuras, `ink`/`ink-muted`. Reglas:
- Una sola acción primaria `star-gold` por pantalla.
- Cada recurso tiene un color fijo que nunca cambia: energía `star-gold`, aire y comida `comet-cyan`, radiación `nebula-magenta`.
- `constellation` es decorativo: nunca para texto ni bordes de control.
- `danger` siempre va con icono y texto. `danger` y `solar-coral` tienen luminosidad parecida: coral se usa solo en ilustración, nunca para comunicar un estado crítico (eso es siempre `danger` + icono).

**Tipografía.** Una sola familia redondeada, **Fredoka** (como la Fredoka One de la referencia), en 400–700, para títulos y texto. **Space Mono** solo para telemetría, números y créditos. Títulos display en mayúsculas. El cuerpo mínimo de instrucciones es 18px (`body`); nada baja de 12px (`caption-mono`). Ambas fuentes son OFL: uso comercial y embebido permitido.

**Forma.** Todo es redondo y amable: radios `radius-md`/`radius-lg`, píldoras para toasts. Los elementos pulsables tienen un canto inferior sólido (`shadow-press`) que se hunde al presionar, como un botón físico de una consola. Sin gradientes en la UI; los degradados suaves quedan para las ilustraciones (nebulosas, planetas).

**Espacio.** Retícula de 4px (`space-1`…`space-8`). El HUD respeta un margen seguro `space-6` (32px) respecto al borde. Los paneles usan padding `space-5`.

**Movimiento (estilo Apple, *Designing Fluid Interfaces*).** Tokens `motion`: `--ease-spring` es un spring críticamente amortiguado (damping 1.0, response 0,35 s, sin rebote) muestreado con `linear()`, con `--dur-spring` (500 ms) como tiempo de asentamiento; `--dur-press` (90 ms) es la respuesta al presionar y `--dur-fade` (160 ms) el fundido corto. Reglas (`juego/src/styles/app.css`, sección *Fluidez*):
- **Respuesta en pointer-down:** botones y tarjetas se hunden al presionar; `touch-action: manipulation` quita la demora táctil.
- **Materiales:** los paneles del HUD son translúcidos (`backdrop-filter`), con un borde superior de luz; los grandes (tareas, acciones, consejo) llevan más blur. Son sólidos con transparencia reducida, alto contraste o Ultra Ligero (`[data-solid]`).
- **Atenuar para enfocar:** el velo del modal desenfoca la estación y el panel se materializa (escala 0,94→1, blur y opacidad a la vez).
- **Mismo camino de ida y vuelta:** cada aviso entra y sale desde su esquina (acciones abajo a la derecha, consejo abajo a la izquierda, alertas desde arriba), con `@starting-style` y `display … allow-discrete`.
- **Pista de dirección:** en el selector, Siguiente trae las tarjetas desde la derecha y Atrás desde la izquierda.
- **Feedback continuo:** las barras se deslizan hasta su valor con el spring.
- **Movimiento reducido** (sistema o ajuste del juego, `[data-calm]`): sin desplazamientos, escalas ni blur; solo fundidos cortos.
- Tipografía: tracking negativo en `display-xl`/`display-lg` (−0,01em) y `title` (−0,005em); los títulos usan `text-wrap: balance`.

**Profundidad.** Tres planos: escena del juego (`z-world`), HUD/diálogos (`z-hud`, `z-dialog`) y capas modales (`z-toast`, `z-modal` sobre `overlay`).

## Pantalla de juego (HUD de la estación)

Vista cenital de la nave, cámara centrada en el personaje y visión limitada a un radio de luz (las salas no visitadas aparecen como "?" hasta descubrirlas). Distribución fija:

| Zona | Componente |
|---|---|
| Arriba izquierda | `TaskList`: tareas del día |
| Arriba derecha | `TabletButton`: abre `StatusPanel` (Tab) |
| Arriba centro | `AchievementToast`: descubrimientos, alertas solares |
| Abajo centro | `MiniStats`: salud · energía · radiación |
| Abajo derecha | Minimapa (salas descubiertas) y botón **USAR (E)** cuando hay una consola cerca |

Cada consola cuesta algo: comer, beber, curarse o ajustar la antena gastan energía; orientar paneles recarga energía pero suma radiación. Durante una llamarada solar la pantalla se tiñe y la Habitación es el refugio. Prototipo jugable: artifact "Michinautas — Vista previa: interior de la estación".

## Personajes

Tripulantes animales; el primero es el **michi astronauta** (`MichiSprite`, assets en el grupo Personajes): casco redondo con orejas, cara visible tras el visor, mochila de soporte vital y cola. Rig de 13 capas con pivotes, 5 animaciones y variantes de color. Otros animales reutilizan traje, casco y animaciones cambiando orejas, cara y cola.

## Ilustración

- Vector plano con degradados suaves y grano ligero, como la referencia: planetas con anillos, nebulosas en violeta/magenta/coral, asteroides grises redondeados.
- Personajes: gatos astronautas propios del equipo (*michis*), cabeza grande, contornos gruesos `space-900`, traje blanco hueso con acentos de color de recurso.
- Fondo: campo estelar y constelaciones punteadas (ver `assets/Motivos`), siempre en `constellation`/`ink-muted` para no competir con la UI.
- Fotos reales de la NASA (Hubble, JWST, Tierra desde la ISS) se muestran enmarcadas en un `Panel`, nunca como fondo bajo texto, y con crédito.

## Iconografía

- Trazo redondeado de 3px, terminaciones redondas, retícula de 24px; relleno sólido solo en estados activos.
- El destello de cuatro puntas (`assets/Motivos/destello.svg`) es la firma del sistema: puntuación, chispas de recompensa, viñetas.
- Iconos sobre rellenos brillantes en `ink-dark`; sobre superficies oscuras en `ink`.
- No hay set de iconos todavía: usar un set OFL/MIT redondeado (p. ej. Phosphor "bold") hasta dibujar el propio.

## Movimiento

- Rápido y con rebote suave: botones 90ms, toasts 250ms de entrada, estrellas en cascada de 250ms con un "pop" 0.6→1.1→1.
- El texto de diálogo aparece letra a letra (~40 caracteres/s) y se completa con un toque.
- Las alertas críticas parpadean a ≤2 Hz (nunca más rápido: riesgo fotosensible).
- Respetar *reducir movimiento*: sin rebotes ni parpadeos, solo fundidos.

## Accesibilidad

- Texto ≥4.5:1 en ambos temas (verificado: `ink` ≥10:1, `ink-muted` ≥6.6:1 sobre todas las superficies; `ink-dark` ≥5.3:1 sobre todos los rellenos).
- Tema **Alto contraste** seleccionable en Ajustes: fondo negro, bordes blancos, colores más claros.
- Foco visible siempre (`shadow-focus` / anillo doble) y navegación completa con mando y teclado; áreas táctiles ≥56px.
- El color nunca es la única señal: estado crítico = color + icono + sonido + texto.
- Subtítulos para todo diálogo hablado; opción de velocidad de texto.

## Entregar a motor

- **Web (Phaser/React)**: cargar `tokens.css` + `components/bundle.css` y usar las clases `mn-*`.
- **Unity / Godot**: leer `tokens.json` (colores por tema, tamaños, radios) y mapearlo a un `ScriptableObject`/`Theme`. Los nombres de token se mantienen idénticos en código.
- Los componentes son referencia visual y de comportamiento: su README dice qué estados existen y qué aporta el consumidor.

## Componentes

`Button`, `Panel`, `ResourceBar`, `DialogueBox`, `MissionChecklist`, `AchievementToast`, `Telemetry`, `StarRating`, `Chip`.

HUD de la estación: `TabletButton`, `StatusPanel`, `TaskList`, `MiniStats`. Personajes: `MichiSprite`.
