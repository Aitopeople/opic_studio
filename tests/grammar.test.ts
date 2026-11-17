import test from "node:test";
import assert from "node:assert/strict";
import { evaluationSchema, validateEvaluationEvidence } from "../src/server/ai";
import { newExam } from "../src/server/exam";
import { TOPICS } from "../src/lib/questions";
test("grammar suggestions must cite exact actual text, keep original text, and don't turn a short practice into a grade", () => {
  const exam = newExam("user", {
    mode: "practice",
    difficulty: 4,
    count: 15,
    target: "IH",
    topics: TOPICS.slice(0, 3).map((t) => t.id),
    occupation: "일 경험 없음",
    student: "아니요",
    residence: "혼자 거주",
  });
  exam.answers = [
    {
      index: 0,
      duration: 3,
      audio: null,
      mime: null,
      skipped: false,
      transcript: "I goes to a cafe yesterday.",
      transcriptSource: "gpt",
    },
  ];
  const base = {
    question: 1,
    explanation: "과거 시제로 고칩니다.",
    category: "tense",
    kind: "error",
  };
  const result = validateEvaluationEvidence(
    exam,
    evaluationSchema.parse({
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
      studyPlan: ["test"],
      disclaimer: "test",
      grammar: [
        { ...base, original: "I goes", corrected: "I went" },
        {
          ...base,
          original: "invented learner text",
          corrected: "something else",
        },
        { ...base, original: "a cafe", corrected: "a cafe" },
      ],
    }),
  );
  assert.equal(result.grammar?.length, 1);
  assert.equal(result.grammar[0].original, "I goes");
  assert.equal(result.grammar[0].corrected, "I went");
  assert.equal(exam.answers[0].transcript, "I goes to a cafe yesterday.");
  assert.equal(result.range, "평가 근거 부족");
});
