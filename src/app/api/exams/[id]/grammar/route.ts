import {
  acquireLock,
  releaseLock,
  getExam,
  saveExam,
  rateLimit,
} from "@/server/db";
import { auditGrammar } from "@/server/grammar";
import { connectionState } from "@/server/subscription";
import { publicExam } from "@/server/exam";
import { GRAMMAR_AUDIT_VERSION } from "@/lib/grammar-concepts";
import {
  checkOrigin,
  HttpError,
  json,
  requireUser,
  route,
} from "@/server/http";
export const maxDuration = 300;
// Re-runs only the grammar audit for an evaluated record, keeping its coaching.
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser(),
    id = new URL(request.url).pathname.split("/")[3];
  const record = getExam(id, user.id);
  if (!record) throw new HttpError(404, "시험을 찾을 수 없습니다.");
  const exam = record.exam;
  if (exam.status !== "completed" || !exam.evaluation)
    throw new HttpError(
      409,
      "AI 평가를 받은 기록만 문법을 다시 점검할 수 있습니다.",
    );
  if (exam.evaluation.grammarVersion === GRAMMAR_AUDIT_VERSION)
    return json({ exam: publicExam(exam) });
  if (!(await connectionState(user.id)).sharing)
    throw new HttpError(403, "본인 ChatGPT 구독 사용 권한을 연결해 주세요.");
  if (!exam.answers.some((a) => !a.skipped && a.transcript.trim()))
    throw new HttpError(400, "점검할 전사문이 없습니다.");
  // Shares the evaluation lock and hourly AI limit so both can't overlap.
  const lock = `evaluate:${id}`;
  if (!acquireLock(lock))
    throw new HttpError(409, "이미 평가 중입니다. 잠시 후 다시 확인해 주세요.");
  try {
    if (!rateLimit(`ai:${user.id}`, 5, 3600_000))
      throw new HttpError(429, "한 시간에 최대 5회 평가할 수 있습니다.");
    exam.evaluation.grammar = await auditGrammar(exam);
    exam.evaluation.grammarVersion = GRAMMAR_AUDIT_VERSION;
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
