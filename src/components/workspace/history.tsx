import { Headphones, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { PageHeader } from "@/components/layout/page";
import { RecordsTable } from "./records-table";
import type { ExamSummary } from "@/lib/workspace";

export function LearningHistory({
  records,
  signedIn,
  busy,
  onConnect,
  onStart,
  onOpen,
  onDelete,
}: {
  records: ExamSummary[];
  signedIn: boolean;
  busy: boolean;
  onConnect: () => void;
  onStart: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="page-stack">
      <PageHeader
        title="학습 기록"
        description="시험별 녹음과 전사문, AI 피드백을 다시 확인하세요."
        actions={
          signedIn && (
            <Button onClick={onStart}>
              <Headphones />새 모의시험
            </Button>
          )
        }
      />
      {records.length ? (
        <RecordsTable
          records={records}
          busy={busy}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>
              {signedIn
                ? "학습 기록이 없습니다"
                : "계정을 연결해 기록을 확인하세요"}
            </EmptyTitle>
            <EmptyDescription>
              {signedIn
                ? "모의시험이나 한 문항 연습을 마치면 이곳에 저장됩니다."
                : "ChatGPT를 연결하면 시험 기록을 보관하고 본인 구독으로 피드백을 받을 수 있습니다."}
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={signedIn ? onStart : onConnect}>
            {signedIn ? "모의시험 시작" : "ChatGPT 연결"}
          </Button>
        </Empty>
      )}
    </div>
  );
}
