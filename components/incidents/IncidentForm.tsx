"use client";
import { useActionState, useState } from "react";
import { saveIncident, type CreateState } from "@/lib/incidents/create";
import { validateCreateIncident } from "@/lib/incidents/create-validation";
import type { Incident, Lookup } from "@/types/incidents";
export type IncidentChoices = {categories:Lookup[];modes:Lookup[];effects:Lookup[]};
type Props = { point:[number,number]; choices:IncidentChoices; onCancel:()=>void; onChangePoint:()=>void; initial?:Incident; onSave?:(value:unknown)=>Promise<CreateState> };

function localTime(value:string|null) {
 if(!value)return "";
 const date=new Date(value);
 return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,23);
}
export function IncidentForm({point,choices,onCancel,onChangePoint,initial,onSave=saveIncident}:Props) {
 const [fields,setFields] = useState(initial ? {title:initial.title,category_slug:initial.category_slug,description:initial.description,
 event_start_at:localTime(initial.event_start_at),status:initial.status,current_state_description:initial.current_state_description,
 last_verified_at:localTime(initial.last_verified_at),resolved_at:localTime(initial.resolved_at),impact_description:initial.impact_description,severity:String(initial.severity)} : {title:"",category_slug:"",description:"",event_start_at:"",status:"unverified",
 current_state_description:"",last_verified_at:"",resolved_at:"",impact_description:"",severity:"2"});
 const [modes,setModes] = useState<string[]>(initial?.transport_modes.map(m=>m.slug)??[]);
 const [effects,setEffects] = useState<string[]>(initial?.effects.map(e=>e.slug)??[]);
 const [sources,setSources] = useState<{key:number;id?:string;source_name:string;url:string;published_at:string}[]>(initial?.sources.map((s,key)=>({...s,key,published_at:localTime(s.published_at)}))??[]);
 const [nextKey,setNextKey] = useState(initial?.sources.length??0);
 const [state,action,pending] = useActionState<CreateState,FormData>(async () => {
  try {
   const iso = (v:string) => v ? new Date(v).toISOString() : null;
   const input = validateCreateIncident({...fields,severity:Number(fields.severity),geometry:{type:"Point",coordinates:point},
    event_start_at:iso(fields.event_start_at),last_verified_at:iso(fields.last_verified_at),resolved_at:iso(fields.resolved_at),
    modes,effects,sources:sources.map(s=>({...s,published_at:iso(s.published_at)}))});
   return await onSave(input);
  } catch(error) {
   // Redirects from Server Actions must reach Next.js rather than becoming form errors.
   if (error && typeof error === "object" && "digest" in error) throw error;
   return {error:error instanceof Error ? error.message : "Check the form and try again."};
  }
 },{});
 const set = (key:keyof typeof fields,value:string) => setFields(f=>({...f,[key]:value}));
 const inputClass = "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2";
 const field = (key:keyof typeof fields,label:string,type="text",required=true) =>
  <label className="block" key={key}>{label}<input className={inputClass} type={type} step={type==="datetime-local"?"0.001":undefined} required={required} value={fields[key]} onChange={e=>set(key,e.target.value)} /></label>;
 const textarea = (key:keyof typeof fields,label:string) =>
  <label className="block">{label}<textarea className={inputClass} required rows={3} value={fields[key]} onChange={e=>set(key,e.target.value)} /></label>;
 const toggle = (list:string[],slug:string) => list.includes(slug)?list.filter(x=>x!==slug):[...list,slug];
 return <section aria-label={initial?"Edit incident":"Create incident"} className="absolute inset-0 z-20 overflow-y-auto bg-white p-5 shadow-xl md:left-auto md:w-[30rem]">
  <h2 className="text-2xl font-semibold">{initial?"Edit incident":"Add incident"}</h2>
  <p className="mt-2 text-sm">Point: {point[1].toFixed(5)}, {point[0].toFixed(5)} (latitude, longitude)</p>
  <form action={action} onReset={event=>event.preventDefault()} className="mt-4">
   <fieldset disabled={pending} className="space-y-4">
    <div className="flex gap-4"><button type="button" className="underline" onClick={onChangePoint}>Change point</button><button type="button" className="underline" onClick={onCancel}>Cancel</button></div>
    {field("title","Title")}
    <label className="block">Category<select required className={inputClass} value={fields.category_slug} onChange={e=>set("category_slug",e.target.value)}>
      <option value="">Choose a category</option>{choices.categories.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}
    </select></label>
    {textarea("description","What happened?")}
    <p className="text-sm text-slate-600">Dates and times use your device’s local time zone.</p>
    {field("event_start_at","Event start / occurrence","datetime-local")}
    <label className="block">Status<select className={inputClass} value={fields.status} onChange={e=>set("status",e.target.value)}>
     <option value="unverified">Unverified</option><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="resolved">Resolved</option>
    </select></label>
    {textarea("current_state_description","Current state")}
    {field("last_verified_at","Last verified","datetime-local")}
    {field("resolved_at","Resolved at (optional)","datetime-local",false)}
    <fieldset><legend className="font-semibold">Transport modes — select at least one</legend>{choices.modes.map(m=><label key={m.slug} className="mr-4 inline-flex items-center gap-2 py-2"><input type="checkbox" checked={modes.includes(m.slug)} onChange={()=>setModes(toggle(modes,m.slug))}/>{m.label}</label>)}</fieldset>
    <fieldset><legend className="font-semibold">Effects — select at least one</legend>{choices.effects.map(e=><label key={e.slug} className="mr-4 inline-flex items-center gap-2 py-2"><input type="checkbox" checked={effects.includes(e.slug)} onChange={()=>setEffects(toggle(effects,e.slug))}/>{e.label}</label>)}</fieldset>
    {textarea("impact_description","Supply-chain impact")}
    <label className="block">Severity<select className={inputClass} value={fields.severity} onChange={e=>set("severity",e.target.value)}>
     {["Low","Moderate","Significant","Severe","Critical"].map((s,i)=><option key={s} value={i+1}>{i+1} — {s}</option>)}
    </select></label>
    <h3 className="font-semibold">Sources</h3>
    <p className="text-sm">At least one source is required unless the incident is Unverified.</p>
    {sources.map((source,i)=><fieldset key={source.key} className="space-y-3 rounded border p-3"><legend>Source {i+1}</legend>
     {(["source_name","url","published_at"] as const).map(key=><label key={key} className="block">{key==="source_name"?"Source name":key==="url"?"Source URL":"Publication time (optional)"}<input className={inputClass} type={key==="url"?"url":key==="published_at"?"datetime-local":"text"} step={key==="published_at"?"0.001":undefined} required={key!=="published_at"} value={source[key]} onChange={e=>setSources(s=>s.map(x=>x.key===source.key?{...x,[key]:e.target.value}:x))}/></label>)}
     <button className="underline" type="button" onClick={()=>setSources(s=>s.filter(x=>x.key!==source.key))}>Remove source {i+1}</button>
    </fieldset>)}
    <button className="rounded border px-3 py-2" type="button" onClick={()=>{setSources(s=>[...s,{key:nextKey,source_name:"",url:"",published_at:""}]);setNextKey(n=>n+1);}}>Add source</button>
    {state.error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{state.error}</p>}
    <button className="block w-full rounded bg-slate-900 px-4 py-3 text-white disabled:opacity-50" disabled={pending}>{pending?"Saving…":initial?"Save changes":"Save incident"}</button>
   </fieldset>
  </form>
 </section>;
}
