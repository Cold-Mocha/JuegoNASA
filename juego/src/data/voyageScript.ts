/**
 * Guion del regreso a casa «Rueda detenida» (ES/EN). Diálogos originales: no se usa la letra ni la música de ninguna canción.
 * Etiquetas: [REAL] dato verificable · [PROPUESTA] diseño del juego · [MODELO] simplificación. La nave es ficción (orbitador tipo transbordador).
 * El nombre de la nave está en un solo lugar (`SHIP_NAME`) para poder cambiarlo.
 */
export type Who = 'PILOTO' | 'TORRE' | 'VUELO' | 'NAVE' | 'SALA';
export type Fx = 'shake' | 'static' | 'whisper';
export interface ScriptLine { who: Who; es: string; en: string; fx?: Fx; }

/** [PROPUESTA] Wenu Lewfü = «río del cielo» (la Vía Láctea) en mapudungun. Pendiente de confirmar con hablantes y con el equipo. */
export const SHIP_NAME = 'Wenu Lewfü';

export const WHO_LABEL: Record<Who, { es: string; en: string; color: string }> = {
  PILOTO: { es: 'PILOTO', en: 'PILOT', color: '#7fd4ff' },
  TORRE: { es: 'TORRE', en: 'TOWER', color: '#6fe39a' },
  VUELO: { es: 'VUELO', en: 'FLIGHT', color: '#ffcb47' },
  NAVE: { es: 'NAVE', en: 'SHIP', color: '#f5f5f2' },
  SALA: { es: 'SALA', en: 'ROOM', color: '#c9b6ff' },
};

const L = (who: Who, es: string, en: string, fx?: Fx): ScriptLine => ({ who, es, en, fx });

export type SceneKey =
  | 'go' | 'view' | 'signalLost' | 'signalBack' | 'air' | 'airDone' | 'power' | 'powerDone' | 'leo'
  | 'endA' | 'endB' | 'endC';

export const SCRIPT: Record<SceneKey, ScriptLine[]> = {
  // 1. Chequeo GO / NO-GO [REAL: el director de vuelo consulta a cada controlador]
  go: [
    L('NAVE', '* Los sistemas despiertan uno por uno.', '* The systems wake up one by one.'),
    L('TORRE', `${SHIP_NAME}, aquí Torre. ¿Me escuchas?`, `${SHIP_NAME}, this is Tower. Do you read me?`),
    L('PILOTO', 'Fuerte y claro, Torre.', 'Loud and clear, Tower.'),
    L('TORRE', 'Copiado. Director de vuelo, tengo a la tripulación en línea.', 'Copy. Flight director, I have the crew on the line.'),
    L('VUELO', 'Gracias. Voy a consultar a la sala.', 'Thank you. I will poll the room.'),
    L('NAVE', '* Una lista aparece en pantalla. Cada línea dice GO o NO-GO, según lo que cuidaste en la base.', '* A list appears on screen. Each line says GO or NO-GO, depending on how you cared for the base.'),
  ],
  // 2. La vista: la única escena sin amenaza… hasta que deja de estarlo
  view: [
    L('NAVE', '* La Tierra cabe en tu mano. Todos los que conoces están ahí.', '* Earth fits in your hand. Everyone you know is there.'),
    L('TORRE', 'Los datos de tus muestras llegaron completos. La sala está muy contenta.', 'The data from your samples arrived complete. The room is very happy.'),
    L('PILOTO', 'Gracias, Torre. ¿Sabes qué es raro? Se ve tan tranquilo.', 'Thank you, Tower. You know what is strange? It looks so calm.'),
    L('TORRE', 'Es lo bueno y lo malo del espacio. Todo parece tranquilo hasta que deja de estarlo.', 'That is the good and the bad of space. Everything looks calm until it is not.'),
    L('NAVE', '* Detrás de ti, la Luna se hace pequeña. Entre ustedes hay mucho, mucho vacío.', '* Behind you, the Moon grows small. Between you there is so much, so much emptiness.', 'whisper'),
    L('NAVE', `* [Hallazgo] Esta nave se llama «${SHIP_NAME}»: así llamó el pueblo mapuche a la Vía Láctea, el río del cielo. [PROPUESTA]`, `* [Find] This ship is named “${SHIP_NAME}”: the Mapuche people's name for the Milky Way, the river of the sky. [PROPOSAL]`),
  ],
  // 3. Señal perdida [REAL: la señal pasa por satélites de relevo y se pierde y se recupera; las tormentas solares pueden interrumpir la radio]
  signalLost: [
    L('TORRE', `${SHIP_NAME}, aquí To... ...rre. ¿me... escuc...?`, `${SHIP_NAME}, this is To... ...wer. do you... rea...?`, 'static'),
    L('PILOTO', 'Torre, te pierdo. Repite.', 'Tower, I am losing you. Say again.'),
    L('NAVE', '* Pérdida de señal. La antena se desalineó con la tormenta solar.', '* Signal lost. The antenna drifted out of line during the solar storm.', 'static'),
    L('PILOTO', 'Entonces la apunto yo.', 'Then I will point it myself.'),
  ],
  signalBack: [
    L('TORRE', '...Adquirimos señal. Léeme de vuelta: temperatura, presión y CO₂.', '...We have acquired signal. Read back to me: temperature, pressure and CO₂.'),
    L('NAVE', '* En el espacio, repetir lo que escuchaste es parte del trabajo. Así nadie entiende mal una orden.', '* In space, repeating what you heard is part of the job. That way no one misunderstands an order.'),
  ],
  // 4. El aire [REAL: en Apollo 13 el CO₂ subió porque los filtros eran redondos y los de repuesto, cuadrados; la sala dictó el procedimiento]
  air: [
    L('NAVE', '* El indicador de CO₂ sube. Tiene un sonido que no debería existir.', '* The CO₂ gauge climbs. It makes a sound that should not exist.', 'shake'),
    L('PILOTO', 'Torre, el aire se está cargando.', 'Tower, the air is getting heavy.'),
    L('TORRE', 'Copiado. Los filtros no encajan, así que haremos que encajen. Te voy a leer un procedimiento. Anota y repite cada paso.', 'Copy. The filters do not fit, so we will make them fit. I will read you a procedure. Write it down and repeat each step.'),
    L('PILOTO', 'Listo. Anoto.', 'Ready. Writing it down.'),
  ],
  airDone: [
    L('TORRE', 'El CO₂ está bajando. Buen trabajo.', 'CO₂ is coming down. Good work.'),
    L('NAVE', '* [Dato] El hidróxido de litio captura el CO₂ que exhalamos. [REAL]', '* [Fact] Lithium hydroxide captures the CO₂ we exhale. [REAL]'),
  ],
  // 5. Apagar para volver [REAL: en Apollo 13 se apagaron sistemas para ahorrar energía para el reingreso]
  power: [
    L('VUELO', 'Necesito que apagues todo lo que no vas a necesitar para volver.', 'I need you to switch off everything you will not need to get home.'),
    L('NAVE', '* Cinco interruptores: luces, calefacción, laboratorio, comunicaciones y cultivo. Cada uno gasta energía.', '* Five switches: lights, heating, laboratory, communications and crops. Each one costs power.'),
    L('PILOTO', 'Si apago las comunicaciones, no me oyen.', 'If I switch off communications, you cannot hear me.'),
    L('TORRE', 'Y si no apagas nada, no tendrás energía para el escudo. Elige con cuidado.', 'And if you switch off nothing, you will have no power for the shield. Choose carefully.'),
  ],
  powerDone: [
    L('VUELO', 'Anotado. Te quedan los sistemas que importan.', 'Noted. You keep the systems that matter.'),
  ],
  // Entre el tramo 1 y el 2 (dos tramos): la nave queda en órbita baja y desde ahí reingresa. [PROPUESTA: ficción]
  leo: [
    L('NAVE', '* La Luna quedó atrás. La nave frena y se acomoda en órbita baja alrededor de la Tierra.', '* The Moon is behind you. The ship slows and settles into low orbit around Earth.'),
    L('NAVE', '* [Nota] En los regresos lunares reales la nave entra mucho más rápido y es una cápsula. Aquí la imaginamos distinta, para jugar. [PROPUESTA]', '* [Note] On real Moon returns the ship enters much faster and is a capsule. Here we imagine it differently, for the game. [PROPOSAL]'),
    L('VUELO', `${SHIP_NAME}, vamos a mirar tu nave por fuera, loseta por loseta.`, `${SHIP_NAME}, we are going to look at your ship from the outside, tile by tile.`),
    L('PILOTO', 'Entendido. Giro lento.', 'Understood. Slow turn.'),
    L('NAVE', '* El mundo da vueltas despacio. Cada pasada es una foto. [REAL: la voltereta de inspección del transbordador]', '* The world turns slowly. Every pass is a photo. [REAL: the shuttle inspection pitch maneuver]'),
  ],
  // Finales (ninguno castiga)
  endA: [
    L('TORRE', 'Te veo en la trayectoria. Baja la nariz. Sin prisa.', 'I see you on the flight path. Nose down. No rush.'),
    L('NAVE', '* La pista aparece. Es larga y gris. Las ruedas tocan tierra. Se deslizan. Se detienen.', '* The runway appears. It is long and gray. The wheels touch down. They roll. They stop.'),
    L('VUELO', 'Rueda detenida.', 'Wheels stopped.'),
    L('TORRE', 'Bienvenido a casa.', 'Welcome home.'),
    L('NAVE', '* [REAL] En la NASA no se celebra hasta la parada de ruedas.', '* [REAL] At NASA nobody celebrates until the wheels stop.'),
  ],
  endB: [
    L('VUELO', 'Plan B. Vamos por la nave de rescate. Es lo que se hace cuando la nave no es segura.', 'Plan B. We are going with the rescue ship. It is what you do when the ship is not safe.'),
    L('TORRE', 'Tú y tus datos vuelven. Eso es una misión cumplida.', 'You and your data are coming home. That is a mission accomplished.'),
    L('NAVE', '* Volver en otra nave también es volver. Los datos de la Luna se salvaron.', '* Coming back in another ship is also coming back. The Moon data was saved.'),
  ],
  endC: [
    L('NAVE', '* La señal no vuelve. La cabina queda en silencio.', '* The signal does not return. The cabin falls silent.', 'whisper'),
    L('SALA', '¿Qué habríamos cambiado? Revisemos juntos qué pasó.', 'What would we have changed? Let us review together what happened.'),
    L('NAVE', '* Aquí nada se pierde para siempre: se puede intentar otra vez.', '* Nothing here is lost forever: you can try again.'),
  ],
};

/** Textos sueltos de la interfaz del regreso. */
export const UI_TEXT = {
  go: { es: 'GO', en: 'GO' },
  nogo: { es: 'NO-GO', en: 'NO-GO' },
  items: {
    energy: { es: 'Energía', en: 'Power' }, air: { es: 'Aire', en: 'Air' },
    antenna: { es: 'Antena', en: 'Antenna' }, science: { es: 'Ciencia', en: 'Science' },
  },
  next: { es: 'Continuar', en: 'Continue' },
  skip: { es: 'Saltar diálogo', en: 'Skip dialogue' },
  hint: { es: 'Clic, Enter o Espacio para seguir', en: 'Click, Enter or Space to continue' },
  endings: {
    A: { es: 'Final A · Rueda detenida', en: 'Ending A · Wheels stopped' },
    B: { es: 'Final B · El rescate', en: 'Ending B · The rescue' },
    C: { es: 'Final C · Silencio', en: 'Ending C · Silence' },
  },
  retryWhat: { es: '¿Qué cambiarías? Puedes reintentar.', en: 'What would you change? You can try again.' },
} as const;
