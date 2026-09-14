import { STATUS_OPTIONS, type IncidentFilters } from "@/lib/incidents/filters";
import type { IncidentStatus } from "@/types/incidents";

export function StatusFilters({ filters, onToggle }: {
  filters: IncidentFilters; onToggle: (status: IncidentStatus) => void;
}) {
  return <fieldset>
    <legend className="text-sm font-semibold">Incident status</legend>
    <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-1">
      {STATUS_OPTIONS.map(({ value, label }) => <label key={value} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-slate-900" checked={filters.statuses.includes(value)} onChange={() => onToggle(value)} />
        {label}
      </label>)}
    </div>
  </fieldset>;
}
