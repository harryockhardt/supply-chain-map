import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});

// React cache is scoped to this server request, not shared between sessions.
export const requireActor = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("profiles")
    .select("role").eq("id", user.id).single();
  if (error || !data) throw new Error("Your permissions could not be checked. Please try again.");
  return { supabase, user, isAdmin: data.role === "admin" };
});

export const requireAdmin = cache(async () => {
  const actor = await requireActor();
  if (!actor.isAdmin) redirect("/map?error=admin-required");
  return actor;
});
