import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../../src/lib/temperature';

describe('conversão de temperatura', () => {
  it('formata os casos Celsius com uma casa decimal e half-up', () => {
    expect(formatTemperature(20, 'celsius')).toBe('20');
    expect(formatTemperature(20.24, 'celsius')).toBe('20,2');
    expect(formatTemperature(20.25, 'celsius')).toBe('20,3');
    expect(formatTemperature(-0.05, 'celsius')).toBe('-0,1');
  });

  it('converte a partir do Celsius original e arredonda ao final', () => {
    expect(formatTemperature(20, 'fahrenheit')).toBe('68');
    expect(convertTemperature(20.24, 'fahrenheit')).toBe(68.4);
    expect(formatTemperature(20.25, 'fahrenheit')).toBe('68,5');
    expect(formatTemperature(20.24, 'celsius')).toBe('20,2');
  });

  it('apresenta valores ausentes sem inventar temperatura', () => {
    expect(formatTemperature(null, 'fahrenheit')).toBe('Indisponível');
  });
});
