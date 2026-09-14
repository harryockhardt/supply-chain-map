"use client";
import { useCallback, useMemo, useState } from "react";
import type { IncidentSummary } from "@/types/incidents";
import { IncidentForm, type IncidentChoices } from "@/components/incidents/IncidentForm";
import { StatusFilters } from "@/components/filters/StatusFilters";
import { DEFAULT_INCIDENT_FILTERS, filterIncidents, toggleIncidentStatus } from "@/lib/incidents/filters";
import type { IncidentStatus } from "@/types/incidents";
import { WorldMap } from "./WorldMap";
import { categoryColor } from "./category-style";

export function MapWorkspace({ incidents, choices, created }: { incidents: IncidentSummary[]; choices: IncidentChoices; created?: string }) {
  const [filters, setFilters] = useState(DEFAULT_INCIDENT_FILTERS);
  const visibleIncidents = useMemo(() => filterIncidents(incidents, filters), [incidents, filters]);
  const toggleStatus = (status: IncidentStatus) => setFilters(current => toggleIncidentStatus(current, status));
  const [placing, setPlacing] = useState(false);
  const [point, setPoint] = useState<[number,number] | null>(null);
  const pick = useCallback((point:[number,number]) => { setPoint(point); setPlacing(false); }, []);
  const categories = [...new Map(visibleIncidents.map(i => [i.category_slug, i.category_label])).entries()];
  return <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6 md:block">
      <h1 className="text-xl font-semibold">Disruption map</h1>
      <p className="mt-2 text-sm text-slate-600">Select a marker to read the incident.</p>
      <p className="mt-4 text-sm">{visibleIncidents.length} of {incidents.length} incidents shown</p>
      {categories.length > 0 && <><h2 className="mt-6 text-sm font-semibold">Categories on the map</h2><ul className="mt-2 space-y-2">{categories.map(([slug, label]) =>
        <li className="flex items-center gap-2 text-sm" key={slug}><span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{backgroundColor: categoryColor(slug)}} />{label}</li>)}</ul></>}
      <div className="mt-8"><StatusFilters filters={filters} onToggle={toggleStatus} /></div>
    </aside>
    <details className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 md:hidden">
      <summary className="cursor-pointer text-sm font-semibold">Status filters · {visibleIncidents.length} of {incidents.length} shown</summary>
      <StatusFilters filters={filters} onToggle={toggleStatus} />
    </details>
    <div className="relative flex min-h-0 flex-1">
    <WorldMap incidents={visibleIncidents} placing={placing} onPick={pick} point={point} focus={incidents.find(i=>i.id===created)} />
    {!placing && !point && <button className="absolute left-4 top-4 z-10 rounded bg-slate-900 px-4 py-2 text-white shadow" onClick={()=>setPlacing(true)}>+ Add incident</button>}
    {placing && <div role="status" className="absolute left-4 right-14 top-4 z-10 rounded bg-white p-3 shadow">Click or tap the map to place one point. <button className="ml-2 underline" onClick={()=>setPlacing(false)}>Cancel placement</button></div>}
    {point && <div className={placing?"hidden":"contents"}><IncidentForm point={point} choices={choices} onChangePoint={()=>setPlacing(true)} onCancel={()=>setPoint(null)} /></div>}
    {created && !point && !placing && incidents.some(i=>i.id===created) && visibleIncidents.length > 0 && <p role="status" className="absolute bottom-10 left-4 rounded bg-white p-3 shadow">Incident saved. {visibleIncidents.some(i=>i.id===created) ? "Select its marker to read it." : "Its status is hidden by your filters."}</p>}
    {incidents.length > 0 && visibleIncidents.length === 0 && <p role="status" className="absolute bottom-10 left-4 right-14 rounded bg-white p-3 text-sm shadow">No incidents match the selected statuses. Enable a status to show matching incidents.</p>}
    {incidents.length === 0 && <p className="absolute bottom-10 left-4 right-14 rounded bg-white p-3 text-sm shadow">No incidents have been saved yet.</p>}
    </div>
  </div>;
}
