"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  House,
  Layers,
  LibraryBig,
  Play,
  RotateCcw,
  ShoppingBag,
  Sun,
  Tickets,
  TrainFront,
  Utensils,
  Volleyball,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  SpeechListenButton,
  useSpeechPlayback,
} from "@/components/speech-playback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startReview, startStudy } from "@/lib/voca-quiz";
import { dictionarySenses } from "@/lib/voca-dictionary";
import {
  VOCA_BOOKS,
  VOCA_LEVEL_BOOKS,
  VOCA_TOPIC_WORDS,
  VOCA_WORDS,
  type VocaWord,
} from "@/lib/voca-words";
import { useVoca } from "./use-voca";

const pageSize = 25;
const alphabetical = (a: VocaWord, b: VocaWord) =>
  a.english.localeCompare(b.english, "en");
const allWords = [...VOCA_WORDS].sort(alphabetical);
const gradeBooks = VOCA_LEVEL_BOOKS.map((book) => ({
  ...book,
  words: [...book.words].sort(alphabetical),
}));

const covers = {
  transport: [TrainFront, "bg-sky-100 text-sky-800"],
  travel: [Tickets, "bg-indigo-100 text-indigo-800"],
  weather: [Sun, "bg-amber-100 text-amber-800"],
  shopping: [ShoppingBag, "bg-rose-100 text-rose-800"],
  home: [House, "bg-teal-100 text-teal-800"],
  food: [Utensils, "bg-orange-100 text-orange-800"],
  leisure: [Volleyball, "bg-lime-100 text-lime-800"],
  work: [BriefcaseBusiness, "bg-slate-100 text-slate-800"],
} as const;

function ExampleSentence({
  word,
  sentence,
}: {
  word: string;
  sentence: string;
}) {
  const term = word.trim();
  if (!term) return <>{sentence}</>;
  const literal = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${literal})(?![\\p{L}\\p{N}])`,
    "giu",
  );
  return sentence.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded-sm bg-teal-100/80 px-0.5 font-semibold text-teal-950"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function WordEntry({ word }: { word: VocaWord }) {
  const senses = dictionarySenses(word.english);
  const sharedPart =
    senses.length && senses.every(([part]) => part === senses[0][0])
      ? senses[0][0]
      : null;
  const showContext =
    senses.length > 0 &&
    !VOCA_WORDS.some(
      (entry) =>
        entry.english === word.english && entry.meaning === word.meaning,
    );
  return (
    <div className="grid gap-y-1 px-4 py-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @2xl:gap-x-6 @2xl:px-6">
      <dt className="flex min-w-0 flex-wrap items-center gap-x-1.5">
        <span
          lang="en"
          className="min-w-0 text-xl leading-tight font-semibold tracking-tight break-words"
        >
          {word.english}
        </span>
        <SpeechListenButton
          text={word.english}
          label={`${word.english} 발음 듣기`}
          iconOnly
        />
        {sharedPart && (
          <span className="rounded border border-teal-900/10 bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-800">
            {sharedPart}
          </span>
        )}
      </dt>
      <dd className="min-w-0 text-[15px] leading-relaxed @2xl:col-start-1">
        {senses.length ? (
          <ol
            className={
              senses.length > 1
                ? "list-decimal space-y-1 pl-5 marker:text-muted-foreground"
                : "list-none"
            }
          >
            {senses.map(([part, meaning], i) => (
              <li
                key={meaning}
                className={i ? "text-muted-foreground" : "text-foreground"}
              >
                {!sharedPart && (
                  <span className="mr-2 text-xs font-medium text-teal-800">
                    {part}
                  </span>
                )}
                {meaning}
              </li>
            ))}
          </ol>
        ) : (
          word.meaning
        )}
        {showContext && (
          <p className="mt-1 text-sm text-muted-foreground">
            이 표현의 뜻 · {word.meaning}
          </p>
        )}
      </dd>
      {word.example && (
        <dd className="mt-2 min-w-0 self-center border-l-2 border-teal-700/20 pl-3 @2xl:col-start-2 @2xl:row-span-2 @2xl:row-start-1 @2xl:mt-0 @2xl:pl-4">
          <span className="sr-only">예문</span>
          <q
            lang="en"
            className="block max-w-[68ch] text-base leading-relaxed text-slate-700"
          >
            <ExampleSentence word={word.english} sentence={word.example} />
          </q>
        </dd>
      )}
    </div>
  );
}

function WordList({ words }: { words: VocaWord[] }) {
  const { error } = useSpeechPlayback();
  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="bg-card">
        <div
          aria-hidden="true"
          className="hidden gap-x-6 border-b border-teal-900/10 bg-teal-50/70 px-6 py-2.5 text-sm font-semibold text-teal-900 @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
          <span>단어 · 뜻풀이</span>
          {words.some((word) => word.example) && <span>예문</span>}
        </div>
        <dl className="divide-y divide-teal-900/10">
          {words.map((word) => (
            <WordEntry key={word.english} word={word} />
          ))}
        </dl>
      </div>
    </>
  );
}

export function VocaPage({ userId }: { userId?: string }) {
  const router = useRouter();
  const { state, personal, change, notice, sourceError } = useVoca(userId);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const book = VOCA_BOOKS.find((item) => item.id === selectedBook);
  const [BookIcon, coverColor] = book ? covers[book.id] : [BookOpen, ""];
  const [grade, setGrade] = useState("all");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState<string | null>(null);
  const gradeBook = gradeBooks.find((book) => book.grade === grade);
  const words = gradeBook?.words ?? allWords;
  const pages = Math.ceil(words.length / pageSize);
  const offset = (page - 1) * pageSize;
  const review = state?.review;
  const reviewing = review && review.index < review.words.length;
  const current = reviewing ? review : state?.study;
  const underway = current && current.index < current.words.length;
  const missed = state?.missed ?? [];

  async function play(review: boolean) {
    const ready = await change((s) => {
      if (review) return startReview(s);
      if (s.review && s.review.index < s.review.words.length) return s;
      return startStudy(s.review ? { ...s, review: null } : s, personal ?? []);
    });
    if (ready) router.push("/voca/play");
  }
  return (
    <div className="@container flex min-w-0 flex-col gap-6">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          VOCA 단어장
        </h1>
        <p className="text-base text-muted-foreground">
          단어의 뜻과 예문을 살펴보고, 50단어 퀴즈로 복습하세요.
        </p>
      </header>
      <section className="grid items-center gap-5 rounded-2xl bg-linear-to-r from-teal-950 to-teal-800 p-5 text-white @lg:grid-cols-[minmax(0,1fr)_auto] @lg:px-7 @lg:py-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/12 text-teal-50">
            <BookOpen className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">
              {reviewing ? "틀린 단어 복습" : "50단어 퀴즈"}
            </h2>
            {underway ? (
              <div className="mt-2 flex max-w-sm flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-sm text-teal-50 tabular-nums">
                  {current.words.length}문항 중{" "}
                  <strong>{current.index + 1}번째</strong>
                </span>
                <Progress
                  aria-label="완료한 문항"
                  className="h-1.5 min-w-16 flex-1 bg-white/20 [&_[data-slot=progress-indicator]]:bg-teal-200"
                  value={
                    (100 *
                      (current.index + Number(current.response !== null))) /
                    current.words.length
                  }
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-teal-50">
                한국어 뜻을 보고 영어 철자를 채워 보세요.
              </p>
            )}
          </div>
        </div>
        <Button
          size="lg"
          className="h-11 rounded-lg bg-white px-5 text-base font-semibold text-teal-950 hover:bg-teal-50"
          disabled={!state || (!underway && personal === null)}
          onClick={() => void play(false)}
        >
          <Play />
          {underway ? "이어서 풀기" : "퀴즈 시작"}
        </Button>
      </section>
      {notice && <p role="status">{notice}</p>}
      <Tabs defaultValue="catalog" className="min-w-0 gap-6">
        <TabsList
          aria-label="단어 모음"
          className="grid w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1.5 group-data-[orientation=horizontal]/tabs:h-auto @xl:grid-cols-4 [&_[role=tab]]:h-11 [&_[role=tab]]:gap-2 [&_[role=tab]]:text-[15px] [&_[role=tab]]:font-semibold [&_[aria-selected=true]]:text-teal-900"
        >
          <TabsTrigger value="catalog">
            <Layers />
            전체 단어
          </TabsTrigger>
          <TabsTrigger value="topics">
            <LibraryBig />
            주제별 단어집
          </TabsTrigger>
          <TabsTrigger value="missed">
            <RotateCcw />
            틀린 단어{" "}
            {state && (
              <span className="rounded-md bg-background/80 px-1.5 text-xs tabular-nums">
                {missed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="personal">
            <Bookmark />내 추천 표현
          </TabsTrigger>
        </TabsList>
        <TabsContent value="topics" className="space-y-4">
          {book ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${coverColor}`}
                  >
                    <BookIcon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">{book.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {book.words.length}개 단어
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBook(null)}
                >
                  <ArrowLeft />
                  전체 주제
                </Button>
              </div>
              <WordList words={book.words} />
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold">
                  {VOCA_BOOKS.length}개 주제
                </h2>
                <span className="text-sm text-muted-foreground">
                  전체 {VOCA_TOPIC_WORDS.length}개 단어
                </span>
              </div>
              <div className="grid gap-3 @lg:grid-cols-2 @min-[58rem]:grid-cols-4">
                {VOCA_BOOKS.map((item) => {
                  const [Icon, color] = covers[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBook(item.id)}
                      className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-4 rounded-2xl border bg-card p-4 text-left transition hover:border-teal-700/50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-teal-700 @lg:grid-cols-[1fr_auto] @lg:gap-y-4 @lg:p-5"
                    >
                      <span
                        className={`row-span-2 grid size-12 place-items-center rounded-xl @lg:row-span-1 ${color}`}
                      >
                        <Icon className="size-6" strokeWidth={1.7} />
                      </span>
                      <strong className="col-start-2 row-start-1 self-end text-lg leading-snug tracking-tight @lg:col-start-1 @lg:row-start-2">
                        {item.title}
                      </strong>
                      <span className="col-start-2 row-start-2 self-start text-sm text-muted-foreground @lg:row-start-1 @lg:justify-self-end @lg:self-center">
                        {item.words.length}개 단어
                      </span>
                      <ChevronRight className="col-start-3 row-span-2 row-start-1 size-4 text-muted-foreground group-hover:text-teal-800 @lg:col-start-2 @lg:row-span-1 @lg:row-start-2 @lg:justify-self-end" />
                      <span
                        lang="en"
                        className="col-span-full -mt-2 hidden truncate text-sm text-muted-foreground @lg:block"
                      >
                        {item.words
                          .slice(0, 2)
                          .map((w) => w.english)
                          .join(" · ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {gradeBook ? gradeBook.focus : "전체 단어"}{" "}
              <span className="ml-1 text-base font-medium text-teal-800">
                {words.length.toLocaleString("ko-KR")}개
              </span>
            </h2>
            <div className="flex items-center gap-2 text-sm font-medium">
              <label htmlFor="voca-grade">목표 등급</label>
              <Select
                value={grade}
                onValueChange={(value) => {
                  setGrade(value);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  id="voca-grade"
                  className="min-w-28 rounded-xl border-teal-900/20 bg-card font-semibold text-teal-900 hover:bg-teal-50 data-[size=default]:h-10"
                >
                  <SelectValue>{gradeBook?.grade ?? "전체보기"}</SelectValue>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="end"
                  collisionPadding={12}
                  className="max-w-[calc(100vw-1.5rem)] rounded-xl border-teal-900/15 shadow-lg [&_[role=option]]:min-h-10 [&_[role=option]]:rounded-lg [&_[role=option]]:px-3 [&_[role=option]]:pr-9 [&_[role=option]:focus]:bg-teal-50 [&_[aria-selected=true]]:text-teal-900"
                >
                  <SelectItem value="all">전체보기</SelectItem>
                  <SelectSeparator />
                  {gradeBooks.map((item) => (
                    <SelectItem
                      key={item.grade}
                      value={item.grade}
                      textValue={item.grade}
                    >
                      <span className="w-8 shrink-0 font-semibold">
                        {item.grade}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.focus}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <nav
            aria-label="단어 목록 페이지"
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span
              aria-live="polite"
              className="text-muted-foreground tabular-nums"
            >
              A–Z · {offset + 1}–{Math.min(offset + pageSize, words.length)}번째
              단어
            </span>
            <div className="inline-flex items-center text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                disabled={page === 1}
                aria-label="이전 페이지"
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft />
              </Button>
              <span aria-hidden="true" className="h-4 w-px bg-border" />
              <div className="mx-2 grid grid-cols-[3ch_auto_3ch] items-center gap-0.5 text-center text-sm leading-5 tabular-nums">
                <input
                  aria-label="현재 페이지"
                  aria-description={`1부터 ${pages}까지 입력하고 Enter로 이동하세요.`}
                  title="페이지 번호를 입력하고 Enter로 이동"
                  inputMode="numeric"
                  enterKeyHint="go"
                  autoComplete="off"
                  className="h-8 w-full min-w-0 rounded-sm border-0 bg-transparent p-0 text-center font-semibold text-foreground outline-none hover:bg-muted focus:bg-teal-50 focus:ring-1 focus:ring-teal-700"
                  value={pageInput ?? page}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value))
                      setPageInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") event.currentTarget.blur();
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (pageInput)
                      setPage(Math.min(pages, Math.max(1, Number(pageInput))));
                    event.currentTarget.blur();
                  }}
                  onBlur={() => setPageInput(null)}
                />
                <span aria-hidden="true" className="text-muted-foreground/60">
                  /
                </span>
                <span>{pages}</span>
              </div>
              <span aria-hidden="true" className="h-4 w-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                disabled={page === pages}
                aria-label="다음 페이지"
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </nav>
          <WordList words={words.slice(offset, offset + pageSize)} />
          <p className="text-sm text-muted-foreground">
            말하기 과제를 참고해 선정한 추천 어휘예요.{" "}
            <a
              href="https://www.actfl.org/uploads/files/general/OPIc_Familiarization_Guide.pdf"
              className="underline underline-offset-4"
            >
              ACTFL OPIc 안내서
            </a>
          </p>
        </TabsContent>
        <TabsContent value="missed" className="space-y-4">
          {!state ? (
            <p role="status">진도를 불러오는 중…</p>
          ) : missed.length ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground">
                  50개가 모이면 자동으로 복습해요. 지금도 다시 풀 수 있어요.
                </p>
                <Button variant="outline" onClick={() => void play(true)}>
                  <RotateCcw />
                  되짚어보기
                </Button>
              </div>
              <WordList
                words={missed.map((word) => {
                  if (word.example) return word;
                  // Earlier saved rounds contain just the expression and meaning.
                  const sameEntry = (entry: VocaWord) =>
                    entry.english === word.english &&
                    entry.meaning === word.meaning &&
                    entry.example;
                  return (
                    personal?.find(sameEntry) ??
                    VOCA_WORDS.find(sameEntry) ??
                    word
                  );
                })}
              />
            </>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
              아직 틀린 단어가 없어요. 퀴즈에서 틀린 단어는 여기에 모입니다.
            </p>
          )}
        </TabsContent>
        <TabsContent value="personal">
          {personal?.length ? (
            <WordList words={personal} />
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
              {sourceError
                ? "추천 표현을 불러오지 못했어요. 잠시 후 다시 열어 주세요."
                : personal === null
                  ? "추천 표현을 불러오는 중…"
                  : "말하기 연습을 마치면 내 답변에서 추천받은 표현이 여기에 모입니다."}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
