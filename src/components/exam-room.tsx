"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  Headphones,
  LogOut,
  Mic,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react";
import { HStack, VStack, Grid, GridItem } from "./layout/stack";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Waveform } from "./waveform";
import { useRecorder } from "@/hooks/use-recorder";
import { api, answerForm } from "@/lib/api";
import { clock } from "@/lib/utils";
import { TYPE_LABELS, type PublicExam } from "@/lib/types";

export function ExamRoom({
  initial,
  onComplete,
}: {
  initial: PublicExam;
  onComplete: (exam: PublicExam) => void;
}) {
  const [exam, setExam] = useState(initial),
    [remaining, setRemaining] = useState(
      Math.max(0, (initial.deadline - Date.now()) / 1000),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [speaking, setSpeaking] = useState(false),
    [exitOpen, setExitOpen] = useState(false),
    [skipOpen, setSkipOpen] = useState(false),
    [hasHeard, setHasHeard] = useState(false),
    [showHint, setShowHint] = useState(false),
    [expired, setExpired] = useState(false);
  const recorder = useRecorder({ transcribe: true }),
    latestExam = useRef(exam),
    finalizing = useRef(false),
    playback = useRef(0),
    speakingRef = useRef(false);
  const strict = exam.config.mode === "simulation",
    question = exam.questions[exam.index];
  latestExam.current = exam;
  function update(next: PublicExam) {
    setExam(next);
    if (next.status === "completed") onComplete(next);
  }
  const finish = useCallback(
    async (withClip = true) => {
      if (finalizing.current) return;
      finalizing.current = true;
      setBusy(true);
      setError(null);
      window.speechSynthesis?.cancel();
      speakingRef.current = false;
      setSpeaking(false);
      try {
        const clip = await recorder.stop();
        const current = latestExam.current;
        if (withClip && clip && current.status === "active") {
          const result = await api<{ exam: PublicExam }>(
            `/api/exams/${current.id}/answer`,
            {
              method: "POST",
              body: answerForm(
                clip,
                current.index,
                recorder.seconds,
                recorder.getTranscript(),
              ),
            },
          );
          if (result.exam.status === "completed") {
            recorder.reset();
            onComplete(result.exam);
            return;
          }
        }
        const result = await api<{ exam: PublicExam }>(
          `/api/exams/${current.id}`,
          { method: "PATCH", body: JSON.stringify({ action: "finish" }) },
        );
        recorder.reset();
        onComplete(result.exam);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
        finalizing.current = false;
      }
    },
    [recorder, onComplete],
  );
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        (latestExam.current.deadline - Date.now()) / 1000,
      );
      setRemaining(left);
      if (left === 0) {
        setExpired(true);
        clearInterval(timer);
        void finishRef.current();
      }
    }, 500);
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", unload);
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    setHasHeard(exam.plays > 0);
    setShowHint(false);
  }, [exam.index]);
  async function listen() {
    if (busy || speakingRef.current || recorder.status !== "idle" || expired)
      return;
    setError(null);
    if (!("speechSynthesis" in window)) {
      setError(
        "질문 음성을 지원하지 않는 브라우저입니다. 최신 Chrome 또는 Edge를 사용해 주세요.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ exam: PublicExam }>(`/api/exams/${exam.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "play" }),
      });
      setExam(result.exam);
      const speech = new SpeechSynthesisUtterance(
        result.exam.questions[result.exam.index].prompt,
      );
      speech.lang = "en-US";
      speech.rate = 0.91;
      const english = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.startsWith("en"));
      speech.voice =
        english.find((v) =>
          /Samantha|Jenny|Aria|Google US English/i.test(v.name),
        ) ||
        english[0] ||
        null;
      const token = ++playback.current;
      speakingRef.current = true;
      setSpeaking(true);
      speech.onend = () => {
        if (playback.current !== token) return;
        speakingRef.current = false;
        setSpeaking(false);
        setHasHeard(true);
      };
      speech.onerror = () => {
        speakingRef.current = false;
        setSpeaking(false);
        setError(
          "질문 음성을 재생하지 못했습니다. 운영체제의 영어 음성 설치 여부를 확인해 주세요. 청취 횟수는 이미 사용되었습니다.",
        );
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(skip = false) {
    if (busy || expired) return;
    setBusy(true);
    setError(null);
    try {
      const clip = skip ? null : await recorder.stop();
      if (!skip && !clip) throw new Error("답변을 녹음한 후 제출해 주세요.");
      const result = await api<{ exam: PublicExam }>(
        `/api/exams/${exam.id}/answer`,
        clip
          ? {
              method: "POST",
              body: answerForm(
                clip,
                exam.index,
                recorder.seconds,
                recorder.getTranscript(),
              ),
            }
          : {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
                "x-question-index": String(exam.index),
                "x-audio-duration": "0",
                "x-skipped": "true",
              },
            },
      );
      recorder.reset();
      setHasHeard(false);
      setSkipOpen(false);
      update(result.exam);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function choose(choice: "easier" | "same" | "harder") {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ exam: PublicExam }>(`/api/exams/${exam.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "adjust", choice }),
      });
      update(result.exam);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="exam-shell">
      <header className="exam-topbar">
        <HStack gap={3}>
          <span className="brand-symbol">
            <span />
            <span />
            <span />
          </span>
          <strong>
            opic<span className="brand-light">studio</span>
          </strong>
          <span className="header-divider" />
          <span className="caption">
            {strict
              ? "실전 모의시험"
              : exam.config.practiceQuestionId
                ? "한 문항 연습"
                : "자유 연습"}
          </span>
        </HStack>
        <HStack gap={6}>
          <span className={remaining < 300 ? "timer danger" : "timer"}>
            <span className="status-dot" />
            {clock(remaining)}
            <small>남은 시간</small>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setExitOpen(true)}>
            <LogOut size={15} />
            종료
          </Button>
        </HStack>
      </header>
      <main className="exam-main">
        <VStack gap={8}>
          <HStack justify="between">
            <VStack gap={2}>
              <span className="eyebrow">
                {exam.config.practiceQuestionId
                  ? "한 문항 연습"
                  : exam.status === "adjustment"
                    ? "SELF ASSESSMENT"
                    : exam.index < 7
                      ? "FIRST SESSION"
                      : "SECOND SESSION"}
              </span>
              <h1>
                {exam.status === "adjustment"
                  ? "다음 질문의 난이도를 선택해 주세요."
                  : `Question ${String(exam.index + 1).padStart(2, "0")}`}
              </h1>
            </VStack>
            <span className="question-count">
              <strong>
                {String(
                  Math.min(exam.index + 1, exam.questions.length),
                ).padStart(2, "0")}
              </strong>
              <span>/ {exam.questions.length}</span>
            </span>
          </HStack>
          <div className="exam-progress" aria-label={`${exam.index}문항 완료`}>
            {exam.questions.map((_, i) => (
              <span
                key={i}
                data-done={i < exam.index}
                data-current={i === exam.index}
              />
            ))}
          </div>
          {error && (
            <div role="alert" className="notice error">
              {error}
              {expired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void finish()}
                >
                  종료 재시도
                </Button>
              )}
            </div>
          )}
          {exam.status === "adjustment" ? (
            <Card className="adjustment-card px-6 shadow-none">
              <VStack gap={8} align="center">
                <span className="icon-tile large">
                  <CircleHelp size={26} />
                </span>
                <VStack gap={3} className="text-center">
                  <h2>첫 번째 세션을 마쳤습니다.</h2>
                  <p className="text-subtle">
                    앞으로 어떤 수준의 질문을 받고 싶으신가요?
                    <br />
                    어려운 질문을 선택하는 것만으로 높은 등급을 받는 것은
                    아닙니다.
                  </p>
                </VStack>
                <Grid className="adjustment-grid">
                  {[
                    {
                      choice: "easier",
                      label: "쉬운 질문",
                      description: "조금 더 편안한 수준으로",
                    },
                    {
                      choice: "same",
                      label: "비슷한 질문",
                      description: "지금과 비슷한 수준으로",
                    },
                    {
                      choice: "harder",
                      label: "어려운 질문",
                      description: "조금 더 복잡한 수준으로",
                    },
                  ].map((c) => (
                    <GridItem span={4} key={c.choice}>
                      <button
                        className="adjust-option"
                        disabled={busy || expired}
                        onClick={() =>
                          void choose(c.choice as "easier" | "same" | "harder")
                        }
                      >
                        <strong>{c.label}</strong>
                        <span>{c.description}</span>
                        <ArrowRight size={18} />
                      </button>
                    </GridItem>
                  ))}
                </Grid>
                <p className="caption">
                  난이도를 고르는 동안에도 전체 시험 시간은 흐릅니다.
                </p>
              </VStack>
            </Card>
          ) : (
            question && (
              <Grid>
                <GridItem span={8}>
                  <Card className="interview-card gap-0 p-0 overflow-hidden shadow-none">
                    <div className="interviewer-stage">
                      <span className="badge neutral">VIRTUAL INTERVIEWER</span>
                      <div
                        className={
                          speaking ? "interviewer speaking" : "interviewer"
                        }
                      >
                        <div className="interviewer-head">
                          <span className="eye left" />
                          <span className="eye right" />
                          <span className="mouth" />
                        </div>
                        <div className="interviewer-body" />
                        <span className="avatar-ring orbit-inner" />
                        <span className="avatar-ring orbit-outer" />
                      </div>
                      <VStack gap={2} align="center">
                        <h2>Ava</h2>
                        <p className="caption">
                          {speaking
                            ? "질문을 듣고 있습니다"
                            : recorder.status === "recording"
                              ? "당신의 이야기를 듣고 있어요"
                              : hasHeard
                                ? "준비되면 답변을 시작해 주세요"
                                : "질문 듣기를 눌러 시작해 주세요"}
                        </p>
                      </VStack>
                    </div>
                    {!strict && (
                      <VStack gap={4} className="practice-question">
                        <HStack gap={2}>
                          <span className="badge">{question.topicLabel}</span>
                          <span className="caption">
                            {TYPE_LABELS[question.type]}
                          </span>
                        </HStack>
                        <p lang="en" className="english-prompt">
                          {question.prompt}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHint((v) => !v)}
                        >
                          <CircleHelp size={15} />
                          {showHint ? "도움말 닫기" : "답변 구성 힌트"}
                        </Button>
                        {showHint && (
                          <div className="notice">{question.hint}</div>
                        )}
                      </VStack>
                    )}
                    <div className="recording-section">
                      <HStack justify="between">
                        <HStack gap={2}>
                          <span
                            className={
                              recorder.status === "recording"
                                ? "record-dot active"
                                : "record-dot"
                            }
                          />
                          <strong className="small">
                            {speaking
                              ? "질문 재생 중"
                              : recorder.status === "recording"
                                ? "답변 녹음 중"
                                : recorder.status === "ready"
                                  ? "답변이 녹음되었습니다"
                                  : "녹음 대기"}
                          </strong>
                        </HStack>
                        <span className="mono caption">
                          {clock(recorder.seconds)}
                        </span>
                      </HStack>
                      <Waveform analyser={recorder.analyser} compact />
                      {recorder.error && (
                        <p role="alert" className="error-text">
                          {recorder.error}
                        </p>
                      )}
                      {recorder.transcriptError && (
                        <p role="status" className="caption">
                          {recorder.transcriptError}
                        </p>
                      )}
                      <HStack justify="center" gap={3} wrap>
                        <Button
                          variant="outline"
                          disabled={
                            busy ||
                            speaking ||
                            exam.plays >= 2 ||
                            recorder.status !== "idle" ||
                            expired
                          }
                          onClick={() => void listen()}
                        >
                          {exam.plays ? (
                            <RotateCcw size={16} />
                          ) : (
                            <Volume2 size={16} />
                          )}
                          {exam.plays ? "다시 듣기" : "질문 듣기"}
                          <span className="button-counter">{exam.plays}/2</span>
                        </Button>
                        {recorder.status === "idle" ? (
                          <Button
                            disabled={!hasHeard || speaking || busy || expired}
                            onClick={() => void recorder.start()}
                          >
                            <Mic size={16} />
                            답변 시작
                          </Button>
                        ) : (
                          <Button
                            disabled={busy || expired}
                            onClick={() => void submit()}
                          >
                            {busy
                              ? "답변 저장 중…"
                              : recorder.status === "recording"
                                ? exam.config.practiceQuestionId
                                  ? "답변 마치고 복습"
                                  : "답변 마치고 다음"
                                : "답변 제출"}
                            <ArrowRight size={16} />
                          </Button>
                        )}
                      </HStack>
                      {recorder.status === "ready" && recorder.url && (
                        <VStack gap={3}>
                          <span className="caption">
                            제출에 실패해도 녹음은 이 화면에 유지됩니다. 다시
                            제출해 주세요.
                          </span>
                          <a
                            href={recorder.url}
                            download="opic-answer-backup"
                            className="text-link small"
                          >
                            현재 녹음 내려받기
                          </a>
                          {!strict && (
                            <>
                              <audio controls src={recorder.url} />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  recorder.reset();
                                  setHasHeard(true);
                                }}
                              >
                                다시 녹음
                              </Button>
                            </>
                          )}
                        </VStack>
                      )}
                    </div>
                  </Card>
                </GridItem>
                <GridItem span={4}>
                  <VStack gap={5}>
                    <Card className="exam-guide px-6 shadow-none">
                      <HStack gap={2}>
                        <Headphones size={18} />
                        <h3>이야기에 집중하세요.</h3>
                      </HStack>
                      <VStack gap={5}>
                        <div>
                          <h4>질문 듣기</h4>
                          <p>
                            질문은 최대 2회 들을 수 있습니다. 녹음을 시작하면
                            다시 듣기가 잠깁니다.
                          </p>
                        </div>
                        <div>
                          <h4>내 속도로 답변하기</h4>
                          <p>
                            문항마다 시간 제한은 없습니다. 전체 남은 시간만
                            확인해 주세요.
                          </p>
                        </div>
                        <div>
                          <h4>다음으로 이동</h4>
                          <p>
                            답변을 마치면 저장 후 다음 질문으로 넘어갑니다. 이전
                            답변은 바꿀 수 없습니다.
                          </p>
                        </div>
                      </VStack>
                    </Card>
                    <div className="small-note">
                      <ShieldCheck size={16} />
                      <p>
                        답변은 계정에 저장되며, 시험 종료 후 다시 들을 수
                        있습니다.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="skip-button"
                      disabled={
                        busy ||
                        speaking ||
                        recorder.status !== "idle" ||
                        expired
                      }
                      onClick={() => setSkipOpen(true)}
                    >
                      이 문항 건너뛰기
                      <ChevronRight size={15} />
                    </Button>
                  </VStack>
                </GridItem>
              </Grid>
            )
          )}
          <HStack justify="center" gap={2}>
            <ShieldCheck size={14} className="muted-icon" />
            <p className="caption">
              독립적인 학습용 모의시험 · 공식 OPIc 평가가 아닙니다.
            </p>
          </HStack>
        </VStack>
      </main>
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent>
          <VStack gap={5}>
            <DialogTitle>시험을 종료할까요?</DialogTitle>
            <DialogDescription>
              현재 녹음과 제출한 답변을 저장하고 복습 화면으로 이동합니다.
              종료한 시험은 이어서 응시할 수 없습니다.
            </DialogDescription>
            <HStack justify="end">
              <Button variant="outline" onClick={() => setExitOpen(false)}>
                계속 응시
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  setExitOpen(false);
                  void finish();
                }}
              >
                저장하고 종료
              </Button>
            </HStack>
          </VStack>
        </DialogContent>
      </Dialog>
      <Dialog open={skipOpen} onOpenChange={setSkipOpen}>
        <DialogContent>
          <VStack gap={5}>
            <DialogTitle>답변 없이 넘어갈까요?</DialogTitle>
            <DialogDescription>
              건너뛴 질문으로 돌아올 수 없습니다. 답변 누락은 종합 피드백에
              반영됩니다.
            </DialogDescription>
            <HStack justify="end">
              <Button variant="outline" onClick={() => setSkipOpen(false)}>
                돌아가기
              </Button>
              <Button disabled={busy} onClick={() => void submit(true)}>
                건너뛰기
              </Button>
            </HStack>
          </VStack>
        </DialogContent>
      </Dialog>
    </div>
  );
}
