# Declaración de uso de IA

La pauta pide declarar si se usó IA. Sí se usó.

## Texto para el formulario

> Yes. We used Claude (Anthropic), through Claude Code and claude.ai, as a coding and writing assistant. It helped write and refactor TypeScript and Phaser code, draft the design document and README, translate texts between Spanish and English, and prototype the design system and the station layout. The team decided the game design, the datasets and how real data maps to mechanics. The team reviewed, type checked and built the code before every deploy. The character sprites come from our own Python scripts, not from image generation models. The game has no AI features and sends no data to any AI service.

## Detalle

| Uso | Herramienta | Qué revisó el equipo |
|---|---|---|
| Código del juego (TypeScript, Phaser, simulación) | Claude Code | Revisión del código, chequeo de tipos y build antes de cada despliegue. Pruebas de juego a mano |
| Documentación (diseño, README, fuentes, este envío) | Claude Code | Que coincida con el código y con las fuentes enlazadas |
| Traducción entre español e inglés | Claude Code | Lectura de los textos dentro del juego |
| Prototipos del sistema de diseño y de la estación | claude.ai (Artifacts) | Elección del estilo final |
| Arte del personaje | Scripts propios en Python (carpeta `herramientas/`) | No usa IA que genere imágenes |

Si se generan clips de video con una herramienta de IA para la demo, deben declararse aquí también (ver `06-VIDEOS.md`).
