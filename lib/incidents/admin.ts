import "server-only";
import { requireAdmin } from "@/lib/auth/session";

export async function listAdminIncidents() {
  // Guard the data function as well as the route: layouts are not a security boundary.
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.from("incidents")
    .select("id,title,status,owner_id,updated_at,owner:profiles!incidents_owner_id_fkey(display_name)")
    .is("deleted_at", null).order("updated_at", { ascending: false });
  if (error) throw new Error("The admin incident list could not be loaded. Please try again.");
  return { incidents: data, currentUserId: user.id };
}
