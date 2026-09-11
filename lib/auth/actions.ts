"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateCredentials } from "./validation";

export type AuthState = { error?: string; message?: string };

export async function signIn(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const invalid = validateCredentials(email, password, false);
  if (invalid) return { error: invalid };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") return { error: "Confirm your email before signing in." };
      if (error.status === 429) return { error: "Too many attempts. Please wait a few minutes and try again." };
      return { error: "Unable to sign in. Check your email and password and try again." };
    }
  } catch {
    return { error: "We couldn't connect. Please try again shortly." };
  }
  revalidatePath("/", "layout");
  redirect("/map");
}

export async function signUp(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const invalid = validateCredentials(email, password, true);
  if (invalid) return { error: invalid };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return { error: "Account creation is not configured yet." };
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: new URL("/auth/callback", appUrl).toString() },
    });
    if (error) {
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return { error: "Email requests are temporarily limited. Please wait and try again." };
      }
      return { error: "We couldn't create your account. Please try again shortly, or sign in if you already have one." };
    }
    signedIn = Boolean(data.session);
  } catch {
    return { error: "We couldn't connect. Please try again shortly." };
  }
  if (signedIn) {
    revalidatePath("/", "layout");
    redirect("/map");
  }
  return { message: "Check your email for a confirmation link. Open it in this browser, then sign in. If you already have an account, sign in instead." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/map?signout=failed");
  revalidatePath("/", "layout");
  redirect("/login");
}
