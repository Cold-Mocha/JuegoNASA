import { expect, test } from '@playwright/test';
import { canvasHasContent, seedStorage, startMission, watchConsole } from './helpers';

test.describe('carga y navegación', () => {
  test('carga limpia: sin errores ni warnings en consola y canvas dibujado', async ({ page }) => {
    const problems = watchConsole(page);
    await seedStorage(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'MICHINAUTAS' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await canvasHasContent(page)).toBe(true);
    await page.waitForTimeout(500);
    expect(problems).toEqual([]);
  });

  test('menú: Archivo científico, Logros, Ajustes y Créditos', async ({ page }) => {
    const problems = watchConsole(page);
    await seedStorage(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Logros' }).click();
    await expect(page.getByRole('dialog')).toContainText('Logros científicos');
    await page.getByRole('button', { name: 'Cerrar' }).click();

    await page.getByRole('button', { name: 'Ajustes' }).click();
    await expect(page.getByRole('dialog')).toContainText('Modo Ultra Ligero');
    await page.getByLabel('Música').fill('0');
    await page.getByRole('button', { name: 'Listo' }).click();

    await page.getByRole('button', { name: 'Créditos' }).click();
    await expect(page.getByRole('dialog')).toContainText('la NASA no respalda este proyecto');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('button', { name: 'Archivo científico' }).click();
    await expect(page.getByRole('heading', { name: 'Archivo científico' })).toBeVisible();
    await page.getByRole('button', { name: /Gravedad lunar/ }).click();
    await expect(page.locator('[data-detail]')).toContainText('1,62 m/s²');
    await expect(page.locator('[data-detail] a')).toHaveAttribute('href', /nasa\.gov/);
    await expect(page.locator('.archive__item')).not.toHaveCount(0);
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('heading', { name: 'MICHINAUTAS' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('Ajustes se guardan en localStorage (sin datos personales)', async ({ page }) => {
    await seedStorage(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Ajustes' }).click();
    await page.getByLabel(/Modo Ultra Ligero/).check();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('michinautas:settings:v1') ?? '{}'));
    expect(saved.ultraLight).toBe(true);
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.every((k) => k.startsWith('michinautas:'))).toBe(true);
  });

  test('flujo completo: historia → selector → cohete → estación → pausa → mapa → acción', async ({ page }) => {
    const problems = watchConsole(page);
    await seedStorage(page, {}, { tutorialDone: true, best: {}, achievements: [], readEntries: [] });
    await startMission(page, { mission: 'paneles-solares' });

    await expect(page.locator('[data-day]')).toHaveText('Jornada 1/7');
    await expect(page.locator('[data-date]')).toContainText('2017');
    await expect(page.locator('[data-res="oxygen"]')).toHaveAttribute('aria-valuenow', /\d+/);

    // Pausa → Ajustes → Archivo → volver
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toContainText('Pausa');
    await page.getByRole('button', { name: 'Ajustes' }).click();
    await expect(page.getByRole('dialog')).toContainText('Ajustes');
    await page.getByRole('button', { name: 'Listo' }).click();
    await page.getByRole('button', { name: 'Archivo científico' }).click();
    await expect(page.getByRole('heading', { name: 'Archivo científico' })).toBeVisible();
    await page.getByRole('button', { name: 'Volver' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Mapa: solo para mirar (sin clics), con la carita del michi donde estás
    await page.keyboard.press('m');
    await expect(page.locator('[data-map-me]')).toBeVisible();
    await expect(page.locator('.map__room[data-room="puente"]')).toBeVisible();
    await expect(page.locator('.map [data-action]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    // Clic en la consola del Puente (se ve desde el Refugio): el michi camina solo por el pasillo y la abre al llegar
    const energyBefore = Number(await page.locator('[data-res="energy"]').getAttribute('aria-valuenow'));
    const box = (await page.locator('canvas').boundingBox())!;
    const k = box.width / 1280; // el canvas escala el lienzo de 1280×720
    await page.mouse.click(box.x + 760 * k, box.y + 670 * k);
    const root = page.locator('.mn-root:has([data-hud])');
    await expect(root).toHaveAttribute('data-room', 'pasillo', { timeout: 10_000 });
    await expect(root).toHaveAttribute('data-room', 'puente', { timeout: 15_000 });
    await expect(page.locator('[data-actions]')).toBeVisible();
    await page.locator('[data-action="act"][data-id="forecast"]').click();
    await expect(page.locator('[data-forecast]')).toBeVisible({ timeout: 6_000 });
    await expect(page.locator('[data-forecast]')).toContainText('no en vivo');
    expect(Number(await page.locator('[data-res="energy"]').getAttribute('aria-valuenow'))).toBeLessThanOrEqual(energyBefore);
    expect(problems).toEqual([]);
  });

  test('primera misión: muestra los controles y deja elegir si hacer el tutorial', async ({ page }) => {
    const problems = watchConsole(page);
    await seedStorage(page, {}, { tutorialDone: false, best: {}, achievements: [], readEntries: [] });
    await startMission(page);
    const intro = page.getByRole('dialog');
    await expect(intro).toContainText('Controles de la estación');
    await expect(intro.locator('.controls__row')).not.toHaveCount(0);
    const day = await page.locator('[data-daybar]').evaluate((e) => (e as HTMLElement).style.width);
    await page.waitForTimeout(800);
    expect(await page.locator('[data-daybar]').evaluate((e) => (e as HTMLElement).style.width)).toBe(day); // reloj detenido
    await page.getByRole('button', { name: 'Empezar tutorial' }).click();
    await expect(intro).toBeHidden();
    await expect(page.locator('[data-tip]')).toContainText('Camina con WASD');
    // Pausa → Controles también los muestra
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Controles' }).click();
    await expect(page.getByRole('dialog')).toContainText('Impulso');
    expect(problems).toEqual([]);
  });

  test('fin de la jornada: informe con tareas, puntaje y botones', async ({ page }) => {
    const problems = watchConsole(page);
    await seedStorage(page, {}, { tutorialDone: true, best: {}, achievements: [], readEntries: [] });
    await startMission(page, { mission: 'hielo-lunar', difficulty: 'cadete', timescale: 50 });
    // los envíos de la Tierra detienen el reloj hasta elegir una caja: el test elige oxígeno
    await expect(async () => {
      const crate = page.locator('[data-action="resupply"][data-id="oxygen"]');
      if (await crate.isVisible()) await crate.click();
      await expect(page.locator('[data-report]')).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 45_000 });
    await expect(page.locator('[data-score]')).toHaveText(/\d+/);
    // sin hacer las tareas se acaba el plazo: el informe muestra la investigación incompleta y sus tareas
    await expect(page.locator('[data-report]')).toContainText('Investigación incompleta');
    await expect(page.locator('.report__tasks .mn-check')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Lo que aprendiste' })).toBeVisible();
    const best = await page.evaluate(() => JSON.parse(localStorage.getItem('michinautas:progress:v1') ?? '{}').best);
    expect(best['hielo-lunar']).toBeDefined();
    await page.getByRole('button', { name: 'Menú' }).click();
    await expect(page.getByRole('heading', { name: 'MICHINAUTAS' })).toBeVisible();
    expect(problems).toEqual([]);
  });
});
