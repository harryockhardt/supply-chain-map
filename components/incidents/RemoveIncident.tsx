"use client";
import {useActionState,useState} from "react";
import {removeOwnedIncident} from "@/lib/incidents/manage";
import type {CreateState} from "@/lib/incidents/create";
export function RemoveIncident({id,title}:{id:string;title:string}) {
 const [confirm,setConfirm]=useState(false);
 const [state,action,pending]=useActionState<CreateState,FormData>(async()=>removeOwnedIncident(id),{});
 if(!confirm)return <button className="text-red-700 underline" onClick={()=>setConfirm(true)}>Remove incident</button>;
 return <form action={action} className="rounded border border-red-200 bg-red-50 p-4">
  <p>Remove “{title}”? It will disappear from the map and My Incidents.</p>
  <div className="mt-3 flex gap-4"><button disabled={pending} className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50">{pending?"Removing…":"Confirm removal"}</button><button type="button" disabled={pending} onClick={()=>setConfirm(false)} className="underline">Cancel removal</button></div>
  {state.error&&<p role="alert" className="mt-3 text-red-800">{state.error}</p>}
 </form>;
}
