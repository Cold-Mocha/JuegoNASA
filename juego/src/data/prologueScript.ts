import type { ScriptLine, Who } from './voyageScript';
/**
 * Prólogo del juego (ES/EN). Va desde la carta de la Academia hasta «elijan su misión».
 * Reemplaza a las láminas 4–7 de la historia anterior: sus avisos [REAL]/[PROPUESTA] viven ahora en `note`.
 * El juego no nombra instituciones (solo sitios públicos de observación). Fuentes: SOURCES.md, sección «Prólogo».
 */
const L = (who: Who, es: string, en: string, extra: Partial<ScriptLine> = {}): ScriptLine => ({ who, es, en, ...extra });
const S = 'story/';
const P = 'prologue/backgrounds/';

export const INTRO: ScriptLine[] = [
  L('NARRA', '* Cada noche, desde su ventana, Miu y sus amigos miraban las estrellas y soñaban con viajar entre ellas.', '* Every night, from her window, Miu and her friends watched the stars and dreamed of traveling among them.', { bg: `${S}01.svg` }),
  L('NARRA', '* Un día llegó una carta brillante: «Has sido seleccionado para la Academia de Astronautas Junior».', '* One day a shiny letter arrived: “You have been selected for the Junior Astronaut Academy.”', { bg: `${S}02.svg` }),
  L('NEBULA', 'Bienvenidos, cadetes. En el espacio no hay que correr: hay que pensar, revisar y trabajar en equipo.', "Welcome, cadets. In space you don't rush: you think, double-check and work as a team.", { bg: `${S}03.svg` }),

  L('NARRA', '* Norte de Chile. El desierto de Atacama.', '* Northern Chile. The Atacama Desert.', { bg: `${P}bg-alma.svg` }),
  L('NARRA', '* Uno de los cielos más limpios del planeta. Aquí trabajan ALMA, Paranal y La Silla.', '* One of the clearest skies on the planet. ALMA, Paranal and La Silla work here.', { note: { es: '[REAL] Atacama es un sitio de investigación reconocido; compararlo con otros mundos es una analogía de trabajo.', en: '[REAL] Atacama is a recognized research site; comparing it to other worlds is a working analogy.' } }),
  L('NARRA', '* Y aquí también se prueban equipos pensando en otros mundos.', '* Equipment is also tested here, with other worlds in mind.'),
  L('NARRA', '* Más arriba, la Estación Espacial Internacional.', '* Higher up, the International Space Station.', { bg: `${P}bg-eei.svg` }),
  L('NARRA', '* Un contenedor chileno viaja allí: microorganismos, microgravedad y radiación.', '* A Chilean container travels there: microorganisms, microgravity and radiation.'),
  L('NARRA', '* Es el primer laboratorio chileno en el espacio.', "* It is Chile's first laboratory in space.", { note: { es: '[REAL] Primer laboratorio chileno en el espacio: contenedor con experimentos biológicos y tecnológicos a bordo de la Estación Espacial Internacional.', en: "[REAL] Chile's first laboratory in space: a container with biological and technology experiments aboard the International Space Station." } }),

  L('ZIB', '...¿Me escuchan? La señal es débil.', '...Can you hear me? The signal is weak.', { bg: `${P}bg-moon.svg` }),
  L('NEBULA', 'Fuerte y claro. Aquí, base lunar.', 'Loud and clear. Lunar base here.'),
  L('GUINA', 'Desde Chile y Estados Unidos nos mandan órdenes. Cada una tarda poco más de un segundo.', 'Chile and the United States send us orders. Each takes just over a second.'),
  L('LEO', 'Y vienen con una pregunta enorme: ¿puede crecer vida en la Luna?', 'And they come with a huge question: can life grow on the Moon?'),
  L('LEO', 'Nadie lo ha probado. Solo hay propuestas.', 'Nobody has tried it. There are only proposals.', { note: { es: 'La base lunar y esta historia son ficción. Hoy la Luna NO es habitable: no tiene aire respirable, ni agua líquida, ni protección contra la radiación.', en: 'The lunar base and this story are fiction. Today the Moon is NOT habitable: it has no breathable air, no liquid water and no protection from radiation.' } }),
  L('ZIB', 'Entonces... ¡probemos!', "Then... let's try!"),
  L('NEBULA', 'Primero energía, aire y comida. Después, ciencia.', 'Energy, air and food first. Then, science.', { note: { es: '[PROPUESTA] Ordenar el juego en pasos hacia un hábitat es una forma de jugar, no un plan oficial de ninguna agencia.', en: '[PROPOSAL] Ordering the game into steps toward a habitat is a way to play, not an official plan of any agency.' } }),
  L('MIU', 'Y el Sol lanza llamaradas. Ojo con la radiación.', 'And the Sun throws flares. Watch the radiation.'),
  L('LEO', 'Ojo también con esto: lo que hacemos aquí es una simulación inspirada en los experimentos reales.', 'Also note: what we do here is a simulation inspired by the real experiments.'),
  L('ZIB', 'Dicen que al final llegará una sonda con una última prueba.', 'They say a probe will arrive at the end with one last test.'),
  L('ZIB', 'Ah... alguien dejó una nota en el panel.', 'Oh... someone left a note on the panel.'),
  L('NARRA', '* «El polvo de la Luna guarda más secretos de lo que parece.»', '* “Moon dust keeps more secrets than it seems.”'),
  L('NARRA', '* No tiene firma.', '* It is unsigned.'),
  L('NEBULA', 'Elijan su misión, su tripulante y su nivel. Al final, una sonda de control remoto llevará el rover por el espacio, recorrerán la superficie y volveremos a la Tierra en un orbitador. ¡Astromichis, a trabajar!', 'Choose your mission, your crew member and your level. At the end, a remote-controlled probe will carry the rover through space, you will drive across the surface and we will return to Earth in an orbiter. Astromichis, to work!'),
];
