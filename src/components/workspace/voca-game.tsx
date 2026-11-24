"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Gamepad2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  answerWord,
  nextWord,
  startStudy,
  startWordClock,
} from "@/lib/voca-quiz";
import { useVoca } from "./use-voca";
import { VocaSpelling } from "./voca-spelling";
import { Progress } from "@/components/ui/progress";
import "./voca-game.css";

export function VocaGame({ userId }: { userId?: string }) {
  const { state, personal, notice, sourceError, change } = useVoca(userId);
  const current = state?.review ?? state?.study;
  const word = current?.words[current.index];
  const reviewing = Boolean(state?.review);
  return (
    <main className="voca-arena min-h-svh">
      <header className="border-b border-teal-900/10 bg-white/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/?view=voca">
              <ArrowLeft />
              단어장으로
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-sm">
            <Gamepad2 className="size-5 text-teal-800" />
            {reviewing ? "틀린 단어 되짚어보기" : "50단어 퀴즈"}
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-16">
        {notice && <p role="status">{notice}</p>}
        {sourceError && (
          <p role="status">
            추천 표현을 불러오지 못했어요. 기본 어휘로 연습할 수 있어요.
          </p>
        )}
        {!state ? (
          <p role="status">학습 진도를 불러오는 중…</p>
        ) : (
          <section className="min-w-0 space-y-7 rounded-3xl border border-teal-900/15 bg-card p-5 shadow-[0_16px_60px_-36px_#17605266] sm:p-10">
            {current && word ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm tabular-nums">
                    <span className="font-medium">
                      문항 {current.index + 1} / {current.words.length}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-teal-800">
                      <Check className="size-4" />
                      정답 {current.correct}개
                    </span>
                  </div>
                  <Progress
                    className="h-1.5 bg-teal-900/10 [&_[data-slot=progress-indicator]]:bg-teal-800"
                    aria-label="학습 진행률"
                    value={
                      (100 *
                        (current.index + Number(current.response !== null))) /
                      current.words.length
                    }
                  />
                </div>
                <VocaSpelling
                  key={`${reviewing}-${current.index}-${word.english}`}
                  word={word}
                  round={current}
                  onStartClock={() => void change(startWordClock)}
                  onAnswer={(response) =>
                    void change((s) => answerWord(s, response))
                  }
                  onNext={() => void change(nextWord)}
                  nextLabel={
                    current.reviewDue
                      ? "틀린 단어 50개 되짚어보기"
                      : current.index + 1 === current.words.length
                        ? "결과 보기"
                        : "다음 문항"
                  }
                />
              </>
            ) : (
              <>
                {current && <Trophy className="size-9 text-amber-600" />}
                <h2 className="text-xl">
                  {current
                    ? `${current.words.length}문항 중 ${current.correct}문항 정답`
                    : "한국어 뜻을 보고 영어 철자를 채워 보세요."}
                </h2>
                <Button
                  disabled={!reviewing && personal === null}
                  onClick={() =>
                    void change((s) =>
                      reviewing
                        ? { ...s, review: null }
                        : startStudy(s, personal ?? []),
                    )
                  }
                >
                  {reviewing
                    ? "일반 학습으로 돌아가기"
                    : current
                      ? "다음 50단어 시작"
                      : "50단어 시작"}
                  <ArrowRight />
                </Button>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
