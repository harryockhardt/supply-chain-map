import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { authFailureDiagnostic, signupFailure } from "../../lib/auth/errors.ts";

test("installed Supabase SDK's confirmation-email HTTP 500 gets an email-delivery explanation", async () => {
  let requests = 0;
  const client = createClient("https://auth-fixture.invalid", "test-publishable-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async () => {
        requests++;
        return new Response(JSON.stringify({ code: "unexpected_failure", msg: "Error sending confirmation email" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "X-Supabase-Api-Version": "2024-01-01" },
        });
      },
    },
  });
  const { error } = await client.auth.signUp({ email: "test@example.com", password: "fixture-only-password" });
  assert.equal(requests, 1, "Signup must not automatically send repeated confirmation requests");
  assert.ok(error);
  assert.equal(error.status, 500);
  assert.equal(error.code, undefined, "Regression: the installed SDK drops codes on HTTP 500");
  assert.equal(signupFailure(error).category, "email_delivery");
  assert.match(signupFailure(error).error, /couldn't send your confirmation email/);
  assert.deepEqual(authFailureDiagnostic(error, "email_delivery"), {
    category: "email_delivery", code: "unavailable", status: 500,
  });
});

test("other backend failures and disabled signup are not falsely diagnosed as SMTP failures", () => {
  for (const error of [
    { status: 500, message: "Database error saving new user" },
    { status: 503, message: "Service unavailable" },
    { status: 500, code: "unexpected_failure" },
  ]) {
    assert.equal(signupFailure(error).category, "backend");
    assert.doesNotMatch(signupFailure(error).error, /email service|confirmation email/);
  }
  assert.equal(signupFailure({ code: "email_provider_disabled", status: 400 }).category, "signup_disabled");
  assert.equal(signupFailure({ code: "signup_disabled", status: 422 }).category, "signup_disabled");
  assert.equal(signupFailure({ code: "weak_password", status: 422 }).category, "validation");
  assert.equal(signupFailure({ code: "over_email_send_rate_limit", status: 429 }).category, "rate_limit");
});

test("diagnostic records omit raw provider messages and untrusted error codes", () => {
  const privateText = "private-user@example.com password=do-not-log";
  const diagnostic = authFailureDiagnostic({ code: privateText, status: 500, message: privateText }, "backend");
  assert.deepEqual(diagnostic, { category: "backend", code: "unavailable", status: 500 });
  assert.ok(!JSON.stringify(diagnostic).includes(privateText));
});
