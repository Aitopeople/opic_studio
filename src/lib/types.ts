import type { TargetGrade, TargetCriterionId } from "./target-profiles";
import type { GrammarConceptId } from "./grammar-concepts";
export type TargetFeedback = {
  version: string;
  target: TargetGrade;
  summary: string;
  criteria: {
    id: TargetCriterionId;
    status: "demonstrated" | "developing" | "not_observed";
    feedback: string;
    evidence: { question: number; quote: string }[];
    practice: string;
  }[];
};
export type QuestionType =
  | "intro"
  | "description"
  | "routine"
  | "past"
  | "comparison"
  | "roleplay"
  | "solution"
  | "opinion";
export const TYPE_LABELS: Record<QuestionType, string> = {
  intro: "자기소개",
  description: "묘사",
  routine: "일상·습관",
  past: "과거 경험",
  comparison: "비교·변화",
  roleplay: "질문하기",
  solution: "문제 해결",
  opinion: "의견 제시",
};
export type Question = {
  id: string;
  topic: string;
  topicLabel: string;
  type: QuestionType;
  prompt: string;
  hint: string;
  difficulty: number;
};
export type ExamConfig = {
  mode: "simulation" | "practice";
  difficulty: number;
  count: 12 | 15;
  target: string;
  topics: string[];
  occupation: string;
  student: string;
  residence: string;
  practiceQuestionId?: string;
};
export type Answer = {
  index: number;
  duration: number;
  audio: string | null;
  mime: string | null;
  transcript: string;
  transcriptSource: "pending" | "browser" | "manual" | "gpt";
  skipped: boolean;
};
export type VocabularySuggestion = {
  question: number;
  quote: string;
  phrase: string;
  meaning: string;
  reason: string;
  example: string;
  practice: string;
};

export type Evaluation = {
  targetFeedback?: TargetFeedback;
  vocabulary?: VocabularySuggestion[];
  range: string;
  confidence: "low" | "medium";
  summary: string;
  dimensions: { name: string; score: number; feedback: string }[];
  strengths: string[];
  priorities: string[];
  evidence: {
    question: number;
    quote: string;
    feedback: string;
    improved: string;
  }[];
  studyPlan: string[];
  grammar?: {
    question: number;
    original: string;
    originalStart?: number;
    corrected: string;
    explanation: string;
    category: string;
    kind: "error" | "naturalness";
    // Absent on items saved before the dedicated grammar audit.
    concepts?: GrammarConceptId[];
    transcriptionDoubt?: boolean;
  }[];
  // Set only when grammar came from the current dedicated audit.
  grammarVersion?: string;
  disclaimer: string;
};
export type GrammarItem = NonNullable<Evaluation["grammar"]>[number];
export type Exam = {
  id: string;
  userId: string;
  config: ExamConfig;
  status: "active" | "adjustment" | "completed";
  createdAt: number;
  deadline: number;
  completedAt: number | null;
  index: number;
  plays: number;
  questions: Question[];
  answers: Answer[];
  adjustment: "easier" | "same" | "harder" | null;
  evaluation: Evaluation | null;
};
export type PublicExam = Omit<Exam, "userId" | "questions"> & {
  questions: Question[];
};
export type User = {
  id: string;
  name: string;
  email: string | null;
  demo: boolean;
};
export type SessionInfo = {
  user: User | null;
  authConfigured: boolean;
  authMode: "local" | "partner" | "pending";
  aiConfigured: boolean;
  sharing: boolean;
  showPlanWelcome: boolean;
  demoEnabled: boolean;
  model: string;
  effort: string;
  transcriptionConfigured: boolean;
};
