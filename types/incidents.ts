import type { Point } from "geojson";

export type IncidentStatus = "upcoming" | "active" | "resolved" | "unverified";
export type Severity = 1 | 2 | 3 | 4 | 5;
export type Lookup = { slug: string; label: string };
export type IncidentSource = { id: string; source_name: string; url: string; published_at: string | null };
export type IncidentSummary = {
  id: string; title: string; category_slug: string; category_label: string;
  status: IncidentStatus; severity: Severity; geometry: Point;
};
export type Incident = IncidentSummary & {
  owner_id: string; description: string; event_start_at: string;
  current_state_description: string; last_verified_at: string;
  resolved_at: string | null; impact_description: string;
  created_at: string; updated_at: string;
  transport_modes: Lookup[]; effects: Lookup[]; sources: IncidentSource[];
};
