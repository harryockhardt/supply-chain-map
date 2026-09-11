import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string; error?: string }> }) {
  const { code, error } = await searchParams;
  // Supabase may fall back to its configured Site URL for email confirmation.
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  if (error) redirect("/login?error=confirmation");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  redirect(data.user ? "/map" : "/login");
}
