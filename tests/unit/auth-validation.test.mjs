import test from "node:test";
import assert from "node:assert/strict";
import { validateCredentials } from "../../lib/auth/validation.ts";

test("sign-up rejects malformed email and short passwords", () => {
  assert.ok(validateCredentials("not-an-email", "longpassword", true));
  assert.ok(validateCredentials("person@example.com", "short", true));
  assert.equal(validateCredentials("person@example.com", "longpassword", true), null);
});

test("sign-in accepts existing shorter passwords but rejects missing or excessive input", () => {
  assert.equal(validateCredentials("person@example.com", "short", false), null);
  assert.ok(validateCredentials("person@example.com", "", false));
  assert.ok(validateCredentials("person@example.com", "a".repeat(129), false));
});
