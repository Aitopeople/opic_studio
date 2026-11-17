import { z } from "zod";
import type { Exam, TargetFeedback, Evaluation } from "@/lib/types";
import {
  TARGET_CRITERIA,
  TARGET_LEVELS,
  TARGET_PROFILE_VERSION,
  getTargetProfile,
} from "@/lib/target-profiles";

export const targetFeedbackSchema = z.object({
  target: z.enum(TARGET_LEVELS),
  summary: z.string().min(1).max(1800),
  criteria: z
    .array(
      z.object({
        id: z.enum(TARGET_CRITERIA),
        status: z.enum(["demonstrated", "developing", "not_observed"]),
        feedback: z.string().min(1).max(1500),
        evidence: z
          .array(
            z.object({
              question: z.number().int().min(1).max(15),
              quote: z.string().min(1).max(2000),
            }),
          )
          .max(3),
        practice: z.string().min(1).max(1200),
      }),
    )
    .length(4),
});
export function validateTargetFeedback(
  exam: Exam,
  raw: z.infer<typeof targetFeedbackSchema>,
): TargetFeedback {
  const profile = getTargetProfile(exam.config.target);
  if (!profile || raw.target !== profile.target)
    throw new Error("Target feedback does not match exam target");
  const ids = new Set(raw.criteria.map((item) => item.id));
  if (ids.size !== TARGET_CRITERIA.length)
    throw new Error("Duplicate target criteria");
  return {
    version: TARGET_PROFILE_VERSION,
    target: profile.target,
    summary: raw.summary,
    criteria: profile.criteria.map((criterion) => {
      const item = raw.criteria.find((item) => item.id === criterion.id)!;
      const evidence = item.evidence.filter((e) => {
        const answer = exam.answers.find(
          (answer) => answer.index === e.question - 1,
        );
        return (
          !!answer &&
          !answer.skipped &&
          exam.questions[e.question - 1]?.type !== "intro" &&
          !!e.quote.trim() &&
          answer.transcript.includes(e.quote)
        );
      });
      if (item.status === "not_observed" || evidence.length === 0) {
        return {
          ...item,
          status: "not_observed",
          evidence: [],
          feedback:
            item.status === "not_observed"
              ? item.feedback
              : "이 전사문에서 이 항목을 판단할 인용 근거를 확인하지 못했습니다. 질문이 해당 능력을 요구했는지도 함께 확인해야 합니다.",
        };
      }
      return { ...item, evidence };
    }),
  };
}
export function hasCurrentTargetFeedback(
  exam: Exam,
  evaluation: Evaluation | null = exam.evaluation,
) {
  return (
    !!evaluation?.targetFeedback &&
    evaluation.targetFeedback.version === TARGET_PROFILE_VERSION &&
    evaluation.targetFeedback.target === exam.config.target
  );
}
export function targetInstructions(target: string) {
  const profile = getTargetProfile(target);
  if (!profile) throw new Error("Unsupported target grade");
  return {
    target: profile.target,
    summary: profile.summary,
    note: profile.note,
    criteria: profile.criteria,
  };
}
