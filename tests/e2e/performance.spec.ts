import { expect, test } from '@playwright/test';
import { installWeatherRoutes } from './helpers';

function percentile95(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

test('mede p95 de 100 buscas e 100 consultas com rede controlada', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Medição de desempenho é executada uma vez em Chromium.',
  );
  test.setTimeout(180_000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (10 * 1024 * 1024) / 8,
    connectionType: 'wifi',
  });
  await installWeatherRoutes(page, { delayMs: 100 });
  await page.goto('/');
  const searchSamples: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
    const start = await page.evaluate(() => performance.now());
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    await page.getByRole('button', { name: /São Paulo.*Brasil/ }).waitFor();
    searchSamples.push((await page.evaluate(() => performance.now())) - start);
  }
  const consultationSamples: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    await page.getByRole('searchbox', { name: 'Nome da cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('button', { name: /São Paulo.*Brasil/ }).waitFor();
    const start = await page.evaluate(() => performance.now());
    await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
    await expect(page.getByText('20 °C', { exact: true })).toBeVisible();
    await expect(page.getByRole('article', { name: /^Previsão para/ })).toHaveCount(5);
    consultationSamples.push((await page.evaluate(() => performance.now())) - start);
  }
  const report = {
    network: { downloadMbps: 10, clientLatencyMs: 100, mockedApiMaximumMs: 100 },
    search: {
      sampleCount: searchSamples.length,
      p95Ms: percentile95(searchSamples),
      samplesMs: searchSamples,
    },
    consultation: {
      sampleCount: consultationSamples.length,
      p95Ms: percentile95(consultationSamples),
      samplesMs: consultationSamples,
    },
  };
  await testInfo.attach('performance-samples.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  console.log(
    'Performance report: ' +
      JSON.stringify({ search: report.search.p95Ms, consultation: report.consultation.p95Ms }),
  );
  expect(report.search.sampleCount).toBeGreaterThanOrEqual(100);
  expect(report.consultation.sampleCount).toBeGreaterThanOrEqual(100);
  expect(report.search.p95Ms).toBeLessThanOrEqual(3000);
  expect(report.consultation.p95Ms).toBeLessThanOrEqual(3000);
});
