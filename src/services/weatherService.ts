import { getWeatherDescription } from '../lib/weatherCodes';
import type { City, CurrentWeather, ForecastDay, WeatherErrorCode } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  readonly code: WeatherErrorCode;
  readonly retryable = true;

  constructor(code: WeatherErrorCode) {
    super(code);
    this.name = 'WeatherServiceError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

async function requestJson(url: string, externalSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError(response.status === 429 ? 'rate_limit' : 'http');
    }
    try {
      return (await response.json()) as unknown;
    } catch {
      if (timedOut) throw new WeatherServiceError('timeout');
      if (externalSignal?.aborted) throw new WeatherServiceError('network');
      throw new WeatherServiceError('invalid_response');
    }
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (timedOut) throw new WeatherServiceError('timeout');
    throw new WeatherServiceError('network');
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromCaller);
  }
}

function normalizeCity(value: unknown): City | null {
  if (!isRecord(value)) return null;
  const id = finiteNumber(value.id);
  const name = nonEmptyString(value.name);
  const country = nonEmptyString(value.country);
  const countryCode = nonEmptyString(value.country_code);
  const timezone = nonEmptyString(value.timezone);
  const latitude = finiteNumber(value.latitude);
  const longitude = finiteNumber(value.longitude);
  if (
    id === null ||
    name === null ||
    country === null ||
    countryCode === null ||
    timezone === null ||
    latitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude === null ||
    longitude < -180 ||
    longitude > 180
  )
    return null;
  return {
    id,
    name,
    country,
    countryCode,
    adminRegion: nonEmptyString(value.admin1),
    latitude,
    longitude,
    timezone,
  };
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');
  const payload = await requestJson(url.toString(), signal);
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new WeatherServiceError('invalid_response');
  }
  if (payload.results.length === 0) return [];
  const cities = payload.results.map(normalizeCity).filter((city): city is City => city !== null);
  if (cities.length === 0) throw new WeatherServiceError('invalid_response');
  return cities;
}

function makeForecastUrl(city: City, key: 'current' | 'daily'): string {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(city.latitude));
  url.searchParams.set('longitude', String(city.longitude));
  url.searchParams.set(
    key,
    key === 'current'
      ? 'temperature_2m,weather_code'
      : 'temperature_2m_min,temperature_2m_max,weather_code',
  );
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('timezone', city.timezone);
  if (key === 'daily') url.searchParams.set('forecast_days', '5');
  return url.toString();
}

export async function getCurrentWeather(city: City, signal?: AbortSignal): Promise<CurrentWeather> {
  const payload = await requestJson(makeForecastUrl(city, 'current'), signal);
  if (!isRecord(payload) || !isRecord(payload.current)) {
    throw new WeatherServiceError('invalid_response');
  }
  const temperatureC = finiteNumber(payload.current.temperature_2m);
  const weatherCode = finiteNumber(payload.current.weather_code);
  return {
    temperatureC,
    weatherCode,
    conditionPtBr: weatherCode === null ? null : getWeatherDescription(weatherCode),
    referenceTime: nonEmptyString(payload.current.time),
  };
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function localDateInTimezone(timezone: string, instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function nextIsoDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export async function getForecast(
  city: City,
  signal?: AbortSignal,
): Promise<[ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay]> {
  const payload = await requestJson(makeForecastUrl(city, 'daily'), signal);
  if (
    !isRecord(payload) ||
    !isRecord(payload.daily) ||
    !Array.isArray(payload.daily.time) ||
    payload.daily.time.length !== 5
  ) {
    throw new WeatherServiceError('invalid_response');
  }
  const dates: unknown[] = payload.daily.time;
  let expectedFirst: string;
  try {
    expectedFirst = localDateInTimezone(city.timezone, new Date());
  } catch {
    throw new WeatherServiceError('invalid_response');
  }
  for (let index = 0; index < 5; index += 1) {
    if (!isValidIsoDate(dates[index])) throw new WeatherServiceError('invalid_response');
    const expected = index === 0 ? expectedFirst : nextIsoDate(dates[index - 1] as string);
    if (dates[index] !== expected) throw new WeatherServiceError('invalid_response');
  }
  const minima = Array.isArray(payload.daily.temperature_2m_min)
    ? payload.daily.temperature_2m_min
    : [];
  const maxima = Array.isArray(payload.daily.temperature_2m_max)
    ? payload.daily.temperature_2m_max
    : [];
  const codes = Array.isArray(payload.daily.weather_code) ? payload.daily.weather_code : [];
  return dates.map((date, index) => {
    const temperatureMinC = finiteNumber(minima[index]);
    const temperatureMaxC = finiteNumber(maxima[index]);
    const weatherCode = finiteNumber(codes[index]);
    return {
      date: date as string,
      temperatureMinC,
      temperatureMaxC,
      weatherCode,
      conditionPtBr: weatherCode === null ? null : getWeatherDescription(weatherCode),
    };
  }) as [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];
}
