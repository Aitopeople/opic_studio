import { ArrowRight, Loader2, Target } from "lucide-react";
import type { TargetFeedback as TargetReport } from "@/lib/types";
import {
  getTargetProfile,
  TARGET_PROFILE_VERSION,
  TARGET_SOURCES,
} from "@/lib/target-profiles";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const STATUS = {
  demonstrated: "전사문에서 확인",
  developing: "보완하며 연습",
  not_observed: "확인 기회·근거 부족",
};
export function TargetFeedbackPanel({
  target,
  report: saved,
  onSelectQuestion,
  onEvaluate,
  busy = false,
  disabled = false,
}: {
  target: string;
  report?: TargetReport;
  onSelectQuestion?: (index: number) => void;
  onEvaluate?: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const profile = getTargetProfile(target);
  if (!profile) return null;
  const report =
    saved?.target === target && saved.version === TARGET_PROFILE_VERSION
      ? saved
      : undefined;
  return (
    <Card className="shadow-none target-feedback">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-base">
              <Target className="size-4" />
              {target} 목표 피드백
            </h2>
          </CardTitle>
          <Badge variant="outline">전사문 기반 학습 목표</Badge>
        </div>
        <CardDescription className="leading-6">
          {report?.summary || profile.summary}
        </CardDescription>
        <p className="text-xs leading-5 text-muted-foreground">
          이 기록에 저장된 목표 {target}를 기준으로 봅니다. 항목의 확인 여부는
          이 답변의 근거이며 목표 등급 도달 판정이 아닙니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {profile.criteria.map((criterion) => {
            const item = report?.criteria.find(
              (item) => item.id === criterion.id,
            );
            return (
              <section
                key={criterion.id}
                className="rounded-lg border p-4 space-y-3"
                data-target-criterion={criterion.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{criterion.title}</h3>
                  {item && (
                    <Badge
                      variant={
                        item.status === "demonstrated" ? "secondary" : "outline"
                      }
                      data-target-status={item.status}
                    >
                      {STATUS[item.status]}
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  {criterion.description}
                </p>
                {item && (
                  <>
                    <p className="text-sm leading-7">{item.feedback}</p>
                    {item.evidence.map((e, i) => (
                      <div
                        key={i}
                        className="rounded-md bg-muted/40 p-3 space-y-2"
                      >
                        {onSelectQuestion ? (
                          <Button
                            size="sm"
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => onSelectQuestion(e.question - 1)}
                          >
                            Q{e.question} 답변 보기
                            <ArrowRight size={12} />
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Q{e.question} 전사 근거
                          </p>
                        )}
                        <blockquote
                          lang="en"
                          className="text-sm leading-7 break-words"
                        >
                          “{e.quote}”
                        </blockquote>
                      </div>
                    ))}
                    <div className="border-t pt-3 space-y-1">
                      <p className="text-xs font-medium">다음 말하기 연습</p>
                      <p className="text-sm leading-7">{item.practice}</p>
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
        {!report && (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              AI 평가를 요청하면 각 목표에 대해 전사 근거, 보완할 점과 다음
              연습을 제공합니다. 질문이 요구하지 않은 능력은 부족하다고 단정하지
              않습니다.
            </p>
            {onEvaluate && (
              <>
                <Button
                  variant="outline"
                  disabled={busy || disabled}
                  onClick={onEvaluate}
                >
                  {busy ? <Loader2 className="animate-spin" /> : <Target />}
                  {busy
                    ? "목표 피드백 작성 중…"
                    : "목표 피드백 포함해 다시 평가"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  기존 기록의 재평가는 본인 ChatGPT 구독 사용량을 사용합니다.
                  버튼을 누를 때만 요청합니다.
                </p>
              </>
            )}
          </div>
        )}
        <details className="text-xs leading-6 text-muted-foreground">
          <summary className="cursor-pointer font-medium">
            목표 기준과 출처
          </summary>
          <div className="pt-2 space-y-2">
            <p>{profile.note}</p>
            <p>
              발음·억양·말하기 속도·멈춤은 전사문으로 평가하지 않습니다. 질문의
              범위와 전사 오류를 함께 고려합니다.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {TARGET_SOURCES.map((source) => (
                <a
                  key={source.url}
                  className="underline underline-offset-4"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
