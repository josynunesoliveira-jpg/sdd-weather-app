import { expect, test } from '@playwright/test';
import { installWeatherRoutes, searchAndSelect } from './helpers';

test('busca uma cidade, consulta clima/previsão e alterna unidade em viewports móveis e desktop', async ({
  page,
}, testInfo) => {
  const isMobile = testInfo.project.name === 'webkit-mobile';
  await page.setViewportSize(isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 });
  await installWeatherRoutes(page);
  await page.goto('/');
  await page.getByRole('heading', { name: 'Consulte o tempo da sua cidade' }).waitFor();
  await searchAndSelect(page);

  await expect(page.getByText('Local selecionado: São Paulo, Brasil')).toBeVisible();
  await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
  await expect(page.getByText('Estimativa do modelo para 11:00')).toBeVisible();
  await expect(page.getByRole('article', { name: /^Previsão para/ })).toHaveCount(5);
  await expect(page.getByText('Céu limpo').first()).toBeVisible();

  await page.getByRole('radio', { name: 'Fahrenheit (°F)' }).check();
  await expect(page.getByText('68 °F', { exact: true })).toBeVisible();
  await expect(page.getByText('50 °F').first()).toBeVisible();
  await page.getByRole('radio', { name: 'Celsius (°C)' }).check();
  await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
    'href',
    'https://open-meteo.com/',
  );
  await expect(page.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by/4.0/',
  );
});
