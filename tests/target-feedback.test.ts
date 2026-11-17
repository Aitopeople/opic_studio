import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  TARGET_LEVELS,
  TARGET_CRITERIA,
  TARGET_PROFILE_VERSION,
  getTargetProfile,
} from "../src/lib/target-profiles";
import {
  targetFeedbackSchema,
  targetInstructions,
  validateTargetFeedback,
  hasCurrentTargetFeedback,
} from "../src/server/target-feedback";
import { FEEDBACK_EXAMPLE } from "../src/lib/feedback-example";
import type { TargetFeedback } from "../src/lib/types";

process.env.DATA_DIR = join(process.cwd(), "output", "tests", randomUUID());
const { newExam } = await import("../src/server/exam");
const { evaluate, evaluationSchema, validateEvaluationEvidence } =
  await import("../src/server/ai");
const { db, saveConnection } = await import("../src/server/db");
const { seal } = await import("../src/server/auth");
function fixture(target = "IH") {
  const exam = newExam("target-test-user", {
    mode: "practice",
    practiceQuestionId: "travel-past-0",
    difficulty: 4,
    count: 15,
    target,
    topics: [],
    occupation: "일 경험 없음",
    student: "아니요",
    residence: "혼자 거주",
  });
  exam.status = "completed";
  exam.answers = [
    {
      index: 0,
      duration: 60,
      audio: null,
      mime: null,
      transcript: FEEDBACK_EXAMPLE.transcript,
      transcriptSource: "gpt",
      skipped: false,
    },
  ];
  return exam;
}
function output(targetFeedback?: TargetFeedback) {
  return {
    range: "IH–AL",
    confidence: "medium",
    summary: "test",
    dimensions: ["functions", "context", "accuracy", "text"].map((name) => ({
      name,
      score: 3,
      feedback: "test",
    })),
    strengths: ["test"],
    priorities: ["test"],
    evidence: [],
    grammar: [],
    studyPlan: ["test"],
    disclaimer: "test",
    targetFeedback,
  };
}
test("all six targets have explicit learning criteria, with IM practice focuses distinguished from official cutoffs", () => {
  for (const target of TARGET_LEVELS) {
    const profile = targetInstructions(target);
    assert.equal(profile.target, target);
    assert.deepEqual(
      profile.criteria.map((item) => item.id),
      [...TARGET_CRITERIA],
    );
    assert.equal(
      profile.criteria.every((item) => item.description.length > 10),
      true,
    );
    if (target.startsWith("IM"))
      assert.match(profile.note, /공식 세부 등급의 합격 기준이 아닙니다/);
  }
  assert.notDeepEqual(
    targetInstructions("IL").criteria,
    targetInstructions("AL").criteria,
  );
  assert.notDeepEqual(
    targetInstructions("IM1").criteria,
    targetInstructions("IM3").criteria,
  );
  assert.equal(getTargetProfile("wrong"), undefined);
});
test("target evidence must cite actual non-skipped answers; unsupported judgments become unobserved", () => {
  const exam = fixture(),
    raw = targetFeedbackSchema.parse(FEEDBACK_EXAMPLE.targetFeedback);
  raw.criteria[0].evidence = [{ question: 1, quote: "invented words" }];
  const checked = validateTargetFeedback(exam, raw);
  assert.equal(checked.criteria[0].status, "not_observed");
  assert.deepEqual(checked.criteria[0].evidence, []);
  assert.equal(checked.criteria[2].status, "developing");
  assert.equal(checked.criteria[2].evidence.length, 2);
  exam.answers[0].skipped = true;
  assert.ok(
    validateTargetFeedback(exam, raw).criteria.every(
      (item) => item.status === "not_observed",
    ),
  );
});
test("wrong targets and duplicate criteria are rejected; no observed opportunity is not a failure", () => {
  const exam = fixture(),
    raw = targetFeedbackSchema.parse(FEEDBACK_EXAMPLE.targetFeedback);
  assert.throws(
    () =>
      validateTargetFeedback(
        { ...exam, config: { ...exam.config, target: "AL" } },
        raw,
      ),
    /match/,
  );
  const duplicate = structuredClone(raw);
  duplicate.criteria[3].id = duplicate.criteria[0].id;
  assert.throws(() => validateTargetFeedback(exam, duplicate), /Duplicate/);
  raw.criteria[0].status = "not_observed";
  raw.criteria[0].feedback =
    "이 질문에서는 문제 해결을 확인할 기회가 없습니다.";
  const checked = validateTargetFeedback(exam, raw);
  assert.equal(checked.criteria[0].status, "not_observed");
  assert.deepEqual(checked.criteria[0].evidence, []);
  assert.match(checked.criteria[0].feedback, /기회가 없습니다/);
});
test("single-question target coaching never turns into a grade, and legacy evaluations need an explicit refresh", () => {
  const exam = fixture();
  const checked = validateEvaluationEvidence(
    exam,
    evaluationSchema.parse(output(FEEDBACK_EXAMPLE.targetFeedback)),
  );
  assert.equal(checked.range, "평가 근거 부족");
  assert.equal(checked.targetFeedback?.target, "IH");
  assert.equal(checked.targetFeedback?.version, TARGET_PROFILE_VERSION);
  assert.equal(hasCurrentTargetFeedback(exam, checked), true);
  assert.equal(
    hasCurrentTargetFeedback(exam, { ...checked, targetFeedback: undefined }),
    false,
  );
  assert.equal(
    hasCurrentTargetFeedback(
      { ...exam, config: { ...exam.config, target: "AL" } },
      checked,
    ),
    false,
  );
});
test("each real evaluation request carries its saved target profile and requires structured coaching, without a second model call", async () => {
  const exam = fixture();
  saveConnection(
    exam.userId,
    "test-client",
    "issuer|client|subject",
    await seal(
      {
        accessToken: "dummy-target-token",
        refreshToken: null,
        idToken: null,
        scopes: ["chatgpt.tokens.use.direct"],
        expiresAt: Date.now() + 3600_000,
      },
      3600,
    ),
  );
  const originalFetch = globalThis.fetch;
  let inferenceCalls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(
      new Headers(options?.headers).get("authorization"),
      "Bearer dummy-target-token",
    );
    if (String(url).endsWith("/models"))
      return Response.json({
        models: [
          { slug: "test-luna", display_name: "Luna", visibility: "list" },
        ],
      });
    inferenceCalls++;
    const request = JSON.parse(String(options?.body));
    const input = JSON.parse(request.input[0].content);
    assert.equal(input.targetProfile.target, "IH");
    assert.deepEqual(
      input.targetProfile.criteria,
      targetInstructions("IH").criteria,
    );
    assert.equal(input.responses[0].answer, FEEDBACK_EXAMPLE.transcript);
    assert.ok(request.text.format.schema.required.includes("targetFeedback"));
    assert.match(request.instructions, /NEVER the current range estimate/);
    const payload = JSON.stringify(output(FEEDBACK_EXAMPLE.targetFeedback));
    return new Response(
      [
        `data: ${JSON.stringify({ type: "response.output_text.delta", delta: payload })}\n\n`,
        `data: ${JSON.stringify({ type: "response.completed", response: { status: "completed" } })}\n\n`,
      ].join(""),
      { headers: { "Content-Type": "text/event-stream" } },
    );
  };
  try {
    const checked = await evaluate(exam);
    assert.equal(checked.targetFeedback?.target, "IH");
    assert.equal(checked.range, "평가 근거 부족");
    assert.equal(inferenceCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test.after(() => db().close());
