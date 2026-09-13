import assert from "node:assert/strict";
import test from "node:test";
import {appOrigin} from "../../lib/auth/urls.ts";

test("Confirmation URLs retain the configured host and port",()=>{
 const canonical="http://127.0.0.1:3000";
 assert.equal(new URL("/auth/callback",appOrigin(canonical)).toString(),canonical+"/auth/callback");
});
test("Only valid application origins can be used in confirmation emails",()=>{
 assert.equal(appOrigin("https://app.example/"),"https://app.example");
 for(const value of [undefined,"not-a-url","javascript:alert(1)","http://app.example","https://user:password@app.example","https://app.example/other","https://app.example/?to=elsewhere"])
  assert.throws(()=>appOrigin(value));
});
