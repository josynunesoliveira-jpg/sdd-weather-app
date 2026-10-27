import { formatDate } from '../lib/format';
import { formatTemperature, getUnitSymbol } from '../lib/temperature';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const noMetrics =
    day.temperatureMinC === null && day.temperatureMaxC === null && day.conditionPtBr === null;
  return (
    <article
      className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
      aria-label={`Previsão para ${formatDate(day.date)}`}
    >
      <h3 className="font-semibold text-white">{formatDate(day.date)}</h3>
      {noMetrics ? (
        <p className="mt-3 text-sm text-slate-200">Sem dados</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-slate-100">
          <p>
            Mín.: {formatTemperature(day.temperatureMinC, unit)} {getUnitSymbol(unit)}
          </p>
          <p>
            Máx.: {formatTemperature(day.temperatureMaxC, unit)} {getUnitSymbol(unit)}
          </p>
          <p className="break-words">{day.conditionPtBr ?? 'Indisponível'}</p>
        </div>
      )}
    </article>
  );
}
