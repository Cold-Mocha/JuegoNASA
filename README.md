# Michinautas

Juego web 2D para el reto **Build a Junior Astronaut Mission Trainer** del **NASA Space Apps Challenge 2026** (sede Temuco), hecho por un equipo de estudiantes de ingeniería de la Universidad de La Frontera.

Niñas y niños de 7 a 12 años entran a una base en la superficie de la Luna como un tripulante animal (el primero: un **michi astronauta**) y la mantienen funcionando. Caminan entre módulos, hacen tareas y deciden cómo gastar recursos que nunca alcanzan para todo. **Ninguna decisión es gratis**: así aprenden los trade-offs reales que enfrentan los astronautas y los planificadores de misión.

> Estado: juego jugable de punta a punta, en español e inglés (15 de noviembre de 2026). English version: [`README.en.md`](README.en.md). El desafío oficial completo está en [`DESAFIO.md`](DESAFIO.md).

## Datos usados

| Dataset | Qué hace en el juego | En qué pantalla se ve | Enlace |
|---|---|---|---|
| **NASA DONKI** (llamaradas solares) y reportes NASA / NOAA SWPC | Tres semanas reales del Sol son el «clima» de las jornadas: cada llamarada cae en su día y hora reales, y su clase GOES fija cuánta radiación llega | Estación: aviso de cada llamarada con su fecha, pie del HUD con la fuente, comparación «con escudo / afuera». Informe final. Archivo científico | [api.nasa.gov](https://api.nasa.gov/) · [NOAA SWPC](https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts) |
| **Zhang et al. 2020**, *Science Advances* (Chang’e 4) | Radiación de fondo de la superficie lunar: la barra sube un poco cada jornada aunque no haya llamaradas | Barra de radiación; ficha «Radiación en la superficie lunar» | [doi:10.1126/sciadv.aaz1334](https://doi.org/10.1126/sciadv.aaz1334) |
| **NASA Moon Fact Sheet** | Gravedad lunar del salto (1,62 m/s²) y ciclo de luz de 7 jornadas (3 de día, 1 de atardecer, 3 de noche sin paneles) | Salto del michi; reloj del HUD; fichas «Gravedad lunar» y «Un día lunar dura un mes» | [nssdc.gsfc.nasa.gov](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) |
| **Demora Tierra–Luna** (384 400 km / c) | La antena y el pronóstico solar responden tras 2,56 s, la ida y vuelta real de la señal | Comunicaciones; ficha «Mensajes que tardan» | [NASA: Communicating with Missions](https://www.nasa.gov/communicating-with-missions/) |
| **NASA OSDR** | Solo lectura recomendada: ningún número del juego sale de ahí, y la ficha lo dice | Archivo científico | [osdr.nasa.gov](https://osdr.nasa.gov/bio/) |

Las llamaradas son un **archivo histórico, no datos en vivo**, y el juego lo dice en pantalla. Todavía no se pudieron contrastar con la API de DONKI (no respondió en dos intentos): el detalle está en [`SOURCES.md`](SOURCES.md).

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
| Gestionar un puesto avanzado en la Luna o Marte | La **Estación Central**, una base ficticia en la superficie lunar. |
| Trade-offs reales; ninguna opción gratis | El blindaje contra una llamarada gasta energía y sin energía protege la mitad; de noche los paneles no producen y pedalear cambia comida por energía; salir a la superficie avanza la investigación y suma radiación; el pronóstico solar cuesta energía y solo llega con la antena en buen estado. |
| 2–3 recursos centrales, sin abrumar | 5 barras (energía, oxígeno, comida, salud y radiación); los equipos solo aparecen en el HUD cuando fallan, y el tutorial muestra 3 controles. |
| Datos reales de la NASA, citados en el juego | Semanas reales de llamaradas guardadas en el juego y etiquetadas como históricas; la fuente está siempre al pie del HUD y en cada aviso (ver «Datos usados»). |
| Rejugable, aprender del error sin castigo | Tormentas de polvo y fracturas al azar, 3 jornadas y 3 dificultades. El informe explica la causa real y «Reintentar» vuelve directo a la estación. |
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
- **3 variantes:** Miu (naranja, banda dorada), Leo (leopardo de las nieves, banda cyan) y Güiña (felino chileno amarillo con manchas negras, banda magenta). Una gata negra se descartó porque su cara se perdía contra el fondo azul marino.
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
| Mapa | `src/sim/stationMap.ts` + SVG | Un solo plano continuo definido en código y dibujado como SVG: sin editor externo ni pantallas de carga. |
| Simulación | `src/sim/` en TypeScript puro + **Vitest** | Reglas de recursos sin Phaser y probadas, por ejemplo con un test de que "subir el blindaje siempre cuesta energía". Así se puede trabajar en paralelo. |
| Idiomas | `src/core/i18n.ts` + `src/data/locales/` | Español e inglés; las claves están tipadas, así un texto sin traducir no compila. |
| Deploy | Sitio estático (nginx) | Space Apps pide un enlace público. |

Detalles y cómo correrlo: [`juego/README.md`](juego/README.md).

### 3.6 Datos reales de la NASA
- **Llamaradas:** tres semanas reales (diciembre de 2019, mayo de 2024 y octubre de 2024) guardadas en `juego/src/data/donki-archive.ts`. `npm run data:donki` las reemplaza por los datos exactos de DONKI y las marca como verificadas; la API key **no va en el frontend**.
- **OSDR:** lectura recomendada en el Archivo científico; no alimenta ningún número del juego.
- Cada dato real se cita en pantalla («Clima solar real: NASA / NOAA, archivo histórico (no en vivo)»). Lo simulado se declara como simulado; nunca se presentan datos guardados como «en vivo».

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

## 6. Estado (15-11-2026)
Juego jugable de punta a punta: 3 jornadas científicas con semanas reales del Sol y la misión final «Casa», estación 2.5D en Phaser, simulación en `juego/src/sim/`, Archivo científico con 29 fichas, logros, guardado local, audio procedural, modo Ultra Ligero, controles táctiles y español e inglés. Ver [`GDD.md`](GDD.md), [`SOURCES.md`](SOURCES.md) y [`REPORTE-CALIDAD.md`](REPORTE-CALIDAD.md).

## 7. Deuda conocida
1. **Verificar el archivo de llamaradas contra DONKI** cuando la API responda.
2. **Tests de balance:** `tests/unit/balance.test.ts`, `simulation.test.ts` y el e2e de navegación quedaron escritos para las reglas anteriores (energía inicial 100, paneles de noche, blindaje gratis).
3. **Prueba con niños:** los valores de comida, energía y blindaje son estimaciones; falta ajustarlos jugando.
4. **Progresión:** campaña «De la Luna a Marte» y más animales sobre el mismo rig.
