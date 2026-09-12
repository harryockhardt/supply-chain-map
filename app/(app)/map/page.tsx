import { requireUser } from "@/lib/auth/session";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { listVisibleIncidents } from "@/lib/incidents/read";
import { getIncidentChoices } from "@/lib/incidents/lookups";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ signout?: string; created?:string }> }) {
  await requireUser();
  const { signout,created } = await searchParams;
  const [incidents,choices] = await Promise.all([listVisibleIncidents(),getIncidentChoices()]);
  return <><MapWorkspace key={created || "map"} incidents={incidents} choices={choices} created={created} />
    {signout === "failed" && <p role="alert" className="mb-6 text-red-800">Sign out did not finish. Please try again.</p>}
  </>;
}
