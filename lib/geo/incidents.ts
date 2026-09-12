import type { FeatureCollection, Point } from "geojson";
import type { IncidentSummary } from "../../types/incidents.ts";
import { parsePoint } from "../incidents/parse.ts";

export function incidentsToGeoJSON(incidents: IncidentSummary[]): FeatureCollection<Point, Omit<IncidentSummary, "geometry">> {
  return {
    type: "FeatureCollection",
    features: incidents.map(({ geometry, ...properties }) => ({
      type: "Feature", id: properties.id, geometry: parsePoint(geometry), properties,
    })),
  };
}
