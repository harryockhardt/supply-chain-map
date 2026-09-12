import type { IncidentSummary } from "@/types/incidents";
import { WorldMap } from "./WorldMap";
import { categoryColor } from "./category-style";

export function MapWorkspace({ incidents }: { incidents: IncidentSummary[] }) {
  const categories = [...new Map(incidents.map(i => [i.category_slug, i.category_label])).entries()];
  return <div className="relative flex min-h-0 flex-1">
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6 md:block">
      <h1 className="text-xl font-semibold">Disruption map</h1>
      <p className="mt-2 text-sm text-slate-600">Select a marker to read the incident.</p>
      <p className="mt-4 text-sm">{incidents.length} saved {incidents.length === 1 ? "incident" : "incidents"}</p>
      {categories.length > 0 && <><h2 className="mt-6 text-sm font-semibold">Categories on the map</h2><ul className="mt-2 space-y-2">{categories.map(([slug, label]) =>
        <li className="flex items-center gap-2 text-sm" key={slug}><span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{backgroundColor: categoryColor(slug)}} />{label}</li>)}</ul></>}
      <h2 className="mt-8 text-sm font-semibold">Incident status</h2>
      <p className="mt-2 text-sm text-slate-500">All statuses are shown. Status filters are not available yet.</p>
      <button disabled className="mt-8 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-500">+ Add incident</button>
    </aside>
    <WorldMap incidents={incidents} />
    {incidents.length === 0 && <p className="absolute bottom-10 left-4 right-14 rounded bg-white p-3 text-sm shadow md:left-76">No incidents have been saved yet.</p>}
  </div>;
}
