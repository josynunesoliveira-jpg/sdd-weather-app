import type { Page } from '@playwright/test';

export const cityFixture = {
  id: 3448439,
  name: 'São Paulo',
  country: 'Brasil',
  country_code: 'BR',
  admin1: 'São Paulo',
  latitude: -23.5475,
  longitude: -46.63611,
  timezone: 'America/Sao_Paulo',
};

export interface RouteReply {
  status?: number;
  body: unknown;
}
export type RouteFactory = (url: URL, count: number) => RouteReply | Promise<RouteReply>;
export interface WeatherRouteOptions {
  geocoding?: RouteFactory;
  current?: RouteFactory;
  daily?: RouteFactory;
  delayMs?: number;
}
export interface WeatherCallCounts {
  geocoding: number;
  current: number;
  daily: number;
}

export function nextFiveLocalDates(timezone = cityFixture.timezone): string[] {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const start = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day));
  return Array.from({ length: 5 }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10),
  );
}

export async function installWeatherRoutes(
  page: Page,
  options: WeatherRouteOptions = {},
): Promise<WeatherCallCounts> {
  const counts: WeatherCallCounts = { geocoding: 0, current: 0, daily: 0 };
  const pause = async () => {
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
  };
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    counts.geocoding += 1;
    await pause();
    const url = new URL(route.request().url());
    const reply = options.geocoding
      ? await options.geocoding(url, counts.geocoding)
      : { body: { results: [cityFixture] } };
    await route.fulfill({
      status: reply.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(reply.body),
    });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    const url = new URL(route.request().url());
    const isCurrent = url.searchParams.has('current');
    const key = isCurrent ? 'current' : 'daily';
    counts[key] += 1;
    await pause();
    const defaultReply: RouteReply = isCurrent
      ? { body: { current: { time: '2026-10-26T11:00', temperature_2m: 20, weather_code: 0 } } }
      : {
          body: {
            daily: {
              time: nextFiveLocalDates(),
              temperature_2m_min: [10, 11, 12, 13, 14],
              temperature_2m_max: [20, 21, 22, 23, 24],
              weather_code: [0, 1, 2, 3, 61],
            },
          },
        };
    const factory = options[key];
    const reply = factory ? await factory(url, counts[key]) : defaultReply;
    await route.fulfill({
      status: reply.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(reply.body),
    });
  });
  return counts;
}

export async function searchAndSelect(page: Page, query = 'São Paulo'): Promise<void> {
  const input = page.getByRole('searchbox', { name: 'Nome da cidade' });
  await input.fill(query);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
}
