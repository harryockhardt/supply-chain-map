"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { validateCreateIncident } from "./create-validation";
import { getIncident } from "./read";
import type { CreateState } from "./create";

function refreshIncident(id:string) {
 revalidatePath("/map"); revalidatePath("/my-incidents");
 revalidatePath(`/incidents/${id}`); revalidatePath(`/incidents/${id}/edit`);
}
export async function updateIncident(id:string, version:string, value:unknown):Promise<CreateState> {
 const {supabase,user}=await requireUser();
 const incident=await getIncident(id);
 if (!incident || incident.owner_id!==user.id) return {error:"This incident is unavailable or you do not have permission to edit it."};
 let payload;
 try {payload=validateCreateIncident(value);} catch(error) {return {error:error instanceof Error?error.message:"Check the form."};}
 const {error}=await supabase.rpc("update_incident",{target_id:id,expected_updated_at:version,payload});
 if(error) {
  if(error.code==="40001") return {error:"This incident has changed since you opened it. Copy any unsaved changes, then reload to review the latest version."};
  if(error.code==="42501") return {error:"This incident is unavailable or you do not have permission to edit it."};
  return {error:["23514","23503","23502","22P02","22007"].includes(error.code)?"Check the required fields, options and sources. Nothing was changed.":"We could not confirm the update. Check your connection and reload the incident before retrying."};
 }
 refreshIncident(id); redirect(`/incidents/${id}?updated=1`);
}
export async function removeOwnedIncident(id:string):Promise<CreateState> {
 const {supabase,user}=await requireUser();
 const incident=await getIncident(id);
 if(!incident || incident.owner_id!==user.id) return {error:"This incident is unavailable or you do not have permission to remove it."};
 const {error}=await supabase.rpc("remove_incident",{target_id:id});
 if(error) return {error:error.code==="42501"?"This incident is unavailable or you do not have permission to remove it.":"We could not confirm removal. Check My Incidents before retrying."};
 refreshIncident(id); redirect("/my-incidents?removed=1");
}
