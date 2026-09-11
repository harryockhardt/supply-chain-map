import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireUser();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <p className="font-semibold">Supply Chain Disruption Map</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="break-all text-sm text-slate-600">{user.email}</span>
          <form action={signOut}><button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">Sign out</button></form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
