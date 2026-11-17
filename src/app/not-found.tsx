import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-6 px-6">
      <h1>이 페이지를 찾을 수 없습니다.</h1>
      <Button asChild>
        <Link href="/">학습 홈으로 돌아가기</Link>
      </Button>
    </main>
  );
}
