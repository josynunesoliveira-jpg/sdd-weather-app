import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../../src/services/weatherService';

const validResult = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  country_code: 'BR',
  latitude: -23.5,
  longitude: -46.6,
  timezone: 'America/Sao_Paulo',
  admin1: 'São Paulo',
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('serviço de geocodificação', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('codifica consulta Unicode e normaliza a cidade sem inferir região', async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(response({ results: [{ ...validResult, admin1: undefined }] }));
    await expect(searchCities('São Paulo')).resolves.toEqual([
      {
        id: 1,
        name: 'São Paulo',
        country: 'Brasil',
        countryCode: 'BR',
        adminRegion: null,
        latitude: -23.5,
        longitude: -46.6,
        timezone: 'America/Sao_Paulo',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('name')).toBe('São Paulo');
    expect(url.searchParams.get('language')).toBe('pt');
    expect(url.searchParams.get('format')).toBe('json');
  });

  it('distingue lista vazia de formato inválido e descarta só registros inválidos', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ results: [] }));
    await expect(searchCities('X')).resolves.toEqual([]);
    vi.mocked(fetch).mockResolvedValueOnce(response({}));
    await expect(searchCities('X')).rejects.toMatchObject({ code: 'invalid_response' });
    vi.mocked(fetch).mockResolvedValueOnce(response({ results: [{ id: 2 }, validResult] }));
    await expect(searchCities('X')).resolves.toHaveLength(1);
    vi.mocked(fetch).mockResolvedValueOnce(response({ results: [{ id: 2 }] }));
    await expect(searchCities('X')).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('rejeita coordenadas fora dos limites e valores obrigatórios vazios', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ results: [{ ...validResult, latitude: 91 }] }));
    await expect(searchCities('X')).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it.each([
    [429, 'rate_limit'],
    [503, 'http'],
  ] as const)('classifica HTTP %i', async (status, code) => {
    vi.mocked(fetch).mockResolvedValue(response({}, status));
    await expect(searchCities('X')).rejects.toMatchObject({ code });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('classifica falha de transporte como network sem retry', async () => {
    const fetchMock = vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
    await expect(searchCities('X')).rejects.toMatchObject({ code: 'network' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborta uma chamada pendente exatamente no limite de 10 segundos', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const pending = searchCities('X');
    const assertion = expect(pending).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propaga cancelamento externo ao fetch e classifica a interrupção', async () => {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const pending = searchCities('X', controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'network' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it('trata JSON inválido como resposta inválida', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not json', { status: 200 }));
    await expect(searchCities('X')).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(searchCities('X')).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
