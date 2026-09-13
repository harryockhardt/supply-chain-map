import assert from "node:assert/strict";

const base = process.env.AUTH_TEST_URL || "http://127.0.0.1:3000";
const email = process.env.AUTH_TEST_EMAIL;
const password = process.env.AUTH_TEST_PASSWORD;
if (!email || !password) throw new Error("Use a disposable confirmed test account via AUTH_TEST_EMAIL and AUTH_TEST_PASSWORD.");
const jar = new Map();
async function request(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    ...options, redirect: "manual",
    headers: { Cookie: [...jar].map(([k,v]) => k + "=" + v).join("; "), Origin: base, ...options.headers },
  });
  for (const cookie of response.headers.getSetCookie()) {
    const first = cookie.split(";")[0];
    const split = first.indexOf("=");
    const name = first.slice(0, split), value = first.slice(split + 1);
    if (!value || /max-age=0(?:;|$)/i.test(cookie)) jar.delete(name); else jar.set(name, value);
  }
  return response;
}
function formFrom(html) {
  const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, "Form rendered");
  const data = new FormData();
  const decode = (s) => s.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&");
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    const value = input[0].match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) data.set(decode(name), decode(value));
  }
  return data;
}

let response = await request("/map");
assert.equal(response.status, 307);
assert.equal(response.headers.get("location"), "/login");
response = await request("/auth/callback?code=invalid");
assert.match(response.headers.get("location"), /\/login\?error=confirmation$/);
response = await request("/login");
let html = await response.text();
let form = formFrom(html);
form.set("email", email); form.set("password", "incorrect-password");
response = await request("/login", { method: "POST", body: form });
assert.match(await response.text(), /Unable to sign in/);
response = await request("/login");
form = formFrom(await response.text());
form.set("email", email); form.set("password", password);
response = await request("/login", { method: "POST", body: form });
assert.equal(response.status, 303, "Sign-in redirects");
assert.equal(response.headers.get("location"), "/map");
assert.ok([...jar.keys()].some(k => k.includes("auth-token")), "Session cookie saved");

response = await request("/map");
assert.equal(response.status, 200);
html = await response.text();
assert.ok(html.includes(email), "Authenticated page identifies current user");
assert.ok(html.includes("Interactive world map"));
assert.match(response.headers.get("cache-control"), /no-store|private/);
response = await request("/map");
assert.equal(response.status, 200, "Session survives a fresh page request");
assert.ok((await response.text()).includes(email));

form = formFrom(html);
response = await request("/map", { method: "POST", body: form });
assert.equal(response.status, 303);
assert.equal(response.headers.get("location"), "/login");
response = await request("/map");
assert.equal(response.status, 307, "Signed-out user is redirected");
assert.equal(response.headers.get("location"), "/login");

console.log("PASS: route protection, invalid confirmation, wrong password, real sign-in, session cookies, refresh, no-store headers and sign-out.");
