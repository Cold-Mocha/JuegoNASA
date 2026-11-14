// Descarga las llamaradas reales de DONKI (NASA) para cada semana del archivo y actualiza
// src/data/donki-archive.ts marcándola como verificada. Corre SOLO en desarrollo: la clave nunca va al frontend.
// Uso: NASA_API_KEY=tu_clave npm run data:donki   (sin clave usa DEMO_KEY, limitada a pocas consultas por hora)
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/donki-archive.ts', import.meta.url);
const KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
let src = readFileSync(FILE, 'utf8');

const weeks = [...src.matchAll(/id: '([\w-]+)',\s*startDate: '([\d-]+)',\s*endDate: '([\d-]+)'/g)];
for (const [, id, start, end] of weeks) {
  const q = `startDate=${start}&endDate=${end}&api_key=${KEY}`;
  const [flr, sep] = await Promise.all(['FLR', 'SEP'].map(async (kind) => {
    const res = await fetch(`https://api.nasa.gov/DONKI/${kind}?${q}`);
    if (!res.ok) throw new Error(`DONKI ${kind} ${id}: HTTP ${res.status}`);
    const text = await res.text();
    return text.trim() ? JSON.parse(text) : [];
  }));
  const sepDays = new Set(sep.map((s) => s.eventTime.slice(0, 10)));
  const flares = flr
    .filter((f) => /^[MX]/.test(f.classType)) // solo M y X: las que afectan el juego
    .map((f) => {
      const day = f.peakTime.slice(0, 10);
      const linkedSep = (f.linkedEvents ?? []).some((e) => e.activityID.includes('-SEP-')) || sepDays.has(day);
      const region = f.activeRegionNum ? `, activeRegion: ${f.activeRegionNum}` : '';
      return `      { peakTime: '${f.peakTime.replace('Z', '')}:00Z', classType: '${f.classType}'${region}, sep: ${linkedSep} },`;
    });
  const block = new RegExp(`(id: '${id}',[\\s\\S]*?verifiedAgainstDonki: )(true|false)([\\s\\S]*?flares: \\[)[\\s\\S]*?(\\n    \\],)`);
  src = src.replace(block, (_m, a, _v, b, c) => `${a}true${b}\n${flares.join('\n')}${c}`);
  console.log(`${id}: ${flares.length} llamaradas M/X desde DONKI`);
}
writeFileSync(FILE, src);
console.log('Listo: revisa el diff y corre npm run test:unit.');
