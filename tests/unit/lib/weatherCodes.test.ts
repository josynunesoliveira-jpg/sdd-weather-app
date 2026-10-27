import { describe, expect, it } from 'vitest';
import { getWeatherDescription, weatherCodes } from '../../../src/lib/weatherCodes';

describe('descrições WMO', () => {
  it('mapeia o céu limpo exatamente', () => {
    expect(getWeatherDescription(0)).toBe('Céu limpo');
  });

  it('mapeia cada código exportado', () => {
    for (const [code, description] of Object.entries(weatherCodes)) {
      expect(getWeatherDescription(Number(code))).toBe(description);
    }
  });

  it('não expõe códigos desconhecidos', () => {
    expect(getWeatherDescription(12345)).toBe('Condição indisponível');
    expect(getWeatherDescription(12345)).not.toContain('12345');
  });
});
