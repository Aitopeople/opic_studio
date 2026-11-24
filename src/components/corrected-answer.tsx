import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { SpeakableText } from "./speech-playback";
import { correctedTranscript } from "@/lib/corrected-transcript";
import type { Evaluation } from "@/lib/types";

export function CorrectedAnswer({
  transcript,
  items,
  legacy = false,
}: {
  transcript: string;
  items: NonNullable<Evaluation["grammar"]>;
  legacy?: boolean;
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
        {legacy && (
          <p className="text-xs leading-5 text-muted-foreground">
            이전 기준의 문법 점검 결과라 고치지 못한 오류가 남아 있을 수
            있습니다. 위의 문법 다시 점검을 받으면 모든 문장을 새로 확인합니다.
          </p>
        )}
        {corrected.skipped > 0 && (
          <p className="text-xs leading-5 text-muted-foreground">
            위치가 겹치거나 불분명한 교정, 또는 녹음 확인이 필요한 교정{" "}
            {corrected.skipped}개는 아래 카드에서 개별 제안으로 확인할 수
            있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
