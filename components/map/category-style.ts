const colors: Record<string, string> = {
  "armed-conflict": "#991b1b", attack: "#e11d48", "airspace-restriction": "#7c3aed",
  "maritime-restriction": "#0369a1", "infrastructure-disruption": "#b45309",
  "border-restriction": "#4d7c0f", "labor-disruption": "#0f766e", "natural-disaster": "#c2410c",
  other: "#475569",
};
export function categoryColor(slug: string) { return colors[slug] ?? colors.other; }
