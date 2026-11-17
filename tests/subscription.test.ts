import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
process.env.DATA_DIR = join(process.cwd(), "output", "tests", randomUUID());
const { readCompletedResponse, planError, subscriptionResponse } =
  await import("../src/server/subscription");
const { db, saveConnection } = await import("../src/server/db");
const { seal } = await import("../src/server/auth");

function sse(events: unknown[], split = 7) {
  const bytes = new TextEncoder().encode(
    events.map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`).join(""),
  );
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += split)
          controller.enqueue(bytes.slice(i, i + split));
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}
test("fragmented SSE with CRLF only commits on response.completed", async () => {
  assert.equal(
    await readCompletedResponse(
      sse([
        { type: "response.output_text.delta", delta: "hello" },
        { type: "response.completed", response: { status: "completed" } },
      ]),
    ),
    "hello",
  );
  await assert.rejects(
    readCompletedResponse(
      sse([
        {
          type: "response.output_text.delta",
          delta: "looks complete but is not",
        },
      ]),
    ),
    /중단/,
  );
});
test("usage failure after partial text is not saved as a successful evaluation", async () => {
  await assert.rejects(
    readCompletedResponse(
      sse([
        { type: "response.output_text.delta", delta: "partial" },
        {
          type: "response.failed",
          response: {
            error: { code: "subscription_sharing_usage_limit_exceeded" },
          },
        },
      ]),
    ),
    (error) => {
      assert.equal((error as { status: number }).status, 429);
      assert.match((error as Error).message, /사용 한도/);
      return true;
    },
  );
  await assert.rejects(
    readCompletedResponse(sse([{ type: "response.incomplete" }])),
    /완성되지/,
  );
});
test("each request uses only the caller's subscription token and account's model catalog", async () => {
  const user = randomUUID();
  saveConnection(
    user,
    "issued-test-client",
    "issuer|client|subject",
    await seal(
      {
        accessToken: "user-a-dummy-token",
        refreshToken: null,
        idToken: null,
        scopes: ["chatgpt.tokens.use.direct"],
        expiresAt: Date.now() + 3600_000,
      },
      3600,
    ),
  );
  process.env.OPENAI_API_KEY = "operator-key-must-not-be-used";
  const original = globalThis.fetch;
  const requests: { url: string; token: string }[] = [];
  globalThis.fetch = async (url, options) => {
    const token = new Headers(options?.headers).get("authorization") || "";
    requests.push({ url: String(url), token });
    assert.equal(token, "Bearer user-a-dummy-token");
    if (String(url).endsWith("/models"))
      return Response.json({
        models: [
          {
            slug: "account-luna",
            display_name: "Available Luna",
            visibility: "list",
          },
        ],
      });
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "account-luna");
    assert.equal(body.stream, true);
    assert.equal(body.store, false);
    assert.ok(Array.isArray(body.input));
    assert.ok(!("max_output_tokens" in body));
    return sse([
      { type: "response.output_text.delta", delta: "done" },
      { type: "response.completed", response: { status: "completed" } },
    ]);
  };
  try {
    assert.equal(
      await subscriptionResponse(user, {
        input: [{ role: "user", content: "test" }],
      }),
      "done",
    );
    assert.equal(requests.length, 2);
    await assert.rejects(
      subscriptionResponse("another-user", { input: [] }),
      /다시 연결/,
    );
    assert.equal(
      requests.length,
      2,
      "missing caller credentials must not use operator credentials",
    );
  } finally {
    globalThis.fetch = original;
    delete process.env.OPENAI_API_KEY;
  }
});
test("structured permission errors preserve actionable status", () => {
  assert.equal(
    planError("subscription_sharing_user_not_eligible", 200).status,
    403,
  );
  assert.equal(
    planError("subscription_sharing_usage_unavailable", 200).status,
    503,
  );
});
test.after(() => db().close());
