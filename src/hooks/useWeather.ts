import { useEffect, useRef, useState } from 'react';
import {
  getCurrentWeather,
  getForecast,
  searchCities,
  WeatherServiceError,
} from '../services/weatherService';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  LoadState,
  SearchState,
  WeatherError,
} from '../types/weather';

type Forecast = [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];

interface WeatherActions {
  searchState: SearchState;
  selectedCity: City | null;
  current: LoadState<CurrentWeather>;
  forecast: LoadState<Forecast>;
  search: (query: string) => Promise<void>;
  retrySearch: () => Promise<void>;
  selectCity: (city: City) => void;
  retryCurrent: () => Promise<void>;
  retryForecast: () => Promise<void>;
}

const initialLoadState: LoadState<never> = { status: 'idle' };
const initialSearchState: SearchState = { status: 'idle' };

function normalizeError(error: unknown): WeatherError {
  if (error instanceof WeatherServiceError) {
    return { code: error.code, retryable: error.retryable };
  }
  return { code: 'network', retryable: true };
}

function currentStatus(data: CurrentWeather): LoadState<CurrentWeather> {
  const hasTemperature = data.temperatureC !== null;
  const hasCondition = data.conditionPtBr !== null;
  if (!hasTemperature && !hasCondition) return { status: 'unavailable' };
  return hasTemperature && hasCondition ? { status: 'success', data } : { status: 'partial', data };
}

function forecastStatus(data: Forecast): LoadState<Forecast> {
  const isComplete = data.every(
    (day) =>
      day.temperatureMinC !== null && day.temperatureMaxC !== null && day.conditionPtBr !== null,
  );
  return isComplete ? { status: 'success', data } : { status: 'partial', data };
}

export default function useWeather(): WeatherActions {
  const [searchState, setSearchState] = useState<SearchState>(initialSearchState);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [current, setCurrent] = useState<LoadState<CurrentWeather>>(initialLoadState);
  const [forecast, setForecast] = useState<LoadState<Forecast>>(initialLoadState);
  const searchController = useRef<AbortController | null>(null);
  const currentController = useRef<AbortController | null>(null);
  const forecastController = useRef<AbortController | null>(null);
  const searchRequestId = useRef(0);
  const selectionId = useRef(0);
  const lastQuery = useRef('');

  useEffect(
    () => () => {
      searchRequestId.current += 1;
      selectionId.current += 1;
      searchController.current?.abort();
      currentController.current?.abort();
      forecastController.current?.abort();
    },
    [],
  );

  const search = async (value: string): Promise<void> => {
    const query = value.trim();
    if (searchState.status === 'loading' || query.length === 0 || [...query].length > 100) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const requestId = ++searchRequestId.current;
    lastQuery.current = query;
    setSearchState({ status: 'loading' });
    try {
      const cities = await searchCities(query, controller.signal);
      if (requestId !== searchRequestId.current) return;
      setSearchState(
        cities.length === 0 ? { status: 'empty' } : { status: 'results', items: cities },
      );
    } catch (error) {
      if (requestId !== searchRequestId.current) return;
      setSearchState({ status: 'error', error: normalizeError(error) });
    }
  };

  const retrySearch = async (): Promise<void> => {
    if (searchState.status !== 'error' || searchState.error.retryable) {
      await search(lastQuery.current);
    }
  };

  const loadCurrent = async (city: City, requestId: number): Promise<void> => {
    currentController.current?.abort();
    const controller = new AbortController();
    currentController.current = controller;
    setCurrent({ status: 'loading' });
    try {
      const data = await getCurrentWeather(city, controller.signal);
      if (requestId !== selectionId.current) return;
      setCurrent(currentStatus(data));
    } catch (error) {
      if (requestId !== selectionId.current) return;
      setCurrent({ status: 'error', error: normalizeError(error) });
    }
  };

  const loadForecast = async (city: City, requestId: number): Promise<void> => {
    forecastController.current?.abort();
    const controller = new AbortController();
    forecastController.current = controller;
    setForecast({ status: 'loading' });
    try {
      const data = await getForecast(city, controller.signal);
      if (requestId !== selectionId.current) return;
      setForecast(forecastStatus(data));
    } catch (error) {
      if (requestId !== selectionId.current) return;
      setForecast({ status: 'error', error: normalizeError(error) });
    }
  };

  const selectCity = (city: City): void => {
    searchController.current?.abort();
    searchRequestId.current += 1;
    setSearchState({ status: 'idle' });
    setSelectedCity(city);
    const requestId = ++selectionId.current;
    currentController.current?.abort();
    forecastController.current?.abort();
    setCurrent({ status: 'loading' });
    setForecast({ status: 'loading' });
    void loadCurrent(city, requestId);
    void loadForecast(city, requestId);
  };

  const retryCurrent = async (): Promise<void> => {
    if (selectedCity === null || current.status !== 'error') return;
    await loadCurrent(selectedCity, selectionId.current);
  };

  const retryForecast = async (): Promise<void> => {
    if (selectedCity === null || forecast.status !== 'error') return;
    await loadForecast(selectedCity, selectionId.current);
  };

  return {
    searchState,
    selectedCity,
    current,
    forecast,
    search,
    retrySearch,
    selectCity,
    retryCurrent,
    retryForecast,
  };
}
