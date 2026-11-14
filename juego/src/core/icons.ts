/**
 * Iconos de los botones: un solo estilo (línea de 2 px, puntas redondeadas, 24×24, color del texto).
 * Son decorativos (aria-hidden): el nombre accesible del botón sigue siendo su texto.
 */
const PATHS = {
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  retry: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.5M4.5 12h.5M4.5 18h.5"/>',
  skip: '<path d="M5 5.5v13l9-6.5z"/><path d="M18 5v14"/>',
  rocket: '<path d="M12 2.5c3.5 2.5 5 6.5 4.5 11.5h-9C7 9 8.5 5 12 2.5z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M7.5 14l-2.5 4 3.5-.5M16.5 14l2.5 4-3.5-.5M10 17.5l2 3.5 2-3.5"/>',
  // recursos e indicadores
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  oxygen: '<circle cx="8.5" cy="15" r="4.5"/><circle cx="17" cy="15.5" r="3"/><circle cx="13.5" cy="6.5" r="2.5"/>',
  apple: '<path d="M12 7.5c-3-2-7.5-1-7.5 4 0 5 3 9 5 9 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c2 0 5-4 5-9 0-5-4.5-6-7.5-4z"/><path d="M12 7.5c0-2 1-3.5 3-4.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  radiation: '<circle cx="12" cy="12" r="1.8"/><path d="M9 6.8a6 6 0 0 1 6 0L13 10.3a2 2 0 0 0-2 0zM18 13a6 6 0 0 1-3 5.2l-2-3.5a2 2 0 0 0 1-1.7zM9 18.2A6 6 0 0 1 6 13h4a2 2 0 0 0 1 1.7z"/>',
  dash: '<path d="M3.5 8h7M2 12h8M3.5 16h7"/><path d="M13.5 6l6 6-6 6"/>',
  antenna: '<path d="M12 21v-8"/><circle cx="12" cy="11" r="2"/><path d="M8 7.5a5.5 5.5 0 0 0 0 7M16 7.5a5.5 5.5 0 0 1 0 7M5.2 4.8a9.5 9.5 0 0 0 0 12.4M18.8 4.8a9.5 9.5 0 0 1 0 12.4"/>',
  panel: '<path d="M5 4h15l-2.5 10h-15z"/><path d="M3.8 9h15M10.5 4L8.3 14M15.5 4l-2.2 10M10 14v6M6.5 20h7"/>',
  flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.8 1.8 0 0 0 6 21h12a1.8 1.8 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  // acciones y salas
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/>',
  radar: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6"/>',
  helmet: '<circle cx="12" cy="11" r="7.5"/><path d="M8 10.5a4 4 0 0 1 8 0v1a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 8 11.5z"/><path d="M8 19.5V21h8v-1.5"/>',
  brush: '<path d="M14.5 3.5l6 6-7 7-6-6z"/><path d="M7.5 10.5L3 20.5l10-4.5"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7zM12 14c0-3-2.5-5.5-7-5.5 0 3.5 2.5 5.5 7 5.5z"/>',
  snowflake: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>',
  exit: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  // archivo y logros
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  galaxy: '<circle cx="12" cy="12" r="2"/><path d="M12 4c5 0 8 3.5 8 7s-4 4-6.5 2.5M12 20c-5 0-8-3.5-8-7s4-4 6.5-2.5"/>',
  medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5L6 3h4l2 4.5L14 3h4l-2.5 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
} as const;

export type IconName = keyof typeof PATHS;

export const icon = (name: IconName): string =>
  `<svg class="mn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
