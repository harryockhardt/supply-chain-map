"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateCredentials } from "./validation";
import { appOrigin } from "./urls";
import { authFailureDiagnostic, signupFailure } from "./errors";

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
  let appUrl: string;
  try { appUrl = appOrigin(process.env.NEXT_PUBLIC_APP_URL); }
  catch { return { error: "Account creation is not configured yet." }; }
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: new URL("/auth/callback", appUrl).toString() },
    });
    if (error) {
      const failure = signupFailure(error);
      console.error("Signup failed", authFailureDiagnostic(error, failure.category));
      return { error: failure.error };
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

export async function resendConfirmation(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup", email,
      options: { emailRedirectTo: new URL("/auth/callback", appOrigin(process.env.NEXT_PUBLIC_APP_URL)).toString() },
    });
    if (error) {
      console.error("Confirmation resend failed", authFailureDiagnostic(error, signupFailure(error).category));
      if (error.status === 429 || error.code === "over_email_send_rate_limit") return { error: "Email requests are temporarily limited. Wait at least a minute before trying again." };
      return { error: "The confirmation email could not be sent. Please try later or contact the project owner." };
    }
    return { message: "If this address has an account awaiting confirmation, a new link has been requested. Check your inbox and spam folder, and use the newest link. Already confirmed? Sign in below." };
  } catch {
    return { error: "We couldn't request a confirmation email. Please try again shortly." };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/map?signout=failed");
  revalidatePath("/", "layout");
  redirect("/login");
}
