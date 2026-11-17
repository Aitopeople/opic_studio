import { z } from "zod";
import { getExam, saveExam, deleteExam } from "@/server/db";
import { adjust, finish, play, publicExam } from "@/server/exam";
import {
  checkOrigin,
  HttpError,
  json,
  jsonBody,
  requireUser,
  route,
} from "@/server/http";
function idFrom(request: Request) {
  return new URL(request.url).pathname.split("/")[3];
}
export const GET = route(async (request) => {
  const user = await requireUser(),
    record = getExam(idFrom(request), user.id);
  if (!record) throw new HttpError(404, "시험을 찾을 수 없습니다.");
  if (
    record.exam.status !== "completed" &&
    Date.now() >= record.exam.deadline
  ) {
    finish(record.exam, record.exam.deadline);
    saveExam(record.exam, record.revision);
  }
  return json({ exam: publicExam(record.exam) });
});
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("play") }),
  z.object({ action: z.literal("finish") }),
  z.object({
    action: z.literal("adjust"),
    choice: z.enum(["easier", "same", "harder"]),
  }),
  z.object({
    action: z.literal("transcript"),
    index: z.number().int().min(0).max(14),
    transcript: z.string().max(12000),
  }),
]);
export const PATCH = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser(),
    record = getExam(idFrom(request), user.id);
  if (!record) throw new HttpError(404, "시험을 찾을 수 없습니다.");
  const action = actionSchema.parse(await jsonBody(request)),
    exam = record.exam;
  if (action.action === "play") play(exam);
  if (action.action === "finish") finish(exam);
  if (action.action === "adjust") adjust(exam, action.choice);
  if (action.action === "transcript") {
    if (exam.status !== "completed")
      throw new HttpError(
        409,
        "시험 종료 후에만 전사 내용을 수정할 수 있습니다.",
      );
    const answer = exam.answers.find((a) => a.index === action.index);
    if (!answer) throw new HttpError(404, "답변을 찾을 수 없습니다.");
    answer.transcript = action.transcript;
    answer.transcriptSource = "manual";
    exam.evaluation = null;
  }
  if (!saveExam(exam, record.revision))
    throw new HttpError(
      409,
      "다른 요청으로 시험이 변경되었습니다. 다시 시도해 주세요.",
    );
  return json({ exam: publicExam(exam) });
});
export const DELETE = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser();
  if (!deleteExam(idFrom(request), user.id))
    throw new HttpError(404, "시험을 찾을 수 없습니다.");
  return json({ ok: true });
});
