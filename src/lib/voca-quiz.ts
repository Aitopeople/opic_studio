import { z } from "zod";
import { VOCA_WORDS, type VocaWord } from "./voca-words";

export const VOCA_SET_SIZE = 50;
const wordSchema = z.object({
  english: z.string().min(1),
  meaning: z.string().min(1),
  example: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
});
const roundSchema = z.object({
  words: z.array(wordSchema).min(1).max(VOCA_SET_SIZE),
  index: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  response: z.string().nullable(),
  reviewDue: z.boolean(),
  deadline: z.number().finite().optional(),
  lastGuess: z.string().optional(),
  timedOut: z.boolean().optional(),
});
export const vocaStateSchema = z.object({
  study: roundSchema.nullable(),
  review: roundSchema.nullable(),
  missed: z.array(wordSchema),
  seen: z.array(z.string()),
});
export type VocaState = z.infer<typeof vocaStateSchema>;
export type VocaRound = z.infer<typeof roundSchema>;
export const emptyVocaState: VocaState = {
  study: null,
  review: null,
  missed: [],
  seen: [],
};

export function wordKey(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesWord(word: VocaWord, text: string) {
  return [word.english, ...(word.alternatives ?? [])].some(
    (answer) => wordKey(answer) === wordKey(text),
  );
}

// Spaces and punctuation are printed on the board. The learner fills the letters.
export function spellingLetters(text: string) {
  return text.normalize("NFKC").replace(/[^\p{L}\p{N}]/gu, "");
}

// Keep the original blanks until the learner types past them using a known answer.
export function spellingTemplate(word: VocaWord, letters: string) {
  if (letters.length <= spellingLetters(word.english).length)
    return word.english;
  const prefix = letters.toLowerCase();
  return word.alternatives?.find((answer) =>
    spellingLetters(answer).toLowerCase().startsWith(prefix),
  );
}

export function spellingAnswer(word: VocaWord, input: string) {
  const letters = spellingLetters(input).toLowerCase();
  return (
    [word.english, ...(word.alternatives ?? [])].find(
      (answer) => spellingLetters(answer).toLowerCase() === letters,
    ) ?? input
  );
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let end = shuffled.length - 1; end > 0; end--) {
    const index = Math.floor(Math.random() * (end + 1));
    [shuffled[end], shuffled[index]] = [shuffled[index], shuffled[end]];
  }
  return shuffled;
}

function round(words: VocaWord[]) {
  return { words, index: 0, correct: 0, response: null, reviewDue: false };
}

export function startStudy(state: VocaState, personal: VocaWord[]): VocaState {
  if (
    state.review ||
    (state.study && state.study.index < state.study.words.length)
  )
    return state;
  const pool = new Map<string, VocaWord>();
  for (const word of [...shuffle(personal), ...shuffle(VOCA_WORDS)]) {
    const id = wordKey(word.english);
    if (!pool.has(id)) pool.set(id, word);
  }
  const seen = new Set(state.seen);
  const fresh = [...pool.keys()].filter((id) => !seen.has(id));
  const selected = fresh.slice(0, VOCA_SET_SIZE);
  let nextSeen = [...seen, ...selected];
  if (selected.length < VOCA_SET_SIZE) {
    const refill = [...pool.keys()]
      .filter((id) => seen.has(id))
      .slice(0, VOCA_SET_SIZE - selected.length);
    selected.push(...refill);
    nextSeen = refill;
  }
  return {
    ...state,
    seen: nextSeen,
    study: round(selected.map((id) => pool.get(id)!)),
  };
}

export function startReview(state: VocaState): VocaState {
  if (
    !state.missed.length ||
    (state.review && state.review.index < state.review.words.length)
  )
    return state;
  return {
    ...state,
    study: state.study && { ...state.study, reviewDue: false },
    review: round(shuffle(state.missed.slice(0, VOCA_SET_SIZE))),
  };
}

export function wordSeconds(word: VocaWord) {
  return Math.min(90, 15 + 2 * spellingLetters(word.english).length);
}

// Start on display so time spent on the feedback screen never costs the next word.
export function startWordClock(state: VocaState, now = Date.now()): VocaState {
  const mode = state.review ? "review" : "study";
  const current = state[mode];
  const word = current?.words[current.index];
  if (
    !current ||
    !word ||
    current.response !== null ||
    current.deadline !== undefined
  )
    return state;
  return {
    ...state,
    [mode]: { ...current, deadline: now + wordSeconds(word) * 1000 },
  };
}

export function answerWord(
  state: VocaState,
  response: string | null,
  now = Date.now(),
): VocaState {
  const mode = state.review ? "review" : "study";
  const current = state[mode];
  const word = current?.words[current.index];
  if (
    !current ||
    !word ||
    current.response !== null ||
    (response !== null && !response.trim())
  )
    return state;
  const timedOut = current.deadline !== undefined && now >= current.deadline;
  const guess = timedOut ? null : response;
  const correct = guess !== null && matchesWord(word, guess);
  const id = wordKey(word.english);
  const knownMiss = state.missed.some((w) => wordKey(w.english) === id);
  let missed = state.missed;
  if (correct && knownMiss && !current.lastGuess)
    missed = missed.filter((w) => wordKey(w.english) !== id);
  if (!correct && !knownMiss) missed = [...missed, word];
  return {
    ...state,
    missed,
    [mode]: {
      ...current,
      response: correct ? guess : guess === null ? "" : null,
      lastGuess: !correct && guess ? guess : current.lastGuess,
      timedOut,
      correct: current.correct + Number(correct),
      reviewDue:
        current.reviewDue ||
        (mode === "study" &&
          !correct &&
          !knownMiss &&
          missed.length >= VOCA_SET_SIZE),
    },
  };
}

export function nextWord(state: VocaState): VocaState {
  const mode = state.review ? "review" : "study";
  const current = state[mode];
  if (!current || current.response === null) return state;
  const next = {
    ...state,
    [mode]: {
      ...current,
      index: current.index + 1,
      response: null,
      reviewDue: false,
      lastGuess: undefined,
      deadline: undefined,
      timedOut: undefined,
    },
  };
  return current.reviewDue && state.missed.length >= VOCA_SET_SIZE
    ? startReview(next)
    : next;
}
