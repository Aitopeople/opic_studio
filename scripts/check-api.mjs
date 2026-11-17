import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://localhost:3000";
async function request(path, options = {}, cookie) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  return { response, data };
}
async function guest() {
  const result = await request("/api/auth/guest", { method: "POST" });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  return result.response.headers.get("set-cookie").split(";")[0];
}
const unauthenticated = await request("/api/exams");
assert.equal(unauthenticated.response.status, 401);
const cookieA = await guest(),
  cookieB = await guest();
const session = await request("/api/session", {}, cookieA);
assert.ok(
  session.data.user?.id,
  "session cookie must work across route modules",
);
const config = {
  mode: "simulation",
  difficulty: 4,
  count: 15,
  target: "AL",
  topics: [
    "home",
    "neighborhood",
    "cafe",
    "movies",
    "music",
    "concerts",
    "parks",
    "walking",
    "running",
    "fitness",
    "cooking",
    "shopping",
  ],
  occupation: "일 경험 없음",
  student: "아니요",
  residence: "혼자 거주",
};
const created = await request(
  "/api/exams",
  { method: "POST", body: JSON.stringify(config) },
  cookieA,
);
assert.equal(created.response.status, 201, JSON.stringify(created.data));
const id = created.data.exam.id;
try {
  assert.equal(created.data.exam.questions[1].prompt, "");
  assert.equal(
    (await request(`/api/exams/${id}`, {}, cookieB)).response.status,
    404,
  );
  assert.equal(
    (await request(`/api/exams/${id}`, { method: "DELETE" }, cookieB)).response
      .status,
    404,
  );
  assert.equal(
    (
      await request(
        `/api/exams/${id}`,
        {
          method: "PATCH",
          headers: { Origin: "https://attacker.invalid" },
          body: JSON.stringify({ action: "finish" }),
        },
        cookieA,
      )
    ).response.status,
    403,
  );
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 2; j++)
      assert.equal(
        (
          await request(
            `/api/exams/${id}`,
            { method: "PATCH", body: JSON.stringify({ action: "play" }) },
            cookieA,
          )
        ).response.status,
        200,
      );
    assert.equal(
      (
        await request(
          `/api/exams/${id}`,
          { method: "PATCH", body: JSON.stringify({ action: "play" }) },
          cookieA,
        )
      ).response.status,
      409,
    );
    const answer = await request(
      `/api/exams/${id}/answer`,
      {
        method: "POST",
        headers: {
          "x-question-index": String(i),
          "x-audio-duration": "0",
          "x-skipped": "true",
        },
      },
      cookieA,
    );
    assert.equal(answer.response.status, 200, JSON.stringify(answer.data));
  }
  const midpoint = await request(`/api/exams/${id}`, {}, cookieA);
  assert.equal(midpoint.data.exam.status, "adjustment");
  const adjusted = await request(
    `/api/exams/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "adjust", choice: "harder" }),
    },
    cookieA,
  );
  assert.equal(adjusted.response.status, 200);
  assert.equal(adjusted.data.exam.questions[7].difficulty, 5);
  assert.equal(adjusted.data.exam.deadline, created.data.exam.deadline);
  const ended = await request(
    `/api/exams/${id}`,
    { method: "PATCH", body: JSON.stringify({ action: "finish" }) },
    cookieA,
  );
  assert.equal(ended.data.exam.status, "completed");
  if (!session.data.aiConfigured)
    assert.equal(
      (await request(`/api/exams/${id}/evaluate`, { method: "POST" }, cookieA))
        .response.status,
      403,
    );
  console.log(
    "PASS: authenticated session, ownership isolation, CSRF, 2x replay, 7-question transition, difficulty update, fixed deadline, completion, honest AI readiness",
  );
} finally {
  assert.equal(
    (await request(`/api/exams/${id}`, { method: "DELETE" }, cookieA)).response
      .status,
    200,
  );
}
