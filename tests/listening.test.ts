import test from "node:test";
import assert from "node:assert/strict";
import { correctedTranscript } from "../src/lib/corrected-transcript";
import { speechChunks } from "../src/lib/speech";
import { FEEDBACK_EXAMPLE } from "../src/lib/feedback-example";
import type { Evaluation } from "../src/lib/types";

test("full-answer listening applies only grounded grammar edits and preserves optional wording and original data", () => {
  const original = FEEDBACK_EXAMPLE.transcript;
  const output = correctedTranscript(original, FEEDBACK_EXAMPLE.grammar);
  assert.equal(output.applied, 4);
  assert.equal(output.skipped, 0);
  assert.ok(output.text.includes("I went to Busan"));
  assert.ok(output.text.includes("many pictures"));
  assert.ok(output.text.includes("we decided to go"));
  assert.ok(output.text.includes("I had never seen"));
  assert.ok(output.text.includes("the trip was really fun."));
  assert.equal(FEEDBACK_EXAMPLE.transcript, original);
});
test("ambiguous and overlapping correction excerpts never silently rewrite the wrong passage", () => {
  const base = {
    question: 1,
    explanation: "",
    category: "tense",
    kind: "error",
  } as const;
  const items: NonNullable<Evaluation["grammar"]> = [
    { ...base, original: "I go", corrected: "I went" },
    { ...base, original: "go home", corrected: "went home" },
    { ...base, original: "missing", corrected: "invented" },
  ];
  const overlap = correctedTranscript("I go home.", items);
  assert.deepEqual(overlap, { text: "I go home.", applied: 0, skipped: 3 });
  const repeated = correctedTranscript("I go home. I go out.", [items[0]]);
  assert.deepEqual(repeated, {
    text: "I go home. I go out.",
    applied: 0,
    skipped: 1,
  });
});
test("speech chunks preserve an answer's words and order while bounding long utterances", () => {
  const text = `Dr. Smith visited Busan. ${"The beach was quiet and beautiful. ".repeat(80)}I would go again!`;
  const chunks = speechChunks(text);
  assert.equal(chunks.join(" "), text.trim().replace(/\s+/g, " "));
  assert.ok(chunks.every((chunk) => chunk.length > 0 && chunk.length <= 220));
  assert.deepEqual(speechChunks("  \n  "), []);
});
