import type Phaser from 'phaser';
import type { Character } from '../data/characters';
import type { MissionId } from '../data/missions';

/**
 * Arte vectorial placeholder (SVG en texto): sirve tanto en la UI HTML como textura en Phaser.
 * Reemplazar por ilustraciones finales manteniendo la misma API.
 */
export function michiSvg(c: Character, visor: string): string {
  const e = c.eyeScale ?? 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${c.name}">
  <circle cx="80" cy="84" r="66" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5"/>
  ${c.antennae ? antennaeSvg(c) : ''}
  <path d="M38 52 L48 18 L70 44 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <path d="M122 52 L112 18 L90 44 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="80" cy="88" r="46" fill="${c.fur}" stroke="#0e0b33" stroke-width="4"/>
  <path d="M50 70 Q80 54 110 70" fill="none" stroke="${c.furDark}" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="64" cy="90" rx="${7 * e}" ry="${9 * e}" fill="#0e0b33"/><ellipse cx="96" cy="90" rx="${7 * e}" ry="${9 * e}" fill="#0e0b33"/>
  <circle cx="${64 + 2 * e}" cy="${90 - 3 * e}" r="${2.5 * e}" fill="#fff"/><circle cx="${96 + 2 * e}" cy="${90 - 3 * e}" r="${2.5 * e}" fill="#fff"/>
  <path d="M76 102 L84 102 L80 107 Z" fill="#ee5fd6"/>
  <path d="M80 107 Q74 114 68 110 M80 107 Q86 114 92 110" fill="none" stroke="#0e0b33" stroke-width="3" stroke-linecap="round"/>
  <path d="M30 60 A60 60 0 0 1 130 60" fill="none" stroke="${visor}" stroke-width="6" stroke-linecap="round" opacity=".9"/>
</svg>`;
}

/** Carita de michi pequeña (marcador del mapa): orejas, cara y ojos con los colores del tripulante. */
export function michiFaceSvg(c: Character): string {
  const e = c.eyeScale ?? 1;
  const antennae = c.antennae
    ? `<path d="M14 9 Q13 4 10 2 M18 9 Q19 4 22 2" fill="none" stroke="#0e0b33" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="2.5" r="2" fill="${c.antennae}" stroke="#0e0b33" stroke-width="1.2"/><circle cx="22" cy="2.5" r="2" fill="${c.antennae}" stroke="#0e0b33" stroke-width="1.2"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">${antennae}
  <path d="M5 13 L7 3 L14 9 Z M27 13 L25 3 L18 9 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="16" cy="18" r="11" fill="${c.fur}" stroke="#0e0b33" stroke-width="2"/>
  <ellipse cx="12" cy="18" rx="${1.8 * e}" ry="${2.4 * e}" fill="#0e0b33"/><ellipse cx="20" cy="18" rx="${1.8 * e}" ry="${2.4 * e}" fill="#0e0b33"/>
  <path d="M14.8 22 h2.4 l-1.2 1.4 z" fill="#ee5fd6"/></svg>`;
}

/** Antenitas del michi marciano (entre las orejas). */
const antennaeSvg = (c: Character): string => [[-1, 70, 62], [1, 90, 98]].map(([, base, tip]) =>
  `<path d="M${base} 48 Q${base} 30 ${tip} 22" fill="none" stroke="#0e0b33" stroke-width="9" stroke-linecap="round"/>
  <path d="M${base} 48 Q${base} 30 ${tip} 22" fill="none" stroke="${c.fur}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="${tip}" cy="18" r="7" fill="${c.antennae}" stroke="#0e0b33" stroke-width="4"/>`).join('');

/** Ilustración de cada jornada científica (tarjetas del selector): mismo estilo que los michis y el Sol. */
export function missionArtSvg(id: MissionId, accent: string): string {
  const O = 'stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"';
  const art: Record<MissionId, string> = {
    'hielo-lunar': `<ellipse cx="80" cy="124" rx="56" ry="13" fill="#c4c2e0" ${O}/>
      <path d="M48 74 L60 88 V116 L48 124 L36 116 V88 Z" fill="#bfe6ff" ${O}/>
      <path d="M112 84 L122 96 V118 L112 125 L102 118 V96 Z" fill="#bfe6ff" ${O}/>
      <path d="M80 30 L98 52 V110 L80 124 L62 110 V52 Z" fill="#dff3ff" ${O}/>
      <path d="M80 30 V124 M62 52 L80 64 L98 52" fill="none" stroke="#4cc3f5" stroke-width="3"/>
      <path d="M70 72 V96" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    'huerto-lunar': `<path d="M52 106 H108 L100 136 H60 Z" fill="#c4c2e0" ${O}/>
      <rect x="44" y="94" width="72" height="16" rx="6" fill="#9a98c8" ${O}/>
      <path d="M80 94 V58" stroke="#0e0b33" stroke-width="9" stroke-linecap="round"/><path d="M80 94 V58" stroke="#2f8f3a" stroke-width="4" stroke-linecap="round"/>
      <path d="M80 66 C80 44 96 30 122 30 C122 54 104 66 80 66 Z" fill="#5ad6b2" ${O}/>
      <path d="M80 78 C80 60 66 50 42 50 C42 68 56 78 80 78 Z" fill="#7ed957" ${O}/>`,
    'cazadores-tormentas': `${Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5;
        return `<line x1="${62 + 40 * Math.cos(a)}" y1="${62 + 40 * Math.sin(a)}" x2="${62 + 50 * Math.cos(a)}" y2="${62 + 50 * Math.sin(a)}" stroke="#ffcb47" stroke-width="6" stroke-linecap="round"/>`;
      }).join('')}
      <circle cx="62" cy="62" r="32" fill="#ffcb47" ${O}/>
      <path d="M86 40 Q108 20 120 34 Q104 36 94 54 Z" fill="#ee5fd6" ${O}/>
      <path d="M106 70 L136 82 V102 C136 120 123 133 106 139 C89 133 76 120 76 102 V82 Z" fill="#9b7bff" ${O}/>
      <path d="M92 104 L102 114 L122 92" fill="none" stroke="#faf8f0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" aria-hidden="true">
  <circle cx="80" cy="80" r="70" fill="${accent}" opacity=".18"/>${art[id]}</svg>`;
}

/** Cohete pequeño (pantalla de carga). Apunta hacia arriba; 64×128. */
export function rocketSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="128" viewBox="0 0 64 128">
  <path d="M32 4 C50 22 52 52 50 86 L14 86 C12 52 14 22 32 4 Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <path d="M32 4 C40 12 45 22 47 32 L17 32 C19 22 24 12 32 4 Z" fill="#ff6b7a" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="32" cy="52" r="9" fill="#4cc3f5" stroke="#0e0b33" stroke-width="4"/>
  <path d="M14 66 L2 96 L14 92 Z M50 66 L62 96 L50 92 Z" fill="#9b7bff" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <rect x="20" y="86" width="24" height="10" rx="3" fill="#68668f" stroke="#0e0b33" stroke-width="4"/>
</svg>`;
}

export const svgDataUri = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Rasteriza un SVG a textura de Phaser (sin XHR: funciona offline y en cualquier hosting). */
export function addSvgTexture(textures: Phaser.Textures.TextureManager, key: string, svg: string, width: number, height: number, scale = 2): Promise<void> {
  if (textures.exists(key)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      textures.addCanvas(key, canvas);
      resolve();
    };
    img.onerror = () => reject(new Error(`No se pudo rasterizar la textura "${key}"`));
    img.src = svgDataUri(svg);
  });
}
