import { expect, type Page } from '@playwright/test';

/** Mensajes de consola que no son errores del juego (avisos de rendimiento del driver GL en headless). */
const IGNORED = [/GL Driver Message/i, /GPU stall/i, /WebGL/i];

export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (m) => {
    if ((m.type() === 'error' || m.type() === 'warning') && !IGNORED.some((r) => r.test(m.text()))) problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/** Preferencias iniciales (reduce movimiento para acelerar la carga del cohete en los tests). */
export async function seedStorage(page: Page, settings: Record<string, unknown> = {}, progress?: Record<string, unknown>): Promise<void> {
  await page.addInitScript(([s, p]) => {
    localStorage.setItem('michinautas:settings:v1', JSON.stringify({ reducedMotion: true, ...s }));
    if (p) localStorage.setItem('michinautas:progress:v1', JSON.stringify(p));
  }, [settings, progress] as const);
}

export async function startMission(page: Page, opts: { mission?: string; character?: string; difficulty?: string; timescale?: number } = {}): Promise<void> {
  const { mission = 'hielo-lunar', character = 'miu', difficulty = 'cadete', timescale = 1 } = opts;
  await page.goto(`/?timescale=${timescale}`);
  await page.getByRole('button', { name: 'Jugar' }).click();
  await page.getByRole('button', { name: 'Saltar' }).click();
  await page.locator(`.option[data-id="${character}"]`).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.locator(`.option[data-id="${mission}"]`).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.locator(`.option[data-id="${difficulty}"]`).click();
  await page.getByRole('button', { name: '¡Despegar!' }).click();
  await expect(page.locator('[data-hud]')).toBeVisible({ timeout: 20_000 });
}

/** El canvas debe tener contenido real (no un lienzo vacío de un solo color). */
export async function canvasHasContent(page: Page): Promise<boolean> {
  // WebGL no permite leer el canvas sin preserveDrawingBuffer: se analiza una captura real de pantalla
  const shot = (await page.locator('canvas').screenshot()).toString('base64');
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const tmp = document.createElement('canvas');
    tmp.width = 64;
    tmp.height = 36;
    const ctx = tmp.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 64, 36);
    const d = ctx.getImageData(0, 0, 64, 36).data;
    const colors = new Set<string>();
    for (let i = 0; i < d.length; i += 4) colors.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
    return colors.size > 8;
  }, shot);
}

/** Rectángulos visibles de los elementos que coinciden con el selector. */
export async function boxes(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((els) =>
    els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => {
      const r = e.getBoundingClientRect();
      return { sel: (e as HTMLElement).className, x: r.x, y: r.y, w: r.width, h: r.height };
    }));
}

export const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a): boolean =>
  a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
