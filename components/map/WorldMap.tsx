"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { MAP_STYLE_URL, INITIAL_VIEW } from "@/lib/geo/map-config";
import type { IncidentSummary } from "@/types/incidents";

export function WorldMap({ incidents }: { incidents: IncidentSummary[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | undefined;
    let resize: ResizeObserver | undefined;
    let removeMarkers: (() => void) | undefined;
    const fail = (text: string) => {
      if (disposed) return;
      setMessage(text);
      setStatus("error");
    };
    const timeout = window.setTimeout(() => fail("The map is taking too long to load. Check your connection and retry."), 20000);
    const ready = () => {
      if (disposed) return;
      window.clearTimeout(timeout);
      setStatus("ready");
    };

    async function initialize() {
      try {
        const { Map, NavigationControl, setWorkerUrl } = await import("maplibre-gl");
        const { addIncidentMarkers } = await import("./incident-markers");
        if (disposed || !container.current) return;
        // Next.js must serve the worker and its sibling module from public/.
        setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        map = new Map({
          container: container.current,
          style: MAP_STYLE_URL,
          ...INITIAL_VIEW,
          attributionControl: { compact: false },
          dragRotate: false,
          pitchWithRotate: false,
          maxPitch: 0,
        });
        map.touchZoomRotate.disableRotation();
        removeMarkers = addIncidentMarkers(map, incidents);
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");
        map.getCanvas().setAttribute("aria-label", "World map. Use arrow keys to pan and plus or minus to zoom.");
        map.on("load", ready);
        map.on("idle", () => { if (map?.isStyleLoaded() && map.areTilesLoaded()) ready(); });
        map.on("error", (event) => {
          console.error("Map loading failed:", event.error);
          window.clearTimeout(timeout);
          fail("Some map data could not load. Check your connection and retry.");
        });
        map.on("webglcontextlost", () => fail("Your browser lost its map graphics connection. Retry to reload the map."));
        resize = new ResizeObserver(() => map?.resize());
        resize.observe(container.current);
      } catch (error) {
        console.error("Map initialization failed:", error);
        window.clearTimeout(timeout);
        fail("The map could not start. Check your connection and that your browser supports WebGL 2, then retry.");
      }
    }
    void initialize();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      resize?.disconnect();
      removeMarkers?.();
      map?.remove();
    };
  }, [incidents]);

  return (
    <section aria-label="Interactive world map" className="relative min-h-0 flex-1 overflow-hidden bg-slate-200">
      <div className="absolute inset-0">
        <div ref={container} data-testid="world-map" data-map-status={status} className="h-full w-full" />
      </div>
      {status === "loading" && <p role="status" className="absolute left-4 top-4 rounded bg-white px-3 py-2 text-sm shadow">Loading map…</p>}
      {status === "error" && (
        <div role="alert" className="absolute left-4 right-14 top-4 max-w-sm rounded bg-white p-4 shadow">
          <p className="text-sm">{message}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded bg-slate-900 px-3 py-2 text-sm text-white">Retry map</button>
        </div>
      )}
    </section>
  );
}
