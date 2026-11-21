"use client";
import { useState } from "react";
import { ArrowRight, Check, Eye, RotateCcw } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { SpeakableText } from "./speech-playback";
import { markSpans, sameSentence } from "@/lib/grammar-drill";
import type { GrammarOccurrence } from "@/lib/grammar-profile";
import { TYPE_LABELS } from "@/lib/types";
import { dateLabel } from "@/lib/utils";

type Result = "correct" | "different" | "revealed";

// Learners rewrite their own sentences; checking is local and never calls AI.
export function GrammarDrill({ items }: { items: GrammarOccurrence[] }) {
  const seen = new Set<string>();
  const drills = items.filter((item) => {
    const key = `${item.examId}|${item.question}|${item.sentence}`;
    if (
      item.kind !== "error" ||
      !item.sentence ||
      item.correctedSentence === item.sentence ||
      seen.has(key)
    )
      return false;
    seen.add(key);
    return true;
  });
  const [index, setIndex] = useState(0),
    [draft, setDraft] = useState(""),
    [result, setResult] = useState<Result | null>(null),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false);
  if (!drills.length)
    return (
      <p className="text-sm leading-7 text-muted-foreground">
        이 개념으로 고쳐 쓸 문장이 아직 없어요. 문법 수정이 나온 답변이 생기면
        여기에서 연습할 수 있어요.
      </p>
    );
  if (done)
    return (
      <div className="space-y-4 rounded-lg border p-5" data-drill-summary>
        <p className="text-sm font-medium">
          {drills.length}문장 중 {score}문장을 교정문과 같게 고쳤어요.
        </p>
        <p className="text-xs leading-6 text-muted-foreground">
          맞힌 문장도 교정문을 듣고 소리 내어 따라 말해 보세요. 다음 답변에서 이
          개념을 쓸 기회가 생기면 실제로 고쳐졌는지 문법 노트에서 확인할 수
          있어요.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIndex(0);
            setDraft("");
            setResult(null);
            setScore(0);
            setDone(false);
          }}
        >
          <RotateCcw />
          처음부터 다시
        </Button>
      </div>
    );
  const item = drills[index];
  const parts = markSpans(
    item.sentence,
    item.highlights?.length ? item.highlights : [item.original],
  );
  function check() {
    const correct = sameSentence(draft, item.correctedSentence);
    setResult(correct ? "correct" : "different");
    if (correct) setScore((value) => value + 1);
  }
  function next() {
    if (index + 1 >= drills.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setDraft("");
    setResult(null);
  }
  return (
    <div className="space-y-5" data-grammar-drill>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {index + 1} / {drills.length} 문장
        </span>
        <span className="text-xs text-muted-foreground">
          {dateLabel(item.createdAt)} · Q{item.question}{" "}
          {TYPE_LABELS[item.questionType]}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium">내가 말한 문장</p>
        <p lang="en" className="text-sm leading-8">
          {parts.map((part, i) =>
            part.marked ? (
              <mark key={i} className="grammar-mark">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="grammar-drill-answer">
          표시한 부분을 모두 고쳐 문장 전체를 다시 써 보세요
        </label>
        <Textarea
          id="grammar-drill-answer"
          lang="en"
          rows={3}
          value={draft}
          disabled={result !== null}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              draft.trim()
            ) {
              event.preventDefault();
              check();
            }
          }}
          placeholder="Type the corrected sentence"
        />
      </div>
      {result === null ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={!draft.trim()} onClick={check}>
            <Check />
            확인
          </Button>
          <Button variant="outline" onClick={() => setResult("revealed")}>
            <Eye />
            교정문 보기
          </Button>
        </div>
      ) : (
        <div
          className="space-y-4 rounded-lg border p-4"
          data-drill-result={result}
        >
          {result !== "revealed" && (
            <Badge variant={result === "correct" ? "secondary" : "outline"}>
              {result === "correct" ? "교정문과 같아요" : "교정문과 달라요"}
            </Badge>
          )}
          <SpeakableText
            heading={<span className="text-xs font-medium">교정문</span>}
            text={item.correctedSentence}
            label="교정문 듣기"
            className="grammar-corrected"
          />
          <p className="text-xs leading-6 text-muted-foreground">
            {item.explanation}
          </p>
          {result === "different" && (
            <p className="text-xs leading-6 text-muted-foreground">
              다른 표현도 맞을 수 있어요. 표시한 부분을 모두 고친 교정문과
              비교한 결과예요.
            </p>
          )}
          <p className="text-xs leading-6 text-muted-foreground">
            교정문을 듣고 소리 내어 세 번 따라 말해 보세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {result === "different" && (
              <Button
                variant="outline"
                onClick={() => {
                  setResult("correct");
                  setScore((value) => value + 1);
                }}
              >
                내 답도 맞아요
              </Button>
            )}
            <Button onClick={next}>
              {index + 1 >= drills.length ? "결과 보기" : "다음 문장"}
              <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
