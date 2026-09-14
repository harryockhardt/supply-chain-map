import type { IncidentStatus, IncidentSummary } from "@/types/incidents";

export const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "unverified", label: "Unverified" },
] as const;

export type IncidentFilters = { statuses: readonly IncidentStatus[] };
export const DEFAULT_INCIDENT_FILTERS: IncidentFilters = {
  statuses: STATUS_OPTIONS.map(({ value }) => value),
};

// Add future dimensions here; renderers only receive the matching incidents.
export function filterIncidents<T extends Pick<IncidentSummary, "status">>(
  incidents: readonly T[], filters: IncidentFilters,
): T[] {
  return incidents.filter(incident => filters.statuses.includes(incident.status));
}

export function toggleIncidentStatus(filters: IncidentFilters, status: IncidentStatus): IncidentFilters {
  return { ...filters, statuses: filters.statuses.includes(status)
    ? filters.statuses.filter(value => value !== status)
    : [...filters.statuses, status] };
}
