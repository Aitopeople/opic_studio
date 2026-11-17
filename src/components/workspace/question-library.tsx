"use client";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page";
import { QUESTION_BANK } from "@/lib/questions";
import { TYPE_LABELS } from "@/lib/types";

export function QuestionLibrary({
  onPractice,
}: {
  onPractice: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [type, setType] = useState("all"),
    [topic, setTopic] = useState("all"),
    [page, setPage] = useState(1);
  const filtered = QUESTION_BANK.filter(
    (q) =>
      (type === "all" || q.type === type) &&
      (topic === "all" || q.topic === topic) &&
      `${q.prompt} ${q.topicLabel} ${TYPE_LABELS[q.type]}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    current = Math.min(page, pages);
  function reset() {
    setSearch("");
    setType("all");
    setTopic("all");
    setPage(1);
  }
  return (
    <div className="page-stack">
      <PageHeader
        title="문제 라이브러리"
        description={`주제와 유형별로 ${QUESTION_BANK.length}개의 자체 제작 문제를 연습할 수 있습니다.`}
      />
      <div className="library-toolbar">
        <div className="space-y-2">
          <Label htmlFor="question-search">문제 검색</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              id="question-search"
              aria-label="문제 검색"
              className="pl-9 pr-9"
              placeholder="주제나 질문 검색"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-0.5 top-0.5"
                aria-label="검색어 지우기"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic-filter">주제</Label>
          <Select
            value={topic}
            onValueChange={(v) => {
              setTopic(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              id="topic-filter"
              className="w-full"
              aria-label="주제 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 주제</SelectItem>
              {Array.from(
                new Map(QUESTION_BANK.map((q) => [q.topic, q.topicLabel])),
              ).map(([id, label]) => (
                <SelectItem value={id} key={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type-filter">유형</Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              id="type-filter"
              className="w-full"
              aria-label="유형 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 유형</SelectItem>
              {Object.entries(TYPE_LABELS).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <section className="space-y-4" aria-label="연습 문제">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" role="status">
            {filtered.length}개의 연습 문제
          </p>
          <p className="text-xs text-muted-foreground">
            실제 기출 원문이 아닌 자체 제작 문항
          </p>
        </div>
        {filtered.length ? (
          <div className="divide-y rounded-lg border">
            {filtered.slice((current - 1) * 12, current * 12).map((q) => (
              <article className="question-library-row" key={q.id}>
                <div className="min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{q.topicLabel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[q.type]}
                    </span>
                  </div>
                  <p className="text-sm leading-6" lang="en">
                    {q.prompt}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onPractice(q.id)}
                >
                  연습하기
                  <ArrowRight />
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>검색 결과가 없습니다</EmptyTitle>
              <EmptyDescription>
                검색어나 필터를 바꿔서 다시 찾아보세요.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={reset}>
              필터 초기화
            </Button>
          </Empty>
        )}
        {pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {current} / {pages} 페이지
            </p>
            <Pagination className="mx-0 w-auto" aria-label="문제 페이지">
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    size="default"
                    aria-label="이전 페이지"
                    href="#"
                    aria-disabled={current === 1}
                    className={
                      current === 1 ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (current === 1) return;
                      setPage(current - 1);
                    }}
                  >
                    <ChevronLeft />
                    이전
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    size="default"
                    aria-label="다음 페이지"
                    href="#"
                    aria-disabled={current === pages}
                    className={
                      current === pages ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (current === pages) return;
                      setPage(current + 1);
                    }}
                  >
                    다음
                    <ChevronRight />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>
    </div>
  );
}
