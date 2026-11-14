# Game Design Document — Michinautas (iteración 2: versión simplificada para 8–12 años)

> Cambios de esta iteración y su justificación frente al reto: ver `ESTUDIO-SIMPLIFICACION.md`.

**Género:** gestión de recursos y supervivencia en 2.5D · **Público:** 7–12 años (también sirve para familia y aula) · **Plataforma:** navegador, sin descarga ni cuenta · **Reto:** NASA Space Apps 2026, *Build a Junior Astronaut Mission Trainer*.

## 1. Fantasía y objetivo educativo
Eres un michi astronauta en la **Estación Central**, un puesto lunar ficticio, en una **jornada científica**: una investigación con una lista de tareas (por ejemplo, buscar hielo, cultivar algas o estudiar las llamaradas). Al cumplir todas las tareas, la tripulación **vuelve a la Tierra**. El plazo son 7 días lunares comprimidos, y de fondo se vive una **semana real del Sol** con sus llamaradas (archivo DONKI de la NASA). Los **3 recursos** (energía, aire y comida, radiación) son **secundarios**: hay que cuidarlos para poder investigar.
**Lo que el niño se lleva:** *ninguna decisión es gratis*. Ahorrar energía hoy cuesta aire mañana; salir a hacer ciencia da puntos pero también radiación; el pronóstico solar solo llega si cuidas la antena.

## 2. Bucle principal
1. Mirar las 3 barras (energía, aire y comida, radiación), la señal de la antena y la jornada (día / atardecer / noche).
2. Caminar a una sala por la estación, que es **un solo plano continuo** (vista cenital, sin pantallas de carga): Soporte vital, Cultivo y Energía arriba; un pasillo central con el Refugio en un extremo y Comunicaciones en el otro; Puente, Esclusa y Enfermería abajo. Se camina con el teclado, con un clic en el piso o con un clic en una máquina (el michi camina solo hasta ella). El mapa (M) es solo para mirar: muestra el plano y una carita de michi donde estás. **Caminar gasta tiempo:** el Refugio queda en el extremo opuesto a Energía y Comunicaciones. **Luz:** no hay niebla; la estación se oscurece pareja a medida que baja la energía.
3. Usar la máquina de la sala. Cada acción muestra su costo antes de elegirla.
4. Reaccionar a eventos: llamaradas reales, envíos de la Tierra y recursos críticos.
5. Terminar las 7 jornadas → puntaje, estrellas, logros y "lo que aprendiste".

## 3. Salas y acciones (`src/sim/rules.ts`) — una acción por sala
| Sala | Acción | Efecto | Costo |
|---|---|---|---|
| Refugio | Entrar / salir del refugio | Radiación ×0,1 mientras estés ahí | −8 energía, no puedes hacer nada más |
| Enfermería | Sala de lectura | Abre la ficha "El cuerpo en el espacio" (NASA/OSDR) | Gratis: no es una decisión |
| Comunicaciones | Arreglar la radio | Radio buena (tras 2,56 s de demora real) | −5 energía |
| Soporte vital | Limpiar el aire | +15 aire y comida | −6 energía |
| Cultivo de algas | Encender luces de las algas | +10 aire y comida ya, +8 al cierre de la jornada | −7 energía |
| Puente | Pronóstico del Sol | Llamaradas de hoy y mañana (requiere radio buena) | −1 energía |
| Energía | Mover los paneles solares | +20 energía × luz | +3 radiación |
| Esclusa | Salir a explorar | +2 ciencia, 1 vez por jornada | −10 aire, −6 energía, +6 radiación (×3 durante una llamarada) |

**Consumo pasivo por jornada:** energía −8, aire y comida −12 (× dificultad). Sin energía, el soporte vital baja el doble. **Fin:** soporte vital en 0 o radiación en 100 % → la tripulación vuelve a la Tierra (no hay barra de salud). **Degradación:** solo la antena (12–20 % por jornada, sorteado con semilla) y se ve en el HUD como "Radio: buena / mala" (mala bajo el 60 %: no llegan pronóstico ni envíos). La estación es de metal gris oscuro.

## 4. Llamaradas (datos reales)
Cada llamarada aparece en su jornada y a su hora UTC real. La dosis de juego se calcula como `2 + 6·(log10(flujo/1e-6))^1.3`, con ×1,5 si hubo tormenta de partículas (SEP), y se reparte en 10 s. Con el blindaje activo entra solo el 10 %. Al empezar una llamarada la pantalla se tiñe de magenta, suena una alarma y el michi se pone el casco. El HUD cita "FUENTE: … · archivo histórico (no en vivo)".

**Aviso previo:** antes de cada llamarada aparece una alerta, una cuenta regresiva y una flecha al Refugio: 25 s antes si hay pronóstico vigente y solo 10 s antes si no (`FLARE_WARNING_SEC` en `sim/rules.ts`).

## 5. Power-up con costo de oportunidad
En las jornadas 3 y 6 llega un **envío de la Tierra** solo si la antena está al ≥ 60 %. El cohete trae **una** caja: aire y comida, o energía (+25). El reloj se detiene mientras eliges. Si la antena está mal, el envío se pierde y la Comandante explica por qué.

## 6. Jornadas científicas, puntaje y logros
- **Jornadas** (`src/data/missions.ts`): Huerto lunar (nivel 1, Sol de diciembre de 2019), Hielo en la Luna (nivel 2, octubre de 2024) y Cazadores de tormentas (nivel 3, mayo de 2024). Cada una tiene una pregunta de investigación y 3 tareas: hacer una acción N veces, juntar ciencia o pasar llamaradas en el Refugio. Los textos son propuestas del equipo; sus fuentes se revisarán.
- **Fin:** con todas las tareas cumplidas se vuelve a la Tierra (gana). Se pierde si se acaba el plazo con tareas pendientes, si el soporte vital llega a 0 o si la radiación llega a 100 %.
- **Dificultad** (se elige después de la jornada): Cadete / Fácil (día de 120 s, consumo ×0,7, tutorial y consejos), Piloto (90 s, ×1, consejos) y Comandante (72 s, ×1,15, sin consejos).
- **Estrellas:** ★ completar la investigación · ★★ además volver con radiación < 50 % · ★★★ además pasar todas las llamaradas en el Refugio.
- **Puntaje:** tareas×300 + ciencia×100 + llamaradas en el Refugio×100 + días ahorrados×100 + estrellas×200.
- **Logros científicos (9):** Pronóstico experto, Refugio a tiempo, Noche lunar, Exploración lunar, Señal fuerte, Investigación completa, Tripulación sana (radiación < 30 %), Ciencia de campo (4+ de ciencia), Archivo leído.
- **Guardado local** (`localStorage`, sin datos personales): ajustes, mejor puntaje por jornada, logros, fichas leídas y tutorial visto.

## 7. Pantallas
Inicio (Jugar, Archivo científico, Logros, Ajustes, Créditos) → Historia → Selector (Tripulante: Miu, Tomás, Luna o Zib, el michi marciano → Jornada científica → Dificultad) → Carga con cohete (capas reales de la atmósfera) → **Estación** (HUD, mapa, panel de acciones, pausa, ajustes, envío) → **Informe** (investigación completa o incompleta, con sus tareas). El **Archivo científico** se abre desde el menú y desde la pausa.

## 8. Tutorial adaptado a 7–12 años
Al empezar la primera misión (en cualquier dificultad) se detiene el reloj y aparece la tabla de **controles**; el jugador elige **Empezar tutorial** o **Saltar tutorial**. El tutorial son 5 pasos cortos de la Comandante Nébula que avanzan solos al cumplirse: moverse, leer la investigación, usar una máquina, leer las 3 barras y entender las llamaradas. Se puede repetir desde Pausa → Controles. En Cadete y Piloto, después, la Comandante da consejos puntuales ("Queda poco aire y comida: ve a Soporte vital"). Los textos son cortos, con frases simples, y los términos técnicos se explican en contexto.

## 9. Controles
Flechas/WASD para caminar · E para usar la máquina cercana (E otra vez confirma) · Espacio para saltar (gravedad lunar real) · M para el mapa · Esc/P para pausar. Todo se puede hacer también con ratón o pantalla táctil: clic en el piso para caminar y en una máquina para ir y usarla. Se quitó el impulso (dash): no enseñaba nada y sumaba una barra más.

## 10. Pendiente para la iteración 2
Verificar el archivo contra DONKI con una clave de API, agregar datos de OSDR a la Enfermería, minijuego de 60 s en la Esclusa, campaña "De la Luna a Marte" con demora de comunicaciones marciana, más animales e i18n (ver REPORTE-CALIDAD.md).
