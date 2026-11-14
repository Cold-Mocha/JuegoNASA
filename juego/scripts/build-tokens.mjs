// Genera src/styles/tokens.css desde design/tokens.json (fuente única: el design system Michinautas).
import { readFileSync, writeFileSync } from 'node:fs';

const t = JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url), 'utf8'));
const themes = t.color.themes.map((x) => x.id);
const [first] = themes;
const valueFor = (tok, theme) =>
  typeof tok.value === 'string' ? (theme === first ? tok.value : undefined) : tok.value[theme];

const themed = [...t.color.tokens, ...(t.shadow?.tokens ?? [])];
const blocks = themes.map((theme, i) => {
  const sel = i === 0 ? `:root, [data-theme="${theme}"]` : `[data-theme="${theme}"]`;
  const decls = themed
    .map((tok) => [tok.name, valueFor(tok, theme)])
    .filter(([, v]) => v !== undefined)
    .map(([n, v]) => `  --${n}: ${v};`);
  return `${sel} {\n${decls.join('\n')}\n}`;
});

const flat = ['spacing', 'radius', 'zIndex', 'motion']
  .flatMap((fam) => t[fam]?.tokens ?? [])
  .map((tok) => `  --${tok.name}: ${tok.value};`);
const fonts = Object.entries(t.type.families).map(([k, v]) => `  --font-${k}: ${v};`);

const styles = t.type.groups.flatMap((g) =>
  g.styles.map((s) => {
    const fam = s.family ?? g.family;
    const ls = s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : '';
    return `.${s.name} { font-family: var(--font-${fam}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${ls} }`;
  }),
);

const out = [
  `/* ${t.name} — generado desde design/tokens.json por scripts/build-tokens.mjs. NO EDITAR A MANO. */`,
  ...blocks,
  `:root {\n${[...flat, ...fonts].join('\n')}\n}`,
  ...styles,
  '',
].join('\n\n');
writeFileSync(new URL('../src/styles/tokens.css', import.meta.url), out);
console.log(`tokens.css generado (${themes.length} temas, ${t.color.tokens.length} colores)`);
