import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentWeather, getForecast } from '../../../src/services/weatherService';
import type { City } from '../../../src/types/weather';

const city: City = {
  id: 9,
  name: 'São Paulo',
  country: 'Brasil',
  countryCode: 'BR',
  adminRegion: null,
  latitude: -23.5,
  longitude: -46.6,
  timezone: 'America/Sao_Paulo',
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function days(): string[] {
  return ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];
}

describe('serviços meteorológicos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T02:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('normaliza clima atual, URL, fuso e referência temporal local', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      response({
        current: {
          time: '2026-10-26T11:00',
          temperature_2m: 18.4,
          weather_code: 3,
        },
      }),
    );
    await expect(getCurrentWeather(city)).resolves.toEqual({
      temperatureC: 18.4,
      weatherCode: 3,
      conditionPtBr: 'Encoberto',
      referenceTime: '2026-10-26T11:00',
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('latitude')).toBe('-23.5');
    expect(url.searchParams.get('longitude')).toBe('-46.6');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('timezone')).toBe(city.timezone);
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ temperature_2m: null, weather_code: 'x' }, null, null],
    [{ weather_code: 0 }, null, 'Céu limpo'],
    [{ temperature_2m: 2 }, 2, null],
  ])('normaliza métricas ausentes ou inválidas', async (body, temperatureC, conditionPtBr) => {
    vi.mocked(fetch).mockResolvedValue(response({ current: body }));
    await expect(getCurrentWeather(city)).resolves.toMatchObject({
      temperatureC,
      conditionPtBr,
      referenceTime: null,
    });
  });

  it.each([undefined, null, 'bad'])('rejeita current malformado', async (current) => {
    vi.mocked(fetch).mockResolvedValue(response({ current }));
    await expect(getCurrentWeather(city)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('exige cinco datas locais consecutivas começando no dia da cidade', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({
        daily: {
          time: days(),
          temperature_2m_min: [15, 16, 17, 18, 19],
          temperature_2m_max: [20, 21, 22, 23, 24],
          weather_code: [0, 1, 2, 3, 61],
        },
      }),
    );
    const result = await getForecast(city);
    expect(result.map((day) => day.date)).toEqual(days());
    expect(result.map((day) => day.conditionPtBr)).toEqual([
      'Céu limpo',
      'Predominantemente limpo',
      'Parcialmente nublado',
      'Encoberto',
      'Chuva fraca',
    ]);
    const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(url.searchParams.get('daily')).toBe(
      'temperature_2m_min,temperature_2m_max,weather_code',
    );
    expect(url.searchParams.get('forecast_days')).toBe('5');
    expect(url.searchParams.get('timezone')).toBe(city.timezone);
  });

  it.each([
    [undefined, 'missing'],
    [['2026-10-27', '2026-10-26', '2026-10-28', '2026-10-29', '2026-10-30'], 'out of order'],
    [['2026-10-26', '2026-10-26', '2026-10-28', '2026-10-29', '2026-10-30'], 'duplicate'],
    [['2026-10-26', '2026-10-27', '2026-10-29', '2026-10-29', '2026-10-30'], 'gap'],
    [['2026-02-30', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'], 'invalid date'],
  ])('rejeita período de datas %s', async (dates, _label) => {
    vi.mocked(fetch).mockResolvedValue(response({ daily: { time: dates } }));
    await expect(getForecast(city)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('classifica fuso horário inválido como resposta inválida', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ daily: { time: days() } }));
    await expect(getForecast({ ...city, timezone: 'Not/A_Timezone' })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('alinha arrays curtos e inválidos sem deslocar valores entre datas', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({
        daily: {
          time: days(),
          temperature_2m_min: [10, null, 'bad'],
          temperature_2m_max: [20, 21],
          weather_code: [0, 2, null, 3],
        },
      }),
    );
    const result = await getForecast(city);
    expect(result[0]).toMatchObject({
      temperatureMinC: 10,
      temperatureMaxC: 20,
      conditionPtBr: 'Céu limpo',
    });
    expect(result[1]).toMatchObject({
      temperatureMinC: null,
      temperatureMaxC: 21,
      conditionPtBr: 'Parcialmente nublado',
    });
    expect(result[2]).toMatchObject({
      temperatureMinC: null,
      temperatureMaxC: null,
      conditionPtBr: null,
    });
    expect(result[3]).toMatchObject({
      temperatureMinC: null,
      temperatureMaxC: null,
      conditionPtBr: 'Encoberto',
    });
  });

  it.each([
    { operation: 'current', status: 429, code: 'rate_limit' },
    { operation: 'current', status: 503, code: 'http' },
    { operation: 'daily', status: 429, code: 'rate_limit' },
    { operation: 'daily', status: 503, code: 'http' },
  ])('classifica erro HTTP $operation $status', async ({ operation, status, code }) => {
    vi.mocked(fetch).mockResolvedValue(response({}, status));
    const request = operation === 'current' ? getCurrentWeather(city) : getForecast(city);
    await expect(request).rejects.toMatchObject({ code });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['current', 'daily'] as const)('classifica falha de rede em %s', async (operation) => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
    const request = operation === 'current' ? getCurrentWeather(city) : getForecast(city);
    await expect(request).rejects.toMatchObject({ code: 'network' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['current', 'daily'] as const)('expira %s em 10 segundos', async (operation) => {
    const pendingFetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', pendingFetch);
    const request = operation === 'current' ? getCurrentWeather(city) : getForecast(city);
    const assertion = expect(request).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(pendingFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    'current',
    'daily',
  ] as const)('propaga cancelamento externo em %s', async (operation) => {
    const pendingFetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', pendingFetch);
    const controller = new AbortController();
    const request =
      operation === 'current'
        ? getCurrentWeather(city, controller.signal)
        : getForecast(city, controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({ code: 'network' });
    expect(pendingFetch).toHaveBeenCalledTimes(1);
    expect(pendingFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
