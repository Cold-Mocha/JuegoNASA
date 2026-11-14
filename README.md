# Michinautas

Juego web 2D para el reto **Build a Junior Astronaut Mission Trainer** del **NASA Space Apps Challenge 2026** (sede Temuco), hecho por un equipo de estudiantes de ingeniería de la Universidad de La Frontera.

Niñas y niños de 7 a 12 años entran a una estación espacial en órbita lunar como un tripulante animal (el primero: un **michi astronauta**) y la mantienen funcionando. Caminan entre módulos, hacen tareas y deciden cómo gastar recursos que nunca alcanzan para todo. **Ninguna decisión es gratis**: así aprenden los trade-offs reales que enfrentan los astronautas y los planificadores de misión.

> Estado: base funcional armada durante la hackatón (14 de noviembre de 2026). El desafío oficial completo está en [`DESAFIO.md`](DESAFIO.md).

---

## 1. Qué hay en esta carpeta

```
JuegoNASA/
├── README.md              ← este documento: el proyecto completo y sus decisiones
├── DESAFIO.md             ← texto oficial del reto, sin modificar
├── escenario/             ← Estación Central: diseño (ESCENARIO.md), datos (JSON) y plano
├── juego/                 ← código fuente (Vite + TypeScript + Phaser 4)
├── prototipos/
│   ├── estacion-hud.html  ← vista cenital tipo Among Us (primer prototipo)
│   └── estacion-2-5d-papel.html ← sala en 2.5D con el michi de papel (estilo elegido)
├── design-system/         ← copia local del design system (tokens, CSS, guías)
├── assets/
│   ├── personajes/michi-papel/ ← personaje oficial: 3 variantes × con/sin casco, 6 animaciones
│   ├── personajes/michi/  ← versión 1 (obsoleta, solo referencia)
│   ├── iconos/            ← iconos de recursos del HUD
│   ├── motivos/           ← destello y patrón de constelación
│   ├── historia/          ← láminas de la introducción (provisorias)
│   └── fuentes/           ← Fredoka y Space Mono (OFL)
└── herramientas/          ← scripts para regenerar los assets del personaje
```

**Versiones en línea (claude.ai, privadas hasta que se compartan):**
- Design system: https://claude.ai/artifact/XQJ7QpQKxf4M2UKSSA6QQP
- Prototipo de la estación: https://claude.ai/artifact/NMiNbq48XFpsKYEQZnszZL

---

## 2. Cómo responde al desafío

| Lo que pide el reto | Cómo lo cubrimos |
|---|---|
| Gestionar un puesto avanzado en la Luna o Marte | Estación en **órbita lunar**. El reto acepta interpretaciones creativas si el objetivo educativo se mantiene. |
| Trade-offs reales; ninguna opción gratis | Cada consola cuesta algo: comer, beber, curarse o ajustar la antena gastan energía; orientar los paneles recarga energía pero suma radiación; caminar entre salas cuesta tiempo. |
| 2–3 recursos centrales, sin abrumar | Base: **energía, oxígeno/soporte vital y blindaje/radiación**. Hambre, sed y demora de comunicaciones entran de forma gradual con la progresión. |
| Datos reales de la NASA, citados en el juego | Plan: eventos solares reales de **DONKI** guardados dentro del juego y etiquetados como históricos (el reto lo acepta explícitamente). Pendiente de implementar. |
| Rejugable, aprender del error sin castigo | Eventos que cambian entre partidas y modo libre con escenarios reales (propuesta de progresión). |
| Navegador, sin descargas ni cuentas | Sitio estático; no pide registro ni recolecta datos. |
| Edad 7–12, lenguaje simple | Textos cortos, términos técnicos explicados en contexto, texto mínimo de 18 px, iconos además de colores. |

---

## 3. Decisiones de diseño

### 3.1 Estética
- **Origen:** la plantilla de referencia "Navy Playful Illustration Universe" (azul marino, nebulosas, planetas redondos, tipografía redondeada). Tomamos el **estilo**, no sus ilustraciones: son assets con licencia de Canva y no se pueden redistribuir dentro de un juego.
- **Dos capas visuales:** el mundo es lúdico e ilustrado; la información es sobria, al estilo de un **control de misión** (telemetría monoespaciada, checklists de vuelo, barras segmentadas). Así el juego se siente divertido sin perder rigor.
- **Paleta "objetos celestes":** suelo azul marino `space-800`. El dorado `star-gold` marca la acción principal y las recompensas; cyan para oxígeno, señal y sed; turquesa para salud y éxito; magenta para radiación y logros; coral para hambre.
- **Colores de recurso fijos en todo el juego:** el mismo recurso siempre tiene el mismo color, para que un niño lo reconozca sin leer. El estado crítico siempre pasa a `danger` con icono ⚠, nunca solo por color.
- **Tipografía:** Fredoka (redondeada y amigable) para todo el texto; Space Mono solo para números y telemetría. Ambas con licencia OFL, empaquetadas dentro del juego para que funcione sin internet.
- **Forma:** radios grandes y botones con canto inferior que se hunde al presionar, como botones físicos de una consola. Sin degradados en la interfaz (solo en ilustraciones).

### 3.2 Pantalla principal: gestión de la nave en 2.5D
- **Estilo elegido: 2.5D de papel.** Salas en perspectiva con piso inclinado; el personaje y los objetos son recortes de papel ordenados por profundidad (prototipo `estacion-2-5d-papel.html`). Se mantiene del primer prototipo la lógica de recursos y el HUD.
- Primer prototipo, como referencia: **vista cenital** de la nave, con la cámara centrada en el personaje y la visión limitada a un radio de luz. Las salas no visitadas aparecen como "?" hasta descubrirlas, para incentivar la exploración.
- **Distribución fija del HUD:** tareas arriba a la izquierda; botón **ESTADO** arriba a la derecha (abre el panel con Tab); avisos arriba al centro; resumen de salud, energía y radiación abajo al centro; minimapa y botón **USAR (E)** abajo a la derecha.
- **Panel de estado con dos pestañas:** *Tripulante* (salud, hambre, sed, radiación) y *Nave* (estado de la radio, energía, señal). Cada pestaña termina con una nota que explica el porqué del valor, porque el objetivo es enseñar, no solo mostrar números.
- **Llamarada solar:** la pantalla se tiñe, la radiación sube rápido y la Habitación funciona como refugio. Es el puente natural hacia los datos reales de DONKI.
- **Propiedad intelectual:** tomamos la perspectiva y las mecánicas del género (son libres). No copiamos el diseño de los tripulantes, el mapa, la interfaz ni los sonidos de Among Us.

### 3.3 Personaje: michi astronauta (estilo papel 2.5D)
- **Diseño propio** (no se parece al tripulante de Among Us): cabeza de gato con orejas, traje blanco con banda de color, mochila de soporte vital y cola separada del cuerpo. Cara simple: dos ojos, nariz y sonrisa.
- **Estilo recorte de papel:** contorno oscuro, borde blanco alrededor de la silueta y pocos frames con poses claras. Al cambiar de dirección gira como una hoja, y la sombra la dibuja el motor sobre el piso. Elegido porque se lee bien a cualquier tamaño, es barato de animar y le da identidad al juego en 2.5D.
- **Casco como burbuja de vidrio** sobre la misma cabeza: la cara es idéntica con y sin casco. Cada variante tiene ambas versiones. Propuesta: sin casco dentro de la nave, con casco en la esclusa, afuera o en una llamarada solar. Así el casco enseña cuándo se necesita.
- **3 variantes:** Miu (naranja, banda dorada), Tomás (leopardo de las nieves, banda cyan) y Güiña (felino chileno amarillo con manchas negras, banda magenta). Una gata negra se descartó porque su cara se perdía contra el fondo azul marino.
- **6 animaciones:** idle, blink (parpadeo), walk (2 frames con balanceo), use (usar consola), hurt (recibir daño) y smile (sonreír).
- **Generado por código** (`herramientas/michi_papel.py`): se pueden agregar animales o animaciones sin redibujar.
- Prototipo jugable: `prototipos/estacion-2-5d-papel.html`.

### 3.3b Escenario: Estación Central (v2)
- **Puesto en la superficie lunar** con solo las **8 salas que tienen acción** en el diseño v2: Refugio, Enfermería, Comunicaciones, Soporte vital, Cultivo de algas, Puente, Energía y Esclusa. Todo lo demás es decoración sin efecto.
- La silueta se inspira en Lunar Palace 1 (un módulo largo y dos cilindros), presentada como base ficticia sin nombre ni logos reales.
- **Assets por separado primero, fondo después:** cada objeto es su propio sprite; el motor dibuja el fondo vacío y encima los objetos ordenados por profundidad.
- La ventana cambia con el calendario lunar (día, atardecer, noche), así se ve por qué los paneles rinden menos.
- Detalle en [`escenario/ESCENARIO.md`](escenario/ESCENARIO.md).

### 3.4 Flujo de pantallas
1. **Menú principal:** Jugar, Ajustes (alto contraste, reducir movimiento), Créditos.
2. **Historia:** láminas con imagen y texto que aparece letra a letra.
3. **Selector:** Misión, Tripulante y Dificultad. *(Hoy el primer paso dice "Estación"; pasará a "Misión" cuando se defina la progresión.)*
4. **Carga con cohete:** el cohete atraviesa las capas reales de la atmósfera (troposfera, estratosfera, mesosfera, termosfera) con altitud y un dato por capa. La barra refleja la carga real de archivos. En pantalla dice "escala no proporcional".
5. **Estación:** gestión tipo Among Us (prototipo en `prototipos/estacion-hud.html`; falta integrarlo al código del juego).

### 3.5 Arquitectura técnica
| Pieza | Elección | Por qué |
|---|---|---|
| Motor | **Phaser 4.2.1** | Motor 2D web maduro: escenas, cámara, partículas, física Arcade y loader con progreso real. |
| Lenguaje | **TypeScript** | Detecta errores mientras escriben; clave con 4 personas en el mismo código durante 48 horas. |
| Build | **Vite 8** | Servidor de desarrollo instantáneo y sitio estático, sin backend. |
| Interfaz | **HTML/CSS sobre el canvas** | Texto nítido y accesible, y diseño editable sin tocar el motor. Usa las clases `mn-*` del design system. |
| Tokens | `design/tokens.json` → `tokens.css` | Una sola fuente de verdad para colores y tipos; el canvas lee los mismos colores en tiempo de ejecución. |
| Mapa (pendiente) | **Tiled** | Editor de mapas gratuito; alguien sin experiencia en programación puede diseñar la estación. |
| Simulación (pendiente) | `src/sim/` en TypeScript puro + **Vitest** | Reglas de recursos sin Phaser y probadas, por ejemplo con un test de que "subir el blindaje siempre cuesta energía". Así se puede trabajar en paralelo. |
| Deploy | GitHub Pages / Netlify | Space Apps pide un enlace público. |

Detalles y cómo correrlo: [`juego/README.md`](juego/README.md).

### 3.6 Datos reales de la NASA (plan)
- **DONKI** (Space Weather Database): llamaradas solares, eyecciones de masa coronal y tormentas de partículas reales. Un script descarga los eventos **una vez, en desarrollo**, y los guarda como JSON dentro del juego. La API key **no va en el frontend**.
- **OSDR:** datos de dosis de radiación y salud de astronautas para explicar qué significa la barra de radiación.
- Cada dato real se cita en pantalla con estilo `caption-mono` ("FUENTE: NASA DONKI"). Lo simulado se declara como simulado; nunca se presentan datos guardados como "en vivo".

---

## 4. Marca, legal y privacidad

- **Logos de la NASA:** no se usan la insignia ("meatball"), el logotipo ("worm") ni el sello. Están protegidos por 14 CFR 1221 y participar en Space Apps no da permiso para usarlos. Para el evento se usa solo el logo oficial de *NASA Space Apps Challenge*, sin modificarlo. Frase de créditos: *"Proyecto creado para el NASA Space Apps Challenge 2026. Usa datos e imágenes abiertas de la NASA; la NASA no respalda este proyecto."*
- **Gateway:** la NASA canceló o pausó el programa Gateway en marzo de 2026 para priorizar una base en la superficie lunar. Por eso la estación del juego debe presentarse como **ficticia, en órbita lunar e inspirada en Gateway**, no como una estación real activa.
- **Imágenes y datos NASA:** se pueden usar con crédito, salvo que indiquen copyright.
- **Privacidad (Chile, Ley 19.628 y Ley 21.719):** el juego no recolecta datos personales. Solo guarda preferencias (tema, velocidad de texto) en el navegador del propio dispositivo. Como el público son menores, no se agregan cuentas, analítica ni nombres reales sin una revisión previa.
- **Fuentes:** Fredoka y Space Mono, ambas con licencia SIL OFL 1.1.

---

## 5. Accesibilidad
- Contraste de texto ≥4.5:1 en ambos temas (verificado). Tema de **alto contraste** en Ajustes.
- Juego completo con teclado (WASD/flechas, E, Tab, Esc), con toque en tablets y celulares, y con foco siempre visible.
- **Reducir movimiento:** sin rebotes ni parpadeos. Las alertas nunca parpadean más de 2 veces por segundo.
- El color nunca es la única señal: el estado crítico combina color, icono ⚠, texto y sonido.

---

## 6. Iteración 1 (14-11-2026)
Juego jugable de punta a punta: 4 misiones con semanas reales del Sol, la estación 2.5D integrada en Phaser, simulación en `juego/src/sim/` con tests, Archivo científico, logros, guardado local, audio procedural y modo Ultra Ligero. Ver [`GDD.md`](GDD.md), [`SOURCES.md`](SOURCES.md) y [`REPORTE-CALIDAD.md`](REPORTE-CALIDAD.md).

## 7. Pendiente (próximas decisiones del equipo)
1. **Progresión:** propuesta híbrida, con una campaña "De la Luna a Marte" de 5 misiones que suma un sistema por misión y termina con la demora de comunicaciones en Marte, más un modo libre con escenarios de clima espacial real. Falta confirmarla.
2. **Integrar la estación** del prototipo al código de Phaser (mapa en Tiled, simulación en `src/sim/` con pruebas).
3. **Datos DONKI** guardados dentro del juego y citados en pantalla.
4. **Más animales** sobre el mismo rig y arte final de la historia.
5. **Explicación breve de los datasets** usados, para el jurado (el reto lo valora).
