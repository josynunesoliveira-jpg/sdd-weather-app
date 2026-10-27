import { formatTime } from '../lib/format';
import { formatTemperature, getUnitSymbol } from '../lib/temperature';
import type { City, CurrentWeather as CurrentWeatherData, LoadState, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City | null;
  state: LoadState<CurrentWeatherData>;
  unit: Unit;
  onRetry: () => void;
}

export default function CurrentWeather({ city, state, unit, onRetry }: CurrentWeatherProps) {
  if (city === null || state.status === 'idle') return null;
  if (state.status === 'loading')
    return (
      <p className="text-slate-200" role="status">
        Carregando clima…
      </p>
    );
  if (state.status === 'error')
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-300/30 bg-red-950/30 p-4 text-red-100"
      >
        <span>Não foi possível carregar o clima. Tente novamente.</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg px-3 py-2 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  if (state.status === 'unavailable')
    return (
      <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
        Clima indisponível para este local.
      </p>
    );
  if (state.status !== 'success' && state.status !== 'partial') return null;

  const data = state.data;
  const time = formatTime(data.referenceTime);
  return (
    <article
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-7"
      aria-labelledby="current-heading"
    >
      <p className="text-sm font-medium uppercase tracking-wide text-accent-400">
        Clima atual estimado
      </p>
      <h2 id="current-heading" className="mt-2 text-xl font-semibold text-white">
        {city.name}, {city.country}
      </h2>
      <p className="mt-5 text-5xl font-bold tracking-tight text-white sm:text-6xl">
        {formatTemperature(data.temperatureC, unit)}{' '}
        <span className="text-2xl text-slate-200">{getUnitSymbol(unit)}</span>
      </p>
      <p className="mt-3 text-lg text-slate-100">{data.conditionPtBr ?? 'Indisponível'}</p>
      <p className="mt-4 text-sm text-slate-300">
        {time === null ? 'Horário de referência indisponível' : `Estimativa do modelo para ${time}`}
      </p>
    </article>
  );
}
