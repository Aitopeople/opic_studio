import { examConfigSchema } from "@/lib/questions";
import { insertExam, listExams, rateLimit } from "@/server/db";
import { newExam, publicExam } from "@/server/exam";
import {
  requireUser,
  checkOrigin,
  HttpError,
  json,
  jsonBody,
  route,
} from "@/server/http";
export const GET = route(async () => {
  const user = await requireUser();
  return json({
    exams: listExams(user.id).map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      completedAt:
        e.completedAt || (Date.now() >= e.deadline ? e.deadline : null),
      config: e.config,
      status:
        e.status !== "completed" && Date.now() >= e.deadline
          ? "completed"
          : e.status,
      index: e.index,
      count: e.questions.length,
      answered: e.answers.filter((a) => !a.skipped).length,
      duration: e.answers.reduce((s, a) => s + a.duration, 0),
      range: e.evaluation?.range || null,
    })),
  });
});
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser();
  if (!rateLimit(`create:${user.id}`, 20, 3600_000))
    throw new HttpError(429, "한 시간에 최대 20개의 시험을 만들 수 있습니다.");
  const config = examConfigSchema.parse(await jsonBody(request));
  if (config.mode === "simulation" && config.practiceQuestionId)
    throw new HttpError(
      400,
      "실전 모의시험에는 단일 문항을 선택할 수 없습니다.",
    );
  const exam = newExam(user.id, config);
  insertExam(exam);
  return json({ exam: publicExam(exam) }, 201);
});
