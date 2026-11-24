import type { VocabularySuggestion } from "@/lib/types";
import { SpeakableText } from "./speech-playback";

export function VocabularySuggestions({
  items,
}: {
  items: VocabularySuggestion[];
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-4" aria-label="다음에 써볼 표현">
      <h3>다음에 써볼 표현</h3>
      {items.map((item) => (
        <article key={item.phrase} className="space-y-4 rounded-lg border p-5">
          <div className="space-y-1">
            <span className="field-label">내가 한 말</span>
            <blockquote lang="en">{item.quote}</blockquote>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold" lang="en">
              {item.phrase}
            </h4>
            <p className="text-sm">{item.meaning}</p>
            <p className="text-sm text-muted-foreground">{item.reason}</p>
          </div>
          <SpeakableText
            heading={<span className="field-label">내 답변에 써 보면</span>}
            text={item.example}
            label="예문 듣기"
            className="improved-sentence"
          />
          <div className="space-y-1 border-t pt-3">
            <span className="field-label">다시 말해 보기</span>
            <p className="text-sm">{item.practice}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
