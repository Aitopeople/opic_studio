import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
process.env.DATA_DIR = join(process.cwd(), "output", "tests", randomUUID());
const { transcribeSavedAnswers } = await import("../src/server/transcription");
const { newExam } = await import("../src/server/exam");
const { TOPICS } = await import("../src/lib/questions");
const { db, insertExam, getExam, writeAudio } =
  await import("../src/server/db");

test("failed transcription checkpoints completed clips, preserves manual text, and retries only unfinished clips", async () => {
  db();
  const exam = newExam("test-user", {
    mode: "practice",
    difficulty: 4,
    count: 15,
    target: "IH",
    topics: TOPICS.slice(0, 3).map((t) => t.id),
    occupation: "일 경험 없음",
    student: "아니요",
    residence: "혼자 거주",
  });
  exam.status = "completed";
  const names = [randomUUID(), randomUUID()].map((id) => `${id}.webm`);
  names.forEach((name) => writeAudio(name, new Uint8Array(200)));
  exam.answers = names.map((audio, index) => ({
    index,
    audio,
    duration: 1,
    mime: "audio/webm",
    transcript: "browser version",
    transcriptSource: "browser",
    skipped: false,
  }));
  exam.answers.push({
    index: 2,
    audio: `${randomUUID()}.webm`,
    duration: 1,
    mime: "audio/webm",
    transcript: "my carefully corrected text",
    transcriptSource: "manual",
    skipped: false,
  });
  insertExam(exam);
  process.env.OPENAI_TRANSCRIBE_API_KEY = "dummy-transcription-key";
  const oldFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    assert.equal(
      new Headers(options?.headers).get("authorization"),
      "Bearer dummy-transcription-key",
    );
    assert.equal((options?.body as FormData).get("model"), "gpt-transcribe");
    return ++calls === 1
      ? Response.json({ text: "I goes to a cafe yesterday." })
      : new Response("failure", { status: 503 });
  };
  try {
    await assert.rejects(
      transcribeSavedAnswers(getExam(exam.id, exam.userId)!),
      /전사에 실패/,
    );
    const saved = getExam(exam.id, exam.userId)!;
    assert.equal(saved.exam.answers[0].transcriptSource, "gpt");
    assert.equal(saved.exam.answers[1].transcriptSource, "browser");
    let retried = 0;
    globalThis.fetch = async () => {
      retried++;
      return Response.json({ text: "The second answer." });
    };
    await transcribeSavedAnswers(saved);
    assert.equal(retried, 1);
    assert.equal(
      saved.exam.answers[2].transcript,
      "my carefully corrected text",
    );
  } finally {
    globalThis.fetch = oldFetch;
    delete process.env.OPENAI_TRANSCRIBE_API_KEY;
  }
});
test("subscription or general API credentials are not silently used for optional speech transcription", async () => {
  process.env.OPENAI_API_KEY = "must-not-be-used";
  await assert.rejects(
    transcribeSavedAnswers({ exam: {} as never, revision: 0 }),
    /전사용 API 키/,
  );
  delete process.env.OPENAI_API_KEY;
});
test.after(() => db().close());
