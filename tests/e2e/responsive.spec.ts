import { expect, test } from '@playwright/test';
import { installWeatherRoutes } from './helpers';

test('fluxos responsivos e sem overflow nas larguras especificadas', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Uma execução Chromium valida as larguras; WebKit mobile roda a suíte principal separadamente.',
  );
  await installWeatherRoutes(page);
  await page.goto('/');
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const result = page.getByRole('button', { name: /São Paulo, Brasil/ });
    await result.waitFor();
    const resultBox = await result.boundingBox();
    expect(resultBox).not.toBeNull();
    if (resultBox) expect(resultBox.x + resultBox.width).toBeLessThanOrEqual(viewport.width);
    await result.click();
    await page.getByRole('radio', { name: 'Celsius (°C)' }).check();
    await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
    await expect(page.getByRole('article', { name: /^Previsão para/ })).toHaveCount(5);
    await page.getByRole('radio', { name: 'Fahrenheit (°F)' }).check();
    await expect(page.getByText('68 °F', { exact: true })).toBeVisible();
    const boxes = await Promise.all([
      page.getByRole('searchbox', { name: 'Nome da cidade' }).boundingBox(),
      page.getByText('Local selecionado:').boundingBox(),
      page.getByRole('article').first().boundingBox(),
      page
        .getByRole('article', { name: /^Previsão para/ })
        .first()
        .boundingBox(),
      page.getByRole('group', { name: 'Unidade de temperatura' }).boundingBox(),
    ]);
    for (const box of boxes) {
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
    const bounds = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width);
  }
  for (const width of [320, 375, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(
      dimensions.width,
    );
  }
});
