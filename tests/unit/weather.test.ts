import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  LoadState,
  Unit,
  WeatherData,
  WeatherViewState,
} from '../../src/types/weather';

describe('Contratos meteorológicos', () => {
  it('restringe unidades e exige exatamente cinco dias', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<WeatherData['forecast']['length']>().toEqualTypeOf<5>();
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
  });

  it('permite dados ausentes sem remover os campos do contrato', () => {
    const city: City = { ...mockWeatherData.city, adminRegion: null };
    const current: CurrentWeather = {
      temperatureC: null,
      weatherCode: null,
      conditionPtBr: null,
      referenceTime: null,
    };
    const day: ForecastDay = {
      date: '2026-10-27',
      temperatureMinC: null,
      temperatureMaxC: null,
      weatherCode: null,
      conditionPtBr: null,
    };

    expect(city.adminRegion).toBeNull();
    expect(current.temperatureC).toBeNull();
    expect(day.temperatureMinC).toBeNull();
  });

  it('mantém sucesso atual independente de erro na previsão', () => {
    const state: WeatherViewState = {
      city: mockWeatherData.city,
      current: { status: 'success', data: mockWeatherData.current },
      forecast: { status: 'error', error: { code: 'network', retryable: true } },
    };

    expect(state.current).toEqual({ status: 'success', data: mockWeatherData.current });
    expect(state.forecast.status).toBe('error');
    expectTypeOf<WeatherViewState['current']>().toEqualTypeOf<LoadState<CurrentWeather>>();
  });
});

describe('Mock meteorológico para a UI', () => {
  it('contém cidade, referência local e clima atual em Celsius', () => {
    expect(mockWeatherData.city).toMatchObject({
      name: 'São Paulo',
      countryCode: 'BR',
      timezone: 'America/Sao_Paulo',
    });
    expect(mockWeatherData.current).toEqual({
      temperatureC: 24.5,
      weatherCode: 0,
      conditionPtBr: 'Céu limpo',
      referenceTime: '2026-10-27T15:00',
    });
  });

  it('contém exatamente cinco datas locais consecutivas a partir da referência', () => {
    expect(mockWeatherData.forecast).toHaveLength(5);
    expect(mockWeatherData.forecast.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(mockWeatherData.forecast[0].date).toBe(
      mockWeatherData.current.referenceTime?.slice(0, 10),
    );
  });

  it('fornece mínimas, máximas e condições utilizáveis em todos os dias', () => {
    for (const day of mockWeatherData.forecast) {
      expect(typeof day.temperatureMinC).toBe('number');
      expect(typeof day.temperatureMaxC).toBe('number');
      if (day.temperatureMinC !== null && day.temperatureMaxC !== null) {
        expect(day.temperatureMinC).toBeLessThanOrEqual(day.temperatureMaxC);
      }
      expect(typeof day.weatherCode).toBe('number');
      expect(day.conditionPtBr).toEqual(expect.any(String));
      expect(day.conditionPtBr).not.toBe('');
    }
  });
});
