import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    country: 'Brasil',
    countryCode: 'BR',
    adminRegion: 'São Paulo',
    latitude: -23.5475,
    longitude: -46.6361,
    timezone: 'America/Sao_Paulo',
  },
  current: {
    temperatureC: 24.5,
    weatherCode: 0,
    conditionPtBr: 'Céu limpo',
    referenceTime: '2026-10-27T15:00',
  },
  forecast: [
    {
      date: '2026-10-27',
      temperatureMinC: 18,
      temperatureMaxC: 27,
      weatherCode: 0,
      conditionPtBr: 'Céu limpo',
    },
    {
      date: '2026-10-28',
      temperatureMinC: 19,
      temperatureMaxC: 28.5,
      weatherCode: 2,
      conditionPtBr: 'Parcialmente nublado',
    },
    {
      date: '2026-10-29',
      temperatureMinC: 17.5,
      temperatureMaxC: 25,
      weatherCode: 3,
      conditionPtBr: 'Encoberto',
    },
    {
      date: '2026-10-30',
      temperatureMinC: 16,
      temperatureMaxC: 22,
      weatherCode: 61,
      conditionPtBr: 'Chuva fraca',
    },
    {
      date: '2026-10-31',
      temperatureMinC: 17,
      temperatureMaxC: 24,
      weatherCode: 1,
      conditionPtBr: 'Predominantemente limpo',
    },
  ],
};
