import {
  acquireLock,
  releaseLock,
  getExam,
  saveExam,
  rateLimit,
} from "@/server/db";
import { evaluate } from "@/server/ai";
import { hasCurrentTargetFeedback } from "@/server/target-feedback";
import { connectionState } from "@/server/subscription";
import { publicExam } from "@/server/exam";
import {
  checkOrigin,
  HttpError,
  json,
  requireUser,
  route,
} from "@/server/http";
export const maxDuration = 300;
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser(),
    id = new URL(request.url).pathname.split("/")[3];
  const record = getExam(id, user.id);
  if (!record) throw new HttpError(404, "시험을 찾을 수 없습니다.");
  if (record.exam.status !== "completed")
    throw new HttpError(409, "시험 종료 후 평가할 수 있습니다.");
  if (hasCurrentTargetFeedback(record.exam))
    return json({ exam: publicExam(record.exam) });
  if (!(await connectionState(user.id)).sharing)
    throw new HttpError(403, "본인 ChatGPT 구독 사용 권한을 연결해 주세요.");
  if (!record.exam.answers.some((a) => a.transcript.trim()))
    throw new HttpError(
      400,
      "평가할 전사문이 없습니다. 녹음을 듣고 실제 답변을 입력한 뒤 평가해 주세요.",
    );
  const lock = `evaluate:${id}`;
  if (!acquireLock(lock))
    throw new HttpError(409, "이미 평가 중입니다. 잠시 후 다시 확인해 주세요.");
  try {
    if (!rateLimit(`ai:${user.id}`, 5, 3600_000))
      throw new HttpError(429, "한 시간에 최대 5회 평가할 수 있습니다.");
    const exam = record.exam;
    exam.evaluation = await evaluate(exam);
    if (!saveExam(exam, record.revision))
      throw new HttpError(
        409,
        "시험 기록이 변경되었습니다. 다시 시도해 주세요.",
      );
    return json({ exam: publicExam(exam) });
  } finally {
    releaseLock(lock);
  }
});
