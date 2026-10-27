import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatNumber, formatTime } from '../../../src/lib/format';

describe('formatadores pt-BR', () => {
  afterEach(() => vi.useRealTimers());

  it('formata data ISO sem depender do fuso do dispositivo', () => {
    expect(formatDate('2026-10-26')).toBe('26/10/2026');
  });

  it('formata hora local e preserva ausência de referência', () => {
    expect(formatTime('2026-10-26T11:00')).toBe('11:00');
    expect(formatTime(null)).toBeNull();
  });

  it('usa vírgula decimal e omite casas decimais zeradas', () => {
    expect(formatNumber(20.5)).toBe('20,5');
    expect(formatNumber(20)).toBe('20');
  });

  it('não consulta relógio do sistema ao formatar referência ausente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T11:00:00Z'));
    expect(formatTime(null)).toBeNull();
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    expect(formatTime(null)).toBeNull();
  });
});
