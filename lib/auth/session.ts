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

export const requireAdmin = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("profiles")
    .select("role").eq("id", user.id).single();
  if (error || data?.role !== "admin") redirect("/map");
  return { supabase, user };
});
