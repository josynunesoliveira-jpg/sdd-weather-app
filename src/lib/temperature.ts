import type { Unit } from '../types/weather';
import { formatNumber } from './format';

export function roundTemperature(value: number): number {
  const rounded = Math.round(Math.abs(value) * 10 + Number.EPSILON) / 10;
  const signed = value < 0 ? -rounded : rounded;
  return Object.is(signed, -0) ? 0 : signed;
}

export function convertTemperature(celsius: number, unit: Unit): number {
  const value = unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
  return roundTemperature(value);
}

export function formatTemperature(celsius: number | null, unit: Unit): string {
  if (celsius === null || !Number.isFinite(celsius)) return 'Indisponível';
  return formatNumber(convertTemperature(celsius, unit));
}

export function getUnitSymbol(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}
