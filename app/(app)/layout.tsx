import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireUser();
  return (
    <div className="flex h-dvh min-h-[32rem] flex-col bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <p className="font-semibold">Supply Chain Disruption Map</p>
        <div className="flex flex-wrap items-center gap-4">
          <nav aria-label="Main navigation" className="flex gap-4 text-sm"><Link className="underline" href="/map">Map</Link><Link className="underline" href="/my-incidents">My Incidents</Link></nav>
          <span className="break-all text-sm text-slate-600">{user.email}</span>
          <form action={signOut}><button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">Sign out</button></form>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
