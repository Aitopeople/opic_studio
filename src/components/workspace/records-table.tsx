"use client";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExamSummary } from "@/lib/workspace";
import { clock, dateLabel } from "@/lib/utils";

export function RecordsTable({
  records,
  busy,
  onOpen,
  onDelete,
}: {
  records: ExamSummary[];
  busy: boolean;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">시험</TableHead>
            <TableHead>진행 상태</TableHead>
            <TableHead className="hidden sm:table-cell">답변</TableHead>
            <TableHead className="hidden lg:table-cell">발화 시간</TableHead>
            <TableHead>AI 학습 추정</TableHead>
            {onDelete && (
              <TableHead className="w-12 pr-4">
                <span className="sr-only">삭제</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="py-4 pl-6">
                <button
                  className="group grid gap-1 text-left disabled:opacity-50"
                  disabled={busy}
                  onClick={() => onOpen(record.id)}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {record.config.mode === "simulation"
                      ? "실전 모의시험"
                      : record.config.practiceQuestionId
                        ? "한 문항 연습"
                        : "자유 연습"}
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dateLabel(record.createdAt)}
                  </span>
                </button>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    record.status === "completed" ? "secondary" : "outline"
                  }
                >
                  {record.status === "completed" ? "완료" : "응시 중"}
                </Badge>
              </TableCell>
              <TableCell className="hidden tabular-nums sm:table-cell">
                {record.answered} / {record.count}
              </TableCell>
              <TableCell className="hidden tabular-nums lg:table-cell">
                {clock(record.duration)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record.range || "평가 전"}
              </TableCell>
              {onDelete && (
                <TableCell className="pr-4">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${dateLabel(record.createdAt)} 시험 삭제`}
                    disabled={busy}
                    onClick={() => onDelete(record.id)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
