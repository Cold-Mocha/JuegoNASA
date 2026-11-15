import { vi } from 'vitest';

/** Las pruebas corren en español (el idioma base de los textos): Node trae `navigator.language = "en-US"` y el juego lo usaría. */
vi.stubGlobal('navigator', { language: 'es-CL', languages: ['es-CL'] });
