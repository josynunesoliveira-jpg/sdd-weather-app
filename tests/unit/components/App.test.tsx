import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App';

const city = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  country_code: 'BR',
  admin1: 'São Paulo',
  latitude: -23.5,
  longitude: -46.6,
  timezone: 'America/Sao_Paulo',
};
function forecastDates(): string[] {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: city.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const first = new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)),
  );
  return Array.from({ length: 5 }, (_, index) =>
    new Date(first.getTime() + index * 86_400_000).toISOString().slice(0, 10),
  );
}
function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('integração da aplicação', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('busca, seleciona, apresenta os dois painéis e alterna unidade sem novas chamadas', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.hostname === 'geocoding-api.open-meteo.com') return jsonResponse({ results: [city] });
      if (url.searchParams.has('current'))
        return jsonResponse({
          current: { time: '2026-10-26T11:00', temperature_2m: 20, weather_code: 0 },
        });
      return jsonResponse({
        daily: {
          time: forecastDates(),
          temperature_2m_min: [10, 11, 12, 13, 14],
          temperature_2m_max: [20, 21, 22, 23, 24],
          weather_code: [0, 1, 2, 3, 61],
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    sessionStorage.clear();
    render(<App />);
    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    await user.type(input, 'São Paulo');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo, Brasil/ }));
    expect(
      await screen.findByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '20 °C',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText('Estimativa do modelo para 11:00')).toBeInTheDocument();
    expect(await screen.findAllByText('Céu limpo')).toHaveLength(2);
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(6));
    const calls = fetchMock.mock.calls.length;
    await user.click(screen.getByRole('radio', { name: 'Fahrenheit (°F)' }));
    expect(
      await screen.findByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '68 °F',
      ),
    ).toBeInTheDocument();
    const dailyCard = screen.getAllByRole('article')[1];
    expect(within(dailyCard).getByText('Mín.: 50 °F')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Celsius (°C)' }));
    expect(
      await screen.findByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '20 °C',
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(calls);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('mantém atribuição e renderiza conteúdo externo como texto literal', async () => {
    const user = userEvent.setup();
    const unsafe = '<script>window.__test=1</script>';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        if (url.hostname === 'geocoding-api.open-meteo.com')
          return jsonResponse({ results: [{ ...city, name: unsafe, admin1: unsafe }] });
        if (url.searchParams.has('current'))
          return jsonResponse({ current: { temperature_2m: 20, weather_code: 0 } });
        return jsonResponse({
          daily: {
            time: forecastDates(),
            temperature_2m_min: [1, 1, 1, 1, 1],
            temperature_2m_max: [2, 2, 2, 2, 2],
            weather_code: [0, 0, 0, 0, 0],
          },
        });
      }),
    );
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'x');
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('button', { name: /script/ }));
    expect(screen.getByRole('heading', { name: /script/ }).textContent).toContain(unsafe);
    expect(document.querySelector('script:not([type=module])')).not.toBeInTheDocument();
    expect((window as Window & { __test?: number }).__test).toBeUndefined();
    expect(screen.getByRole('contentinfo').textContent).toContain(
      'Dados meteorológicos: Open-Meteo (CC BY 4.0)',
    );
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    );
    expect(
      screen.getByText('Descrições e unidades foram traduzidas/convertidas.'),
    ).toBeInTheDocument();
  });
});
