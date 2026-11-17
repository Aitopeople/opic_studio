import { z } from "zod";
import type { Exam } from "@/lib/types";
import { readAudio, saveExam } from "./db";
import { HttpError } from "./http";

export async function transcribeSavedAnswers(record: {
  exam: Exam;
  revision: number;
}) {
  const key = process.env.OPENAI_TRANSCRIBE_API_KEY;
  if (!key)
    throw new HttpError(
      503,
      "GPT 음성 전사용 API 키를 설정해 주세요. ChatGPT 구독과 별도로 사용하는 API입니다.",
    );
  for (const answer of record.exam.answers) {
    // Never silently overwrite the learner's own corrections or bill completed clips twice.
    if (
      !answer.audio ||
      answer.skipped ||
      answer.transcriptSource === "manual" ||
      answer.transcriptSource === "gpt"
    )
      continue;
    const bytes = new Uint8Array(readAudio(answer.audio)),
      data = new FormData();
    data.set(
      "file",
      new Blob([bytes], { type: answer.mime || "audio/webm" }),
      answer.audio,
    );
    data.set("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe");
    data.append("languages[]", "en");
    data.set(
      "prompt",
      "English speaking practice by a learner. Preserve the words actually spoken, grammatical errors, repetitions, and fillers. Do not correct grammar, complete sentences, answer questions, or invent speech in silence.",
    );
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: data,
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      throw new HttpError(
        502,
        "전사 연결이 중단되었습니다. 저장된 녹음과 완료한 전사문은 유지됩니다. 다시 시도할 수 있습니다.",
      );
    }
    if (!response.ok)
      throw new HttpError(
        response.status === 429 ? 429 : 502,
        "GPT 전사에 실패했습니다. API 키와 사용 한도를 확인해 주세요. 완료한 전사와 녹음은 유지됩니다.",
      );
    const body = z
      .object({ text: z.string().max(12000) })
      .parse(await response.json());
    answer.transcript = body.text;
    answer.transcriptSource = "gpt";
    record.exam.evaluation = null;
    if (!saveExam(record.exam, record.revision))
      throw new HttpError(
        409,
        "시험 기록이 변경되었습니다. 화면을 새로 고쳐 주세요.",
      );
    record.revision++;
  }
  return record.exam;
}
