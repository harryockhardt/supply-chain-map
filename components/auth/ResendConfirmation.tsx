"use client";
import { useActionState } from "react";
import { resendConfirmation, type AuthState } from "@/lib/auth/actions";

export function ResendConfirmation() {
  const [state, action, pending] = useActionState<AuthState, FormData>(resendConfirmation, {});
  return <details className="mt-6 border-t pt-4">
    <summary className="cursor-pointer text-sm underline">Didn’t receive your confirmation email?</summary>
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">Account email address
        <input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <button disabled={pending} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{pending ? "Requesting…" : "Resend confirmation email"}</button>
      {state.error && <p role="alert" className="text-sm text-red-800">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-green-900">{state.message}</p>}
    </form>
  </details>;
}
