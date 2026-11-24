import type { Exam, GrammarItem, QuestionType } from "./types";
import {
  GRAMMAR_AUDIT_VERSION,
  conceptHasOpportunity,
  getGrammarConcept,
  type GrammarConceptId,
} from "./grammar-concepts";
import {
  correctedTranscript,
  correctionStart,
  excerptStart,
} from "./corrected-transcript";

export type GrammarOccurrence = {
  examId: string;
  createdAt: number;
  question: number;
  questionType: QuestionType;
  topicLabel: string;
  original: string;
  corrected: string;
  explanation: string;
  kind: "error" | "naturalness";
  transcriptionDoubt: boolean;
  // The learner's whole sentence, and the same sentence with its fixes applied.
  sentence: string;
  correctedSentence: string | null;
  // Every span the corrected sentence changes, so a drill can mark them all.
  highlights: string[];
};
export type ConceptStatus = "repeated" | "single" | "improving" | "suggestion";
export type ConceptStat = {
  id: GrammarConceptId;
  status: ConceptStatus;
  errors: number;
  suggestions: number;
  answersWithError: number;
  lastErrorAt: number | null;
  // Later answers whose question type gave a real chance to use the concept.
  chancesSinceLastError: number;
  occurrences: GrammarOccurrence[];
};
export type GrammarProfile = {
  checkedAnswers: number;
  concepts: ConceptStat[];
  unchecked: { id: string; createdAt: number; label: string }[];
};
// Absence of an error only counts as progress after this many real chances.
export const IMPROVING_AFTER_CHANCES = 2;

const STATUS_ORDER: Record<ConceptStatus, number> = {
  repeated: 0,
  single: 1,
  improving: 2,
  suggestion: 3,
};

export function grammarProfile(exams: Exam[]): GrammarProfile {
  const audited = exams
    .filter(
      (exam) =>
        exam.status === "completed" &&
        exam.evaluation?.grammarVersion === GRAMMAR_AUDIT_VERSION,
    )
    .sort((a, b) => a.createdAt - b.createdAt);
  const units = audited.flatMap((exam) =>
    exam.answers
      .filter((answer) => !answer.skipped && answer.transcript.trim())
      .sort((a, b) => a.index - b.index)
      .flatMap((answer) => {
        const question = exam.questions[answer.index];
        if (!question) return [];
        const items = (exam.evaluation?.grammar || []).filter(
          (item) => item.question === answer.index + 1,
        );
        return [{ exam, answer, question, items }];
      }),
  );
  const stats = new Map<
    GrammarConceptId,
    Omit<ConceptStat, "status" | "chancesSinceLastError"> & {
      lastErrorUnit: number;
      errorUnits: Set<number>;
    }
  >();
  units.forEach((unit, order) => {
    for (const item of unit.items) {
      if (item.transcriptionDoubt) continue;
      for (const id of item.concepts || []) {
        if (!getGrammarConcept(id)) continue;
        const stat = stats.get(id) || {
          id,
          errors: 0,
          suggestions: 0,
          answersWithError: 0,
          lastErrorAt: null,
          occurrences: [],
          lastErrorUnit: -1,
          errorUnits: new Set<number>(),
        };
        stats.set(id, stat);
        stat.occurrences.push(
          occurrence(unit.exam, unit.answer.transcript, item, unit.items),
        );
        if (item.kind === "error") {
          stat.errors++;
          stat.errorUnits.add(order);
          stat.lastErrorUnit = order;
          stat.lastErrorAt = unit.exam.createdAt;
        } else stat.suggestions++;
      }
    }
  });
  const concepts = [...stats.values()].map(
    ({ lastErrorUnit, errorUnits, ...stat }): ConceptStat => {
      const concept = getGrammarConcept(stat.id)!;
      const chancesSinceLastError =
        lastErrorUnit < 0
          ? 0
          : units
              .slice(lastErrorUnit + 1)
              .filter(
                (unit) =>
                  conceptHasOpportunity(concept, unit.question.type) &&
                  !unit.items.some(
                    (item) =>
                      item.transcriptionDoubt &&
                      item.concepts?.includes(concept.id),
                  ),
              ).length;
      const answersWithError = errorUnits.size;
      const status: ConceptStatus =
        stat.errors === 0
          ? "suggestion"
          : chancesSinceLastError >= IMPROVING_AFTER_CHANCES
            ? "improving"
            : answersWithError >= 2 || stat.errors >= 3
              ? "repeated"
              : "single";
      return {
        ...stat,
        answersWithError,
        status,
        chancesSinceLastError,
        occurrences: stat.occurrences.sort(
          (a, b) => b.createdAt - a.createdAt || a.question - b.question,
        ),
      };
    },
  );
  concepts.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      b.errors - a.errors ||
      (b.lastErrorAt || 0) - (a.lastErrorAt || 0) ||
      b.suggestions - a.suggestions,
  );
  const unchecked = exams
    .filter(
      (exam) =>
        exam.status === "completed" &&
        exam.evaluation &&
        exam.evaluation.grammarVersion !== GRAMMAR_AUDIT_VERSION &&
        exam.answers.some((a) => !a.skipped && a.transcript.trim()),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((exam) => ({
      id: exam.id,
      createdAt: exam.createdAt,
      label:
        exam.config.mode === "simulation"
          ? "실전 모의시험"
          : `${exam.questions[0]?.topicLabel || "자유"} 연습`,
    }));
  return { checkedAnswers: units.length, concepts, unchecked };
}

// The learner's sentence around a correction, and that sentence with every error
// fix inside it applied (plus the item itself when it is a suggestion).
export function sentenceContext(
  transcript: string,
  item: GrammarItem,
  answerItems: GrammarItem[],
) {
  const start = correctionStart(transcript, item);
  if (start < 0) return null;
  const [from, to] = sentenceRange(
    transcript,
    start,
    start + item.original.length,
  );
  const sentence = transcript.slice(from, to).trim();
  const fixes: GrammarItem[] = [];
  for (const other of answerItems) {
    const position = correctionStart(transcript, other);
    const selected =
      position === start &&
      other.original === item.original &&
      other.corrected === item.corrected;
    if (other.kind !== "error" && !selected) continue;
    if (position < 0) {
      if (excerptStart(sentence, other.original) >= 0) return null;
      continue;
    }
    const end = position + other.original.length;
    if (position >= to || end <= from) continue;
    if (position < from || end > to) return null;
    fixes.push({ ...other, originalStart: position - from, kind: "error" });
  }
  const corrected = correctedTranscript(sentence, fixes);
  if (corrected.skipped || !corrected.applied) return null;
  return {
    sentence,
    correctedSentence: corrected.text,
    highlights: fixes.map((fix) => fix.original),
  };
}

function occurrence(
  exam: Exam,
  transcript: string,
  item: GrammarItem,
  answerItems: GrammarItem[],
): GrammarOccurrence {
  const context = sentenceContext(transcript, item, answerItems) || {
    sentence: item.original,
    correctedSentence: null,
    highlights: [item.original],
  };
  const question = exam.questions[item.question - 1];
  return {
    examId: exam.id,
    createdAt: exam.createdAt,
    question: item.question,
    questionType: question?.type || "description",
    topicLabel: question?.topicLabel || "",
    original: item.original,
    corrected: item.corrected,
    explanation: item.explanation,
    kind: item.kind,
    transcriptionDoubt: Boolean(item.transcriptionDoubt),
    ...context,
  };
}

export function sentenceRange(text: string, start: number, end: number) {
  let from = start;
  while (from > 0 && !/[.!?]/.test(text[from - 1])) from--;
  while (from < start && /\s/.test(text[from])) from++;
  let to = end;
  if (!/[.!?]/.test(text[end - 1] || "")) {
    while (to < text.length && !/[.!?]/.test(text[to])) to++;
    if (to < text.length) to++;
  }
  return [from, to] as const;
}

// Error counts per concept, most frequent first. Untagged legacy items are skipped.
export function conceptCounts(items: GrammarItem[]) {
  const counts = new Map<GrammarConceptId, number>();
  for (const item of items)
    if (item.kind === "error" && !item.transcriptionDoubt)
      for (const id of item.concepts || [])
        counts.set(id, (counts.get(id) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
