import { Marker, type Map } from "maplibre-gl";
import type { IncidentSummary } from "@/types/incidents";
import { incidentsToGeoJSON } from "@/lib/geo/incidents";
import { categoryColor } from "./category-style";

export function addIncidentMarkers(map: Map, incidents: IncidentSummary[]) {
  const markers = incidentsToGeoJSON(incidents).features.map((feature) => {
    const { id, title, category_slug, category_label, status } = feature.properties;
    const link = document.createElement("a");
    link.href = "/incidents/" + encodeURIComponent(id);
    link.className = "incident-marker";
    link.style.backgroundColor = categoryColor(category_slug);
    link.title = title + " · " + category_label;
    link.setAttribute("aria-label", "Open incident: " + title + " (" + category_label + ", " + status + ")");
    link.dataset.incidentId = id;
    link.dataset.longitude = String(feature.geometry.coordinates[0]);
    link.dataset.latitude = String(feature.geometry.coordinates[1]);
    return new Marker({ element: link }).setLngLat(feature.geometry.coordinates as [number, number]).addTo(map);
  });
  return () => markers.forEach((marker) => marker.remove());
}
