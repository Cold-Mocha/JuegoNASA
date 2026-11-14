import { expect, test } from '@playwright/test';
import { boxes, canvasHasContent, overlaps, seedStorage, startMission } from './helpers';

const VIEWPORTS = [
  { width: 1366, height: 768 },  // laptop antigua típica
  { width: 1280, height: 720 },
  { width: 1024, height: 600 },  // netbook
  { width: 1920, height: 1080 },
];

test.describe('resoluciones: sin solapamientos ni desbordes', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}×${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await seedStorage(page, {}, { tutorialDone: true, best: {}, achievements: [], readEntries: [] });
      await page.goto('/');
      // menú: botones dentro de la pantalla y sin superponerse
      const btns = await boxes(page, '.menu__actions .mn-btn');
      for (const b of btns) {
        expect(b.y + b.h).toBeLessThanOrEqual(vp.height);
        expect(b.x + b.w).toBeLessThanOrEqual(vp.width);
      }
      for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) expect(overlaps(btns[i], btns[j])).toBe(false);

      await startMission(page);
      expect(await canvasHasContent(page)).toBe(true);
      const hud = await boxes(page, '.hud__clock, .hud__tasks, .hud__top-right');
      expect(hud).toHaveLength(3);
      for (let i = 0; i < hud.length; i++) {
        expect(hud[i].y + hud[i].h).toBeLessThanOrEqual(vp.height + 1);
        for (let j = i + 1; j < hud.length; j++) expect(overlaps(hud[i], hud[j]), `${hud[i].sel} vs ${hud[j].sel}`).toBe(false);
      }
      const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight);
      expect(noScroll).toBe(true);
      // texto mínimo legible: 13 px tras escalar
      const minFont = await page.locator('.hud .mn-bar__label').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
      expect(minFont).toBeGreaterThanOrEqual(13);
    });
  }
});

test.describe('rendimiento', () => {
  test('carga inicial rápida y peso total bajo', async ({ page }) => {
    let bytes = 0;
    page.on('response', async (r) => {
      const len = Number(r.headers()['content-length'] ?? 0);
      bytes += len;
    });
    await seedStorage(page);
    const t0 = Date.now();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'MICHINAUTAS' })).toBeVisible();
    const loadMs = Date.now() - t0;
    test.info().annotations.push({ type: 'load-ms', description: String(loadMs) }, { type: 'bytes', description: String(bytes) });
    expect(loadMs).toBeLessThan(5000);
    expect(bytes).toBeLessThan(3 * 1024 * 1024);
  });

  test('FPS estables en la estación y memoria JS acotada', async ({ page }) => {
    await seedStorage(page, {}, { tutorialDone: true, best: {}, achievements: [], readEntries: [] });
    await startMission(page, { mission: 'paneles-solares' });
    await page.keyboard.down('ArrowRight');
    const result = await page.evaluate(() => new Promise<{ fps: number; worst: number }>((resolve) => {
      const times: number[] = [];
      let last = performance.now();
      const loop = (t: number): void => {
        times.push(t - last);
        last = t;
        if (times.length < 180) requestAnimationFrame(loop);
        else {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          resolve({ fps: 1000 / avg, worst: Math.max(...times.slice(5)) });
        }
      };
      requestAnimationFrame(loop);
    }));
    await page.keyboard.up('ArrowRight');
    const mem = await page.evaluate(() => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0);
    test.info().annotations.push({ type: 'fps', description: result.fps.toFixed(1) }, { type: 'worst-frame-ms', description: result.worst.toFixed(1) }, { type: 'js-heap-mb', description: (mem / 1048576).toFixed(1) });
    expect(result.fps).toBeGreaterThan(50);
    if (mem) expect(mem / 1048576).toBeLessThan(150);
  });
});
