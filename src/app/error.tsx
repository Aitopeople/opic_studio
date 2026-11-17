"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-6 px-6">
      <h1>화면을 불러오지 못했습니다.</h1>
      <p className="text-muted-foreground">
        저장된 시험 기록은 유지됩니다. 다시 연결해 주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  );
}
