# Estudio: desafío vs. juego, y simplificación para 8–12 años

**Fecha:** 14-11-2026 · **Alcance:** comparar el texto oficial del reto (`DESAFIO.md`) con Michinautas tal como estaba (GDD iteración 1) y simplificarlo para niños de 8 a 12 años.

## 1. Lo que pide el desafío

| Pide el reto | Cita (DESAFIO.md) |
|---|---|
| Niños de 7–12 años manejan un puesto lunar o marciano | "lets kids ages 7–12 manage a lunar or Martian outpost" |
| Decisiones sobre soporte vital, blindaje, energía, comida y demora de comunicaciones | "life support, radiation shielding, power budgeting, food production, and communication delay" |
| Ninguna decisión gratis | "Avoid designing a 'safe' choice that has no cost" |
| **Pocos sistemas a la vez** | "two or three core resources — life support, power, shielding — are usually more effective than five or six" |
| Lenguaje simple y términos explicados en contexto | "Favor plain language over jargon" |
| Datos reales de la NASA, con fuente y sin presentarlos como en vivo | DONKI, OSDR; "don't present static data as live" |
| La mecánica pesa más que el pulido visual | "a simple game that teaches a real constraint beats a beautiful one that doesn't" |
| Rejugable y sin castigar el error | "learn from failure without it feeling punitive" |

## 2. Cómo estaba el juego (antes)

**Lo que ya cumplía bien:** llamaradas reales del archivo DONKI con fecha y fuente honesta ("archivo histórico, no en vivo"), el blindaje como decisión de costo (energía y quedarse quieto), la demora real Tierra–Luna (2,56 s), el envío de la Tierra con costo de oportunidad, el informe final que explica la causa sin castigar y la semilla aleatoria que cambia cada partida.

**Lo que chocaba con el reto o con la edad:**

| Problema | Por qué molesta a un niño de 8–12 años | Choca con |
|---|---|---|
| **5 barras de recursos** (energía, oxígeno, comida, salud, radiación) **+ barra de impulso** = 6 barras | Duplica el máximo que recomienda el reto; el niño no sabe cuál mirar | "two or three core resources" |
| Variables ocultas: polvo en los paneles (8–14 %/día) y señal de la antena sin indicador | Las acciones fallan "sin razón" visible | Lenguaje claro / mecánica entendible |
| 10 acciones y 2 por sala (teclas 1/2) | Mucho que recordar | Pocos sistemas |
| 7 controles (WASD, Shift, Espacio, E, 1/2, M, Esc); el impulso (dash) no enseña nada | Carga motora sin aprendizaje | Bajo umbral de entrada |
| Salud como recurso intermedio + causa "mixta" de derrota | Cuesta entender por qué se perdió | Aprender del fracaso |
| 5 jornadas × 3 dificultades = 15 combinaciones | Elegir cuesta más que jugar | Bajo umbral |
| Jerga: "X9.3", "UTC", "O₂", "Rad", "alinear antena", "orientar paneles" | No se explica en contexto | "plain language" |
| Puntaje con 7 términos y estrellas atadas a la salud | El niño no entiende qué mejorar | Rejugabilidad clara |
| Tutorial de 6 pasos largos | Se salta o se olvida | Bajo umbral |

## 3. Decisiones de simplificación (aplicadas)

1. **3 recursos, como pide el reto:** ⚡ **Energía**, 🫧 **Aire y comida** (soporte vital) y ☢ **Radiación** (el blindaje). Comida y oxígeno van juntos porque en el juego los produce la misma cadena de soporte vital (reciclador y algas). Se elimina la barra de **Salud**: perder pasa solo si el soporte vital llega a 0 o la radiación a 100 %, y así la causa siempre es una sola y clara.
2. **Una acción por sala** (el Refugio alterna entrar/salir). Se quitan *Curarse* y *Limpiar polvo*, con su variable oculta. **E** abre la máquina y **E otra vez** confirma; el costo se ve antes de confirmar.
3. **Enfermería = sala de lectura:** sin costo, abre la ficha "El cuerpo en el espacio" (NASA / OSDR). Enseña que la radiación no se "cura": se previene en el Refugio.
4. **La radio se ve:** el HUD dice "Radio: buena" o "Radio: mala" (sin porcentajes; un solo umbral para el pronóstico y los envíos). La demora Tierra–Luna sigue en el juego y el texto la explica: "casi 3 segundos, aunque viaja a la velocidad de la luz".
5. **Sin impulso (dash):** quedan 5 controles (caminar, E, saltar, mapa, pausa). El salto se mantiene porque enseña la gravedad lunar real.
6. **3 jornadas, una por nivel:** Huerto lunar (Sol tranquilo, dic. 2019) → Hielo en la Luna (oct. 2024, con llamaradas) → Cazadores de tormentas (mayo 2024). Tareas de 3 pasos y frases cortas.
7. **Lenguaje:** "Llamarada **muy fuerte** (X9.3)" (palabra simple y, entre paréntesis, la clase real); "Pasó de verdad el 10 may 2024" en vez de la hora UTC; los verbos de las acciones son concretos ("Mover los paneles solares", "Arreglar la antena", "Limpiar el aire").
8. **Estrellas que se entienden:** ★ terminar la investigación · ★★ volver con radiación < 50 % · ★★★ además, pasar todas las llamaradas dentro del Refugio. Puntaje: tareas×300 + ciencia×100 + llamaradas en el Refugio×100 + días ahorrados×100 + estrellas×200.
9. **Tutorial de 5 pasos cortos;** el paso 4 dice explícitamente "solo 3 barras… ninguna acción es gratis".
10. **Dificultad con palabras simples:** Cadete = *Fácil* (día de 120 s), Piloto = *Normal* y Comandante = *Difícil*.

## 4. Trade-offs que se conservan (lo que el niño aprende)

| Decisión | Costo | Lección real |
|---|---|---|
| Entrar al Refugio | −8 energía y no puedes hacer nada | El blindaje protege, pero detiene el trabajo |
| Mover los paneles | +3 radiación; de noche no sirve | La energía solar depende del día lunar |
| Limpiar el aire / Encender las algas | Energía | Sin energía, el soporte vital cae más rápido |
| Algas vs. reciclador | Algas: más energía, pero rinden más al final del día | Producir comida y aire toma tiempo |
| Salir a explorar | Aire, energía y radiación (×3 durante una llamarada) | La ciencia tiene riesgo |
| Pedir el pronóstico / arreglar la antena | Energía + 3 s de demora | La comunicación con la Tierra no es instantánea |
| Elegir la caja del envío | Solo una: aire o energía | Costo de oportunidad |

## 5. Verificación

- `tsc --noEmit` y `vite build` sin errores.
- Bot de balance (`tests/unit/balance.test.ts`): una estrategia razonable gana las 3 jornadas en las 3 dificultades, y no hacer nada pierde (13/13).
- Prueba rápida en el navegador: el HUD muestra 3 barras y la señal, sin errores en la consola.
- El resto de las suites no se ejecutó (por decisión del equipo); se actualizó para que compile con el modelo nuevo.

## 6. Pendiente sugerido

Probarlo con 3–5 niños de 8–12 años y medir si saben decir **por qué** ganaron o perdieron; leer en voz alta los textos de la Comandante; evaluar un modo "sin reloj" para los de 8 años.
