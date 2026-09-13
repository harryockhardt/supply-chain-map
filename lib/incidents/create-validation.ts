import { parsePoint, safeSourceUrl } from "./parse.ts";
import type { IncidentStatus, Severity } from "../../types/incidents.ts";
export type CreateIncidentInput = {
 title: string; category_slug: string; description: string;
 geometry: { type: "Point"; coordinates: [number, number] };
 event_start_at: string; status: IncidentStatus; current_state_description: string;
 last_verified_at: string; resolved_at: string | null; severity: Severity;
 impact_description: string; modes: string[]; effects: string[];
 sources: { id?: string; source_name: string; url: string; published_at: string | null }[];
};
export function validateCreateIncident(value: unknown): CreateIncidentInput {
 if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Complete the incident form.");
 const r = value as Record<string, unknown>;
 const required = (key: string, label: string) => {
  if (typeof r[key] !== "string" || !r[key].trim()) throw new Error(label + " is required.");
  return r[key].trim();
 };
 const date = (value: unknown, label: string, optional = false): string | null => {
  if (optional && (value === "" || value == null)) return null;
  if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error(label + " must be a valid date and time.");
  return new Date(value).toISOString();
 };
 const choices = (key: string, label: string) => {
  const items = r[key];
  if (!Array.isArray(items) || items.length === 0 || items.some(x => typeof x !== "string" || !x.trim())) throw new Error("Select at least one " + label + ".");
  return [...new Set(items as string[])];
 };
 let geometry;
 try { geometry = parsePoint(r.geometry); } catch { throw new Error("Place one valid point on the map."); }
 const status = required("status","Status");
 if (!["upcoming","active","resolved","unverified"].includes(status)) throw new Error("Choose a valid status.");
 const severity = r.severity;
 if (typeof severity !== "number" || !Number.isInteger(severity) || severity < 1 || severity > 5) throw new Error("Severity must be a whole number from 1 to 5.");
 if (!Array.isArray(r.sources)) throw new Error("Check the sources.");
 const sources = r.sources.map((value: unknown) => {
  if (!value || typeof value !== "object") throw new Error("Check the sources.");
  const s = value as Record<string, unknown>;
  if (typeof s.source_name !== "string" || !s.source_name.trim()) throw new Error("Each source needs a name.");
  if (typeof s.url !== "string" || !safeSourceUrl(s.url.trim())) throw new Error("Each source needs a valid HTTP or HTTPS link.");
  if (s.id !== undefined && (typeof s.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id))) throw new Error("Invalid source. Reload the incident.");
  return { ...(typeof s.id === "string" ? {id:s.id} : {}), source_name:s.source_name.trim(), url:s.url.trim(), published_at:date(s.published_at,"Source publication time",true) };
 });
 if (status !== "unverified" && !sources.length) throw new Error("Active, Upcoming and Resolved incidents require at least one source.");
 return {
  title:required("title","Title"),category_slug:required("category_slug","Category"),description:required("description","Event description"),
  geometry:{type:"Point",coordinates:geometry.coordinates as [number,number]},
  status:status as IncidentStatus,severity:severity as Severity,
  event_start_at:date(r.event_start_at,"Event time")!,last_verified_at:date(r.last_verified_at,"Last verified time")!,
  resolved_at:date(r.resolved_at,"Resolution time",true),
  current_state_description:required("current_state_description","Current state"),
  impact_description:required("impact_description","Supply-chain impact"),
  modes:choices("modes","transport mode"),effects:choices("effects","effect"),sources
 };
}
