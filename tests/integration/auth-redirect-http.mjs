import assert from "node:assert/strict";

const base = "http://127.0.0.1:3000";
for (const path of ["/login", "/signup"]) {
  const response = await fetch(base + path, {redirect:"manual"});
  assert.equal(response.status, 200, "Canonical host must not redirect in a loop");
  assert.match(await response.text(), /Resend confirmation email/);
}
for (const path of ["/signup","/login"]) {
  const alias = await fetch("http://localhost:3000"+path, {redirect:"manual"});
  assert.equal(alias.status, 200);
  const html = await alias.text();
  assert.ok(html.includes('href="'+base+path+'"'), "Alias offers exact canonical URL");
  assert.ok(!html.includes('name="password"'), "Cannot sign up on the wrong cookie origin");
}
const invalid = await fetch(base + "/auth/callback?code=invalid", {redirect:"manual"});
assert.equal(invalid.headers.get("location"), base + "/login?error=confirmation");
const protectedPage = await fetch(base + "/map", {redirect:"manual"});
assert.equal(protectedPage.status, 307);
assert.equal(new URL(protectedPage.headers.get("location"),base).pathname,"/login");
console.log("PASS: canonical signup/login, alias handoff without loops, callback destination, resend UI and unauthenticated protection.");
