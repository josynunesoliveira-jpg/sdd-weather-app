import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const weather = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <div className="min-h-screen bg-night-900 text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-600/20 via-night-900 to-night-900"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-400">
            Weather App
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Consulte o tempo da sua cidade
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Estimativas meteorológicas e previsão local para hoje e os próximos quatro dias.
          </p>
        </header>
        <main className="flex flex-1 flex-col gap-7">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md sm:p-6">
            <SearchBar
              state={weather.searchState}
              onSearch={(query) => void weather.search(query)}
              onSelect={weather.selectCity}
              onRetry={() => void weather.retrySearch()}
            />
          </section>
          {weather.selectedCity && (
            <p className="-mb-4 text-sm text-slate-300" aria-live="polite">
              Local selecionado:{' '}
              <span className="font-semibold text-white">
                {weather.selectedCity.name}, {weather.selectedCity.country}
              </span>
            </p>
          )}
          <CurrentWeather
            city={weather.selectedCity}
            state={weather.current}
            unit={unit}
            onRetry={() => void weather.retryCurrent()}
          />
          <section aria-labelledby="forecast-heading" className="space-y-4">
            {weather.selectedCity && (
              <h2 id="forecast-heading" className="text-xl font-semibold text-white">
                Previsão para cinco dias
              </h2>
            )}
            <ForecastList
              state={weather.forecast}
              hasCity={weather.selectedCity !== null}
              unit={unit}
              onRetry={() => void weather.retryForecast()}
            />
          </section>
          {weather.selectedCity && <UnitToggle unit={unit} onChange={setUnit} />}
        </main>
        <footer className="mt-10 border-t border-white/10 pt-5 text-sm text-slate-300">
          <p>
            Dados meteorológicos:{' '}
            <a
              className="text-accent-400 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo
            </a>{' '}
            (
            <a
              className="text-accent-400 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
            )
          </p>
          <p className="mt-1">Descrições e unidades foram traduzidas/convertidas.</p>
          <p className="mt-2 text-xs text-slate-400">
            Projeto de demonstração não comercial. Consulte a fonte para conhecer limites e
            disponibilidade.
          </p>
        </footer>
      </div>
    </div>
  );
}
