import Link from "next/link";
import {listMyIncidents} from "@/lib/incidents/read";
export default async function MyIncidentsPage({searchParams}:{searchParams:Promise<{removed?:string}>}) {
 const incidents=await listMyIncidents();
 const {removed}=await searchParams;
 return <section className="min-h-0 flex-1 overflow-y-auto p-6"><div className="mx-auto max-w-3xl">
  <h1 className="text-3xl font-semibold">My Incidents</h1>
  <p className="mt-2 text-slate-600">View and manage the incidents you created.</p>
  {removed==="1"&&<p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">Incident removed.</p>}
  {incidents.length===0?<p className="mt-6">You have no incidents yet. <Link href="/map" className="underline">Add an incident on the map.</Link></p>:<ul className="mt-6 space-y-4">{incidents.map(i=><li key={i.id} className="rounded border bg-white p-4">
   <Link className="break-words text-lg font-semibold underline" href={`/incidents/${i.id}`}>{i.title}</Link>
   <p className="mt-2 capitalize">{i.status}</p>
   <Link className="mt-3 inline-block underline" href={`/incidents/${i.id}/edit`}>Edit incident</Link>
  </li>)}</ul>}
 </div></section>;
}
