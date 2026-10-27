import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../../src/components/SearchBar';
import type { City, SearchState } from '../../../src/types/weather';

const city: City = {
  id: 1,
  name: '<script>alert(1)</script>',
  country: 'Brasil',
  countryCode: 'BR',
  adminRegion: 'Sul',
  latitude: 0,
  longitude: 0,
  timezone: 'UTC',
};
const idle: SearchState = { status: 'idle' };

describe('SearchBar', () => {
  it('valida entrada vazia e mais de 100 pontos mantendo foco', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar state={idle} onSearch={onSearch} onSelect={vi.fn()} onRetry={vi.fn()} />);
    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByText('Digite o nome de uma cidade.')).toBeInTheDocument();
    expect(input).toHaveFocus();
    await user.type(input, '🌦'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByText('Use até 100 caracteres.')).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('envia por Enter com texto normalizado e seleciona resultado por teclado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    const { rerender } = render(
      <SearchBar state={idle} onSearch={onSearch} onSelect={onSelect} onRetry={vi.fn()} />,
    );
    const input = screen.getByRole('searchbox', { name: 'Nome da cidade' });
    await user.type(input, '  São Paulo  ');
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledWith('São Paulo');
    rerender(
      <SearchBar
        state={{ status: 'results', items: [city] }}
        onSearch={onSearch}
        onSelect={onSelect}
        onRetry={vi.fn()}
      />,
    );
    const result = screen.getByRole('button', { name: '<script>alert(1)</script>, Brasil, Sul' });
    result.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(city);
    result.focus();
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getAllByText('<script>alert(1)</script>')).toHaveLength(1);
  });

  it('apresenta loading, vazio e erro com semântica acessível', async () => {
    const onRetry = vi.fn();
    const props = { onSearch: vi.fn(), onSelect: vi.fn(), onRetry };
    const { rerender } = render(<SearchBar {...props} state={{ status: 'loading' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades…');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    rerender(<SearchBar {...props} state={{ status: 'empty' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada.');
    rerender(
      <SearchBar
        {...props}
        state={{ status: 'error', error: { code: 'timeout', retryable: true } }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A busca demorou mais que o esperado. Tente novamente.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar buscar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(
      <SearchBar
        {...props}
        state={{ status: 'error', error: { code: 'network', retryable: true } }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível buscar cidades. Tente novamente.',
    );
  });
});
