import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../../src/hooks/useWeather';
import type { City, CurrentWeather, ForecastDay } from '../../../src/types/weather';

const serviceMocks = vi.hoisted(() => ({
  searchCities: vi.fn(),
  getCurrentWeather: vi.fn(),
  getForecast: vi.fn(),
}));
vi.mock('../../../src/services/weatherService', () => ({
  ...serviceMocks,
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const cityA: City = {
  id: 1,
  name: 'A',
  country: 'Brasil',
  countryCode: 'BR',
  adminRegion: null,
  latitude: 1,
  longitude: 2,
  timezone: 'UTC',
};
const cityB: City = { ...cityA, id: 2, name: 'B', latitude: 3 };
const current: CurrentWeather = {
  temperatureC: 20,
  weatherCode: 0,
  conditionPtBr: 'Céu limpo',
  referenceTime: null,
};
const forecast: [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay] = [
  0, 1, 2, 3, 4,
].map((index) => ({
  date: `2026-10-${String(26 + index)}`,
  temperatureMinC: 10,
  temperatureMaxC: 20,
  weatherCode: 0,
  conditionPtBr: 'Céu limpo',
})) as [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  beforeEach(() => {
    serviceMocks.searchCities.mockReset();
    serviceMocks.getCurrentWeather.mockReset();
    serviceMocks.getForecast.mockReset();
  });

  it('valida comprimento Unicode, trim, estados e retry normalizado', async () => {
    serviceMocks.searchCities
      .mockResolvedValueOnce([cityA])
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([cityA]);
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.search('   ');
    });
    await act(async () => {
      await result.current.search('🌦'.repeat(101));
    });
    expect(serviceMocks.searchCities).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.search('  São Paulo  ');
    });
    expect(serviceMocks.searchCities).toHaveBeenLastCalledWith(
      'São Paulo',
      expect.any(AbortSignal),
    );
    expect(result.current.searchState).toMatchObject({ status: 'results', items: [cityA] });
    await act(async () => {
      await result.current.search('A');
    });
    expect(result.current.searchState.status).toBe('error');
    await act(async () => {
      await result.current.retrySearch();
    });
    expect(serviceMocks.searchCities).toHaveBeenLastCalledWith('A', expect.any(AbortSignal));
    expect(serviceMocks.searchCities).toHaveBeenCalledTimes(3);
  });

  it('impede submissão duplicada durante loading', async () => {
    const pending = deferred<City[]>();
    serviceMocks.searchCities.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather());
    act(() => {
      void result.current.search('São Paulo');
    });
    expect(result.current.searchState.status).toBe('loading');
    await act(async () => {
      await result.current.search('Rio');
    });
    expect(serviceMocks.searchCities).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve([cityA]);
      await pending.promise;
    });
    expect(result.current.searchState.status).toBe('results');
  });

  it('descarta resultados de busca obsoletos após seleção', async () => {
    const pending = deferred<City[]>();
    serviceMocks.searchCities.mockReturnValue(pending.promise);
    serviceMocks.getCurrentWeather.mockResolvedValue(current);
    serviceMocks.getForecast.mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => {
      void result.current.search('antiga');
    });
    act(() => {
      result.current.selectCity(cityB);
    });
    await act(async () => {
      pending.resolve([cityA]);
      await pending.promise;
    });
    await waitFor(() => expect(result.current.selectedCity).toEqual(cityB));
    expect(result.current.searchState.status).toBe('idle');
  });

  it('inicia current e forecast em paralelo e descarta respostas tardias da cidade anterior', async () => {
    const currentA = deferred<CurrentWeather>();
    const currentB = deferred<CurrentWeather>();
    const forecastA = deferred<typeof forecast>();
    const forecastB = deferred<typeof forecast>();
    serviceMocks.getCurrentWeather.mockImplementation((city: City) =>
      city.id === 1 ? currentA.promise : currentB.promise,
    );
    serviceMocks.getForecast.mockImplementation((city: City) =>
      city.id === 1 ? forecastA.promise : forecastB.promise,
    );
    const { result } = renderHook(() => useWeather());
    act(() => {
      result.current.selectCity(cityA);
    });
    act(() => {
      result.current.selectCity(cityB);
    });
    expect(serviceMocks.getCurrentWeather).toHaveBeenCalledTimes(2);
    expect(serviceMocks.getForecast).toHaveBeenCalledTimes(2);
    expect(result.current.current.status).toBe('loading');
    expect(result.current.forecast.status).toBe('loading');
    await act(async () => {
      currentB.resolve({ ...current, temperatureC: 30 });
      forecastB.resolve(forecast);
      await Promise.all([currentB.promise, forecastB.promise]);
    });
    await act(async () => {
      currentA.resolve(current);
      forecastA.resolve(forecast);
      await Promise.all([currentA.promise, forecastA.promise]);
    });
    expect(result.current.selectedCity).toEqual(cityB);
    expect(result.current.current).toMatchObject({ status: 'success', data: { temperatureC: 30 } });
    expect(result.current.forecast.status).toBe('success');
  });

  it('mantém sucesso independente e retry restrito ao painel com erro', async () => {
    serviceMocks.getCurrentWeather
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(current);
    serviceMocks.getForecast.mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => {
      result.current.selectCity(cityA);
    });
    await waitFor(() => expect(result.current.current.status).toBe('error'));
    expect(result.current.forecast.status).toBe('success');
    await act(async () => {
      await result.current.retryCurrent();
    });
    expect(serviceMocks.getCurrentWeather).toHaveBeenCalledTimes(2);
    expect(serviceMocks.getForecast).toHaveBeenCalledTimes(1);
    expect(result.current.current.status).toBe('success');
  });

  it('classifica dados parciais e clima indisponível', async () => {
    serviceMocks.getCurrentWeather
      .mockResolvedValueOnce({ ...current, temperatureC: null })
      .mockResolvedValueOnce({
        ...current,
        temperatureC: null,
        weatherCode: null,
        conditionPtBr: null,
      });
    serviceMocks.getForecast.mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => {
      result.current.selectCity(cityA);
    });
    await waitFor(() => expect(result.current.current.status).toBe('partial'));
    act(() => {
      result.current.selectCity(cityB);
    });
    await waitFor(() => expect(result.current.current.status).toBe('unavailable'));
  });
  it('aceita exatamente 100 pontos de código Unicode e registra lista vazia', async () => {
    serviceMocks.searchCities.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    const query = '🌦'.repeat(100);
    await act(async () => {
      await result.current.search(query);
    });
    expect(serviceMocks.searchCities).toHaveBeenCalledTimes(1);
    expect(serviceMocks.searchCities).toHaveBeenCalledWith(query, expect.any(AbortSignal));
    expect(result.current.searchState.status).toBe('empty');
  });
});
