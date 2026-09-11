import { requireUser } from "@/lib/auth/session";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ signout?: string }> }) {
  await requireUser();
  const { signout } = await searchParams;
  return <section>
    {signout === "failed" && <p role="alert" className="mb-6 text-red-800">Sign out did not finish. Please try again.</p>}
    <h1 className="text-2xl font-semibold">You’re signed in</h1>
    <p className="mt-3 text-slate-600">Your map will appear here.</p>
  </section>;
}
