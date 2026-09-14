import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { ownedIncidentQuery } from "../../lib/incidents/owned-query.ts";

test("My Incidents sends ownership and soft-deletion filters for each session", async () => {
  const requests = [];
  const client = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      requests.push(new URL(String(input)));
      return new Response("[]", { headers: { "Content-Type": "application/json" } });
    } },
  });
  // Same client, different identities: no cached owner or admin-wide fallback.
  const owners = ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"];
  for (const owner of owners) assert.equal((await ownedIncidentQuery(client, owner)).error, null);
  assert.equal(requests.length, 2);
  for (const [index, url] of requests.entries()) {
    assert.equal(url.pathname, "/rest/v1/incidents");
    assert.equal(url.searchParams.get("owner_id"), "eq." + owners[index]);
    assert.equal(url.searchParams.get("deleted_at"), "is.null");
    assert.equal(url.searchParams.get("order"), "updated_at.desc");
  }
  assert.throws(() => ownedIncidentQuery(client, ""), /signed-in user/);
  assert.equal(requests.length, 2, "Missing identity must not fetch shared records");
});
