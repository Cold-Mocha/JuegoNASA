# Game Design Document — Michinautas (iteración 1 restaurada: 5 barras, salud, polvo y 5 jornadas; nave compacta y exterior con oxígeno del traje)

> Cambios de esta iteración y su justificación frente al reto: ver `ESTUDIO-SIMPLIFICACION.md`.

**Género:** gestión de recursos y supervivencia en 2.5D · **Público:** 7–12 años (también sirve para familia y aula) · **Plataforma:** navegador, sin descarga ni cuenta · **Reto:** NASA Space Apps 2026, *Build a Junior Astronaut Mission Trainer*.

## 1. Fantasía y objetivo educativo
Eres un michi astronauta en la **Estación Central**, un puesto lunar ficticio, en una **jornada científica**: una investigación con una lista de tareas (por ejemplo, buscar hielo, cultivar algas o estudiar las llamaradas). Al cumplir todas las tareas, la tripulación **vuelve a la Tierra**. El plazo son 7 días lunares comprimidos, y de fondo se vive una **semana real del Sol** con sus llamaradas (archivo DONKI de la NASA). Los **5 recursos** (energía, oxígeno, comida, salud, radiación) son **secundarios**: hay que cuidarlos para poder investigar.
**Lo que el niño se lleva:** *ninguna decisión es gratis*. Ahorrar energía hoy cuesta aire mañana; salir a hacer ciencia da puntos pero también radiación; el pronóstico solar solo llega si cuidas la antena.

## 2. Bucle principal
1. Mirar las 3 barras (energía, aire y comida, radiación), la señal de la antena y la jornada (día / atardecer / noche).
2. Caminar a una sala por la estación, que es **un solo plano continuo** (vista cenital, sin pantallas de carga): Soporte vital, Cultivo y Energía arriba; un pasillo central con el Refugio en un extremo y Comunicaciones en el otro; Puente, Esclusa y Enfermería abajo. Se camina con el teclado, con un clic en el piso o con un clic en una máquina (el michi camina solo hasta ella). El mapa (M) es solo para mirar: muestra el plano y una carita de michi donde estás. **Caminar gasta tiempo:** el Refugio queda en el extremo opuesto a Energía y Comunicaciones. **Luz:** no hay niebla; la estación se oscurece pareja a medida que baja la energía.
3. Usar la máquina de la sala. Cada acción muestra su costo antes de elegirla.
4. Reaccionar a eventos: llamaradas reales, envíos de la Tierra y recursos críticos.
5. Terminar las 7 jornadas → puntaje, estrellas, logros y "lo que aprendiste".

## 3. Salas y acciones (`src/sim/rules.ts`) — 10 acciones, hasta 2 por máquina (teclas 1 y 2)
La **nave** (arriba, compacta) protege de las llamaradas (radiación ×0,1). **Afuera** están la superficie lunar, los paneles solares y el invernadero: ahí aparece la barra de **oxígeno del traje**, que baja de a poco en la superficie y se recarga en la nave y el invernadero. No hay cápsula ni Refugio.
| Sala | Acciones | Efecto | Costo |
|---|---|---|---|
| Soporte vital | 1 Reciclar el aire · 2 Preparar comida | +15 O₂ · +18 comida | −6 / −5 energía |
| Invernadero (afuera) | 1 Luces de las algas · 2 Cosechar | +6 O₂ y +4 comida (+5 y +4 al cierre del día) · +15 comida | −7 / −3 energía |
| Puente | 1 Pronóstico solar | Llamaradas de hoy y mañana (señal ≥ 60 %) | −1 energía |
| Enfermería | 1 Curarse | +25 salud | −8 energía, −4 comida |
| Comunicaciones | 1 Alinear la antena | Señal al 100 % (tras 2,56 s de demora) | −5 energía |
| Paneles (afuera) | 1 Orientar paneles · 2 Limpiar el polvo | +20 energía × luz × (1 − pérdida por polvo) · polvo a 0 | +3 / +2 radiación |
| Roca con hielo (afuera) | 1 Recoger muestras | +2 ciencia, 1 vez por día | −3 energía, +4 radiación (×3 en llamarada) |

**Energía renovable:** los paneles generan +14 por jornada mientras estén limpios (la energía se renueva sola). El polvo les quita rendimiento; cuando generan menos de lo que gasta la nave (−8 × dificultad), "fallan" y la energía empieza a bajar. Limpiarlos en la superficie la repone.
**Consumo pasivo por jornada:** energía −8, O₂ −9, comida −7 (× dificultad). Sin energía el O₂ baja más rápido. **Salud:** baja si O₂ o comida ≤ 15 o la radiación ≥ 70 %; con salud 0 (o radiación 100 %) la tripulación vuelve a la Tierra. **Degradación:** antena (12–20 % por jornada, visible como "Señal %") y polvo en los paneles (8–14 % por jornada, variable oculta).

## 4. Llamaradas (datos reales)
Cada llamarada aparece en su jornada y a su hora UTC real. La dosis de juego se calcula como `2 + 6·(log10(flujo/1e-6))^1.3`, con ×1,5 si hubo tormenta de partículas (SEP), y se reparte en 10 s. Con el blindaje activo entra solo el 10 %. Al empezar una llamarada la pantalla se tiñe de magenta, suena una alarma y el michi se pone el casco. El HUD cita "FUENTE: … · archivo histórico (no en vivo)".

**Aviso previo:** antes de cada llamarada aparece una alerta, una cuenta regresiva y una flecha al Refugio: 25 s antes si hay pronóstico vigente y solo 10 s antes si no (`FLARE_WARNING_SEC` en `sim/rules.ts`).

## 5. Power-up con costo de oportunidad
En las jornadas 3 y 6 llega un **envío de la Tierra** solo si la antena está al ≥ 60 %. El cohete trae **una** caja: aire y comida, o energía (+25). El reloj se detiene mientras eliges. Si la antena está mal, el envío se pierde y la Comandante explica por qué.

## 6. Jornadas científicas, puntaje y logros
- **Jornadas** (`src/data/missions.ts`): tres. **Huerto lunar** (nivel 1, Sol tranquilo de diciembre de 2019; trae el cultivo de algas y el rack de plantas), **Energía del Sol** (nivel 2, Sol tranquilo; trae un panel de pruebas) y **Hielo en la Luna** (nivel 3, octubre de 2024 con llamaradas; trae el taladro de hielo). El mapa base es fijo; cada jornada suma sus propios objetos interactivos, que solo aparecen al elegirla (`only(...)` en `src/data/rooms.ts`). Los textos son propuestas del equipo; sus fuentes se revisarán.
- **Fin:** con todas las tareas cumplidas se vuelve a la Tierra (gana). Se pierde si se acaba el plazo con tareas pendientes, si el soporte vital llega a 0 o si la radiación llega a 100 %.
- **Dificultad** (se elige después de la jornada): Cadete (día de 120 s, consumo ×0,7, tutorial y consejos), Piloto (90 s, ×1, consejos) y Comandante (72 s, ×1,15, sin consejos).
- **Estrellas:** ★ completar la investigación · ★★ además volver con radiación < 50 % · ★★★ además pasar todas las llamaradas en el Refugio.
- **Puntaje:** tareas×300 + ciencia×100 + llamaradas en el Refugio×100 + días ahorrados×100 + estrellas×200.
- **Logros científicos (9):** Pronóstico experto, Refugio a tiempo, Noche lunar, Exploración lunar, Señal fuerte, Investigación completa, Tripulación sana (radiación < 30 %), Ciencia de campo (4+ de ciencia), Archivo leído.
- **Guardado local** (`localStorage`, sin datos personales): ajustes, mejor puntaje por jornada, logros, fichas leídas y tutorial visto.

## 7. Pantallas
Inicio (Jugar, Archivo científico, Logros, Ajustes, Créditos) → Historia → Selector (Tripulante: Miu, Tomás, Luna o Zib, el michi marciano → Jornada científica → Dificultad) → Carga con cohete (capas reales de la atmósfera) → **Estación** (HUD, mapa, panel de acciones, pausa, ajustes, envío) → **Informe** (investigación completa o incompleta, con sus tareas). El **Archivo científico** se abre desde el menú y desde la pausa.

## 8. Tutorial adaptado a 7–12 años
Al empezar la primera misión (en cualquier dificultad) se detiene el reloj y aparece la tabla de **controles**; el jugador elige **Empezar tutorial** o **Saltar tutorial**. El tutorial son 5 pasos cortos de la Comandante Nébula que avanzan solos al cumplirse: moverse, leer la investigación, usar una máquina, leer las 3 barras y entender las llamaradas. Se puede repetir desde Pausa → Controles. En Cadete y Piloto, después, la Comandante da consejos puntuales ("Queda poco aire y comida: ve a Soporte vital"). Los textos son cortos, con frases simples, y los términos técnicos se explican en contexto.

## 9. Controles
Flechas/WASD para caminar · E para usar la máquina cercana · 1/2 para elegir la acción · Espacio para saltar (gravedad lunar real) · M para el mapa · Esc/P para pausar. Todo se puede hacer también con ratón o pantalla táctil: clic en el piso para caminar y en una máquina para ir y usarla. Shift = impulso (dash) con su barra propia; 1 y 2 eligen la acción de la máquina.

## 10. Pendiente para la iteración 2
Verificar el archivo contra DONKI con una clave de API, agregar datos de OSDR a la Enfermería, minijuego de 60 s en la Esclusa, campaña "De la Luna a Marte" con demora de comunicaciones marciana, más animales e i18n (ver REPORTE-CALIDAD.md).
