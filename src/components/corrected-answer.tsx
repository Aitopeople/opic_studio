import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { SpeakableText } from "./speech-playback";
import { correctedTranscript } from "@/lib/corrected-transcript";
import type { Evaluation } from "@/lib/types";

export function CorrectedAnswer({
  transcript,
  items,
}: {
  transcript: string;
  items: NonNullable<Evaluation["grammar"]>;
}) {
  const corrected = correctedTranscript(transcript, items);
  if (!transcript.trim()) return null;
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {corrected.applied
              ? "문법 수정만 적용한 전체 답변"
              : "전체 답변 듣기"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SpeakableText
          text={corrected.text}
          label="전체 답변 듣기"
          className="text-sm leading-8"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {corrected.applied
            ? `${corrected.applied}개 문법 수정만 반영했습니다. 원문의 사실과 이야기 순서를 유지하며, 선택적인 표현 제안은 제외합니다.`
            : "원문을 그대로 읽습니다. 수정할 부분이 있다면 아래 문장별 교정도 확인해 주세요."}
        </p>
        {corrected.skipped > 0 && (
          <p className="text-xs leading-5 text-muted-foreground">
            원문에서 위치를 분명하게 특정할 수 없는 수정 {corrected.skipped}개는
            반영하지 않았습니다. 해당 문장은 문장별 교정에서 들을 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
