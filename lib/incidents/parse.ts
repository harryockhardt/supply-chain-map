import type { Incident, IncidentStatus, Lookup, Severity } from "../../types/incidents.ts";
import type { Point } from "geojson";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid incident object");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid incident text");
  return value;
}
function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Invalid incident collection");
  return value;
}
function lookup(value: unknown): Lookup {
  const row = object(value);
  return { slug: text(row.slug), label: text(row.label) };
}
export function parsePoint(value: unknown): Point {
  const row = object(value);
  const coordinates = array(row.coordinates);
  if (row.type !== "Point" || coordinates.length !== 2) throw new Error("Unsupported incident geometry");
  const [lng, lat] = coordinates;
  if (typeof lng !== "number" || typeof lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat) ||
      Math.abs(lng) > 180 || Math.abs(lat) > 90) throw new Error("Invalid incident coordinates");
  return { type: "Point", coordinates: [lng, lat] };
}
export function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function parseIncidents(value: unknown): Incident[] {
  return array(value).map((item) => {
    const r = object(item);
    const status = text(r.status);
    if (!["upcoming", "active", "resolved", "unverified"].includes(status)) throw new Error("Invalid incident status");
    if (typeof r.severity !== "number" || !Number.isInteger(r.severity) || r.severity < 1 || r.severity > 5) throw new Error("Invalid severity");
    return {
      id: text(r.id), title: text(r.title), category_slug: text(r.category_slug), category_label: text(r.category_label),
      status: status as IncidentStatus, severity: r.severity as Severity, geometry: parsePoint(r.geometry),
      owner_id: text(r.owner_id), description: text(r.description), event_start_at: text(r.event_start_at),
      current_state_description: text(r.current_state_description), last_verified_at: text(r.last_verified_at),
      resolved_at: nullableText(r.resolved_at), impact_description: text(r.impact_description),
      created_at: text(r.created_at), updated_at: text(r.updated_at),
      transport_modes: array(r.transport_modes).map(lookup), effects: array(r.effects).map(lookup),
      sources: array(r.sources).map((item) => {
        const s = object(item);
        return { id: text(s.id), source_name: text(s.source_name), url: text(s.url), published_at: nullableText(s.published_at) };
      }),
    };
  });
}
