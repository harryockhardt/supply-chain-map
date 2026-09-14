import Link from "next/link";
import {notFound} from "next/navigation";
import {requireActor} from "@/lib/auth/session";
import {getIncident} from "@/lib/incidents/read";
import {getIncidentChoices} from "@/lib/incidents/lookups";
import {EditIncidentWorkspace} from "@/components/incidents/EditIncidentWorkspace";
import {canManageIncident} from "@/lib/incidents/permissions";
import type {Lookup} from "@/types/incidents";
export default async function EditIncidentPage({params}:{params:Promise<{id:string}>}) {
 const actor=await requireActor();
 const {id}=await params;
 const incident=await getIncident(id);
 if(!incident)notFound();
 if(!canManageIncident(actor,incident.owner_id))return <section className="p-6"><h1 className="text-2xl font-semibold">You can only edit your own incidents</h1><Link className="mt-4 inline-block underline" href={`/incidents/${id}`}>Back to incident</Link></section>;
 const choices=await getIncidentChoices();
 // Retain existing inactive lookup values when editing an older incident.
 const include=(active:Lookup[],selected:Lookup[])=>[...active,...selected.filter(s=>!active.some(a=>a.slug===s.slug))];
 return <EditIncidentWorkspace key={incident.id+incident.updated_at} incident={incident} choices={{categories:include(choices.categories,[{slug:incident.category_slug,label:incident.category_label}]),modes:include(choices.modes,incident.transport_modes),effects:include(choices.effects,incident.effects)}}/>;
}
