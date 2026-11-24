import { randomUUID } from "node:crypto";
import { createQuestionSet, createSecondSession } from "@/lib/questions";
import type { Answer, Exam, ExamConfig, PublicExam } from "@/lib/types";
import { HttpError } from "./http";

export function newExam(
  userId: string,
  config: ExamConfig,
  now = Date.now(),
): Exam {
  return {
    id: randomUUID(),
    userId,
    config,
    status: "active",
    createdAt: now,
    deadline: now + (config.mode === "simulation" ? 40 : 60) * 60_000,
    completedAt: null,
    index: 0,
    plays: 0,
    questions: createQuestionSet(config),
    answers: [],
    adjustment: null,
    evaluation: null,
  };
}
export function publicExam(exam: Exam): PublicExam {
  const { userId: _, ...rest } = exam;
  // Future questions are not sent to the browser during a simulation.
  const questions =
    exam.status === "completed" || exam.config.mode === "practice"
      ? exam.questions
      : exam.questions.map((q, i) =>
          i <= exam.index
            ? q
            : {
                ...q,
                prompt: "",
                hint: "",
                topicLabel: "",
                topic: "",
                type: "description" as const,
              },
        );
  return {
    ...rest,
    questions: questions.map((q) =>
      exam.status !== "completed" && exam.config.mode === "simulation"
        ? { ...q, hint: "" }
        : q,
    ),
    answers: rest.answers.map((a) => ({
      ...a,
      audio: a.audio ? `/api/exams/${exam.id}/audio/${a.index}` : null,
    })),
  };
}
export function finish(exam: Exam, now = Date.now()) {
  exam.status = "completed";
  exam.completedAt = now;
  return exam;
}
export function ensureActive(exam: Exam, now = Date.now()) {
  if (exam.status === "completed")
    throw new HttpError(409, "이미 종료된 시험입니다.");
  if (now >= exam.deadline)
    throw new HttpError(409, "전체 시험 시간이 종료되었습니다.");
}
export function play(exam: Exam) {
  ensureActive(exam);
  if (exam.status !== "active")
    throw new HttpError(409, "난이도를 먼저 선택해 주세요.");
  if (exam.plays >= 2)
    throw new HttpError(409, "질문은 최대 두 번 들을 수 있습니다.");
  exam.plays++;
}
export function submitAnswer(exam: Exam, answer: Answer) {
  if (exam.status === "completed" || exam.status === "adjustment")
    throw new HttpError(409, "답변을 제출할 수 없는 상태입니다.");
  if (
    answer.index !== exam.index ||
    exam.answers.some((a) => a.index === answer.index)
  )
    throw new HttpError(
      409,
      "문항이 이미 변경되었습니다. 화면을 새로 고쳐 주세요.",
    );
  if (Date.now() > exam.deadline + 30_000)
    throw new HttpError(
      409,
      "시험이 종료되었습니다. 마지막 녹음은 화면에서 내려받을 수 있습니다.",
    );
  if (!answer.skipped && !exam.plays)
    throw new HttpError(400, "질문을 먼저 들어 주세요.");
  exam.answers.push(answer);
  exam.index++;
  exam.plays = 0;
  if (Date.now() >= exam.deadline || exam.index >= exam.questions.length)
    finish(exam);
  else if (exam.index === 7 && exam.config.mode === "simulation")
    exam.status = "adjustment";
}
export function adjust(exam: Exam, choice: "easier" | "same" | "harder") {
  ensureActive(exam);
  if (exam.status !== "adjustment")
    throw new HttpError(409, "난이도 재선택 단계가 아닙니다.");
  const difficulty = Math.min(
    6,
    Math.max(
      1,
      exam.config.difficulty +
        (choice === "easier" ? -1 : choice === "harder" ? 1 : 0),
    ),
  );
  exam.questions = [
    ...exam.questions.slice(0, 7),
    ...createSecondSession(
      { ...exam.config, difficulty },
      Math.floor(Math.random() * 1_000_000),
      exam.questions.slice(1, 7).map((question) => question.topic),
    ),
  ];
  exam.adjustment = choice;
  exam.status = "active";
}
