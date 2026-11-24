"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  Flag,
  Lightbulb,
  Timer,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  matchesWord,
  spellingAnswer,
  spellingLetters,
  wordSeconds,
  type VocaRound,
} from "@/lib/voca-quiz";
import type { VocaWord } from "@/lib/voca-words";

export function VocaSpelling({
  word,
  round,
  onStartClock,
  onAnswer,
  onNext,
  nextLabel,
}: {
  word: VocaWord;
  round: VocaRound;
  onStartClock: () => void;
  onAnswer: (answer: string | null) => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const letters = spellingLetters(word.english);
  const count = letters.length;
  const words = word.english.trim().normalize("NFKC").split(/\s+/u);
  const [value, setValue] = useState(
    spellingLetters(round.lastGuess ?? round.response ?? "").slice(0, count),
  );
  const [hint, setHint] = useState(false);
  const [selection, setSelection] = useState(0);
  const [focused, setFocused] = useState(false);
  const [seconds, setSeconds] = useState(() =>
    round.deadline === undefined
      ? wordSeconds(word)
      : Math.max(0, Math.ceil((round.deadline - Date.now()) / 1000)),
  );
  const input = useRef<HTMLInputElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const { deadline, response, timedOut } = round;
  const done = response !== null;
  const won = done && matchesWord(word, response);
  const wrong = !done && Boolean(value && round.lastGuess === value);
  const urgent = seconds <= 5;
  const shown = won ? spellingLetters(response).slice(0, count) : value;
  const phase = won ? "won" : wrong || done ? "miss" : "playing";
  const startClock = useEffectEvent(onStartClock);
  const expire = useEffectEvent(() => onAnswer(null));

  useEffect(() => {
    if (done) return;
    if (deadline === undefined) {
      startClock();
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) expire();
    };
    tick();
    const id = window.setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline, done]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (done || !value || deadline === undefined) return;
    const answer = spellingAnswer(word, value);
    if (Date.now() < deadline && !matchesWord(word, answer)) {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        navigator.vibrate?.([45, 35, 45]);
        board.current?.animate(
          [0, -5, 4, -3, 2, 0].map((x) => ({
            transform: `translateX(${x}px)`,
          })),
          { duration: 310 },
        );
      }
      input.current?.focus();
      input.current?.select();
    }
    onAnswer(answer);
  }

  let position = 0;
  return (
    <form onSubmit={submit} className="space-y-6" data-phase={phase}>
      <div className="flex items-center justify-between gap-3">
        <div
          id="voca-shape"
          className="text-sm font-medium text-muted-foreground"
        >
          {words.length}단어 · {count}글자{" "}
          {words.length > 1 &&
            `(${words.map((part) => spellingLetters(part).length).join(" + ")})`}
        </div>
        {!done && (
          <span
            role="timer"
            aria-label={`남은 시간 ${seconds}초`}
            data-urgent={urgent}
            className="voca-clock"
          >
            <Timer className="size-4" />
            {seconds}초
          </span>
        )}
      </div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {word.meaning}
      </h2>
      {hint && !done && (
        <p role="status" className="text-sm text-teal-800">
          첫 글자 <strong lang="en">{letters[0]}</strong>
        </p>
      )}
      <div className="relative" ref={board}>
        {!done && (
          <input
            ref={input}
            id="voca-answer"
            aria-label="영어 답안"
            aria-describedby="voca-shape voca-feedback"
            aria-invalid={wrong}
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
            type="text"
            inputMode="text"
            maxLength={count}
            className="sr-only"
            value={value}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSelect={(e) => setSelection(e.currentTarget.selectionStart ?? 0)}
            onChange={(e) => {
              const text = spellingLetters(e.currentTarget.value).slice(
                0,
                count,
              );
              setValue(text);
              setSelection(
                Math.min(
                  text.length,
                  e.currentTarget.selectionStart ?? text.length,
                ),
              );
            }}
            onPaste={(e) => {
              e.preventDefault();
              const field = e.currentTarget;
              const from = field.selectionStart ?? value.length;
              const to = field.selectionEnd ?? from;
              const pasted = spellingLetters(
                e.clipboardData.getData("text"),
              ).slice(0, count - value.length + to - from);
              setValue(value.slice(0, from) + pasted + value.slice(to));
              requestAnimationFrame(() =>
                field.setSelectionRange(
                  from + pasted.length,
                  from + pasted.length,
                ),
              );
            }}
          />
        )}
        <div
          aria-hidden="true"
          className="flex min-w-0 flex-wrap gap-x-4 gap-y-2"
        >
          {words.map((part, group) => (
            <span
              key={group}
              className="inline-flex max-w-full flex-wrap items-center gap-1"
            >
              {Array.from(part, (char, offset) => {
                if (!spellingLetters(char))
                  return <span key={offset}>{char}</span>;
                const i = position++;
                return (
                  <span
                    key={offset}
                    data-letter-cell=""
                    data-active={
                      !done && focused && Math.min(selection, count - 1) === i
                    }
                    className="voca-cell"
                    style={{
                      animationDelay: won
                        ? `${Math.min(i, 12) * 25}ms`
                        : undefined,
                    }}
                    onClick={() => {
                      const el = input.current;
                      if (!el) return;
                      el.focus();
                      const start = Math.min(i, value.length);
                      el.setSelectionRange(
                        start,
                        Math.min(start + 1, value.length),
                      );
                    }}
                  >
                    {shown[i]}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
      </div>
      <div
        id="voca-feedback"
        role="status"
        aria-live="polite"
        className="text-sm font-medium"
      >
        {won ? (
          <p className="flex items-center gap-2 text-emerald-800">
            <Trophy className="size-5" />
            {round.lastGuess ? "다시 도전해서 맞혔어요!" : "정답이에요!"}{" "}
            <span lang="en">{response}</span>
          </p>
        ) : done ? (
          <div className="space-y-2 rounded-xl bg-muted px-4 py-3">
            <p className="text-base">
              정답 · <strong lang="en">{word.english}</strong>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Flag className="size-4" />
              {timedOut && "시간이 다 됐어요. "}틀린 단어에 모았어요.
            </p>
          </div>
        ) : wrong ? (
          <p className="flex items-center gap-2 text-rose-800">
            <CircleAlert className="size-4" />
            아쉬워요! 철자를 바꿔 다시 도전해 보세요.
          </p>
        ) : (
          <p className="text-muted-foreground">
            영어 철자를 채우고 Enter로 채점하세요.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-5">
        {done ? (
          <Button key="next" type="button" autoFocus onClick={onNext}>
            {nextLabel}
            <ArrowRight />
          </Button>
        ) : (
          <>
            <Button
              key="submit"
              type="submit"
              className="bg-teal-800 text-white hover:bg-teal-900"
              disabled={!value || deadline === undefined}
            >
              <Check />
              채점하기
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={hint}
              onClick={() => {
                setHint(true);
                if (!value) setValue(letters[0] ?? "");
                input.current?.focus();
              }}
            >
              <Lightbulb />
              힌트 보기
            </Button>
            <Button
              type="button"
              className="text-muted-foreground"
              variant="ghost"
              onClick={() => onAnswer(null)}
            >
              <Eye /> 정답 확인
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
