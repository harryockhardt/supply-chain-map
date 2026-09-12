import "server-only";
import { createClient } from "@/lib/supabase/server";
export async function getIncidentChoices() {
 const client = await createClient();
 const results = await Promise.all([
  client.from("incident_categories").select("slug,label").eq("is_active",true).order("sort_order"),
  client.from("transport_modes").select("slug,label").eq("is_active",true).order("sort_order"),
  client.from("effect_types").select("slug,label").eq("is_active",true).order("sort_order"),
 ]);
 if (results.some(r => r.error)) throw new Error("Incident choices could not load.");
 return { categories:results[0].data!, modes:results[1].data!, effects:results[2].data! };
}
