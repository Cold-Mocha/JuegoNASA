# Informe de jugabilidad y movimiento de las barras

Fecha: 15 de noviembre de 2026. Es un análisis del código (no se jugó ni se simuló en el navegador). Las trayectorias vienen de una simulación aparte con las constantes copiadas del juego, con 300 semillas y valores medianos. Son orientativas.

## Números reales del juego

| Cosa | Valor |
|---|---|
| Inicio | Energía 50, oxígeno 60, comida 60, salud 100, radiación 0 |
| Gasto pasivo por jornada | Energía 6, oxígeno 11, comida 14 (por el multiplicador de dificultad) |
| Renovación | Oxígeno +10 y paneles 9 por la luz. Estas no se multiplican por la dificultad |
| Multiplicador | Cadete 0,85, Piloto 1,15, Comandante 1,35 |
| Fractura del reciclador | 70 % por jornada desde el día 2. Quita 30 de oxígeno extra y corta la renovación |
| Tormenta de polvo | 50 % por jornada y segura si pasaron 2 jornadas sin una |
| Salud | Baja con oxígeno 0 (45), comida 0 (30) y radiación sobre 30 |
| Llamaradas | Dosis de 17 a 27 de X1 a X9. Dentro de la nave entra el 10 %. El escudo gasta 4 de energía por llamarada |

## Cómo se mueven las barras

Sin hacer nada, en la misión de mayo de 2024:

- Cadete: el oxígeno llega a 0 el día 4 y se pierde en 296 de 300 partidas.
- Piloto: el oxígeno llega a 0 el día 4 y se pierde siempre.
- Comandante: el oxígeno ya está en 0 el día 3 y se pierde siempre.

Solo cumpliendo tareas (primera misión, termina el día 3): se gana en los tres niveles, pero en Comandante el oxígeno llega a 0 justo al final.

Jugando bien (sella, cosecha, pedalea, cura y se protege), al llegar al día 7:

- Cadete: energía 33, oxígeno 86, comida 37, salud 100, radiación 27.
- Piloto: energía 29, oxígeno 64, comida 8, salud 100, radiación 27.
- Comandante: energía 22, oxígeno 48, comida 0, salud 72, radiación 27.

## Lo que encontramos

Gravedad alta:

1. El GDD tenía números distintos a los del código (energía inicial, consumos, fractura y multiplicadores). Ya se corrigió en `GDD.md`.
2. La fractura es lo único que mata rápido. En Comandante quita unos 55 de oxígeno por jornada y ninguna tarea la menciona. Sellarla es un impuesto diario casi seguro.
3. El multiplicador de dificultad sube el gasto pero no la renovación. El oxígeno neto va de +0,65 por jornada en Cadete a −4,85 en Comandante, y la comida de −11,9 a −18,9. Comandante termina con comida 0 aunque juegue bien.

Gravedad media:

4. La radiación casi no importa. Quien se protege termina entre 16 y 27, siempre bajo el umbral de 30.
5. El escudo no es un dilema. Gasta 4 de energía por llamarada y un solo pedal da 10.
6. Pedalear y cosechar dominan: dan casi toda la energía y la comida que pide una misión.
7. Curar no tiene tope diario.
8. El invernadero cuenta como «afuera» en las llamaradas. Con solo 10 segundos de aviso es fácil recibir 20 de radiación sin entender por qué.
9. La misión de mayo de 2024 es ajustada: una limpieza tardía del panel de pruebas la pierde por plazo.

Gravedad baja:

10. La comparación «afuera habrían sido 20» usa siempre 20 y no la dosis real.
11. Terminar temprano da puntos por día ahorrado, pero choca con el logro «Noche lunar».
12. La primera tormenta siempre cae el día 2, aunque el texto dice que es al azar.

## Propuestas de balance (sin aplicar, para decidir tras jugar)

1. Subir también la renovación de oxígeno con el multiplicador, o bajar el de Comandante a 1,25.
2. Bajar el umbral de salud por radiación de 30 a 20, o subir el golpe de afuera de 20 a 30.
3. Subir el gasto del escudo de 0,4 a 1,0 de energía por segundo (10 por llamarada).
4. Bajar los pedales de 3 a 2 por jornada.
5. Poner tope de 2 curaciones por jornada.
6. Bajar la probabilidad de fractura de 0,7 a 0,5 y avisar antes.
7. Subir el aviso sin pronóstico de 10 a 15 segundos.

## HUD: qué se mueve cuando algo cambia

Ya existía: las barras se deslizan hasta su valor, hay textos flotantes sobre el michi, el aviso de llamarada tiene cuenta regresiva y el tinte magenta.

Faltaba (y ya se agregó en esta versión):

- Un destello verde o rojo en la barra cuando sube o baja 3 puntos o más (en radiación se invierten los colores).
- Dos pulsos de alarma cuando una barra entra en estado crítico.
- Un pulso en el número del día al empezar cada jornada.
- Un pulso en el panel de tareas al cumplir una tarea.
- La barra marca estado crítico con el mismo valor real que usa la simulación (antes usaba el valor redondeado y se pintaba roja un instante antes).

Todo se apaga con «reducir movimiento» y ninguna animación se repite más de 2 veces por segundo.

## Incoherencias de la HUD pendientes

- La barra de radiación llena es mala y las demás llenas son buenas. Solo el color magenta lo insinúa.
- La barra del traje muestra segundos pero mide porcentaje, y usa el ícono de casco con el color del oxígeno.
- Comida usa el ícono de brote, igual que cultivar y cosechar. Energía usa el mismo rayo que pedalear.
- El umbral crítico del traje es 30 y el de las barras es 20.
