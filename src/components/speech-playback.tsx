"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { NativeSelect } from "./ui/native-select";
import { englishVoice, speechChunks } from "@/lib/speech";

type Playback = {
  activeId: string | null;
  rate: number;
  error: string | null;
  start: (id: string, text: string, rate?: number) => void;
  stop: (id?: string) => void;
  changeRate: (rate: number) => void;
};
const SpeechContext = createContext<Playback | null>(null);
export function useSpeechPlayback() {
  const value = useContext(SpeechContext);
  if (!value) throw new Error("Speech controls require SpeechPlaybackProvider");
  return value;
}
export function SpeechPlaybackProvider({
  children,
  scope,
}: {
  children: ReactNode;
  scope: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null),
    [rate, setRate] = useState(0.9),
    [error, setError] = useState<string | null>(null);
  const current = useRef<{ id: string; text: string } | null>(null),
    utterance = useRef<SpeechSynthesisUtterance | null>(null),
    revision = useRef(0);
  const stop = useCallback((id?: string) => {
    if (id && current.current?.id !== id) return;
    revision.current++;
    current.current = null;
    utterance.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    setActiveId(null);
  }, []);
  const start = useCallback(
    (id: string, text: string, speed = rate) => {
      stop();
      setError(null);
      if (
        !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        setError(
          "이 브라우저에서는 교정문 음성 재생을 지원하지 않습니다. 최신 Chrome 또는 Edge에서 시도해 주세요.",
        );
        return;
      }
      const chunks = speechChunks(text);
      if (!chunks.length) return;
      document
        .querySelectorAll<HTMLMediaElement>("audio, video")
        .forEach((media) => {
          if (!media.paused) media.pause();
        });
      const token = revision.current;
      current.current = { id, text };
      setActiveId(id);
      const speak = (index: number) => {
        if (revision.current !== token) return;
        if (index >= chunks.length) {
          current.current = null;
          utterance.current = null;
          setActiveId(null);
          return;
        }
        try {
          const speech = new SpeechSynthesisUtterance(chunks[index]);
          utterance.current = speech;
          speech.lang = "en-US";
          speech.rate = speed;
          speech.voice = englishVoice(window.speechSynthesis.getVoices());
          speech.onend = () => speak(index + 1);
          speech.onerror = (event) => {
            if (revision.current !== token) return;
            stop();
            setError(
              event.error === "not-allowed"
                ? "소리 재생이 차단되었습니다. 브라우저의 소리 재생 권한을 확인하고 다시 눌러 주세요."
                : "음성을 재생하지 못했습니다. 기기의 영어 음성과 소리 출력을 확인하고 다시 시도해 주세요.",
            );
          };
          window.speechSynthesis.speak(speech);
        } catch {
          if (revision.current !== token) return;
          stop();
          setError("음성을 재생하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      };
      window.speechSynthesis.resume();
      speak(0);
    },
    [rate, stop],
  );
  const changeRate = useCallback(
    (value: number) => {
      if (![0.75, 0.9, 1].includes(value)) return;
      setRate(value);
      const playing = current.current;
      if (playing) start(playing.id, playing.text, value);
    },
    [start],
  );
  // Leaving a review or changing questions must not leave speech playing in the background.
  useEffect(() => {
    setError(null);
    return () => stop();
  }, [scope, stop]);
  useEffect(() => {
    const onMediaPlay = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && current.current) stop();
    };
    document.addEventListener("play", onMediaPlay, true);
    return () => document.removeEventListener("play", onMediaPlay, true);
  }, [stop]);
  return (
    <SpeechContext.Provider
      value={{ activeId, rate, error, start, stop, changeRate }}
    >
      {children}
    </SpeechContext.Provider>
  );
}
export function SpeechListenButton({
  text,
  label = "교정문 듣기",
  playbackId,
}: {
  text: string;
  label?: string;
  playbackId?: string;
}) {
  const generatedId = useId(),
    { activeId, start, stop } = useSpeechPlayback();
  const id = playbackId || generatedId;
  const active = activeId === id;
  useEffect(() => () => stop(id), [id, text, stop]);
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      aria-label={active ? `${label} 정지` : label}
      aria-pressed={active}
      disabled={!text.trim()}
      onClick={() => (active ? stop(id) : start(id, text))}
    >
      {active ? <Square /> : <Volume2 />}
      {active ? "정지" : label}
    </Button>
  );
}
export function SpeakableText({
  text,
  label = "교정문 듣기",
  heading,
  className,
}: {
  text: string;
  label?: string;
  heading?: ReactNode;
  className?: string;
}) {
  const id = useId(),
    { start } = useSpeechPlayback(),
    [focused, setFocused] = useState(0),
    words = useRef<(HTMLSpanElement | null)[]>([]);
  const tokens = Array.from(text.matchAll(/\S+/gu), (match) => ({
    word: match[0],
    start: match.index,
  }));
  useEffect(() => setFocused(0), [text]);
  function listen(index: number) {
    setFocused(index);
    start(id, text.slice(tokens[index].start));
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {heading || (
          <span className="text-xs text-muted-foreground">
            단어를 눌러 여기부터 듣기
          </span>
        )}
        <SpeechListenButton playbackId={id} text={text} label={label} />
      </div>
      <p lang="en" className={className}>
        {text.slice(0, tokens[0]?.start || 0)}
        {tokens.map((token, index) => (
          <span key={`${token.start}-${token.word}`}>
            <span
              ref={(element) => {
                words.current[index] = element;
              }}
              role="button"
              tabIndex={focused === index ? 0 : -1}
              data-speech-word={token.start}
              aria-label={`${token.word}부터 듣기`}
              title="여기부터 듣기"
              className="cursor-pointer rounded-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onFocus={() => setFocused(index)}
              onClick={(event) => {
                if (
                  event.ctrlKey ||
                  event.metaKey ||
                  event.altKey ||
                  window.getSelection()?.toString()
                )
                  return;
                listen(index);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  listen(index);
                  return;
                }
                const next =
                  event.key === "ArrowRight"
                    ? Math.min(index + 1, tokens.length - 1)
                    : event.key === "ArrowLeft"
                      ? Math.max(index - 1, 0)
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tokens.length - 1
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  setFocused(next);
                  words.current[next]?.focus();
                }
              }}
            >
              {token.word}
            </span>
            {text.slice(
              token.start + token.word.length,
              tokens[index + 1]?.start ?? text.length,
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
export function SpeechPlaybackSettings() {
  const { activeId, rate, error, stop, changeRate } = useSpeechPlayback(),
    id = useId();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Volume2 className="size-4" />
            듣고 따라 말하기
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            교정문의 단어를 누르면 그 위치부터 읽습니다. 방향키로 이동하고
            Enter로 재생할 수도 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="text-xs">
            속도
          </Label>
          <NativeSelect
            id={id}
            aria-label="교정문 읽기 속도"
            value={rate}
            onChange={(event) => changeRate(Number(event.target.value))}
          >
            <option value={0.75}>0.75×</option>
            <option value={0.9}>0.9×</option>
            <option value={1}>1.0×</option>
          </NativeSelect>
          <Button
            size="sm"
            variant="ghost"
            disabled={!activeId}
            onClick={() => stop()}
          >
            <Square />
            모두 정지
          </Button>
        </div>
      </div>
      {activeId && (
        <p role="status" className="text-xs text-muted-foreground">
          재생 중 · 속도를 바꾸면 선택한 시작 위치부터 다시 읽습니다.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
