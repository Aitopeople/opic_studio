import test from "node:test";
import assert from "node:assert/strict";
import {
  isLocalRuntime,
  localDynamicEnabled,
  cookieOptions,
} from "../src/server/auth";
test("local production execution permits loopback dynamic auth but remote service mode never does", () => {
  const old = { ...process.env };
  try {
    Object.assign(process.env, {
      NODE_ENV: "production",
      APP_MODE: "local",
      APP_URL: "http://127.0.0.1:3000",
      CHATGPT_CLIENT_ID: "",
      CHATGPT_LOCAL_AUTH: "true",
    });
    assert.equal(isLocalRuntime(), true);
    assert.equal(localDynamicEnabled(), true);
    assert.equal(cookieOptions(10).secure, false);
    process.env.APP_URL = "https://a-public-service.example";
    assert.equal(isLocalRuntime(), false);
    assert.equal(localDynamicEnabled(), false);
    assert.equal(cookieOptions(10).secure, true);
    process.env.APP_URL = "http://localhost:3000";
    process.env.APP_MODE = "service";
    assert.equal(localDynamicEnabled(), false);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in old)) delete process.env[key];
    Object.assign(process.env, old);
  }
});
