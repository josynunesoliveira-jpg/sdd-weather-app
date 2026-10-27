import { type FormEvent, useRef, useState } from 'react';
import type { City, SearchState } from '../types/weather';

interface SearchBarProps {
  state: SearchState;
  onSearch: (query: string) => void;
  onSelect: (city: City) => void;
  onRetry: () => void;
}

function errorMessage(state: Extract<SearchState, { status: 'error' }>): string {
  return state.error.code === 'timeout'
    ? 'A busca demorou mais que o esperado. Tente novamente.'
    : 'Não foi possível buscar cidades. Tente novamente.';
}

export default function SearchBar({ state, onSearch, onSelect, onRetry }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query.length === 0) {
      setValidationError('Digite o nome de uma cidade.');
      inputRef.current?.focus();
      return;
    }
    if ([...query].length > 100) {
      setValidationError('Use até 100 caracteres.');
      inputRef.current?.focus();
      return;
    }
    setValidationError(null);
    onSearch(query);
  };

  return (
    <section className="w-full" aria-labelledby="search-heading">
      <h2 id="search-heading" className="mb-3 text-lg font-semibold text-white">
        Buscar cidade
      </h2>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="city-search">
          Nome da cidade
        </label>
        <input
          ref={inputRef}
          id="city-search"
          name="city"
          type="search"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setValidationError(null);
          }}
          aria-invalid={validationError !== null}
          aria-describedby={validationError ? 'search-validation' : undefined}
          placeholder="Ex.: São Paulo"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-night-800 px-4 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="rounded-xl bg-accent-600 px-6 py-3 font-semibold text-white transition hover:bg-[#4b59d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </form>
      {validationError && (
        <p id="search-validation" className="mt-2 text-sm text-amber-200">
          {validationError}
        </p>
      )}
      {state.status === 'loading' && (
        <p className="mt-3 text-sm text-slate-200" role="status">
          Buscando cidades…
        </p>
      )}
      {state.status === 'empty' && (
        <p className="mt-3 text-sm text-slate-200" role="status">
          Nenhuma cidade encontrada.
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="alert">
          <span>{errorMessage(state)}</span>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-accent-400 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            onClick={onRetry}
          >
            Tentar buscar novamente
          </button>
        </div>
      )}
      {state.status === 'results' && (
        <ul className="mt-4 grid gap-2" aria-label="Resultados da busca">
          {state.items.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                aria-label={[city.name, city.country, city.adminRegion]
                  .filter((value) => value !== null)
                  .join(', ')}
                onClick={() => onSelect(city)}
                className="flex w-full flex-wrap items-center gap-x-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
              >
                <span className="font-semibold">{city.name}</span>
                <span className="text-slate-200">{city.country}</span>
                {city.adminRegion !== null && (
                  <span className="text-sm text-slate-300">{city.adminRegion}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
