import {RemoveIncident} from "@/components/incidents/RemoveIncident";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { getIncident } from "@/lib/incidents/read";
import { canManageIncident } from "@/lib/incidents/permissions";
import { safeSourceUrl } from "@/lib/incidents/parse";

function time(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC";
}
export default async function IncidentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams:Promise<{updated?:string}> }) {
  const actor = await requireActor();
  const { user, isAdmin } = actor;
  const { id } = await params;
  const incident = await getIncident(id);
  if (!incident) notFound();
  const {updated}=await searchParams;
  const severity = ["", "Low", "Moderate", "Significant", "Severe", "Critical"][incident.severity];
  return <article className="min-h-0 flex-1 overflow-y-auto p-6">
    <div className="mx-auto max-w-3xl">
      <Link className="text-sm underline" href="/map">← Back to map</Link>
      {isAdmin && <Link className="ml-4 text-sm underline" href="/admin">All incidents (Admin)</Link>}
      <p className="mt-6 text-sm text-slate-600">{incident.category_label}</p>
      <h1 className="mt-1 text-3xl font-semibold">{incident.title}</h1>
      <p className="mt-3 capitalize">{incident.status} · Severity {incident.severity}: {severity}</p>
      {updated==="1"&&<p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">Changes saved.</p>}
      {canManageIncident(actor,incident.owner_id)&&<div className="mt-5 flex flex-wrap items-center gap-4"><Link className="rounded bg-slate-900 px-4 py-2 text-white" href={`/incidents/${id}/edit`}>Edit incident</Link><RemoveIncident id={id} title={incident.title}/></div>}
      <dl className="mt-6 grid gap-5">
        {[
          ["What happened", incident.description],
          ["Current state", incident.current_state_description],
          ["Supply-chain impact", incident.impact_description],
          ["Transport modes", incident.transport_modes.map(m => m.label).join(", ")],
          ["Effects", incident.effects.map(e => e.label).join(", ")],
          ["Location", "Latitude " + incident.geometry.coordinates[1] + ", longitude " + incident.geometry.coordinates[0]],
          ["Event started", time(incident.event_start_at)],
          ["Last verified", time(incident.last_verified_at)],
          ...(incident.resolved_at ? [["Resolved", time(incident.resolved_at)]] : []),
          ["Created by", incident.owner_id === user.id ? "You" : isAdmin ? `Contributor · ${incident.owner_id}` : "Community contributor"],
          ["Created", time(incident.created_at)],
          ["Updated", time(incident.updated_at)],
        ].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-700">{value}</dd></div>)}
      </dl>
      <h2 className="mt-6 font-semibold">Sources</h2>
      {incident.sources.length === 0 ? <p className="mt-1 text-slate-600">No sources supplied. This incident is unverified.</p> :
        <ul className="mt-2 space-y-3">{incident.sources.map(source => {
          const url = safeSourceUrl(source.url);
          return <li key={source.id}>{url ? <a className="break-words underline" href={url} target="_blank" rel="noopener noreferrer">{source.source_name}</a> : <span>{source.source_name} (link unavailable)</span>}
            {source.published_at && <p className="text-sm text-slate-600">Published {time(source.published_at)}</p>}</li>;
        })}</ul>}
    </div>
  </article>;
}
