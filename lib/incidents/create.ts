"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { validateCreateIncident } from "./create-validation";
export type CreateState = { error?: string };
export async function saveIncident(value: unknown): Promise<CreateState> {
 const { supabase } = await requireUser();
 let payload;
 try { payload = validateCreateIncident(value); }
 catch(error) { return {error:error instanceof Error ? error.message : "Check the incident form."}; }
 const {data,error} = await supabase.rpc("create_incident",{payload});
 if (error) {
  console.error("Incident save failed",error.code);
  return {error:["23514","23503","23502","22P02","22007"].includes(error.code)
   ? "Check the required fields and selected options. Nothing was saved."
   : "We could not confirm the save. Check your connection and the map before retrying."};
 }
 revalidatePath("/map");
 redirect("/map?created=" + encodeURIComponent(data));
}
