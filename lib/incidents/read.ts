import "server-only";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseIncidents } from "./parse";
import type { IncidentSummary } from "@/types/incidents";

async function read(incidentId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("read_incidents", incidentId ? { incident_id: incidentId } : {});
  if (error) {
    console.error("Incident read failed", error.code);
    throw new Error("Incidents could not be loaded. Please try again.");
  }
  return parseIncidents(data);
}
export async function listVisibleIncidents(): Promise<IncidentSummary[]> {
  return (await read()).map(({ id, title, category_slug, category_label, status, severity, geometry }) =>
    ({ id, title, category_slug, category_label, status, severity, geometry }));
}
export async function getIncident(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  return (await read(id))[0] ?? null;
}

export async function listMyIncidents() {
 const {supabase,user}=await requireUser();
 const {data,error}=await supabase.from("incidents").select("id,title,status,updated_at")
  .eq("owner_id",user.id).is("deleted_at",null).order("updated_at",{ascending:false});
 if(error) throw new Error("Your incidents could not be loaded. Please try again.");
 return data;
}
