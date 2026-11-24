"use client";
import { useState } from "react";
import { ArrowUpRight, Lightbulb, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { SpeechListenButton } from "./speech-playback";
import { GrammarDrill } from "./grammar-drill";
import {
  getGrammarConcept,
  type GrammarConceptId,
} from "@/lib/grammar-concepts";
import {
  IMPROVING_AFTER_CHANCES,
  type ConceptStat,
  type ConceptStatus,
} from "@/lib/grammar-profile";
import { splitAround } from "@/lib/grammar-drill";
import { TYPE_LABELS } from "@/lib/types";
import { dateLabel } from "@/lib/utils";

export type ConceptTab = "learn" | "mine" | "drill";
export const CONCEPT_STATUS: Record<
  ConceptStatus,
  { label: string; description: string }
> = {
  repeated: {
    label: "반복 오류",
    description: "여러 답변에서 나왔거나 한 답변에서 세 번 이상 나왔어요.",
  },
  single: {
    label: "한 번 나옴",
    description: "아직 한 번만 나왔어요. 다음 답변에서 다시 확인해요.",
  },
  improving: {
    label: "최근 답변에서 안 나옴",
    description: `마지막 오류 뒤 이 개념을 쓸 기회가 있었던 답변 ${IMPROVING_AFTER_CHANCES}개 이상에서 다시 나오지 않았어요. 익혔다는 판정은 아니에요.`,
  },
  suggestion: {
    label: "표현 제안만",
    description: "문법 오류는 없고 더 자연스러운 표현 제안만 있어요.",
  },
};

export function GrammarConceptSheet({
  conceptId,
  stat,
  loading = false,
  showMine = true,
  initialTab = "learn",
  onOpenChange,
  onOpenRecord,
}: {
  conceptId: GrammarConceptId | null;
  stat?: ConceptStat;
  loading?: boolean;
  showMine?: boolean;
  initialTab?: ConceptTab;
  onOpenChange: (open: boolean) => void;
  onOpenRecord?: (examId: string) => void;
}) {
  const [tab, setTab] = useState<ConceptTab>(initialTab),
    [shown, setShown] = useState(conceptId),
    [request, setRequest] = useState(`${conceptId}|${initialTab}`);
  // Reset the tab for each new request, and keep content during the close animation.
  if (`${conceptId}|${initialTab}` !== request) {
    setRequest(`${conceptId}|${initialTab}`);
    if (conceptId) {
      setShown(conceptId);
      setTab(initialTab);
    }
  }
  const concept = shown ? getGrammarConcept(shown) : undefined;
  const errors = stat?.occurrences.filter((o) => o.kind === "error") || [];
  return (
    <Sheet open={Boolean(conceptId && concept)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {concept && (
          <>
            <SheetHeader className="gap-3 border-b p-6 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">문법 개념</Badge>
                {stat && (
                  <Badge
                    variant={
                      stat.status === "repeated" ? "default" : "secondary"
                    }
                    data-concept-status={stat.status}
                  >
                    {CONCEPT_STATUS[stat.status].label}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-lg leading-7">
                {concept.title}
              </SheetTitle>
              <SheetDescription className="leading-6">
                {concept.rule}
              </SheetDescription>
            </SheetHeader>
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as ConceptTab)}
              className="gap-4 p-6"
            >
              {showMine && (
                <TabsList className="w-full">
                  <TabsTrigger value="learn">개념</TabsTrigger>
                  <TabsTrigger value="mine">
                    내 사례 {stat ? stat.occurrences.length : ""}
                  </TabsTrigger>
                  <TabsTrigger value="drill">고쳐 쓰기</TabsTrigger>
                </TabsList>
              )}
              <TabsContent value="learn" className="space-y-6">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-7">
                  {concept.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {concept.examples.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">예문</h3>
                    {concept.examples.map((example) => (
                      <div
                        key={example.wrong}
                        className="space-y-2 rounded-lg border p-4"
                      >
                        <p lang="en" className="grammar-original">
                          <span className="sr-only">원래 표현: </span>
                          {example.wrong}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p lang="en" className="grammar-corrected">
                            <span className="sr-only">학습 예문: </span>
                            {example.right}
                          </p>
                          <SpeechListenButton
                            text={example.right}
                            label="듣기"
                          />
                        </div>
                        <p className="text-xs leading-6 text-muted-foreground">
                          {example.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                  <Lightbulb className="mt-1 size-4 shrink-0" />
                  <p className="text-sm leading-7">{concept.tip}</p>
                </div>
                {stat && (
                  <p className="text-xs leading-6 text-muted-foreground">
                    {CONCEPT_STATUS[stat.status].description}
                  </p>
                )}
              </TabsContent>
              {showMine && (
                <TabsContent value="mine" className="space-y-3">
                  {loading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />내 기록을
                      모으고 있어요.
                    </p>
                  ) : !stat ? (
                    <p className="text-sm leading-7 text-muted-foreground">
                      새 기준으로 문법을 점검한 기록에서 아직 이 개념이 나오지
                      않았어요.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs leading-6 text-muted-foreground">
                        문법 수정 {stat.errors}개 · 표현 제안 {stat.suggestions}
                        개 · 오류가 나온 답변 {stat.answersWithError}개
                      </p>
                      {stat.occurrences.map((item, index) => {
                        const parts = splitAround(item.sentence, item.original);
                        return (
                          <article
                            key={`${item.examId}-${item.question}-${item.original}-${index}`}
                            className="space-y-3 rounded-lg border p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{dateLabel(item.createdAt)}</span>
                              <span aria-hidden>·</span>
                              <span>
                                Q{item.question} {item.topicLabel} ·{" "}
                                {TYPE_LABELS[item.questionType]}
                              </span>
                              <Badge variant="outline">
                                {item.kind === "error"
                                  ? "문법 수정"
                                  : "표현 제안"}
                              </Badge>
                              {item.transcriptionDoubt && (
                                <Badge variant="outline">녹음 확인 필요</Badge>
                              )}
                            </div>
                            <p lang="en" className="text-sm leading-8">
                              {parts.before}
                              {parts.match && (
                                <mark className="grammar-mark">
                                  {parts.match}
                                </mark>
                              )}
                              {parts.after}
                            </p>
                            <p lang="en" className="grammar-corrected">
                              <span className="sr-only">고친 표현: </span>→{" "}
                              {item.corrected}
                            </p>
                            <p className="text-xs leading-6 text-muted-foreground">
                              {item.explanation}
                            </p>
                            {onOpenRecord && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => onOpenRecord(item.examId)}
                              >
                                이 답변 복습하기
                                <ArrowUpRight />
                              </Button>
                            )}
                          </article>
                        );
                      })}
                    </>
                  )}
                </TabsContent>
              )}
              {showMine && (
                <TabsContent value="drill">
                  {loading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      연습 문장을 준비하고 있어요.
                    </p>
                  ) : (
                    <GrammarDrill key={shown} items={errors} />
                  )}
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
