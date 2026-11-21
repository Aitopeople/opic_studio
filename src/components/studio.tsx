"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Fingerprint,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { HStack, VStack } from "./layout/stack";
import { AppShell } from "./layout/app-shell";
import { Dashboard } from "./workspace/dashboard";
import { QuestionLibrary } from "./workspace/question-library";
import { LearningHistory } from "./workspace/history";
import { GrammarNotes } from "./workspace/grammar-notes";
import { TestGuide } from "./workspace/guide";
import { SettingsPage } from "./workspace/settings";
import { Setup, defaultConfig } from "./setup";
import { PracticeSetup } from "./practice-setup";
import { FeedbackExample } from "./workspace/feedback-example";
import { SpeechPlaybackProvider } from "./speech-playback";
import { ExamRoom } from "./exam-room";
import { Results } from "./results";
import { api } from "@/lib/api";
import { QUESTION_BANK } from "@/lib/questions";
import type { ExamConfig, PublicExam, SessionInfo } from "@/lib/types";
import type { ExamSummary, WorkspaceView } from "@/lib/workspace";
export function Studio() {
  const [view, setView] = useState<WorkspaceView>("dashboard"),
    [session, setSession] = useState<SessionInfo | null>(null),
    [records, setRecords] = useState<ExamSummary[]>([]),
    [exam, setExam] = useState<PublicExam | null>(null),
    [questionId, setQuestionId] = useState<string | undefined>(),
    [loginOpen, setLoginOpen] = useState(false),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [pendingDelete, setPendingDelete] = useState<string | null>(null),
    [target, setTarget] = useState("IH");
  const loadRecords = useCallback(async () => {
    const data = await api<{ exams: ExamSummary[] }>("/api/exams");
    setRecords(data.exams);
    return data.exams;
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);
  async function acknowledgePlan() {
    setSession((s) => (s ? { ...s, showPlanWelcome: false } : s));
    try {
      await api("/api/connection", {
        method: "POST",
        body: JSON.stringify({ action: "welcome" }),
      });
    } catch {
      /* Confirmation can be shown on the next visit if saving fails. */
    }
  }
  function navigate(next: WorkspaceView) {
    if (next !== "practice") {
      try {
        sessionStorage.removeItem("opic:pending-practice");
      } catch {}
    }
    setView(next);
    setError(null);
    if (next !== "exam" && next !== "results")
      window.history.replaceState(
        {},
        "",
        next === "dashboard" ? "/" : `/?view=${next}`,
      );
    window.scrollTo(0, 0);
  }
  const loadExam = useCallback(async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ exam: PublicExam }>(`/api/exams/${id}`);
      setExam(data.exam);
      setView(data.exam.status === "completed" ? "results" : "exam");
      window.history.replaceState({}, "", `/?exam=${id}`);
      window.scrollTo(0, 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await api<SessionInfo>("/api/session");
        if (!active) return;
        setSession(info);
        const params = new URLSearchParams(window.location.search);
        if (params.get("auth")) {
          setLoginOpen(true);
          setError(
            params.get("auth") === "failed"
              ? "ChatGPT 구독 연결을 완료하지 못했습니다. 동의 화면의 계정·권한을 확인한 뒤 다시 시도해 주세요."
              : "이 배포 서비스의 ChatGPT 구독 연동은 아직 개방되지 않았습니다.",
          );
        }
        const initialView = params.get("view");
        if (
          [
            "bank",
            "history",
            "grammar",
            "guide",
            "settings",
            "example",
          ].includes(initialView || "")
        )
          setView(initialView as WorkspaceView);
        let pendingPractice = params.get("practice");
        if (!pendingPractice && params.get("connected")) {
          try {
            pendingPractice = sessionStorage.getItem("opic:pending-practice");
          } catch {}
        }
        if (QUESTION_BANK.some((q) => q.id === pendingPractice)) {
          setQuestionId(pendingPractice!);
          try {
            sessionStorage.setItem("opic:pending-practice", pendingPractice!);
          } catch {}
          setView("practice");
          window.history.replaceState(
            {},
            "",
            `/?practice=${encodeURIComponent(pendingPractice!)}`,
          );
        }
        if (info.user) {
          await loadRecords();
          if (params.get("exam")) await loadExam(params.get("exam")!);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadRecords, loadExam]);
  async function ensureUser() {
    if (session?.user) return true;
    setLoginOpen(true);
    return false;
  }
  async function startSetup() {
    if (!(await ensureUser())) return;
    navigate("setup");
  }
  function preparePractice(id?: string) {
    const selected = QUESTION_BANK.find((q) => q.id === id);
    if (!selected) {
      setError("선택한 연습 문제를 찾을 수 없습니다.");
      return;
    }
    setQuestionId(selected.id);
    navigate("practice");
    try {
      sessionStorage.setItem("opic:pending-practice", selected.id);
    } catch {}
    window.history.replaceState(
      {},
      "",
      `/?practice=${encodeURIComponent(selected.id)}`,
    );
  }
  async function startExam(config: ExamConfig) {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ exam: PublicExam }>("/api/exams", {
        method: "POST",
        body: JSON.stringify(config),
      });
      setExam(result.exam);
      try {
        sessionStorage.removeItem("opic:pending-practice");
      } catch {}
      setView("exam");
      window.history.replaceState({}, "", `/?exam=${result.exam.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/guest", { method: "POST" });
      const info = await api<SessionInfo>("/api/session");
      setSession(info);
      await loadRecords();
      setLoginOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const result = await api<{ revoked: boolean }>("/api/auth/logout", {
        method: "POST",
      });
      setSession((s) => (s ? { ...s, user: null } : null));
      setRecords([]);
      setExam(null);
      navigate("dashboard");
      if (!result.revoked)
        setError(
          "이 앱에서 연결을 해제했습니다. 원격 해제는 확인하지 못했으므로 ChatGPT 설정에서도 앱 연결을 확인해 주세요.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await api(`/api/exams/${pendingDelete}`, { method: "DELETE" });
      setPendingDelete(null);
      await loadRecords();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const complete = useCallback(
    (next: PublicExam) => {
      setExam(next);
      setView("results");
      window.scrollTo(0, 0);
      void loadRecords();
    },
    [loadRecords],
  );
  if (view === "exam" && exam)
    return <ExamRoom initial={exam} onComplete={complete} />;
  const practiceQuestion = QUESTION_BANK.find((q) => q.id === questionId);
  return (
    <SpeechPlaybackProvider scope={`${view}-${exam?.id || ""}`}>
      <AppShell
        view={view}
        session={session}
        busy={busy}
        onNavigate={(next) =>
          next === "setup" ? void startSetup() : navigate(next)
        }
        onConnect={() => setLoginOpen(true)}
        onLogout={() => void logout()}
      >
        {error && !loginOpen && (
          <Alert
            variant="destructive"
            className="mb-6 flex items-center justify-between gap-4"
            role="alert"
          >
            <AlertDescription>{error}</AlertDescription>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="알림 닫기"
              onClick={() => setError(null)}
            >
              <X />
            </Button>
          </Alert>
        )}
        {loading ? (
          <div className="loading-state" role="status">
            <Loader2 className="size-6 animate-spin" />
            <p>학습 공간을 준비하고 있습니다.</p>
          </div>
        ) : (
          <>
            {view === "dashboard" && (
              <Dashboard
                records={records}
                target={target}
                busy={busy}
                onTargetChange={setTarget}
                onStart={() => void startSetup()}
                onPractice={preparePractice}
                onNavigate={navigate}
                onOpen={(id) => void loadExam(id)}
              />
            )}
            {view === "setup" && (
              <Setup
                mode="simulation"
                initialTarget={target}
                onStart={(config) => void startExam(config)}
                onCancel={() => navigate("dashboard")}
                busy={busy}
              />
            )}
            {view === "bank" && (
              <QuestionLibrary onPractice={preparePractice} />
            )}
            {view === "example" && (
              <FeedbackExample onBack={() => navigate("bank")} />
            )}
            {view === "practice" && practiceQuestion && (
              <PracticeSetup
                key={practiceQuestion.id}
                question={practiceQuestion}
                signedIn={Boolean(session?.user)}
                busy={busy}
                onConnect={() => setLoginOpen(true)}
                onCancel={() => navigate("bank")}
                onStart={() =>
                  startExam({
                    ...defaultConfig,
                    mode: "practice",
                    target,
                    difficulty: practiceQuestion.difficulty,
                    topics: [],
                    practiceQuestionId: practiceQuestion.id,
                  })
                }
              />
            )}
            {view === "history" && (
              <LearningHistory
                records={records}
                signedIn={Boolean(session?.user)}
                busy={busy}
                onConnect={() => setLoginOpen(true)}
                onStart={() => void startSetup()}
                onOpen={(id) => void loadExam(id)}
                onDelete={setPendingDelete}
              />
            )}
            {view === "grammar" && (
              <GrammarNotes
                key={session?.user?.id || "signed-out"}
                signedIn={Boolean(session?.user)}
                onConnect={() => setLoginOpen(true)}
                onOpenRecord={(id) => void loadExam(id)}
              />
            )}
            {view === "guide" && (
              <TestGuide onStart={() => void startSetup()} />
            )}
            {view === "settings" && (
              <SettingsPage
                session={session}
                busy={busy}
                onChange={setSession}
                onConnect={() => setLoginOpen(true)}
                onLogout={() => void logout()}
                onHistory={() => navigate("history")}
              />
            )}
            {view === "results" && exam && (
              <Results
                key={exam.id}
                initial={exam}
                aiConfigured={Boolean(session?.aiConfigured)}
                transcriptionConfigured={Boolean(
                  session?.transcriptionConfigured,
                )}
                onConnect={() => navigate("settings")}
                onBack={() => {
                  void loadRecords();
                  navigate(exam.config.practiceQuestionId ? "bank" : "history");
                }}
                onRetry={() =>
                  exam.config.practiceQuestionId
                    ? preparePractice(exam.config.practiceQuestionId)
                    : void startSetup()
                }
                onGrammarNotes={() => navigate("grammar")}
              />
            )}
          </>
        )}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent>
            <VStack gap={6}>
              <span className="icon-tile large">
                <Fingerprint size={26} />
              </span>
              <VStack gap={3}>
                <DialogTitle>내 ChatGPT 구독으로 연습하기</DialogTitle>
                <DialogDescription>
                  ChatGPT를 연결하고, 본인의 구독 사용량으로 답변 피드백을
                  받아보세요.
                </DialogDescription>
              </VStack>
              {error && (
                <div className="notice error" role="alert">
                  {error}
                </div>
              )}
              {session?.authConfigured ? (
                <Button asChild size="lg" className="button-chatgpt">
                  <a
                    href={
                      session.user && !session.user.demo && !session.sharing
                        ? "/api/auth/login?consent=1"
                        : "/api/auth/login"
                    }
                    data-oai-siwc-button
                  >
                    Continue with ChatGPT
                    <ArrowRight size={16} />
                  </a>
                </Button>
              ) : (
                <>
                  <Button size="lg" disabled>
                    <Fingerprint size={18} />
                    ChatGPT 구독 연동 준비 중
                  </Button>
                  <p className="caption">
                    이 원격 서비스는 OpenAI의 구독 사용량 연동 승인이
                    필요합니다. 현재 배포 환경에서는 아직 연결할 수 없습니다.
                  </p>
                </>
              )}
              {session?.authMode === "local" && (
                <p className="caption">
                  이 PC에서 실행하는 로컬 연결입니다. 적격 ChatGPT 계정으로 구독
                  사용 권한을 허용해 주세요.
                </p>
              )}
              {session?.demoEnabled && (
                <VStack gap={3}>
                  <div className="or-divider">
                    <span>개발 환경 체험</span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void demo()}
                  >
                    {busy ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} />
                    )}
                    체험 계정으로 둘러보기
                  </Button>
                  <p className="caption">
                    이 PC의 개발 환경에서만 제공됩니다. 실제 ChatGPT 로그인은
                    아닙니다.
                  </p>
                </VStack>
              )}
              <HStack gap={2} align="start">
                <ShieldCheck size={14} className="muted-icon" />
                <p className="caption">
                  ChatGPT 대화 기록이나 비밀번호를 수집하지 않습니다.
                </p>
              </HStack>
            </VStack>
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(session?.showPlanWelcome)}
          onOpenChange={(open) => {
            if (!open) void acknowledgePlan();
          }}
        >
          <DialogContent>
            <VStack gap={6}>
              <span className="icon-tile large">
                <Sparkles size={25} />
              </span>
              <VStack gap={3}>
                <DialogTitle>본인의 ChatGPT 구독을 사용합니다.</DialogTitle>
                <DialogDescription>
                  이 앱에서 요청하는 AI 평가는 연결한 ChatGPT 계정의 구독
                  사용량을 사용합니다. 사용 한도와 앱 접근 권한은 ChatGPT
                  설정에서 관리할 수 있습니다.
                </DialogDescription>
              </VStack>
              <Button asChild variant="outline">
                <a
                  href="https://chatgpt.com/settings/usage"
                  target="_blank"
                  rel="noreferrer"
                >
                  사용량 관리
                  <ExternalLink size={15} />
                </a>
              </Button>
              <Button onClick={() => void acknowledgePlan()}>
                확인했습니다
              </Button>
            </VStack>
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(pendingDelete)}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
        >
          <DialogContent>
            <VStack gap={5}>
              <DialogTitle>이 시험 기록을 삭제할까요?</DialogTitle>
              <DialogDescription>
                녹음 파일, 전사문, AI 피드백이 함께 삭제됩니다. 삭제 후 되돌릴
                수 없습니다.
              </DialogDescription>
              <HStack justify="end">
                <Button
                  variant="outline"
                  onClick={() => setPendingDelete(null)}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  기록 삭제
                </Button>
              </HStack>
            </VStack>
          </DialogContent>
        </Dialog>
      </AppShell>
    </SpeechPlaybackProvider>
  );
}
