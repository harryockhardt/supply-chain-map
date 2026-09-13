"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/lib/auth/actions";
import { ResendConfirmation } from "./ResendConfirmation";

export function AuthForm({ mode, initialError, canonicalUrl }: { mode: "login" | "signup"; initialError?: string; canonicalUrl?: string }) {
  const signup = mode === "signup";
  const [state, action, pending] = useActionState<AuthState, FormData>(signup ? signUp : signIn, {});
  if (canonicalUrl) return <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-semibold">Continue to the app</h1>
    <p className="mt-3">Use the app’s main address so your confirmation link opens correctly.</p>
    <a className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-3 text-white" href={canonicalUrl}>Continue</a>
  </section>;
  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="mb-6 text-sm font-medium text-slate-600">Supply Chain Disruption Map</p>
      <h1 className="text-2xl font-semibold tracking-tight">{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {signup ? "Join to view and contribute supply-chain disruption records." : "Sign in to access your workspace."}
      </p>
      <form action={action} className="mt-7 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200" />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"}
            required minLength={signup ? 8 : undefined} maxLength={128}
            aria-describedby={signup ? "password-hint" : undefined}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200" />
          {signup && <p id="password-hint" className="mt-2 text-xs text-slate-600">At least 8 characters.</p>}
        </div>
        {(state.error || initialError) && !state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error || initialError}</p>}
        {state.message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm leading-6 text-green-900">{state.message}</p>}
        <button disabled={pending} className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">
          {pending ? "Please wait…" : signup ? "Create account" : "Sign in"}
        </button>
      </form>
      <ResendConfirmation />
      <p className="mt-6 text-center text-sm text-slate-600">
        {signup ? "Already have an account? " : "New here? "}
        <Link className="font-medium text-slate-900 underline underline-offset-4" href={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
