export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  adminRegion: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperatureC: number | null;
  weatherCode: number | null;
  conditionPtBr: string | null;
  referenceTime: string | null;
}

export interface ForecastDay {
  date: string;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  weatherCode: number | null;
  conditionPtBr: string | null;
}

/** Dados para apresentação; não substitui os estados independentes de consulta. */
export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];
}

export interface WeatherViewState {
  city: City;
  current: LoadState<CurrentWeather>;
  forecast: LoadState<WeatherData['forecast']>;
}

export type SearchState =
  | { status: 'idle' | 'loading' }
  | { status: 'results'; items: City[] }
  | { status: 'empty' }
  | { status: 'error'; error: WeatherError };

export type WeatherErrorCode = 'timeout' | 'network' | 'rate_limit' | 'http' | 'invalid_response';

export interface WeatherError {
  code: WeatherErrorCode;
  retryable: boolean;
}

export type LoadState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: T }
  | { status: 'partial'; data: T }
  | { status: 'unavailable' }
  | { status: 'error'; error: WeatherError };
