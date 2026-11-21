"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Mic,
  Pencil,
  ShieldCheck,
  Sparkles,
  SpellCheck,
} from "lucide-react";
import { HStack, VStack, Grid, GridItem } from "./layout/stack";
import { Button } from "./ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "./ui/card";
import { api } from "@/lib/api";
import { GrammarCorrections } from "./grammar-corrections";
import { CorrectedAnswer } from "./corrected-answer";
import { TargetFeedbackPanel } from "./target-feedback";
import {
  SpeakableText,
  SpeechPlaybackSettings,
  useSpeechPlayback,
} from "./speech-playback";
import { GrammarConceptSheet } from "./grammar-concept-sheet";
import { clock, dateLabel } from "@/lib/utils";
import { TYPE_LABELS, type PublicExam } from "@/lib/types";
import {
  GRAMMAR_AUDIT_VERSION,
  getGrammarConcept,
  type GrammarConceptId,
} from "@/lib/grammar-concepts";
import { conceptCounts, type GrammarProfile } from "@/lib/grammar-profile";

export function Results({
  initial,
  aiConfigured,
  transcriptionConfigured,
  onConnect,
  onBack,
  onRetry,
  onGrammarNotes,
}: {
  initial: PublicExam;
  aiConfigured: boolean;
  transcriptionConfigured: boolean;
  onConnect: () => void;
  onBack: () => void;
  onRetry: () => void;
  onGrammarNotes?: () => void;
}) {
  const [exam, setExam] = useState(initial),
    [selected, setSelected] = useState(initial.answers[0]?.index ?? 0),
    [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(""),
    [error, setError] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false),
    [transcriptionConsent, setTranscriptionConsent] = useState(false);
  const [checkingGrammar, setCheckingGrammar] = useState(false),
    [sheet, setSheet] = useState<{ id: GrammarConceptId; open: boolean }>(),
    [profile, setProfile] = useState<GrammarProfile | null>(null),
    [profileLoading, setProfileLoading] = useState(false);
  const { stop: stopSpeech } = useSpeechPlayback();
  useEffect(() => {
    stopSpeech();
  }, [selected, stopSpeech]);
  const answer = exam.answers.find((a) => a.index === selected),
    question = exam.questions[selected],
    feedback = exam.evaluation,
    answered = exam.answers.filter((a) => !a.skipped).length;
  const grammarCurrent = feedback?.grammarVersion === GRAMMAR_AUDIT_VERSION,
    examPatterns = conceptCounts(feedback?.grammar || []);
  async function checkGrammar() {
    setCheckingGrammar(true);
    setError(null);
    try {
      const result = await api<{ exam: PublicExam }>(
        `/api/exams/${exam.id}/grammar`,
        { method: "POST" },
      );
      setExam(result.exam);
      setProfile(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCheckingGrammar(false);
    }
  }
  async function openConcept(id: GrammarConceptId) {
    setSheet({ id, open: true });
    if (profile || profileLoading) return;
    setProfileLoading(true);
    try {
      const data = await api<{ profile: GrammarProfile }>("/api/grammar");
      setProfile(data.profile);
    } catch {
      /* The concept explanation still works without personal examples. */
    } finally {
      setProfileLoading(false);
    }
  }
  const pendingTranscriptions = exam.answers.filter(
    (a) =>
      a.audio &&
      !a.skipped &&
      a.transcriptSource !== "gpt" &&
      a.transcriptSource !== "manual",
  ).length;
  async function transcribe() {
    setTranscribing(true);
    setError(null);
    try {
      const result = await api<{ exam: PublicExam }>(
        `/api/exams/${exam.id}/transcribe`,
        {
          method: "POST",
          body: JSON.stringify({ consent: transcriptionConsent }),
        },
      );
      setExam(result.exam);
      setTranscriptionConsent(false);
    } catch (e) {
      setError((e as Error).message);
      const result = await api<{ exam: PublicExam }>(
        `/api/exams/${exam.id}`,
      ).catch(() => null);
      if (result) setExam(result.exam);
    } finally {
      setTranscribing(false);
    }
  }
  async function evaluate() {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ exam: PublicExam }>(
        `/api/exams/${exam.id}/evaluate`,
        { method: "POST" },
      );
      setExam(result.exam);
    } catch (e) {
      setError((e as Error).message);
      const result = await api<{ exam: PublicExam }>(
        `/api/exams/${exam.id}`,
      ).catch(() => null);
      if (result) setExam(result.exam);
    } finally {
      setBusy(false);
    }
  }
  async function saveTranscript() {
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ exam: PublicExam }>(`/api/exams/${exam.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "transcript",
          index: selected,
          transcript: draft,
        }),
      });
      setExam(result.exam);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function download() {
    const file = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), ...exam },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opic-practice-${exam.id.slice(0, 8)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <VStack gap={8}>
      <HStack justify="between" wrap>
        <VStack gap={2}>
          <h1>답변 복습</h1>
          <p className="text-subtle">
            {dateLabel(exam.createdAt)} ·{" "}
            {exam.config.mode === "simulation"
              ? "실전 모의시험"
              : exam.config.practiceQuestionId
                ? "한 문항 연습"
                : "자유 연습"}
          </p>
        </VStack>
        <HStack>
          <Button variant="outline" onClick={download}>
            <Download size={16} />
            기록 내보내기
          </Button>
          <Button onClick={onRetry}>
            다시 연습하기
            <ArrowRight size={16} />
          </Button>
        </HStack>
      </HStack>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <Grid>
        <GridItem span={3}>
          <Card className="metric-card gap-2 px-6 shadow-none">
            <span className="caption">답변한 문항</span>
            <strong>
              {answered}
              <small> / {exam.questions.length}</small>
            </strong>
            <span className="caption">
              {exam.questions.length - answered}문항 미응답
            </span>
          </Card>
        </GridItem>
        <GridItem span={3}>
          <Card className="metric-card gap-2 px-6 shadow-none">
            <span className="caption">전체 발화 시간</span>
            <strong>
              {clock(exam.answers.reduce((sum, a) => sum + a.duration, 0))}
            </strong>
            <span className="caption">녹음 시간 기준</span>
          </Card>
        </GridItem>
        <GridItem span={3}>
          <Card className="metric-card gap-2 px-6 shadow-none">
            <span className="caption">목표 등급</span>
            <strong>{exam.config.target}</strong>
            <span className="caption">
              초기 난이도 {exam.config.difficulty}
            </span>
          </Card>
        </GridItem>
        <GridItem span={3}>
          <Card className="metric-card gap-2 px-6 shadow-none">
            <span className="caption">AI 학습 추정 범위</span>
            <strong className="range-text">
              {feedback?.range || "평가 전"}
            </strong>
            <span className="caption">공식 등급이 아닙니다</span>
          </Card>
        </GridItem>
      </Grid>
      <Card className="transcription-options px-6 shadow-none">
        <VStack gap={4}>
          <HStack justify="between" align="start" wrap>
            <VStack gap={2} className="flex-1">
              <HStack gap={2}>
                <Mic size={17} />
                <h2>GPT로 녹음 전사하기</h2>
                <span className="badge neutral">선택 기능</span>
              </HStack>
              <p className="text-subtle">
                gpt-transcribe로 저장된 녹음을 전사할 수 있습니다. 직접
                입력·수정한 전사문은 유지합니다.
              </p>
              <p className="caption">
                ChatGPT 구독과 별도로 API 사용량이 발생합니다. 전사문이 바뀌면
                기존 AI 피드백은 초기화됩니다.
              </p>
            </VStack>
            <Button
              variant="outline"
              disabled={
                busy ||
                transcribing ||
                (transcriptionConfigured &&
                  (!transcriptionConsent || pendingTranscriptions === 0))
              }
              onClick={() =>
                transcriptionConfigured ? void transcribe() : onConnect()
              }
            >
              {transcribing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Mic size={15} />
              )}
              {transcribing
                ? "GPT 음성 전사 중…"
                : transcriptionConfigured
                  ? `녹음 ${pendingTranscriptions}개 전사하기`
                  : "전사 API 설정 안내"}
            </Button>
          </HStack>
          {transcriptionConfigured && pendingTranscriptions > 0 && (
            <label className="checkbox-label">
              <Checkbox
                checked={transcriptionConsent}
                disabled={transcribing}
                onCheckedChange={(checked) =>
                  setTranscriptionConsent(checked === true)
                }
              />
              녹음의 OpenAI 전송과 별도 API 사용량 발생을 확인했습니다.
            </label>
          )}
          {!transcriptionConfigured && (
            <span className="caption">
              전사용 API 키가 아직 없습니다. 브라우저 전사나 직접 입력으로도
              문법 점검을 받을 수 있습니다.
            </span>
          )}
        </VStack>
      </Card>
      {!feedback ? (
        <Card className="evaluation-banner px-6 shadow-none">
          <HStack gap={5} wrap>
            <span className="icon-tile large">
              <Sparkles size={23} />
            </span>
            <VStack gap={2} className="flex-1">
              <h2>
                {busy
                  ? "전체 답변을 종합적으로 살펴보고 있어요."
                  : "AI 답변 피드백"}
              </h2>
              <p className="text-subtle">
                {busy
                  ? "본인의 ChatGPT 구독으로 전체 전사문을 평가하고 있습니다. 잠시 기다려 주세요."
                  : aiConfigured
                    ? `전사문을 바탕으로 답변을 살펴보고, 목표 ${exam.config.target}를 위한 보완점과 다음 연습을 제공합니다.`
                    : "ChatGPT 구독 사용 권한을 연결하면 본인 계정으로 종합 평가를 받을 수 있습니다."}
              </p>
              <span className="caption">
                평가 요청 시 질문·전사문·목표 등급이 OpenAI로 전송됩니다.{" "}
                {aiConfigured && "Using ChatGPT plan"}
              </span>
            </VStack>
            <Button
              disabled={
                busy ||
                transcribing ||
                (aiConfigured && !exam.answers.some((a) => a.transcript.trim()))
              }
              onClick={() => (aiConfigured ? void evaluate() : onConnect())}
            >
              {busy ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {busy
                ? "평가 중…"
                : aiConfigured
                  ? "내 구독으로 평가받기"
                  : "ChatGPT 구독 연결"}
            </Button>
          </HStack>
          <a
            href="https://chatgpt.com/settings/usage"
            className="text-link small usage-link"
            target="_blank"
            rel="noreferrer"
          >
            ChatGPT 사용량 관리
          </a>
          {!exam.answers.some((a) => a.transcript.trim()) && answered > 0 && (
            <p className="caption">
              자동 전사된 내용이 없습니다. 아래에서 실제 답변을 직접 입력하면
              평가할 수 있습니다.
            </p>
          )}
        </Card>
      ) : (
        <VStack gap={5}>
          <Card className="evaluation-summary px-6 shadow-none">
            <HStack gap={3}>
              <span className="badge">AI PRACTICE FEEDBACK</span>
              <span className="caption">
                확신도 {feedback.confidence === "low" ? "낮음" : "보통"}
              </span>
            </HStack>
            <h2>{feedback.summary}</h2>
            <div className="notice">
              <ShieldCheck size={18} />
              <p>{feedback.disclaimer}</p>
            </div>
          </Card>
          <Grid>
            {feedback.dimensions.map((d, i) => (
              <GridItem span={3} key={d.name}>
                <Card className="dimension-card px-6 shadow-none">
                  <span className="caption">0{i + 1}</span>
                  <h3>
                    {
                      [
                        "수행 기능",
                        "내용과 맥락",
                        "표현의 정확성",
                        "발화 구성",
                      ][i]
                    }
                  </h3>
                  <div className="rubric-score">
                    {Array.from({ length: 5 }, (_, j) => (
                      <span key={j} data-filled={j < d.score} />
                    ))}
                    <strong>{d.score}/5</strong>
                  </div>
                  <p>{d.feedback}</p>
                  <span className="caption">학습용 지표 · 공식 점수 아님</span>
                </Card>
              </GridItem>
            ))}
          </Grid>
          <Grid>
            <GridItem span={6}>
              <Card className="feedback-list px-6 shadow-none">
                <h3>잘하고 있는 점</h3>
                {feedback.strengths.map((s) => (
                  <HStack align="start" key={s}>
                    <Check size={16} className="success-icon" />
                    <p>{s}</p>
                  </HStack>
                ))}
              </Card>
            </GridItem>
            <GridItem span={6}>
              <Card className="feedback-list px-6 shadow-none">
                <h3>다음에 집중할 점</h3>
                {feedback.priorities.map((s) => (
                  <HStack align="start" key={s}>
                    <ArrowRight size={16} />
                    <p>{s}</p>
                  </HStack>
                ))}
              </Card>
            </GridItem>
          </Grid>
        </VStack>
      )}
      <TargetFeedbackPanel
        target={exam.config.target}
        report={feedback?.targetFeedback}
        busy={busy}
        disabled={transcribing}
        onEvaluate={
          feedback
            ? () => (aiConfigured ? void evaluate() : onConnect())
            : undefined
        }
        onSelectQuestion={(index) => {
          setSelected(index);
          setEditing(false);
          document
            .getElementById("answer-review-title")
            ?.scrollIntoView({ block: "start", behavior: "smooth" });
        }}
      />
      {feedback && !grammarCurrent && (
        <Card className="px-6 shadow-none" data-grammar-recheck>
          <HStack gap={5} align="start" wrap>
            <span className="icon-tile large">
              <SpellCheck size={22} />
            </span>
            <VStack gap={2} className="flex-1">
              <h2>문법 다시 점검</h2>
              <p className="text-subtle">
                이 기록에는 새 기준의 문법 점검 결과가 없어 놓친 오류가 있을 수
                있어요. 새 점검은 모든 문장을 확인해 오류를 빠짐없이 찾고, 문법
                개념별로 문법 노트에 모아 줍니다.
              </p>
              <span className="caption">
                코칭 피드백은 그대로 두고 문법만 다시 봅니다. 본인 ChatGPT 구독
                사용량을 사용하며 버튼을 누를 때만 요청합니다.
              </span>
            </VStack>
            <Button
              disabled={busy || checkingGrammar || transcribing}
              onClick={() => (aiConfigured ? void checkGrammar() : onConnect())}
            >
              {checkingGrammar ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <SpellCheck size={16} />
              )}
              {checkingGrammar
                ? "문법 점검 중…"
                : aiConfigured
                  ? "문법 다시 점검"
                  : "ChatGPT 구독 연결"}
            </Button>
          </HStack>
        </Card>
      )}
      {grammarCurrent && examPatterns.length > 0 && (
        <Card className="px-6 shadow-none" data-exam-grammar-patterns>
          <VStack gap={4}>
            <HStack justify="between" align="start" wrap>
              <VStack gap={1} className="flex-1">
                <h2>이번 기록의 문법 패턴</h2>
                <p className="caption">
                  문법 수정이 나온 개념과 횟수예요. 개념을 누르면 규칙을 익히고
                  내 문장을 고쳐 쓸 수 있어요.
                </p>
              </VStack>
              {onGrammarNotes && (
                <Button variant="outline" size="sm" onClick={onGrammarNotes}>
                  <BookOpenCheck size={15} />
                  문법 노트
                </Button>
              )}
            </HStack>
            <div className="flex flex-wrap gap-2">
              {examPatterns.map(([id, count]) => (
                <Button
                  key={id}
                  size="sm"
                  variant="outline"
                  onClick={() => void openConcept(id)}
                >
                  {getGrammarConcept(id)?.title}
                  <span className="tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </Button>
              ))}
            </div>
          </VStack>
        </Card>
      )}
      <VStack gap={5}>
        <HStack justify="between">
          <h2 id="answer-review-title" className="scroll-mt-20">
            문항별 답변 돌아보기
          </h2>
          <span className="caption">전사 내용은 녹음과 다를 수 있습니다.</span>
        </HStack>
        {feedback && <SpeechPlaybackSettings />}
        <Grid>
          <GridItem span={4}>
            <Card className="review-questions gap-0 p-0 shadow-none">
              {exam.questions.map((q, i) => {
                const a = exam.answers.find((a) => a.index === i);
                return (
                  <button
                    key={i}
                    className="review-question"
                    aria-pressed={selected === i}
                    onClick={() => {
                      setSelected(i);
                      setEditing(false);
                    }}
                  >
                    <span className="question-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <VStack gap={1}>
                      <strong>{q.topicLabel}</strong>
                      <span className="caption">
                        {TYPE_LABELS[q.type]} ·{" "}
                        {a && !a.skipped ? clock(a.duration) : "미응답"}
                      </span>
                    </VStack>
                    <ChevronRight size={16} />
                  </button>
                );
              })}
            </Card>
          </GridItem>
          <GridItem span={8}>
            <Card className="answer-review px-6 shadow-none">
              <VStack gap={6}>
                <HStack justify="between">
                  <HStack gap={2}>
                    <span className="badge">Q{selected + 1}</span>
                    <span className="caption">
                      {TYPE_LABELS[question.type]}
                    </span>
                  </HStack>
                  {question.type === "intro" && (
                    <span className="caption">
                      준비운동 · 등급 근거에서 제외
                    </span>
                  )}
                </HStack>
                <p lang="en" className="english-prompt">
                  {question.prompt}
                </p>
                {answer?.audio ? (
                  <VStack gap={3}>
                    <HStack gap={2}>
                      <Mic size={16} />
                      <h3>내 녹음</h3>
                      <span className="caption">{clock(answer.duration)}</span>
                    </HStack>
                    <audio
                      key={`${exam.id}-${selected}`}
                      controls
                      src={answer.audio}
                      preload="metadata"
                    />
                    <a
                      className="text-link small"
                      href={answer.audio}
                      download={`opic-q${selected + 1}`}
                    >
                      녹음 파일 다운로드
                      <Download size={13} />
                    </a>
                  </VStack>
                ) : (
                  <div className="notice">
                    이 문항에는 저장된 녹음이 없습니다.
                  </div>
                )}
                {answer && !answer.skipped && (
                  <VStack gap={3}>
                    <HStack justify="between">
                      <h3>답변 전사</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || saving || transcribing}
                        onClick={() => {
                          setDraft(answer.transcript);
                          setEditing(true);
                        }}
                      >
                        <Pencil size={14} />
                        직접 입력·수정
                      </Button>
                    </HStack>
                    {editing ? (
                      <>
                        <label className="sr-only" htmlFor="transcript">
                          답변 전사문
                        </label>
                        <Textarea
                          id="transcript"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          maxLength={12000}
                          rows={8}
                          lang="en"
                          placeholder="녹음을 듣고 실제로 말한 내용을 입력해 주세요."
                        />
                        <p className="caption">
                          전사를 수정하면 기존 AI 피드백이 초기화됩니다. 실제
                          발화를 그대로 입력해 주세요.
                        </p>
                        <HStack justify="end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(false)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            disabled={saving}
                            onClick={() => void saveTranscript()}
                          >
                            {saving ? "저장 중…" : "전사 저장"}
                          </Button>
                        </HStack>
                      </>
                    ) : (
                      <div className="transcript" lang="en">
                        {answer.transcript || (
                          <span className="text-subtle">
                            자동 전사된 내용이 없습니다. 녹음을 듣고 실제로 말한
                            내용을 입력해 주세요.
                          </span>
                        )}
                      </div>
                    )}
                    {answer.transcriptSource === "manual" && (
                      <span className="caption">
                        직접 입력한 전사 · 음성에서 자동 추출한 결과가 아닙니다.
                      </span>
                    )}
                    {answer.transcriptSource === "browser" && (
                      <span className="caption">
                        브라우저 음성 인식으로 전사했습니다. 녹음과 비교해
                        오류를 확인해 주세요.
                      </span>
                    )}
                    {answer.transcriptSource === "gpt" && (
                      <span className="caption">
                        gpt-transcribe 자동 전사 · 녹음과 비교해 인식 오류를
                        확인해 주세요.
                      </span>
                    )}
                  </VStack>
                )}
                {feedback && answer?.transcript && !editing && (
                  <CorrectedAnswer
                    transcript={answer.transcript}
                    items={(feedback.grammar || []).filter(
                      (item) => item.question === selected + 1,
                    )}
                    legacy={!grammarCurrent}
                  />
                )}
                <GrammarCorrections
                  items={(feedback?.grammar || []).filter(
                    (item) => item.question === selected + 1,
                  )}
                  transcript={answer?.transcript}
                  onConcept={(id) => void openConcept(id)}
                />
                {feedback?.evidence
                  .filter((e) => e.question === selected + 1)
                  .map((e, i) => (
                    <VStack gap={4} className="evidence-card" key={i}>
                      <HStack gap={2}>
                        <Sparkles size={16} />
                        <h3>이 답변에서 발견한 점</h3>
                      </HStack>
                      <blockquote lang="en">“{e.quote}”</blockquote>
                      <p>{e.feedback}</p>
                      <VStack gap={2}>
                        <span className="field-label">
                          이렇게 표현해 볼 수 있어요
                        </span>
                        <SpeakableText
                          text={e.improved}
                          label="개선 표현 듣기"
                          className="improved-sentence"
                        />
                      </VStack>
                    </VStack>
                  ))}
                {!feedback && (
                  <div className="small-note">
                    <FileText size={16} />
                    <p>
                      말한 길이만으로 등급을 판단하지 않습니다. 질문이 요구한
                      내용을 구체적으로 전달했는지 들어보세요.
                    </p>
                  </div>
                )}
              </VStack>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
      {feedback && (
        <Card className="study-plan px-6 shadow-none">
          <VStack gap={5}>
            <span className="eyebrow">YOUR NEXT STEP</span>
            <h2>다음 연습은 이렇게 해 보세요.</h2>
            {feedback.studyPlan.map((s, i) => (
              <HStack gap={4} align="start" key={s}>
                <span className="step-index">0{i + 1}</span>
                <p>{s}</p>
              </HStack>
            ))}
          </VStack>
        </Card>
      )}
      <Button className="self-start" variant="ghost" onClick={onBack}>
        <ArrowLeft size={16} />
        {exam.config.practiceQuestionId
          ? "문제 라이브러리로 돌아가기"
          : "학습 기록으로 돌아가기"}
      </Button>
      <GrammarConceptSheet
        conceptId={sheet?.open ? sheet.id : null}
        stat={profile?.concepts.find((c) => c.id === sheet?.id)}
        loading={profileLoading}
        onOpenChange={(open) => {
          if (!open) setSheet((s) => (s ? { ...s, open: false } : s));
        }}
      />
    </VStack>
  );
}
