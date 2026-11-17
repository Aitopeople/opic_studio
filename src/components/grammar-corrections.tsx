import { HStack, VStack } from "./layout/stack";
import type { Evaluation } from "@/lib/types";
import { SpeakableText } from "./speech-playback";

export function GrammarCorrections({
  items,
}: {
  items: NonNullable<Evaluation["grammar"]>;
}) {
  return (
    <>
      {items.map((item, index) => (
        <VStack gap={4} className="grammar-card" key={index}>
          <HStack justify="between" gap={3} wrap>
            <h3>문법·표현 점검</h3>
            <span className="badge neutral">
              {item.kind === "error" ? "문법 수정" : "더 자연스러운 표현"}
            </span>
          </HStack>
          <VStack gap={2}>
            <span className="field-label">원문</span>
            <p lang="en" className="grammar-original">
              {item.original}
            </p>
          </VStack>
          <SpeakableText
            heading={
              <span className="field-label">
                {item.kind === "error"
                  ? "최소한으로 고치면"
                  : "이렇게도 말할 수 있어요"}
              </span>
            }
            text={item.corrected}
            label={item.kind === "error" ? "교정문 듣기" : "표현 제안 듣기"}
            className="grammar-corrected"
          />
          <p className="caption">{item.explanation}</p>
        </VStack>
      ))}
    </>
  );
}
