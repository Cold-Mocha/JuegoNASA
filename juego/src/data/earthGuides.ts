import type { ScriptLine, Who } from './voyageScript';
/**
 * Conversaciones diarias con Control Tierra (ES/EN), estilo RPG: se abren al empezar cada jornada, con un equipo de Estados Unidos
 * y otro de Chile (solo se nombran países, nunca instituciones). Las pistas de cada minijuego viven aquí, dentro de la charla,
 * en vez de en ventanas sueltas antes de cada juego.
 * Etiquetas: [REAL] dato verificable · [PROPUESTA] diseño del juego · [MODELO] simplificación. Fuentes: SOURCES.md, «Guías de Control Tierra».
 */
const L = (who: Who, es: string, en: string, extra: Partial<ScriptLine> = {}): ScriptLine => ({ who, es, en, ...extra });
const US = (es: string, en: string, extra: Partial<ScriptLine> = {}): ScriptLine => L('TIERRA_US', es, en, extra);
const CL = (es: string, en: string, extra: Partial<ScriptLine> = {}): ScriptLine => L('TIERRA_CL', es, en, extra);

/** Jornada (1-based) → charla con la Tierra. Las jornadas sin entrada no abren conversación. */
export const DAY_TALKS: Record<number, ScriptLine[]> = {
  1: [
    CL('Buenos días desde Chile, base lunar. Aquí es de mañana y ya tenemos el café listo.', 'Good morning from Chile, lunar base. It is morning here and the coffee is ready.'),
    US('Y desde Estados Unidos, un saludo. Dos equipos, un solo plan: que lleguen sanos hasta el final.', 'And from the United States, hello. Two teams, one plan: get you all the way to the end in good shape.'),
    L('NEBULA', 'Recibido. Hoy empezamos con calma: revisar, trabajar y turnarnos.', 'Copy that. We start calmly today: check, work and take turns.'),
    CL('Una pista de huerto: cosechen solo lo maduro, el fruto grande y dorado con su estrellita. Lo verde todavía no.', 'A garden tip: only harvest what is ripe, the big golden fruit with its little star. The green ones are not ready.'),
    US('Nuestras palabras tardan poco más de un segundo en llegar. Si la radio se retrasa, es la distancia, no un error.', 'Our words take just over a second to arrive. If the radio lags, it is the distance, not a mistake.', { note: { es: '[REAL] La señal de radio tarda cerca de 1,3 segundos en ir de la Tierra a la Luna.', en: '[REAL] A radio signal takes about 1.3 seconds to travel from Earth to the Moon.' } }),
  ],
  2: [
    US('Segundo día. Hoy hablemos de las algas: son una mini fábrica de aire y comida.', 'Day two. Today, the algae: a mini factory of air and food.'),
    L('MIU', 'Tienen tres perillas: luz, nutrientes y temperatura. ¿Hay truco?', 'There are three dials: light, nutrients and temperature. Is there a trick?'),
    US('Sí: la luz también calienta el tanque. Si suben una, la otra se mueve sola. Vayan con calma y miren hacia dónde apunta la flecha.', 'Yes: light also warms the tank. Raise one and the other drifts on its own. Go slowly and watch where the arrow points.', { note: { es: '[MODELO] Simplificación del juego: en un cultivo real también se vigilan luz, nutrientes y temperatura.', en: '[MODEL] Game simplification: in a real culture, light, nutrients and temperature are also watched.' } }),
    CL('Cuando una aguja entra a su franja verde, se queda quieta un rato. Aprovechen ese respiro para las otras.', 'When a needle enters its green band, it settles for a while. Use that breather for the others.'),
    L('ZIB', 'Entendido. Todo suave, nada de apuros.', 'Understood. Nice and smooth, no rush.'),
  ],
  3: [
    CL('Día tres: biología. Les va a gustar.', 'Day three: biology. You will like it.'),
    L('LEO', 'Una cepa es como una «raza» de un microbio: la misma especie, pero cada cepa aguanta cosas distintas.', 'A strain is like a "breed" of microbe: the same species, but each strain handles different things.'),
    CL('Exacto. Y dentro de cada célula hay un anillo pequeño de ADN, el plásmido, donde se pueden agregar instrucciones nuevas: un sensor, una función y un interruptor.', 'Exactly. And inside each cell there is a small ring of DNA, the plasmid, where new instructions can be added: a sensor, a function and a switch.', { note: { es: '[REAL] Los plásmidos son anillos de ADN que usan los biólogos para dar nuevas funciones a bacterias y levaduras. [PROPUESTA] Armarlo con piezas es una forma de jugarlo.', en: '[REAL] Plasmids are DNA rings that biologists use to give bacteria and yeast new functions. [PROPOSAL] Building it from pieces is a way to play with it.' } }),
    US('Armen un plásmido completo dentro de la célula en el Taller de ADN. Quien lo hace bien puede descubrir algo especial.', 'Build a full plasmid inside the cell in the DNA Workshop. Whoever does it well might discover something special.'),
    L('NARRA', '* Las luces de la base parpadean un instante.', '* The base lights flicker for an instant.', { fx: 'dim' }),
    US('¿Todo bien por allá? Nuestros sensores marcaron una caída de luz de un segundo. Seguro es el panel solar. Seguro.', 'Everything okay up there? Our sensors logged a one-second drop in light. It must be the solar panel. Surely.', { fx: 'whisper' }),
  ],
  4: [
    US('Día cuatro. Ojo con el Sol: a veces lanza llamaradas.', 'Day four. Watch the Sun: it sometimes throws flares.'),
    L('GUINA', '¿Cómo vamos a saberlo a tiempo?', 'How will we know in time?'),
    US('La pantalla se los dirá: un parpadeo y un tinte de color. Amarillo, suave. Naranja, fuerte. Rojo, muy fuerte.', 'The screen will tell you: a blink and a color tint. Yellow, mild. Orange, strong. Red, very strong.', { note: { es: '[PROPUESTA] Los colores son una señal de juego; las llamaradas reales se clasifican por letras (C, M, X).', en: '[PROPOSAL] The colors are a game signal; real flares are classified by letters (C, M, X).' } }),
    CL('Si la imagen se llena de estática por un instante, es la radio con interferencia. Pasa y se recupera.', 'If the picture fills with static for a moment, it is the radio with interference. It passes and recovers.'),
    L('NEBULA', 'Entonces, al primer parpadeo, adentro y a refugiarse. Si algo se rompe, seguimos la grieta con el sellador.', 'So, at the first blink, inside and take cover. If something cracks, we follow the crack with the sealant.'),
  ],
  5: [
    CL('Día cinco. La noche lunar es larguísima: dura casi dos semanas de las nuestras.', 'Day five. The lunar night is very long: almost two of our weeks.', { note: { es: '[REAL] La noche en un punto de la Luna dura unos 14 días terrestres.', en: '[REAL] Night at one spot on the Moon lasts about 14 Earth days.' } }),
    US('Sin Sol no hay panel. Pedalear en la bici genera energía: sigan el ritmo, cada nota baja por un lado.', 'No Sun means no panels. Pedaling the bike makes energy: follow the rhythm, each note falls on one side.'),
    L('MIU', 'Y cuando salga el Sol, a limpiar los paneles.', 'And when the Sun comes out, time to clean the panels.'),
    CL('Cuidado con el polvo lunar: es finísimo y se pega a todo. Límpienlo a mano, con cariño. Y ojo con el oxígeno del traje afuera.', 'Careful with lunar dust: it is very fine and sticks to everything. Clean it by hand, gently. And watch the suit oxygen outside.'),
  ],
  6: [
    US('Día seis. Si trajeron muestras de hielo, ojo con lo que concluyen.', 'Day six. If you brought ice samples, be careful what you conclude.'),
    L('LEO', 'Nunca decimos «hay vida». Decimos «indicio» o «sin indicio».', 'We never say "there is life". We say "hint" or "no hint".'),
    US('Eso. Y una sola prueba no basta: hagan al menos dos antes de informar.', 'That. And one test is not enough: do at least two before reporting.'),
    CL('Y si alguien se lastima, atiéndanlo con calma. Mantengan apretado cada punto hasta que se cierre el anillo.', 'And if someone gets hurt, take care calmly. Hold each spot down until the ring closes.'),
  ],
  7: [
    CL('Último día. Hay que avisar a la Tierra con la antena: conecten los cables del mismo símbolo.', 'Last day. We need to tell Earth with the antenna: connect the cables with the same symbol.'),
    US('Si llega estática, busquen el patrón que se repite y recuperen el mensaje.', 'If static comes in, look for the pattern that repeats and recover the message.'),
    L('NEBULA', 'Lo logramos juntos. Sin prisa, sin pánico. ¡Astromichis, a cerrar la misión!', 'We did it together. No rush, no panic. Astromichis, let us close the mission!'),
  ],
};

const seen = new Set<string>();
/** True la primera vez de la sesión que se abre esa charla para esa misión (así no se repite en cada reintento). */
export function takeTalk(mission: string, day: number): boolean {
  const key = `${mission}:${day}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

/** Escena al armar un diseño perfecto en el Taller de ADN: nace la cepa legendaria Aurora (ficción del juego). */
export const LEGEND_EARNED: ScriptLine[] = [
  L('NARRA', '* El plásmido brilla dentro de la célula. Algo cambió.', '* The plasmid glows inside the cell. Something changed.'),
  L('LEO', 'Sensor, función e interruptor, todo encajó. ¡Y la cepa aguanta justo lo que necesitaba!', 'Sensor, function and switch, everything clicked. And the strain handles exactly what it needed!'),
  L('ZIB', 'Está tan limpia que parece una cepa nueva. ¿Podemos ponerle nombre?', 'It is so clean it looks like a new strain. Can we name it?'),
  CL('Que se llame Aurora. Cuando la radiación se ponga peligrosa, esa cepa va a responder y a proteger a la tripulación.', 'Let it be called Aurora. When radiation gets dangerous, that strain will respond and protect the crew.', { note: { es: '[PROPUESTA] La cepa Aurora es ficción del juego. [REAL en concepto] Se estudian microbios y pigmentos que protegen de la radiación.', en: '[PROPOSAL] The Aurora strain is a game fiction. [REAL in concept] Microbes and pigments that shield from radiation are studied.' } }),
  US('Guárdenla. Es un solo uso: se activa sola cuando más la necesiten.', 'Keep it safe. One use only: it switches on by itself when you need it most.'),
  L('NEBULA', 'Cepa Aurora a bordo. Gracias, equipo de biología.', 'Aurora strain on board. Thank you, biology team.'),
];

/** Escena cuando la cepa Aurora responde ante la radiación alta. */
export const LEGEND_USED: ScriptLine[] = [
  L('NARRA', '* Un resplandor verde recorre el invernadero.', '* A green glow runs through the greenhouse.', { fx: 'whisper' }),
  L('ZIB', '¡La cepa Aurora respondió! La radiación está bajando.', 'The Aurora strain responded! Radiation is going down.'),
  CL('Para eso la diseñaron. Ahora a refugiarse y a cuidar la salud.', 'That is what it was designed for. Now take cover and look after your health.'),
];
