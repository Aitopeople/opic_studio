import test from "node:test";
import assert from "node:assert/strict";
import {
  isLocalRuntime,
  localDynamicEnabled,
  cookieOptions,
} from "../src/server/auth";
import { checkOrigin } from "../src/server/http";

test("local changes are accepted from the app on 3000 or the dev fallback 3001 only", () => {
  const old = { ...process.env };
  const post = (origin: string | null, url: string) =>
    new Request(url, {
      method: "POST",
      headers: origin ? { origin } : {},
    });
  const status = (request: Request) => {
    try {
      checkOrigin(request);
      return 200;
    } catch (error) {
      return (error as { status: number }).status;
    }
  };
  try {
    Object.assign(process.env, {
      NODE_ENV: "production",
      APP_MODE: "local",
      APP_URL: "http://127.0.0.1:3000",
    });
    for (const base of [
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://localhost:3001",
    ])
      assert.equal(status(post(base, `${base}/api/exams`)), 200, base);
    assert.equal(
      status(post("http://127.0.0.1:3002", "http://127.0.0.1:3002/api/exams")),
      403,
    );
    assert.equal(
      status(post("https://evil.example", "http://127.0.0.1:3001/api/exams")),
      403,
    );
    assert.equal(status(post(null, "http://127.0.0.1:3001/api/exams")), 403);
    // A deployed service never trusts loopback origins.
    Object.assign(process.env, {
      APP_MODE: "service",
      APP_URL: "https://a-public-service.example",
    });
    assert.equal(
      status(post("http://127.0.0.1:3001", "http://127.0.0.1:3001/api/exams")),
      403,
    );
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in old)) delete process.env[key];
    Object.assign(process.env, old);
  }
});
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
