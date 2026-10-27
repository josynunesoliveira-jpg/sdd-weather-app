import { expect, test } from '@playwright/test';
import { cityFixture, installWeatherRoutes, nextFiveLocalDates, searchAndSelect } from './helpers';

test('lista vazia não solicita dados meteorológicos', async ({ page }) => {
  const counts = await installWeatherRoutes(page, { geocoding: () => ({ body: { results: [] } }) });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('status')).toHaveText('Nenhuma cidade encontrada.');
  expect(counts.current + counts.daily).toBe(0);
});

test('retry de geocoding repete somente a busca', async ({ page }) => {
  const counts = await installWeatherRoutes(page, {
    geocoding: (_url, count) =>
      count === 1 ? { status: 503, body: {} } : { body: { results: [cityFixture] } },
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível buscar cidades.');
  await page.getByRole('button', { name: 'Tentar buscar novamente' }).click();
  await expect(page.getByRole('button', { name: /São Paulo.*Brasil/ })).toBeVisible();
  expect(counts.geocoding).toBe(2);
  expect(counts.current + counts.daily).toBe(0);
});

test('retry de clima preserva previsão carregada e não repete daily', async ({ page }) => {
  const counts = await installWeatherRoutes(page, {
    current: (_url, count) =>
      count === 1
        ? { status: 503, body: {} }
        : { body: { current: { temperature_2m: 20, weather_code: 0 } } },
  });
  await page.goto('/');
  await searchAndSelect(page);
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o clima.');
  await expect(page.getByRole('article', { name: /^Previsão para/ })).toHaveCount(5);
  await page.getByRole('alert').getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
  expect(counts.current).toBe(2);
  expect(counts.daily).toBe(1);
});

test('retry de previsão preserva clima atual e não repete current', async ({ page }) => {
  const counts = await installWeatherRoutes(page, {
    daily: (_url, count) =>
      count === 1
        ? { status: 429, body: {} }
        : {
            body: {
              daily: {
                time: nextFiveLocalDates(),
                temperature_2m_min: [10, 11, 12, 13, 14],
                temperature_2m_max: [20, 21, 22, 23, 24],
                weather_code: [0, 0, 0, 0, 0],
              },
            },
          },
  });
  await page.goto('/');
  await searchAndSelect(page);
  await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar a previsão.');
  await page.getByRole('alert').getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('article', { name: /^Previsão para/ })).toHaveCount(5);
  expect(counts.current).toBe(1);
  expect(counts.daily).toBe(2);
});

test('conteúdo externo parecido com script permanece texto literal', async ({ page }) => {
  const scriptText = '<script>window.__weatherTest=1</script>';
  const unsafeCity = { ...cityFixture, name: scriptText, admin1: scriptText };
  await installWeatherRoutes(page, { geocoding: () => ({ body: { results: [unsafeCity] } }) });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('x');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: /weatherTest/ }).click();
  await expect(page.getByText(scriptText).first()).toBeVisible();
  expect(
    await page.evaluate(() => (window as Window & { __weatherTest?: number }).__weatherTest),
  ).toBeUndefined();
  expect(
    await page.evaluate(() =>
      Array.from(document.scripts).some((script) => script.textContent?.includes('__weatherTest')),
    ),
  ).toBe(false);
});
