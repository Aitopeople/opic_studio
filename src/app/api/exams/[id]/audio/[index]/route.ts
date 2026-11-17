import { getExam, readAudio } from "@/server/db";
import { requireUser, HttpError, route } from "@/server/http";
export const GET = route(async (request) => {
  const user = await requireUser(),
    segments = new URL(request.url).pathname.split("/"),
    record = getExam(segments[3], user.id);
  if (!record || record.exam.status !== "completed")
    throw new HttpError(404, "녹음을 찾을 수 없습니다.");
  const answer = record.exam.answers.find(
    (a) => a.index === Number(segments[5]),
  );
  if (!answer?.audio) throw new HttpError(404, "녹음을 찾을 수 없습니다.");
  return new Response(new Uint8Array(readAudio(answer.audio)), {
    headers: {
      "Content-Type": answer.mime || "audio/webm",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
    },
  });
});
