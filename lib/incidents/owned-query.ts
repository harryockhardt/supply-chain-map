import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// The caller supplies the verified session user, never an owner from the URL.
// Keep this filter even for admins: My Incidents always means records I created.
export function ownedIncidentQuery(supabase: SupabaseClient<Database>, userId: string) {
  if (!userId) throw new Error("A signed-in user is required.");
  return supabase.from("incidents").select("id,title,status,updated_at")
    .eq("owner_id", userId).is("deleted_at", null)
    .order("updated_at", { ascending: false });
}
