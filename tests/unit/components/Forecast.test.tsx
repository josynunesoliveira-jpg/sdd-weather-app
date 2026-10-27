import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ForecastCard from '../../../src/components/ForecastCard';
import ForecastList from '../../../src/components/ForecastList';
import type { ForecastDay } from '../../../src/types/weather';

const day: ForecastDay = {
  date: '2026-10-26',
  temperatureMinC: 10.2,
  temperatureMaxC: 20,
  weatherCode: 0,
  conditionPtBr: 'Céu limpo',
};
const days: [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay] = [0, 1, 2, 3, 4].map(
  (index) => ({
    ...day,
    date: `2026-10-${String(26 + index)}`,
    temperatureMinC: 10 + index,
    temperatureMaxC: 20 + index,
  }),
) as [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];

describe('ForecastCard', () => {
  it('formata os dados do mesmo dia e unidade recebida', () => {
    render(<ForecastCard day={day} unit="celsius" />);
    expect(screen.getByText('26/10/2026')).toBeInTheDocument();
    expect(screen.getByText('Mín.: 10,2 °C')).toBeInTheDocument();
    expect(screen.getByText('Máx.: 20 °C')).toBeInTheDocument();
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
  });

  it('mostra ausência e condição desconhecida sem expor o código', () => {
    const partial: ForecastDay = {
      ...day,
      temperatureMinC: null,
      temperatureMaxC: 20,
      weatherCode: 999,
      conditionPtBr: 'Condição indisponível',
    };
    const { rerender } = render(<ForecastCard day={partial} unit="celsius" />);
    expect(screen.getByText('Mín.: Indisponível °C')).toBeInTheDocument();
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.queryByText('999')).not.toBeInTheDocument();
    rerender(
      <ForecastCard
        day={{
          ...day,
          temperatureMinC: null,
          temperatureMaxC: null,
          weatherCode: null,
          conditionPtBr: null,
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });
});

describe('ForecastList', () => {
  it('exibe cinco cartões cronológicos e oculta estado sem cidade', () => {
    const { rerender } = render(
      <ForecastList
        state={{ status: 'success', data: days }}
        hasCity
        unit="celsius"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      '26/10/2026',
      '27/10/2026',
      '28/10/2026',
      '29/10/2026',
      '30/10/2026',
    ]);
    rerender(
      <ForecastList
        state={{ status: 'success', data: days }}
        hasCity={false}
        unit="celsius"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('apresenta loading e erro com retry isolado', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <ForecastList state={{ status: 'loading' }} hasCity unit="celsius" onRetry={onRetry} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão…');
    rerender(
      <ForecastList
        state={{ status: 'error', error: { code: 'network', retryable: true } }}
        hasCity
        unit="celsius"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a previsão. Tente novamente.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
