import type { Evaluation, GrammarItem } from "./types";

// A quote such as "he go" must not match the middle of "she goes".
export function excerptStart(text: string, quote: string, from = 0) {
  if (!quote) return -1;
  const word = /[\p{L}\p{M}\p{N}]/u;
  let start = text.indexOf(quote, from);
  while (start >= 0) {
    const insideStart = word.test(quote[0]) && word.test(text[start - 1] || "");
    const insideEnd =
      word.test(quote[quote.length - 1]) &&
      word.test(text[start + quote.length] || "");
    if (!insideStart && !insideEnd) return start;
    start = text.indexOf(quote, start + 1);
  }
  return -1;
}

export function correctionStart(
  text: string,
  { original, originalStart }: Pick<GrammarItem, "original" | "originalStart">,
) {
  if (originalStart !== undefined) {
    return originalStart >= 0 &&
      excerptStart(text, original, originalStart) === originalStart
      ? originalStart
      : -1;
  }
  const first = excerptStart(text, original);
  return first >= 0 && excerptStart(text, original, first + 1) < 0 ? first : -1;
}

export function correctedTranscript(
  text: string,
  items: NonNullable<Evaluation["grammar"]>,
) {
  const errors = items.filter(
    (item) =>
      item.kind === "error" &&
      item.original.trim() &&
      item.original !== item.corrected,
  );
  const candidates = errors.flatMap((item) => {
    const start = correctionStart(text, item);
    if (item.transcriptionDoubt || start < 0) return [];
    return [
      { start, end: start + item.original.length, corrected: item.corrected },
    ];
  });
  // Ambiguous or overlapping excerpts stay in sentence cards instead of rewriting the wrong passage.
  const edits = candidates
    .filter(
      (edit, index) =>
        !candidates.some(
          (other, otherIndex) =>
            index !== otherIndex &&
            edit.start < other.end &&
            other.start < edit.end,
        ),
    )
    .sort((a, b) => b.start - a.start);
  return {
    text: edits.reduce(
      (value, edit) =>
        value.slice(0, edit.start) + edit.corrected + value.slice(edit.end),
      text,
    ),
    applied: edits.length,
    skipped: errors.length - edits.length,
  };
}
