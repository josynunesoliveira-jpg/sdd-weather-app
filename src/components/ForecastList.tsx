import type { ForecastDay, LoadState, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

type Forecast = [ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay];

interface ForecastListProps {
  state: LoadState<Forecast>;
  hasCity: boolean;
  unit: Unit;
  onRetry: () => void;
}

export default function ForecastList({ state, hasCity, unit, onRetry }: ForecastListProps) {
  if (!hasCity || state.status === 'idle') return null;
  if (state.status === 'loading')
    return (
      <p className="text-slate-200" role="status">
        Carregando previsão…
      </p>
    );
  if (state.status === 'error')
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-300/30 bg-red-950/30 p-4 text-red-100"
      >
        <span>Não foi possível carregar a previsão. Tente novamente.</span>
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
    return <p className="text-slate-200">Previsão indisponível.</p>;
  if (state.status !== 'success' && state.status !== 'partial') return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {state.data.map((day) => (
        <ForecastCard key={day.date} day={day} unit={unit} />
      ))}
    </div>
  );
}
