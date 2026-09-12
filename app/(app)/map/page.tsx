import { requireUser } from "@/lib/auth/session";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { listVisibleIncidents } from "@/lib/incidents/read";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ signout?: string }> }) {
  await requireUser();
  const { signout } = await searchParams;
  const incidents = await listVisibleIncidents();
  return <><MapWorkspace incidents={incidents} />
    {signout === "failed" && <p role="alert" className="mb-6 text-red-800">Sign out did not finish. Please try again.</p>}
  </>;
}
