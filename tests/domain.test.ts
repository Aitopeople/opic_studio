import test from "node:test";
import assert from "node:assert/strict";
import {
  createQuestionSet,
  examConfigSchema,
  QUESTION_BANK,
  TOPICS,
} from "../src/lib/questions";
import {
  newExam,
  play,
  submitAnswer,
  adjust,
  publicExam,
} from "../src/server/exam";
import type { Answer, ExamConfig } from "../src/lib/types";

const config: ExamConfig = {
  mode: "simulation",
  difficulty: 4,
  count: 15,
  target: "IH",
  topics: TOPICS.slice(0, 14).map((t) => t.id),
  occupation: "일 경험 없음",
  student: "아니요",
  residence: "혼자 거주",
};
const skipped = (index: number): Answer => ({
  index,
  skipped: true,
  duration: 0,
  audio: null,
  mime: null,
  transcript: "",
  transcriptSource: "pending",
});

test("bank IDs are unique, covers guide additions and all rated task families", () => {
  assert.equal(
    new Set(QUESTION_BANK.map((q) => q.id)).size,
    QUESTION_BANK.length,
  );
  assert.equal(QUESTION_BANK.length, 192);
  for (const topic of ["sns", "people", "jobsearch"])
    assert.ok(QUESTION_BANK.some((q) => q.topic === topic));
  for (const type of [
    "description",
    "routine",
    "past",
    "comparison",
    "opinion",
    "roleplay",
    "solution",
  ])
    assert.ok(QUESTION_BANK.some((q) => q.type === type));
});
test("15 and 12 question plans have a warmup, selected topic combos, and roleplays", () => {
  for (const count of [12, 15] as const) {
    const set = createQuestionSet({ ...config, count }, () => 0.42);
    assert.equal(set.length, count);
    assert.equal(set[0].type, "intro");
    assert.equal(set[1].topic, set[3].topic);
    assert.equal(set[4].topic, set[6].topic);
    assert.ok(config.topics.includes(set[1].topic));
    assert.notEqual(set[1].topic, set[4].topic);
    assert.ok(set.some((q) => q.type === "roleplay"));
    assert.ok(set.some((q) => q.type === "solution"));
    assert.equal(new Set(set.map((q) => q.prompt)).size, set.length);
  }
});
test("surveys require 12 distinct interests in simulation, 3 in practice", () => {
  assert.ok(examConfigSchema.safeParse(config).success);
  assert.ok(
    !examConfigSchema.safeParse({
      ...config,
      topics: config.topics.slice(0, 3),
    }).success,
  );
  assert.ok(
    examConfigSchema.safeParse({
      ...config,
      mode: "practice",
      topics: config.topics.slice(0, 3),
    }).success,
  );
  assert.ok(
    !examConfigSchema.safeParse({ ...config, topics: Array(12).fill("home") })
      .success,
  );
});
test("the server limits playback and blocks out-of-order submissions", () => {
  const exam = newExam("user", config);
  play(exam);
  play(exam);
  assert.throws(() => play(exam), /두 번/);
  assert.throws(() => submitAnswer(exam, skipped(2)), /문항/);
  submitAnswer(exam, skipped(0));
  assert.equal(exam.plays, 0);
  assert.throws(() => submitAnswer(exam, skipped(0)), /문항/);
});
test("question seven transitions to mandatory adjustment, preserves deadline and answered prompts", () => {
  const exam = newExam("user", config),
    deadline = exam.deadline,
    prompts = exam.questions.slice(0, 7).map((q) => q.prompt);
  for (let i = 0; i < 7; i++) submitAnswer(exam, skipped(i));
  assert.equal(exam.status, "adjustment");
  assert.throws(() => play(exam), /난이도/);
  assert.throws(() => submitAnswer(exam, skipped(7)), /상태/);
  adjust(exam, "harder");
  assert.equal(exam.status, "active");
  assert.equal(exam.deadline, deadline);
  assert.equal(exam.questions[7].difficulty, 5);
  assert.deepEqual(
    exam.questions.slice(0, 7).map((q) => q.prompt),
    prompts,
  );
  for (let i = 7; i < 15; i++) submitAnswer(exam, skipped(i));
  assert.equal(exam.status, "completed");
  assert.throws(() => play(exam), /종료/);
});
test("deadline cannot be reset by difficulty changes, expired play is rejected", () => {
  const exam = newExam("user", config, Date.now() - 41 * 60_000);
  assert.throws(() => play(exam), /종료/);
  assert.throws(() => submitAnswer(exam, skipped(0)), /종료/);
});
test("active simulation hides future prompts, hints, user IDs and raw audio filenames", () => {
  const exam = newExam("secret-user", config);
  exam.answers.push({ ...skipped(0), audio: "private-blob.webm" });
  const output = publicExam(exam);
  assert.ok(!("userId" in output));
  assert.equal(output.questions[1].prompt, "");
  assert.equal(output.questions[0].hint, "");
  assert.equal(output.answers[0].audio, `/api/exams/${exam.id}/audio/0`);
});
test("single-question practice keeps its chosen prompt and completes after one submission", () => {
  const exam = newExam("user", {
    ...config,
    mode: "practice",
    practiceQuestionId: "hotel-roleplay",
  });
  assert.equal(exam.questions.length, 1);
  assert.equal(exam.questions[0].id, "hotel-roleplay");
  submitAnswer(exam, skipped(0));
  assert.equal(exam.status, "completed");
});

test("selected-question practice accepts no survey and rejects missing questions instead of creating a full test", () => {
  for (const id of ["home-description-0", "hotel-roleplay"]) {
    const parsed = examConfigSchema.parse({
      ...config,
      mode: "practice",
      topics: [],
      practiceQuestionId: id,
    });
    const exam = newExam("user", parsed);
    assert.equal(exam.questions.length, 1);
    assert.equal(exam.questions[0].id, id);
    assert.equal(
      exam.questions[0].prompt,
      QUESTION_BANK.find((q) => q.id === id)!.prompt,
    );
  }
  assert.equal(
    examConfigSchema.safeParse({
      ...config,
      mode: "practice",
      topics: [],
      practiceQuestionId: "missing-question",
    }).success,
    false,
  );
  assert.equal(
    examConfigSchema.safeParse({ ...config, mode: "practice", topics: [] })
      .success,
    false,
  );
  assert.equal(
    examConfigSchema.safeParse({ ...config, topics: [] }).success,
    false,
  );
});
