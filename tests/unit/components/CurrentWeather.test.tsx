import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import type { City, CurrentWeather as Data } from '../../../src/types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  countryCode: 'BR',
  adminRegion: null,
  latitude: 0,
  longitude: 0,
  timezone: 'America/Sao_Paulo',
};
const data: Data = {
  temperatureC: 20,
  weatherCode: 0,
  conditionPtBr: 'Céu limpo',
  referenceTime: '2026-10-26T11:00',
};

describe('CurrentWeather', () => {
  it('não mostra cartão antes de selecionar local e apresenta loading', () => {
    const { rerender } = render(
      <CurrentWeather city={null} state={{ status: 'idle' }} unit="celsius" onRetry={vi.fn()} />,
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    rerender(
      <CurrentWeather city={city} state={{ status: 'loading' }} unit="celsius" onRetry={vi.fn()} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Carregando clima…');
  });

  it('apresenta valor, descrição e horário de referência sem rotular observação', () => {
    render(
      <CurrentWeather
        city={city}
        state={{ status: 'success', data }}
        unit="celsius"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'São Paulo, Brasil' })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === '20 °C'),
    ).toBeInTheDocument();
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    expect(screen.getByText('Estimativa do modelo para 11:00')).toBeInTheDocument();
    expect(screen.queryByText(/observação|atualização/i)).not.toBeInTheDocument();
  });

  it('mostra campos ausentes, desconhecidos e referência ausente', () => {
    const partial: Data = {
      ...data,
      temperatureC: null,
      weatherCode: 999,
      conditionPtBr: 'Condição indisponível',
      referenceTime: null,
    };
    render(
      <CurrentWeather
        city={city}
        state={{ status: 'partial', data: partial }}
        unit="fahrenheit"
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'P' && element.textContent === 'Indisponível °F',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getByText('Horário de referência indisponível')).toBeInTheDocument();
    expect(screen.queryByText('999')).not.toBeInTheDocument();
  });

  it('apresenta indisponibilidade sem cartão e permite retry em erro', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <CurrentWeather
        city={city}
        state={{ status: 'unavailable' }}
        unit="celsius"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('Clima indisponível para este local.')).toBeInTheDocument();
    rerender(
      <CurrentWeather
        city={city}
        state={{ status: 'error', error: { code: 'http', retryable: true } }}
        unit="celsius"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o clima. Tente novamente.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(
      <CurrentWeather
        city={city}
        state={{ status: 'error', error: { code: 'network', retryable: true } }}
        unit="celsius"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o clima. Tente novamente.',
    );
  });
});
