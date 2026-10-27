import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { cityFixture, installWeatherRoutes } from './helpers';

test('axe não encontra violações críticas ou sérias nos estados principais', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Auditoria automática executada no projeto Chromium.',
  );
  await installWeatherRoutes(page, {
    geocoding: (url) => {
      const query = url.searchParams.get('name');
      if (query === 'Sem resultados') return { body: { results: [] } };
      if (query === 'Erro') return { status: 503, body: {} };
      return { body: { results: [cityFixture] } };
    },
  });
  await page.goto('/');
  const scan = async (label: string) => {
    const result = await new AxeBuilder({ page }).analyze();
    const serious = result.violations.filter((violation) =>
      ['critical', 'serious'].includes(violation.impact ?? ''),
    );
    expect(
      serious,
      label +
        ': ' +
        JSON.stringify(
          serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })),
        ),
    ).toHaveLength(0);
  };
  await scan('inicial');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Sem resultados');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('Nenhuma cidade encontrada.')).toBeVisible();
  await scan('busca vazia');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('Erro');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível buscar cidades.');
  await scan('erro de busca');
  await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('article', { name: /^Previsão para/ })).toHaveCount(5);
  await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
  await scan('clima e previsão carregados');
});
