import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { getExam, saveExam, writeAudio, audioPath } from "@/server/db";
import { publicExam, submitAnswer } from "@/server/exam";
import {
  checkOrigin,
  HttpError,
  json,
  limitedBytes,
  requireUser,
  route,
} from "@/server/http";

const formats: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/wav": "wav",
};
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser(),
    id = new URL(request.url).pathname.split("/")[3];
  const record = getExam(id, user.id);
  if (!record) throw new HttpError(404, "시험을 찾을 수 없습니다.");
  let index = Number(request.headers.get("x-question-index")),
    duration = Number(request.headers.get("x-audio-duration")),
    skipped = request.headers.get("x-skipped") === "true",
    transcript = "";
  let mime = request.headers.get("content-type")?.split(";")[0] || "",
    bytes: Uint8Array;
  if (mime === "multipart/form-data") {
    const bounded = await limitedBytes(request, 24 * 1024 * 1024 + 64_000);
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type")! },
      body: bounded,
    }).formData();
    const clip = form.get("audio");
    if (!(clip instanceof File))
      throw new HttpError(400, "녹음 파일이 없습니다.");
    if (clip.size > 24 * 1024 * 1024)
      throw new HttpError(413, "녹음은 24MB 이하여야 합니다.");
    bytes = new Uint8Array(await clip.arrayBuffer());
    mime = clip.type.split(";")[0];
    index = Number(form.get("index"));
    duration = Number(form.get("duration"));
    skipped = false;
    const text = form.get("transcript");
    if (typeof text !== "string" || text.length > 12000)
      throw new HttpError(400, "잘못된 전사문입니다.");
    transcript = text;
  } else bytes = await limitedBytes(request, 24 * 1024 * 1024);
  if (
    !Number.isInteger(index) ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 3600
  )
    throw new HttpError(400, "잘못된 녹음 정보입니다.");
  const extension = formats[mime];
  if (!skipped && !extension)
    throw new HttpError(415, "지원하지 않는 녹음 형식입니다.");
  if (!skipped && bytes.length < 100)
    throw new HttpError(400, "녹음된 소리가 없습니다. 마이크를 확인해 주세요.");
  const audio = skipped ? null : `${randomUUID()}.${extension}`;
  submitAnswer(record.exam, {
    index,
    duration,
    audio,
    mime: skipped ? null : mime,
    transcript,
    transcriptSource: transcript ? "browser" : "pending",
    skipped,
  });
  if (audio) writeAudio(audio, bytes);
  if (!saveExam(record.exam, record.revision)) {
    if (audio) rmSync(audioPath(audio), { force: true });
    throw new HttpError(
      409,
      "이미 제출한 문항입니다. 화면을 새로 고쳐 주세요.",
    );
  }
  return json({ exam: publicExam(record.exam) });
});
