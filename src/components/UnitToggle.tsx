import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <fieldset className="flex w-fit items-center gap-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white">
      <legend className="px-1 text-sm font-medium text-slate-200">Unidade de temperatura</legend>
      <label className="flex cursor-pointer items-center gap-2 rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-accent-400">
        <input
          type="radio"
          name="temperature-unit"
          value="celsius"
          checked={unit === 'celsius'}
          onChange={() => onChange('celsius')}
        />
        Celsius (°C)
      </label>
      <label className="flex cursor-pointer items-center gap-2 rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-accent-400">
        <input
          type="radio"
          name="temperature-unit"
          value="fahrenheit"
          checked={unit === 'fahrenheit'}
          onChange={() => onChange('fahrenheit')}
        />
        Fahrenheit (°F)
      </label>
    </fieldset>
  );
}
