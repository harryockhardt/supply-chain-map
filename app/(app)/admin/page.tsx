import Link from "next/link";
import { listAdminIncidents } from "@/lib/incidents/admin";
import { RemoveIncident } from "@/components/incidents/RemoveIncident";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ removed?: string }> }) {
  const { incidents, currentUserId } = await listAdminIncidents();
  const { removed } = await searchParams;
  return <section className="min-h-0 flex-1 overflow-y-auto p-6"><div className="mx-auto max-w-4xl">
    <h1 className="text-3xl font-semibold">Admin · All incidents</h1>
    <p className="mt-2 text-slate-600">Review and manage incidents from every contributor.</p>
    {removed === "1" && <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">Incident removed.</p>}
    <p className="mt-4 text-sm">{incidents.length} {incidents.length === 1 ? "incident" : "incidents"}</p>
    {incidents.length === 0 ? <p className="mt-6">No incidents have been saved yet.</p> : <ul className="mt-6 space-y-4">
      {incidents.map(incident => <li key={incident.id} className="rounded border bg-white p-4">
        <Link className="break-words text-lg font-semibold underline" href={`/incidents/${incident.id}`}>{incident.title}</Link>
        <p className="mt-2 capitalize">{incident.status}</p>
        <p className="mt-2 break-words text-sm text-slate-700">Created by: {incident.owner_id === currentUserId ? "You" : incident.owner?.display_name?.trim() || "Contributor"}</p>
        <p className="mt-1 break-all text-xs text-slate-500">Contributor ID: {incident.owner_id}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Link className="underline" href={`/incidents/${incident.id}/edit`}>Edit incident</Link>
          <RemoveIncident id={incident.id} title={incident.title} />
        </div>
      </li>)}
    </ul>}
  </div></section>;
}
