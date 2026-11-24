"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  Loader2,
  PencilLine,
  SpellCheck,
} from "lucide-react";
import { PageHeader, PageSection } from "@/components/layout/page";
import { Grid, GridItem } from "@/components/layout/stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  CONCEPT_STATUS,
  GrammarConceptSheet,
  type ConceptTab,
} from "@/components/grammar-concept-sheet";
import { api } from "@/lib/api";
import {
  getGrammarConcept,
  type GrammarConceptId,
} from "@/lib/grammar-concepts";
import {
  IMPROVING_AFTER_CHANCES,
  type GrammarProfile,
} from "@/lib/grammar-profile";
import { markSpans } from "@/lib/grammar-drill";
import { dateLabel } from "@/lib/utils";

export function GrammarNotes({
  signedIn,
  onConnect,
  onOpenRecord,
}: {
  signedIn: boolean;
  onConnect: () => void;
  onOpenRecord: (id: string) => void;
}) {
  const [profile, setProfile] = useState<GrammarProfile | null>(null),
    [loading, setLoading] = useState(signedIn),
    [error, setError] = useState<string | null>(null),
    [sheet, setSheet] = useState<{
      id: GrammarConceptId;
      tab: ConceptTab;
      open: boolean;
    }>();
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    api<{ profile: GrammarProfile }>("/api/grammar")
      .then((data) => {
        if (active) setProfile(data.profile);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [signedIn]);
  const concepts = profile?.concepts || [];
  const open = (id: GrammarConceptId, tab: ConceptTab) =>
    setSheet({ id, tab, open: true });
  return (
    <div className="page-stack">
      <PageHeader
        title="문법 노트"
        description="AI 문법 점검에서 나온 오류를 개념별로 모았어요. 반복되는 개념부터 규칙을 익히고 내 문장을 고쳐 써 보세요."
      />
      {!signedIn ? (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SpellCheck />
            </EmptyMedia>
            <EmptyTitle>계정을 연결해 문법 노트를 확인하세요</EmptyTitle>
            <EmptyDescription>
              답변을 평가받으면 문법 오류가 개념별로 이곳에 모여요.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={onConnect}>ChatGPT 연결</Button>
        </Empty>
      ) : loading ? (
        <div className="loading-state" role="status">
          <Loader2 className="size-6 animate-spin" />
          <p>문법 노트를 모으고 있습니다.</p>
        </div>
      ) : error ? (
        <div className="notice error" role="alert">
          {error}
        </div>
      ) : (
        profile && (
          <>
            <Grid>
              <GridItem span={4}>
                <Card className="metric-card gap-2 px-6 shadow-none">
                  <span className="caption">문법을 점검한 답변</span>
                  <strong>{profile.checkedAnswers}</strong>
                  <span className="caption">새 기준으로 점검한 답변 수</span>
                </Card>
              </GridItem>
              <GridItem span={4}>
                <Card className="metric-card gap-2 px-6 shadow-none">
                  <span className="caption">반복 오류 개념</span>
                  <strong>
                    {concepts.filter((c) => c.status === "repeated").length}
                  </strong>
                  <span className="caption">먼저 연습하면 좋은 개념</span>
                </Card>
              </GridItem>
              <GridItem span={4}>
                <Card className="metric-card gap-2 px-6 shadow-none">
                  <span className="caption">최근 답변에서 안 나온 개념</span>
                  <strong>
                    {concepts.filter((c) => c.status === "improving").length}
                  </strong>
                  <span className="caption">쓸 기회가 있던 답변 기준</span>
                </Card>
              </GridItem>
            </Grid>
            {profile.unchecked.length > 0 && (
              <div className="notice" data-unchecked-records>
                <SpellCheck size={18} />
                <div className="space-y-3">
                  <p>
                    새 기준으로 문법을 점검하지 않은 평가 기록이{" "}
                    {profile.unchecked.length}개 있어요. 복습 화면에서{" "}
                    <strong>문법 다시 점검</strong>을 누르면 문법 노트에
                    반영됩니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.unchecked.slice(0, 6).map((record) => (
                      <Button
                        key={record.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenRecord(record.id)}
                      >
                        {dateLabel(record.createdAt)} · {record.label}
                        <ArrowUpRight />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {concepts.length === 0 ? (
              <Empty className="min-h-64 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpenCheck />
                  </EmptyMedia>
                  <EmptyTitle>아직 문법 노트가 비어 있어요</EmptyTitle>
                  <EmptyDescription>
                    {profile.unchecked.length
                      ? "위 기록에서 문법을 다시 점검하면 오류가 개념별로 모여요."
                      : profile.checkedAnswers
                        ? "지금까지 점검에서 확인된 문법 오류가 없어요."
                        : "답변을 녹음하고 AI 평가를 받으면 문법 오류가 개념별로 모여요."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <PageSection
                title="개념별 오류"
                description="반복 오류부터 보여 줍니다. 표현 제안은 오류 횟수에 넣지 않아요."
              >
                <Grid>
                  {concepts.map((stat) => {
                    const concept = getGrammarConcept(stat.id)!;
                    const latest =
                      stat.occurrences.find((o) => o.kind === "error") ||
                      stat.occurrences[0];
                    return (
                      <GridItem span={6} key={stat.id}>
                        <Card
                          className="h-full shadow-none"
                          data-concept-card={stat.id}
                        >
                          <CardHeader className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <CardTitle className="text-base">
                                {concept.title}
                              </CardTitle>
                              <Badge
                                variant={
                                  stat.status === "repeated"
                                    ? "default"
                                    : "secondary"
                                }
                                data-concept-status={stat.status}
                              >
                                {CONCEPT_STATUS[stat.status].label}
                              </Badge>
                            </div>
                            <CardDescription className="leading-6">
                              {concept.rule}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-xs leading-6 text-muted-foreground tabular-nums">
                              {stat.errors > 0
                                ? `문법 수정 ${stat.errors}개 · 오류가 나온 답변 ${stat.answersWithError}개`
                                : `표현 제안 ${stat.suggestions}개`}
                              {stat.lastErrorAt
                                ? ` · 최근 ${dateLabel(stat.lastErrorAt)}`
                                : ""}
                            </p>
                            {latest && (
                              <div className="space-y-1 rounded-md bg-muted/40 p-3">
                                <p lang="en" className="grammar-sentence">
                                  {markSpans(latest.sentence, [
                                    latest.original,
                                  ]).map((part, i) =>
                                    part.marked ? (
                                      <mark key={i} className="grammar-mark">
                                        {part.text}
                                      </mark>
                                    ) : (
                                      <span key={i}>{part.text}</span>
                                    ),
                                  )}
                                </p>
                                <p lang="en" className="grammar-corrected">
                                  → {latest.corrected}
                                </p>
                              </div>
                            )}
                            {stat.errors > 0 && (
                              <p className="text-xs leading-6 text-muted-foreground">
                                마지막 오류 뒤 이 개념을 쓸 기회가 있었던 답변{" "}
                                {stat.chancesSinceLastError}개
                              </p>
                            )}
                          </CardContent>
                          <CardFooter className="mt-auto flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => open(stat.id, "learn")}
                            >
                              <BookOpenCheck />
                              개념 보기
                            </Button>
                            {stat.errors > 0 && (
                              <Button
                                size="sm"
                                onClick={() => open(stat.id, "drill")}
                              >
                                <PencilLine />
                                고쳐 쓰기
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      </GridItem>
                    );
                  })}
                </Grid>
                <p className="caption">
                  ‘최근 답변에서 안 나옴’은 마지막 오류 뒤 그 개념을 쓸 기회가
                  있었던 답변(예: 과거 시제는 과거 경험·비교 문항){" "}
                  {IMPROVING_AFTER_CHANCES}개 이상에서 다시 나오지 않았다는
                  뜻이에요. 익혔다는 판정은 아니에요.
                </p>
              </PageSection>
            )}
          </>
        )
      )}
      <GrammarConceptSheet
        conceptId={sheet?.open ? sheet.id : null}
        initialTab={sheet?.tab}
        stat={concepts.find((c) => c.id === sheet?.id)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSheet((s) => (s ? { ...s, open: false } : s));
        }}
        onOpenRecord={(id) => {
          setSheet((s) => (s ? { ...s, open: false } : s));
          onOpenRecord(id);
        }}
      />
    </div>
  );
}
