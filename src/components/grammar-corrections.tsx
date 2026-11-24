import { BookOpenCheck } from "lucide-react";
import { HStack, VStack } from "./layout/stack";
import { Button } from "./ui/button";
import type { GrammarItem } from "@/lib/types";
import {
  getGrammarConcept,
  type GrammarConceptId,
} from "@/lib/grammar-concepts";
import { conceptCounts, sentenceContext } from "@/lib/grammar-profile";
import { markSpans } from "@/lib/grammar-drill";
import { SpeakableText } from "./speech-playback";

export function GrammarCorrections({
  items,
  transcript,
  onConcept,
}: {
  items: GrammarItem[];
  // When given, each card shows the whole sentence around its correction.
  transcript?: string;
  onConcept?: (id: GrammarConceptId) => void;
}) {
  const patterns = conceptCounts(items);
  return (
    <>
      {patterns.length > 0 && (
        <VStack gap={2} data-grammar-patterns>
          <span className="field-label">이 답변의 문법 패턴</span>
          <div className="flex flex-wrap gap-2">
            {patterns.map(([id, count]) => (
              <Button
                key={id}
                size="sm"
                variant="outline"
                disabled={!onConcept}
                onClick={() => onConcept?.(id)}
              >
                {getGrammarConcept(id)?.title}
                <span className="tabular-nums text-muted-foreground">
                  {count}
                </span>
              </Button>
            ))}
          </div>
        </VStack>
      )}
      {items.map((item, index) => {
        const context = transcript
          ? sentenceContext(transcript, item, items)
          : null;
        return (
          <VStack gap={4} className="grammar-card" key={index}>
            <HStack justify="between" gap={3} wrap>
              <h3>문법·표현 점검</h3>
              <HStack gap={2} wrap>
                {item.transcriptionDoubt && (
                  <span className="badge" title="전사 오류일 수 있어요">
                    녹음 확인 필요
                  </span>
                )}
                <span className="badge neutral">
                  {item.kind === "error" ? "문법 수정" : "더 자연스러운 표현"}
                </span>
              </HStack>
            </HStack>
            <VStack gap={2}>
              <span className="field-label">원문</span>
              {context ? (
                <p lang="en" className="grammar-sentence">
                  {markSpans(context.sentence, [item.original]).map(
                    (part, i) =>
                      part.marked ? (
                        <mark key={i} className="grammar-mark">
                          {part.text}
                        </mark>
                      ) : (
                        <span key={i}>{part.text}</span>
                      ),
                  )}
                </p>
              ) : (
                <p lang="en" className="grammar-original">
                  {item.original}
                </p>
              )}
            </VStack>
            {context && (
              <p lang="en" className="grammar-change">
                <span className="grammar-original">{item.original}</span>
                <span aria-hidden> → </span>
                <span className="sr-only">, 고친 표현: </span>
                <span className="grammar-corrected">{item.corrected}</span>
              </p>
            )}
            <SpeakableText
              heading={
                <span className="field-label">
                  {item.kind === "naturalness"
                    ? "이렇게도 말할 수 있어요"
                    : context
                      ? "고친 문장"
                      : "고친 표현"}
                </span>
              }
              text={context ? context.correctedSentence : item.corrected}
              label={item.kind === "error" ? "교정문 듣기" : "표현 제안 듣기"}
              className="grammar-corrected"
            />
            <p className="caption">{item.explanation}</p>
            {item.concepts?.length ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {item.concepts.map((id) => (
                  <Button
                    key={id}
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    disabled={!onConcept}
                    onClick={() => onConcept?.(id)}
                  >
                    <BookOpenCheck />
                    {getGrammarConcept(id)?.title} 개념 보기
                  </Button>
                ))}
              </div>
            ) : null}
          </VStack>
        );
      })}
    </>
  );
}
