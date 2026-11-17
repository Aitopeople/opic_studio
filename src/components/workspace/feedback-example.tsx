import { ArrowLeft } from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page";
import { Grid, GridItem } from "@/components/layout/stack";
import { GrammarCorrections } from "@/components/grammar-corrections";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FEEDBACK_EXAMPLE as example } from "@/lib/feedback-example";
import { SpeechPlaybackSettings } from "@/components/speech-playback";
import { CorrectedAnswer } from "@/components/corrected-answer";
import { TargetFeedbackPanel } from "@/components/target-feedback";

export function FeedbackExample({ onBack }: { onBack: () => void }) {
  return (
    <div className="page-stack">
      <PageHeader
        title="교정 예시"
        description="전사문 한 개의 문법 교정, 표현 제안과 IH 목표 피드백을 살펴보는 예시입니다."
        actions={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft />
            문제 라이브러리
          </Button>
        }
      />
      <Alert>
        <AlertTitle>임의로 작성한 예시 데이터</AlertTitle>
        <AlertDescription>
          전사문과 피드백을 미리 작성했습니다. 앱의 AI를 호출한 결과가 아니며,
          내 시험 기록에 저장되지 않습니다.
        </AlertDescription>
      </Alert>
      <SpeechPlaybackSettings />
      <Grid>
        <GridItem span={8}>
          <div className="space-y-8">
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>예시 전사문</CardTitle>
                  <Badge variant="secondary">여행 · 과거 경험</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">질문</p>
                  <p lang="en" className="text-sm leading-7">
                    {example.prompt}
                  </p>
                </div>
                <div className="transcript" lang="en">
                  {example.transcript}
                </div>
              </CardContent>
            </Card>
            <PageSection
              title="문장별 교정"
              description="실제 답변 복습 화면과 같은 교정 카드입니다. 원문·수정문·이유를 함께 제공합니다."
            >
              <GrammarCorrections items={example.grammar} />
            </PageSection>
            <CorrectedAnswer
              transcript={example.transcript}
              items={example.grammar}
            />
          </div>
        </GridItem>
        <GridItem span={4}>
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>피드백 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm leading-7">{example.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">문법 수정 4개</Badge>
                  <Badge variant="outline">선택적 표현 1개</Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  한 문항의 전사문으로 등급을 추정하지 않습니다. 발음·억양도 이
                  예시에서 평가하지 않습니다.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>잘한 점</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-7">
                  {example.strengths.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>다음 연습</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-3 pl-4 text-sm leading-7">
                  {example.practice.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </GridItem>
      </Grid>
      <TargetFeedbackPanel target="IH" report={example.targetFeedback} />
    </div>
  );
}
