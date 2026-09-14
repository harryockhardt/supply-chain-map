import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { canManageIncident } from "../../lib/incidents/permissions.ts";
import { validateCreateIncident } from "../../lib/incidents/create-validation.ts";

// Execute the actual server modules with controlled session/database boundaries.
// No live account credentials or production records are needed.
function serverModule(path, imports) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  runInNewContext(outputText, { exports, require(name) {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  }, console });
  return exports;
}
const redirect = path => { throw new Error(`REDIRECT:${path}`); };
const record = { owner_id: "owner" };
const payload = { title:"Test", category_slug:"other", description:"Test", geometry:{type:"Point",coordinates:[0,0]}, event_start_at:"2026-09-14T10:00:00Z", status:"unverified", current_state_description:"Test", last_verified_at:"2026-09-14T10:00:00Z", severity:1, impact_description:"Test", modes:["other"], effects:["other"], sources:[] };

for (const [label, id, isAdmin, allowed] of [["owner","owner",false,true],["other user","other",false,false],["admin","admin",true,true]]) {
  test(`direct server actions: ${label} ${allowed ? "can" : "cannot"} edit and remove the record`, async () => {
    const calls = [], refreshed = [];
    const actions = serverModule("../../lib/incidents/manage.ts", {
      "next/navigation": { redirect }, "next/cache": { revalidatePath: path => refreshed.push(path) },
      "@/lib/auth/session": { requireActor: async () => ({ user:{id}, isAdmin, supabase:{rpc:async(name,args)=>{calls.push({name,args});return {error:null};}} }) },
      "./read": { getIncident: async () => record }, "./permissions": { canManageIncident }, "./create-validation": { validateCreateIncident },
    });
    if (allowed) {
      await assert.rejects(actions.updateIncident("target","version",payload), /REDIRECT:\/incidents\/target\?updated=1/);
      await assert.rejects(actions.removeIncident("target"), new RegExp(`REDIRECT:${isAdmin ? "/admin" : "/my-incidents"}\\?removed=1`));
      assert.deepEqual(calls.map(c=>c.name),["update_incident","remove_incident"]);
      assert.equal(calls[0].args.expected_updated_at,"version");
      assert.ok(refreshed.includes("/admin") && refreshed.includes("/map") && refreshed.includes("/my-incidents"));
    } else {
      assert.match((await actions.updateIncident("target","version",payload)).error,/permission/);
      assert.match((await actions.removeIncident("target")).error,/permission/);
      assert.equal(calls.length,0);
      assert.equal(refreshed.length,0);
    }
  });
}

test("admin guard reads the verified user's current profile, denies normal users and fails closed on errors", async () => {
  let role="user", error=null, seenId;
  const supabase={auth:{getUser:async()=>({data:{user:{id:"verified",user_metadata:{role:"admin"}}},error:null})},from:()=>({select:()=>({eq:(_,id)=>{seenId=id;return {single:async()=>({data:{role},error})};}})})};
  const session=serverModule("../../lib/auth/session.ts",{
    "server-only":{},"react":{cache:fn=>fn},"next/navigation":{redirect},"@/lib/supabase/server":{createClient:async()=>supabase},
  });
  await assert.rejects(session.requireAdmin(),/REDIRECT:\/map\?error=admin-required/);
  assert.equal(seenId,"verified");
  role="admin";
  assert.equal((await session.requireAdmin()).isAdmin,true);
  role="user";
  await assert.rejects(session.requireAdmin(),/admin-required/);
  error={code:"unavailable"};
  await assert.rejects(session.requireActor(),/permissions could not be checked/);
});

test("admin data access checks authorization before querying, including calls outside the layout", async () => {
  let queried=false;
  const admin=serverModule("../../lib/incidents/admin.ts",{
    "server-only":{},"@/lib/auth/session":{requireAdmin:async()=>{throw new Error("Denied");}},
  });
  await assert.rejects(admin.listAdminIncidents(),/Denied/);
  const allowed=serverModule("../../lib/incidents/admin.ts",{
    "server-only":{},"@/lib/auth/session":{requireAdmin:async()=>({user:{id:"admin"},supabase:{from:table=>{
      queried=true;assert.equal(table,"incidents");return {select:columns=>{assert.match(columns,/owner:profiles/);return {is:(column,value)=>{
        assert.equal(column,"deleted_at");assert.equal(value,null);return {order:async()=>({data:[],error:null})};
      }}}};
    }}})},
  });
  assert.equal((await allowed.listAdminIncidents()).incidents.length,0);
  assert.equal(queried,true);
});
