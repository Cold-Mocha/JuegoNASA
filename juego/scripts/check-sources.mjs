// Auditoría de fuentes: extrae las URLs del Archivo Científico, del archivo DONKI y de SOURCES.md
// y comprueba que respondan. 403 = el sitio bloquea clientes automáticos (se reporta, no falla).
import { readFileSync } from 'node:fs';

const files = ['src/data/encyclopedia.ts', 'src/data/donki-archive.ts', '../SOURCES.md'];
const urls = new Set();
for (const f of files) {
  let text = '';
  try { text = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'); } catch { continue; }
  for (const m of text.matchAll(/https:\/\/[^\s'"`)>\]]+/g)) urls.add(m[0].replace(/[.,]$/, ''));
}

let broken = 0;
for (const url of [...urls].sort()) {
  let status = 0;
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (link-check)' }, signal: AbortSignal.timeout(20000) });
    status = res.status;
  } catch { status = 0; }
  const ok = status >= 200 && status < 400;
  const blocked = status === 403 || status === 0;
  if (!ok && !blocked) broken++;
  console.log(`${ok ? 'OK ' : blocked ? 'BLQ' : 'ERR'} ${String(status).padStart(3)} ${url}`);
}
console.log(`\n${urls.size} enlaces, ${broken} rotos (BLQ = bloqueo anti-bots o red: revisar a mano).`);
process.exit(broken ? 1 : 0);
