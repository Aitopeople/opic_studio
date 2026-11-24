import { listExams } from "@/server/db";
import { json, requireUser, route } from "@/server/http";
import type { VocaWord } from "@/lib/voca-words";

export const GET = route(async () => {
  const user = await requireUser();
  const words = new Map<string, VocaWord>();
  for (const exam of listExams(user.id)) {
    for (const item of exam.evaluation?.vocabulary ?? []) {
      const key = item.phrase.trim().toLowerCase();
      if (key && item.meaning.trim() && !words.has(key)) {
        words.set(key, {
          english: item.phrase,
          meaning: item.meaning,
          example: item.example,
        });
      }
    }
  }
  return json({ words: [...words.values()] });
});
