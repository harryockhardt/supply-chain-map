"use client";
import {useCallback,useState,useSyncExternalStore} from "react";
import {useRouter} from "next/navigation";
import type {Incident} from "@/types/incidents";
import {WorldMap} from "@/components/map/WorldMap";
import {IncidentForm,type IncidentChoices} from "./IncidentForm";
import {updateIncident} from "@/lib/incidents/manage";
const subscribe=()=>()=>{};
const clientSnapshot=()=>true;
const serverSnapshot=()=>false;
const noIncidents:Incident[]=[];
export function EditIncidentWorkspace({incident,choices}:{incident:Incident;choices:IncidentChoices}) {
 const router=useRouter();
 const hydrated=useSyncExternalStore(subscribe,clientSnapshot,serverSnapshot);
 const [placing,setPlacing]=useState(false);
 const [point,setPoint]=useState<[number,number]>(incident.geometry.coordinates as [number,number]);
 const pick=useCallback((p:[number,number])=>{setPoint(p);setPlacing(false);},[]);
 const save=updateIncident.bind(null,incident.id,incident.updated_at);
 return <div className="relative flex min-h-0 flex-1">
  <div className={"flex min-h-0 flex-1"+(!placing?" md:mr-[30rem]":"")}><WorldMap incidents={noIncidents} placing={placing} onPick={pick} point={point} focus={incident}/></div>
  {placing && <div role="status" className="absolute left-4 right-14 top-4 z-10 rounded bg-white p-3 shadow">Click or tap the map to move the point. <button className="underline" onClick={()=>setPlacing(false)}>Keep current point</button></div>}
  {hydrated ? <div className={placing?"hidden":"contents"}><IncidentForm initial={incident} point={point} choices={choices} onSave={save} onCancel={()=>router.push(`/incidents/${incident.id}`)} onChangePoint={()=>setPlacing(true)}/></div> : <p role="status">Loading editor…</p>}
 </div>;
}
