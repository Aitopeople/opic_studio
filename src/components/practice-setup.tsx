"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Mic } from "lucide-react";
import { PageHeader } from "./layout/page";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { TYPE_LABELS, type Question } from "@/lib/types";

export function PracticeSetup({
  question,
  signedIn,
  busy,
  onStart,
  onConnect,
  onCancel,
}: {
  question: Question;
  signedIn: boolean;
  busy: boolean;
  onStart: () => Promise<void>;
  onConnect: () => void;
  onCancel: () => void;
}) {
  const [consent, setConsent] = useState(false),
    [checking, setChecking] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function start() {
    setChecking(true);
    setError(null);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "이 브라우저에서는 녹음할 수 없습니다. localhost에서 최신 Chrome·Edge를 이용해 주세요.",
        );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      stream.getTracks().forEach((track) => track.stop());
      await onStart();
    } catch (e) {
      setError(
        e instanceof DOMException &&
          (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
          ? "마이크 권한을 허용한 뒤 다시 시작해 주세요."
          : e instanceof Error
            ? e.message
            : "마이크를 확인하고 다시 시작해 주세요.",
      );
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        title="한 문항 연습"
        description="선택한 문제에 답변하고 녹음과 피드백을 복습하세요."
      />
      <div className="max-w-3xl space-y-6">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{question.topicLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                {TYPE_LABELS[question.type]}
              </span>
            </div>
            <CardTitle className="pt-2 text-base">연습할 질문</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p lang="en" className="text-lg leading-8">
              {question.prompt}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Ava의 질문을 듣고 답변합니다. 연습 중 질문 원문과 답변 힌트를
              확인할 수 있으며, 한 번 답변하면 바로 복습 화면으로 이동합니다.
            </p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            녹음과 전사문은 내 계정에 저장됩니다. 자동 전사에 브라우저 공급자의
            음성 인식 서비스를 사용할 수 있습니다. AI 평가를 요청하면 질문과
            전사문을 OpenAI에 전송하고 본인의 ChatGPT 구독 사용량을 사용합니다.
          </p>
          <div className="flex items-start gap-3">
            <Checkbox
              id="practice-consent"
              checked={consent}
              disabled={checking || busy}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="practice-consent"
              className="text-sm leading-6 font-normal"
            >
              녹음 저장·음성 인식 서비스·AI 평가의 외부 전송을 확인했습니다.
            </Label>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            연습 시작 시 마이크 권한을 확인합니다. 이 단계에서는 녹음을 저장하지
            않습니다.
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            disabled={checking || busy}
            onClick={onCancel}
          >
            <ArrowLeft />
            문제 목록
          </Button>
          {signedIn ? (
            <Button
              disabled={!consent || checking || busy}
              onClick={() => void start()}
            >
              {checking || busy ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Mic />
              )}
              {checking || busy ? "연습 준비 중…" : "연습 시작"}
            </Button>
          ) : (
            <Button onClick={onConnect}>
              ChatGPT 연결 후 연습
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
