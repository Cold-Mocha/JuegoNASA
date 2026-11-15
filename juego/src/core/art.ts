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
  ${c.spots
    ? `<path d="M38 56 C30 36 40 18 54 20 C66 22 72 34 70 44 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <path d="M122 56 C130 36 120 18 106 20 C94 22 88 34 90 44 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>`
    : `<path d="M38 52 L48 18 L70 44 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <path d="M122 52 L112 18 L90 44 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>`}
  <circle cx="80" cy="88" r="46" fill="${c.fur}" stroke="#0e0b33" stroke-width="4"/>
  ${c.spots ? spotsSvg(c.spots) : ''}
  <path d="M50 70 Q80 54 110 70" fill="none" stroke="${c.furDark}" stroke-width="6" stroke-linecap="round"/>
  ${c.eyes
    ? `<ellipse cx="58" cy="90" rx="11" ry="12.5" fill="${c.eyes}" stroke="#0e0b33" stroke-width="3"/><ellipse cx="102" cy="90" rx="11" ry="12.5" fill="${c.eyes}" stroke="#0e0b33" stroke-width="3"/>
  <ellipse cx="58" cy="90" rx="3.8" ry="10.4" fill="#0e0b33"/><ellipse cx="102" cy="90" rx="3.8" ry="10.4" fill="#0e0b33"/>
  <circle cx="62" cy="84" r="3" fill="#fff"/><circle cx="106" cy="84" r="3" fill="#fff"/><circle cx="55" cy="95" r="1.4" fill="#fff"/><circle cx="99" cy="95" r="1.4" fill="#fff"/>`
    : `<ellipse cx="58" cy="90" rx="${8 * e}" ry="${11 * e}" fill="#0e0b33"/><ellipse cx="102" cy="90" rx="${8 * e}" ry="${11 * e}" fill="#0e0b33"/>
  <circle cx="${58 + 3 * e}" cy="${90 - 4 * e}" r="${2.9 * e}" fill="#fff"/><circle cx="${102 + 3 * e}" cy="${90 - 4 * e}" r="${2.9 * e}" fill="#fff"/><circle cx="${58 - 2.6 * e}" cy="${90 + 4.4 * e}" r="${1.4 * e}" fill="#fff"/><circle cx="${102 - 2.6 * e}" cy="${90 + 4.4 * e}" r="${1.4 * e}" fill="#fff"/>`}
  <ellipse cx="70" cy="106" rx="13" ry="10" fill="${lighten(c.fur, 0.55)}"/><ellipse cx="90" cy="106" rx="13" ry="10" fill="${lighten(c.fur, 0.55)}"/>
  <path d="M74 98 L86 98 L80 106 Z" fill="#ee5fd6" stroke="#0e0b33" stroke-width="2" stroke-linejoin="round"/>
  <path d="M80 106 V111 M80 111 Q73 119 66 113 M80 111 Q87 119 94 113" fill="none" stroke="#0e0b33" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M60 100 Q40 94 24 90 M60 105 Q40 106 22 108 M61 110 Q44 118 28 126 M100 100 Q120 94 136 90 M100 105 Q120 106 138 108 M99 110 Q116 118 132 126" fill="none" stroke="#0e0b33" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M30 60 A60 60 0 0 1 130 60" fill="none" stroke="${visor}" stroke-width="6" stroke-linecap="round" opacity=".9"/>
</svg>`;
}

/** Mezcla un color con blanco (a = 0..1): el morro es más claro que el pelaje. */
const lighten = (hex: string, a: number): string => {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${n.map((v) => Math.round(v + (255 - v) * a).toString(16).padStart(2, '0')).join('')}`;
};

/** Manchas de la cara del leopardo de las nieves (frente y mejillas). */
const spotsSvg = (color: string): string => [[62, 62, 5, 3.4], [80, 58, 4.6, 3.6], [98, 62, 5, 3.4], [71, 70, 3.6, 2.6], [89, 70, 3.6, 2.6], [45, 90, 4, 3], [115, 90, 4, 3], [48, 102, 3.4, 2.8], [112, 102, 3.4, 2.8]]
  .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}"/>`).join('');

/** Carita de michi pequeña (marcador del mapa): orejas, cara y ojos con los colores del tripulante. */
export function michiFaceSvg(c: Character): string {
  const e = c.eyeScale ?? 1;
  const antennae = c.antennae
    ? `<path d="M14 9 Q13 4 10 2 M18 9 Q19 4 22 2" fill="none" stroke="#0e0b33" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="2.5" r="2" fill="${c.antennae}" stroke="#0e0b33" stroke-width="1.2"/><circle cx="22" cy="2.5" r="2" fill="${c.antennae}" stroke="#0e0b33" stroke-width="1.2"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">${antennae}
  <path d="M5 13 L7 3 L14 9 Z M27 13 L25 3 L18 9 Z" fill="${c.fur}" stroke="#0e0b33" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="16" cy="18" r="11" fill="${c.fur}" stroke="#0e0b33" stroke-width="2"/>
  ${c.eyes
    ? `<ellipse cx="10.4" cy="18" rx="3" ry="3.4" fill="${c.eyes}" stroke="#0e0b33" stroke-width="1"/><ellipse cx="21.6" cy="18" rx="3" ry="3.4" fill="${c.eyes}" stroke="#0e0b33" stroke-width="1"/><ellipse cx="10.4" cy="18" rx="1.1" ry="2.8" fill="#0e0b33"/><ellipse cx="21.6" cy="18" rx="1.1" ry="2.8" fill="#0e0b33"/>`
    : `<ellipse cx="10.4" cy="18" rx="${2.2 * e}" ry="${3 * e}" fill="#0e0b33"/><ellipse cx="21.6" cy="18" rx="${2.2 * e}" ry="${3 * e}" fill="#0e0b33"/>`}
  <ellipse cx="14" cy="22.4" rx="3.4" ry="2.6" fill="${lighten(c.fur, 0.55)}"/><ellipse cx="18" cy="22.4" rx="3.4" ry="2.6" fill="${lighten(c.fur, 0.55)}"/>
  <path d="M14.4 20.6 h3.2 l-1.6 2 z" fill="#ee5fd6"/>
  <path d="M16 22.6 v1.2 M16 23.8 q-1.5 1.7 -3 0.3 M16 23.8 q1.5 1.7 3 0.3" fill="none" stroke="#0e0b33" stroke-width="1" stroke-linecap="round"/></svg>`;
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
    'paneles-solares': `<circle cx="120" cy="38" r="20" fill="#ffcb47" ${O}/>
      <path d="M36 118 L56 70 H132 L112 118 Z" fill="#322a8a" ${O}/>
      <path d="M46 94 H122 M80 70 L72 118 M104 70 L92 118" stroke="#4cc3f5" stroke-width="3" fill="none"/>
      <path d="M72 118 V136 M42 136 H102" stroke="#0e0b33" stroke-width="7" stroke-linecap="round"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" aria-hidden="true">
  <circle cx="80" cy="80" r="70" fill="${accent}" opacity=".18"/>${art[id]}</svg>`;
}

/**
 * Cohete de la pantalla de carga: un Saturn V en versión cartoon (el de las misiones Apolo a la Luna). Apunta hacia arriba; 52×210.
 * Muy esbelto, como el real (unas 11 veces más alto que ancho): torre de escape, cápsula, módulo de servicio, tres etapas con el patrón
 * blanco y negro, cuatro aletas negras y los motores asomando por debajo de ellas. Dibujo simple y propio, sin emblemas ni texto.
 */
export function rocketSvg(): string {
  const O = 'stroke="#0e0b33" stroke-width="2.6" stroke-linejoin="round"';
  const W = '#f5f5f2';
  const SH = '#dedded'; // sombra suave del lado derecho de cada etapa
  return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="210" viewBox="0 0 52 210">
  <path d="M26 196 L20 209 H32Z" fill="#68668f" ${O}/>
  <path d="M15 192 L12 207 H20 L21 192Z M31 192 L32 207 H40 L37 192Z" fill="#68668f" ${O}/>
  <path d="M26 192 L21 207 H31Z" fill="#9a98c8" ${O}/>
  <path d="M10 158 L1 190 L1 197 L10 189Z M42 158 L51 190 L51 197 L42 189Z" fill="#0e0b33" ${O}/>
  <rect x="10" y="150" width="32" height="44" rx="4" fill="${W}" ${O}/>
  <path d="M26 151 H38 Q41 151 41 154 V190 Q41 193 38 193 H26Z" fill="#0e0b33"/>
  <rect x="10" y="150" width="32" height="44" rx="4" fill="none" ${O}/>
  <path d="M10 160 H42" stroke="#0e0b33" stroke-width="2.6"/>
  <path d="M10 116 L16 108 H36 L42 116 V120 H10Z" fill="${W}" ${O}/>
  <rect x="10" y="118" width="32" height="34" rx="3" fill="${W}" ${O}/>
  <rect x="30" y="120" width="10" height="30" fill="${SH}"/>
  <rect x="10" y="132" width="32" height="8" fill="#0e0b33"/>
  <rect x="16" y="78" width="20" height="32" rx="3" fill="${W}" ${O}/>
  <rect x="29" y="80" width="6" height="28" fill="${SH}"/>
  <rect x="16" y="92" width="20" height="7" fill="#0e0b33"/>
  <path d="M20 64 H32 L36 80 H16Z" fill="${W}" ${O}/>
  <rect x="20" y="52" width="12" height="13" rx="2" fill="${W}" ${O}/>
  <rect x="20" y="57" width="12" height="4" fill="#0e0b33"/>
  <path d="M20 52 L24 36 H28 L32 52Z" fill="#c4c2e0" ${O}/>
  <circle cx="26" cy="45" r="2.2" fill="#4cc3f5" stroke="#0e0b33" stroke-width="1.4"/>
  <rect x="23" y="26" width="6" height="11" rx="2" fill="#ff6b7a" ${O}/>
  <path d="M26 26 V3" stroke="#0e0b33" stroke-width="5" stroke-linecap="round"/><path d="M26 26 V3" stroke="${W}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M23 13 L26 5 L29 13Z" fill="#ff6b7a" ${O}/>
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
