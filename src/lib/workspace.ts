import type { ExamConfig } from "./types";

export type WorkspaceView =
  | "dashboard"
  | "bank"
  | "history"
  | "grammar"
  | "guide"
  | "settings"
  | "setup"
  | "practice"
  | "example"
  | "exam"
  | "results";
export type ExamSummary = {
  id: string;
  createdAt: number;
  completedAt: number | null;
  config: ExamConfig;
  status: string;
  index: number;
  count: number;
  answered: number;
  duration: number;
  range: string | null;
};
export const VIEW_LABELS: Record<WorkspaceView, string> = {
  dashboard: "학습 홈",
  bank: "문제 라이브러리",
  history: "학습 기록",
  grammar: "문법 노트",
  guide: "시험 가이드",
  settings: "계정 및 설정",
  setup: "모의시험 준비",
  practice: "한 문항 연습",
  example: "교정 예시",
  exam: "모의시험",
  results: "답변 복습",
};
export const TARGET_GRADES = ["IL", "IM1", "IM2", "IM3", "IH", "AL"];
