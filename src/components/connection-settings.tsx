"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Fingerprint,
  Loader2,
  Sparkles,
  Unplug,
} from "lucide-react";
import { api } from "@/lib/api";
import type { SessionInfo } from "@/lib/types";
import { HStack, VStack } from "./layout/stack";
import { Button } from "./ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Card } from "./ui/card";

type Model = { slug: string; display_name: string };
export function ConnectionSettings({
  session,
  onChange,
  onConnect,
}: {
  session: SessionInfo | null;
  onChange: (session: SessionInfo) => void;
  onConnect: () => void;
}) {
  const [models, setModels] = useState<Model[]>([]),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!session?.user || !session.sharing) return;
    let active = true;
    setBusy(true);
    api<{ models: Model[]; selected: string | null }>("/api/connection")
      .then((data) => {
        if (active) {
          setModels(data.models);
          setSelected(data.selected || "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id, session?.sharing]);
  async function choose(model: string) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/connection", {
        method: "POST",
        body: JSON.stringify({ action: "model", model }),
      });
      setSelected(model);
      onChange(await api<SessionInfo>("/api/session"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ revoked: boolean }>("/api/connection", {
        method: "POST",
        body: JSON.stringify({ action: "disconnect" }),
      });
      onChange(await api<SessionInfo>("/api/session"));
      setModels([]);
      setMessage(
        result.revoked
          ? "ChatGPT 구독 연결을 해제했습니다."
          : "이 앱의 연결은 해제했습니다. OpenAI의 원격 해제는 확인하지 못했으므로 ChatGPT 설정에서도 연결을 해제해 주세요.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="settings-card px-6 shadow-none">
      <VStack gap={6}>
        <HStack gap={3}>
          <span className="icon-tile">
            <Sparkles size={21} />
          </span>
          <VStack gap={1}>
            <h2>내 ChatGPT 구독으로 평가하기</h2>
            <span className={session?.sharing ? "badge" : "caption"}>
              {session?.sharing
                ? "Using ChatGPT plan"
                : "구독 사용 권한을 연결해 주세요"}
            </span>
          </VStack>
        </HStack>
        <p className="text-subtle">
          본인 계정에서 허용한 ChatGPT 구독 사용량으로 답변을 평가합니다. 사용
          한도와 접근 권한은 ChatGPT 설정에서 관리할 수 있습니다.
        </p>
        {error && (
          <div role="alert" className="notice error">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="notice">
            {message}
          </div>
        )}
        {session?.sharing ? (
          <>
            <label className="field [&_[data-slot=native-select-wrapper]]:w-full">
              평가 모델
              <NativeSelect
                value={selected}
                disabled={busy || !models.length}
                onChange={(e) => void choose(e.target.value)}
              >
                {!selected && (
                  <option value="">사용 가능한 모델을 선택해 주세요</option>
                )}
                {models.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.display_name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            {busy && (
              <HStack gap={2}>
                <Loader2 size={14} className="animate-spin" />
                <span className="caption">
                  계정에서 사용 가능한 모델을 확인하고 있습니다.
                </span>
              </HStack>
            )}
            <span className="caption">
              기본 추론 수준: medium. 이용 가능한 모델은 연결한 계정에 따라
              달라집니다.
            </span>
            <HStack gap={3} wrap>
              <Button asChild variant="outline">
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://chatgpt.com/settings/usage"
                >
                  사용량 관리
                  <ExternalLink size={15} />
                </a>
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => void disconnect()}
              >
                <Unplug size={15} />
                구독 연결 해제
              </Button>
            </HStack>
          </>
        ) : (
          <>
            <Button className="self-start button-chatgpt" onClick={onConnect}>
              <Fingerprint size={17} />
              Continue with ChatGPT
              <ArrowRight size={16} />
            </Button>
            <p className="caption">
              연결 과정에서 이 앱이 본인의 ChatGPT 구독을 사용할 수 있도록
              허용해 주세요.
            </p>
          </>
        )}
        {session?.user && !session.user.demo && (
          <a className="text-link self-start" href="/api/auth/login?new=1">
            다른 ChatGPT 계정 연결
            <ArrowRight size={14} />
          </a>
        )}
        <div className="focus-divider" />
        <VStack gap={3}>
          <h3>GPT 음성 전사 · 선택 기능</h3>
          <p className="text-subtle">
            ChatGPT 구독과 별도로 전사 API 사용량이 발생합니다. 키를 설정해도
            시험 종료 후 전사 버튼을 눌렀을 때만 녹음을 전송합니다.
          </p>
          <span
            className={session?.transcriptionConfigured ? "badge" : "caption"}
          >
            {session?.transcriptionConfigured
              ? "전사 API 키가 설정되어 있습니다"
              : "전사 API 키 미설정"}
          </span>
          <details className="local-key-help">
            <summary>로컬 전사 API 키 설정 방법</summary>
            <p className="caption">
              프로젝트의 .env.local에 OPENAI_TRANSCRIBE_API_KEY를 설정하고 앱을
              재시작하세요. 모델 기본값은 gpt-transcribe입니다. 키를 브라우저나
              소스 코드에 넣지 마세요.
            </p>
            <code>OPENAI_TRANSCRIBE_API_KEY=내_API_키</code>
          </details>
        </VStack>
      </VStack>
    </Card>
  );
}
