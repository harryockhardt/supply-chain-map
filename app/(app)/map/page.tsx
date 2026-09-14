import { requireUser } from "@/lib/auth/session";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { listVisibleIncidents } from "@/lib/incidents/read";
import { getIncidentChoices } from "@/lib/incidents/lookups";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ signout?: string; created?:string; error?:string }> }) {
  await requireUser();
  const { signout,created,error } = await searchParams;
  const [incidents,choices] = await Promise.all([listVisibleIncidents(),getIncidentChoices()]);
  return <>{error === "admin-required" && <p role="alert" className="bg-red-50 p-4 text-red-800">Access denied. The Admin view is available only to administrators.</p>}<MapWorkspace key={created || "map"} incidents={incidents} choices={choices} created={created} />
    {signout === "failed" && <p role="alert" className="mb-6 text-red-800">Sign out did not finish. Please try again.</p>}
  </>;
}
