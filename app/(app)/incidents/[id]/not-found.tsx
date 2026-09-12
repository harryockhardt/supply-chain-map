import Link from "next/link";
export default function IncidentNotFound() {
  return <section className="p-6"><h1 className="text-2xl font-semibold">Incident not found</h1><p className="mt-2">This incident is unavailable or has been removed.</p><Link className="mt-4 inline-block underline" href="/map">Back to map</Link></section>;
}
