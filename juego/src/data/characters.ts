import { localize } from '../core/i18n';
/** Personajes michi originales del equipo (Leo: leopardo de las nieves; Güiña: felino chileno) (placeholder hasta tener ilustraciones finales). */
export type CharacterId = 'miu' | 'leo' | 'luna' | 'zib';

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  /** Especie, si se explicita en pantalla (Leo es un leopardo de las nieves). */
  species?: string;
  trait: string;
  fur: string;     // hex del pelaje (arte, no UI)
  furDark: string;
  accent: string;  // token de color del design system (visor / traje)
  antennae?: string; // hex de las bolitas de las antenas (solo el michi marciano)
  eyeScale?: number; // ojos más grandes (el marciano: 1,45)
  eyes?: string;     // hex del iris (la güiña: turquesa)
  spots?: string;    // hex de las manchas (leopardo de las nieves): también lleva orejas redondas
}

export const CHARACTERS: Character[] = localize([
  { id: 'miu', name: 'Miu', role: 'Ingeniera de vuelo', trait: 'Repara todo con calma', fur: '#f2a65a', furDark: '#c4733a', accent: 'star-gold' },
  { id: 'leo', name: 'Leo', role: 'Científico', species: 'Leopardo de las nieves', trait: 'Curioso y observador', fur: '#cdd0dc', furDark: '#8a8da3', accent: 'comet-cyan', spots: '#4a4c63' },
  { id: 'luna', name: 'Güiña', role: 'Piloto', trait: 'Rápida y valiente', fur: '#e9b949', furDark: '#a8761f', accent: 'nebula-magenta', spots: '#1f1812', eyes: '#2ad0c6' },
  { id: 'zib', name: 'Zib', role: 'Visitante de Marte', trait: 'Todo le da curiosidad', fur: '#7ed957', furDark: '#4c9a2e', accent: 'aurora-teal', antennae: '#ffcb47', eyeScale: 1.45 },
]);
