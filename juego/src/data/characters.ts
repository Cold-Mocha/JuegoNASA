/** Personajes michi originales del equipo (placeholder hasta tener ilustraciones finales). */
export type CharacterId = 'miu' | 'tomas' | 'luna' | 'zib';

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  trait: string;
  fur: string;     // hex del pelaje (arte, no UI)
  furDark: string;
  accent: string;  // token de color del design system (visor / traje)
  antennae?: string; // hex de las bolitas de las antenas (solo el michi marciano)
  eyeScale?: number; // ojos más grandes (el marciano: 1,45)
}

export const CHARACTERS: Character[] = [
  { id: 'miu', name: 'Miu', role: 'Ingeniera de vuelo', trait: 'Repara todo con calma', fur: '#f2a65a', furDark: '#c4733a', accent: 'star-gold' },
  { id: 'tomas', name: 'Tomás', role: 'Científico', trait: 'Curioso y observador', fur: '#a7a9b8', furDark: '#6e7085', accent: 'comet-cyan' },
  { id: 'luna', name: 'Luna', role: 'Piloto', trait: 'Rápida y valiente', fur: '#3a3550', furDark: '#1f1b33', accent: 'nebula-magenta' },
  { id: 'zib', name: 'Zib', role: 'Visitante de Marte', trait: 'Todo le da curiosidad', fur: '#7ed957', furDark: '#4c9a2e', accent: 'aurora-teal', antennae: '#ffcb47', eyeScale: 1.45 },
];
