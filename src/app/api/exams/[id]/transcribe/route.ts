import { z } from "zod";
import { getExam, acquireLock, releaseLock, rateLimit } from "@/server/db";
import { publicExam } from "@/server/exam";
import {
  checkOrigin,
  HttpError,
  json,
  jsonBody,
  requireUser,
  route,
} from "@/server/http";
import { transcribeSavedAnswers } from "@/server/transcription";
export const maxDuration = 300;
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser();
  const body = z
    .object({ consent: z.literal(true) })
    .parse(await jsonBody(request));
  const id = new URL(request.url).pathname.split("/")[3],
    record = getExam(id, user.id);
  if (!record) throw new HttpError(404, "시험을 찾을 수 없습니다.");
  if (record.exam.status !== "completed")
    throw new HttpError(409, "시험 종료 후 음성을 전사할 수 있습니다.");
  if (!process.env.OPENAI_TRANSCRIBE_API_KEY)
    throw new HttpError(
      503,
      "GPT 전사 API 키가 설정되지 않았습니다. 설정 안내를 확인해 주세요.",
    );
  const lock = `evaluate:${id}`;
  if (!acquireLock(lock))
    throw new HttpError(409, "이 시험의 전사 또는 평가가 진행 중입니다.");
  try {
    if (!body.consent || !rateLimit(`transcribe:${user.id}`, 5, 3600_000))
      throw new HttpError(429, "한 시간에 최대 5회 전사를 요청할 수 있습니다.");
    return json({ exam: publicExam(await transcribeSavedAnswers(record)) });
  } finally {
    releaseLock(lock);
  }
});
