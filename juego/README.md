# Michinautas

Juego web 2D para el reto **Build a Junior Astronaut Mission Trainer** · NASA Space Apps Challenge 2026 (Temuco).

## Correr

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build estático en dist/
npm run preview    # sirve dist/  (http://localhost:4173)
npm run test:unit  # Vitest + cobertura (lógica pura de src/sim)
npm run test:e2e   # build + Playwright headless (navegación, resoluciones, FPS)
npm run check:sources   # audita los enlaces científicos
npm run data:donki      # descarga llamaradas reales de DONKI (NASA_API_KEY=...)
npm run assets          # re-exporta fondos, props y michi a public/game/
```

`?timescale=N` en la URL acelera el reloj de la estación (herramienta de QA).

Requiere Node 20.19+ o 22.12+.

## Stack

| Pieza | Versión | Por qué |
|---|---|---|
| Phaser | 4.2.1 | Motor 2D web maduro: escenas, tweens, partículas, loader con progreso real. |
| TypeScript | 6.0.3 | Tipos estrictos: 4 personas tocando el mismo código en 48 h. |
| Vite | 8.3.5 | Dev server instantáneo y build estático (sin backend). |
| @fontsource | 5.3.0 | Fredoka + Space Mono empaquetadas (funciona offline, sin Google Fonts). |

**Arquitectura:** el *canvas* de Phaser dibuja mundo y animación; los menús, textos y paneles son **HTML/CSS sobre el canvas** (`UiLayer`, vía `DOMElement` de Phaser) con las clases `mn-*` del design system. Así el texto es accesible y nítido, y los diseñadores editan CSS sin tocar el motor.

```
design/tokens.json        ← fuente única de colores/tipos (design system Michinautas)
scripts/build-tokens.mjs  ← genera src/styles/tokens.css (corre solo en dev/build)
src/
  main.ts                 ← config de Phaser y orden de escenas
  core/                   ← config, tema (tokens→Phaser), estado, UiLayer, fondo estelar, arte SVG, fades
  data/                   ← CONTENIDO EDITABLE: historia, estaciones, personajes, dificultad, capas atmosféricas, preload
  sim/                    ← LÓGICA PURA (sin Phaser): simulación, reglas, física, llamaradas, puntaje, logros
  scenes/                 ← Boot → MainMenu → Story → Select → LaunchLoading → Station → MissionReport (+ Encyclopedia)
  styles/                 ← components.css (design system) + app.css (layout de pantallas)
public/story/             ← láminas de la historia (placeholder; reemplazar con mismo nombre, 1280×720)
```

## Flujo de pantallas

1. **Menú principal**: Jugar, Ajustes (alto contraste, reducir movimiento), Créditos.
2. **Historia**: láminas imagen + texto con efecto máquina de escribir. Espacio/Enter/clic avanza, Esc salta. Editar en `src/data/story.ts`.
3. **Selector**: Estación → Tripulante → Dificultad (clic o flechas). Resultado en `state.loadout`.
4. **Carga con cohete (despegue al amanecer)**: la torre de control habla directo con el tripulante elegido mientras corre el conteo regresivo (T-10 → T-0, guion en `src/data/launch.ts`). T-6 enciende los motores principales (vapor, temblor de tierra, gaviotas asustadas que huyen del cohete) y T-0 los propulsores y el despegue, con el público de animales y la prensa mirando a distancia. Luego sube por troposfera, estratosfera, mesosfera y termosfera hasta el espacio cislunar con altitud y un dato por capa (valores reales; escala visual no proporcional). Dura ~25 s (`LIFTOFF_MS`, `ASCENT_MS`) y nunca termina antes que la carga real de `src/data/preload.ts`. Con movimiento reducido o Ultra Ligero se acelera, sin sacudidas ni partículas.
5. **Estación**: salas 2.5D, HUD de recursos, mapa, acciones con costo, llamaradas reales, envíos y pausa.
6. **Fin de misión** y **Archivo científico**. Diseño completo en [`../GDD.md`](../GDD.md), fuentes en [`../SOURCES.md`](../SOURCES.md) y QA en [`../REPORTE-CALIDAD.md`](../REPORTE-CALIDAD.md).

## Cómo agregar…

- **Una lámina de historia**: agregar el objeto en `data/story.ts` y su imagen en `public/story/`.
- **Una estación / personaje / dificultad**: un objeto en el archivo correspondiente de `data/`.
- **Assets de la estación o misiones**: `load.image(...)` dentro de `queueStationAssets` (`data/preload.ts`). Se cargan durante el cohete.
- **Un color o estilo**: editar `design/tokens.json` (no `tokens.css`, que se genera).

## Legal y marca

- **No usar** la insignia, el logotipo "worm" ni el sello de la NASA (14 CFR 1221). Participar en Space Apps no da permiso. Para el evento, usar el logo oficial de *NASA Space Apps Challenge* (spaceappschallenge.org/brand) sin modificarlo.
- Imágenes y datos de la NASA: permitidos con crédito (`credit` en `story.ts`, estilo `caption-mono`).
- **Privacidad (Ley 19.628 / 21.719, Chile)**: el juego no recolecta datos personales. Solo guarda preferencias en `localStorage` del dispositivo. No agregar analítica, cuentas ni nombre real del jugador sin revisar esto antes: el público son menores de edad.
- Fuentes Fredoka y Space Mono: SIL OFL 1.1.

## Deploy

El build es estático con rutas relativas: GitHub Pages, Netlify o Vercel sirven `dist/` tal cual. Space Apps pide un enlace público al proyecto.
