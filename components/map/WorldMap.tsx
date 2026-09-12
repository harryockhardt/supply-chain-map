"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { MAP_STYLE_URL, INITIAL_VIEW } from "@/lib/geo/map-config";
import type { IncidentSummary } from "@/types/incidents";

export function WorldMap({ incidents, placing, onPick, point, focus }: { incidents: IncidentSummary[]; placing:boolean; onPick:(point:[number,number])=>void; point:[number,number]|null; focus?:IncidentSummary }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const placement = useRef({placing,onPick});
  useEffect(()=>{placement.current={placing,onPick};},[placing,onPick]);
  useEffect(()=>{
    let disposed=false;
    let remove:(()=>void)|undefined;
    if(point && mapRef.current) {
      const map=mapRef.current;
      void import("maplibre-gl").then(({Marker})=>{
        if(disposed)return;
        const marker=new Marker({color:"#0f172a"}).setLngLat(point).addTo(map);
        remove=()=>marker.remove();
      });
    }
    return ()=>{disposed=true;remove?.();};
  },[point]);
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
          ...(focus ? {center:focus.geometry.coordinates as [number,number],zoom:6} : {}),
          attributionControl: { compact: false },
          dragRotate: false,
          pitchWithRotate: false,
          maxPitch: 0,
        });
        mapRef.current = map;
        map.on("click",(event)=>{
          if(placement.current.placing) {
            const location=event.lngLat.wrap();
            placement.current.onPick([location.lng,location.lat]);
          }
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
      mapRef.current=null;
    };
  }, [incidents,focus]);

  return (
    <section aria-label="Interactive world map" className="relative min-h-0 flex-1 overflow-hidden bg-slate-200">
      <div className="absolute inset-0">
        <div ref={container} data-testid="world-map" data-map-status={status} className={"h-full w-full"+(placing?" is-placing":"")} />
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
