"use client";
import { getTargetProfile } from "@/lib/target-profiles";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  FileQuestion,
  Headphones,
  Mic,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Grid, GridItem } from "@/components/layout/stack";
import { PageHeader, PageSection } from "@/components/layout/page";
import { RecordsTable } from "./records-table";
import type { ExamSummary, WorkspaceView } from "@/lib/workspace";
import { TARGET_GRADES } from "@/lib/workspace";

export function Dashboard({
  records,
  target,
  busy,
  onTargetChange,
  onStart,
  onPractice,
  onNavigate,
  onOpen,
}: {
  records: ExamSummary[];
  target: string;
  busy: boolean;
  onTargetChange: (value: string) => void;
  onStart: () => void;
  onPractice: (id?: string) => void;
  onNavigate: (view: WorkspaceView) => void;
  onOpen: (id: string) => void;
}) {
  const completed = records.filter((r) => r.status === "completed"),
    active = records.find((r) => r.status !== "completed"),
    lastRange = completed.find((r) => r.range)?.range;
  const stats = [
    { label: "완료한 시험", value: `${completed.length}`, unit: "회" },
    {
      label: "누적 발화 시간",
      value: `${Math.round(completed.reduce((sum, r) => sum + r.duration, 0) / 60)}`,
      unit: "분",
    },
    { label: "최근 AI 학습 추정", value: lastRange || "평가 전", unit: "" },
  ];
  return (
    <div className="page-stack">
      <PageHeader
        title="학습 홈"
        description="모의시험을 시작하거나 지난 답변을 복습하세요."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("example")}
          >
            교정 예시 보기
          </Button>
        }
      />
      <div className="workspace-metrics">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-2">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="flex items-baseline gap-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {stat.value}
              <span className="text-sm font-normal text-muted-foreground">
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>
      <Grid>
        <GridItem span={8}>
          <div className="space-y-8">
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg">실전 모의시험</CardTitle>
                  <Badge variant="secondary">시험 환경 연습</Badge>
                </div>
                <CardDescription className="leading-6">
                  배경 설문과 장비 점검을 마친 뒤, 실제 시험 순서에 맞춰 영어로
                  답변합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="size-4" />
                    40분
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileQuestion className="size-4" />
                    12 또는 15문항
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Mic className="size-4" />
                    음성 녹음
                  </span>
                </div>
                <Separator />
                <ol className="grid gap-3 text-sm sm:grid-cols-3">
                  {[
                    "배경 설문·자기평가",
                    "장비 점검·시험 안내",
                    "1·2차 세션 응시",
                  ].map((text, i) => (
                    <li className="flex items-center gap-2" key={text}>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      {text}
                    </li>
                  ))}
                </ol>
              </CardContent>
              <CardFooter className="flex-col items-start justify-between gap-4 border-t sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-muted-foreground">
                  7문항 후 난이도 재선택 · 최대 2회 청취
                </p>
                <Button
                  disabled={busy}
                  onClick={active ? () => onOpen(active.id) : onStart}
                >
                  {active ? "시험 이어가기" : "실전 모의시험 시작"}
                  <ArrowRight />
                </Button>
              </CardFooter>
            </Card>
            <PageSection
              title="최근 학습"
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("history")}
                >
                  전체 기록
                  <ArrowRight />
                </Button>
              }
            >
              {records.length ? (
                <RecordsTable
                  records={records.slice(0, 5)}
                  busy={busy}
                  onOpen={onOpen}
                />
              ) : (
                <div className="rounded-lg border">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Headphones />
                      </EmptyMedia>
                      <EmptyTitle className="text-base">
                        아직 학습 기록이 없습니다
                      </EmptyTitle>
                      <EmptyDescription>
                        모의시험이나 한 문항 연습을 마치면
                        <br />
                        녹음과 피드백을 여기서 확인할 수 있습니다.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </PageSection>
          </div>
        </GridItem>
        <GridItem span={4}>
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>연습 설정</CardTitle>
                <CardDescription>
                  목표 등급을 설정하고 연습하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-grade">목표 등급</Label>
                  <Select value={target} onValueChange={onTargetChange}>
                    <SelectTrigger id="target-grade" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {getTargetProfile(target)?.summary}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  새로 시작하는 연습의 AI 피드백에 반영합니다. 기존 기록은 당시
                  목표를 유지하며, 시험 난이도는 준비 단계에서 따로 선택합니다.
                </p>
              </CardContent>
            </Card>
            <PageSection title="한 문항 연습">
              <div className="divide-y rounded-lg border">
                {[
                  {
                    id: "home-description-0",
                    label: "집과 일상 묘사",
                    type: "묘사",
                  },
                  {
                    id: "travel-past-0",
                    label: "기억에 남는 여행",
                    type: "경험",
                  },
                  {
                    id: "hotel-roleplay",
                    label: "호텔 예약 상황",
                    type: "롤플레이",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm transition-colors hover:bg-muted/50"
                    onClick={() => onPractice(item.id)}
                  >
                    <span className="space-y-1">
                      <span className="block font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.type}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate("bank")}
              >
                <BookOpen />
                문제 라이브러리
              </Button>
            </PageSection>
          </div>
        </GridItem>
      </Grid>
    </div>
  );
}
