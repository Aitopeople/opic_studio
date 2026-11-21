const CONTRACTIONS: [RegExp, string][] = [
  [/\bcan't\b/g, "can not"],
  [/\bcannot\b/g, "can not"],
  [/\bwon't\b/g, "will not"],
  [/n't\b/g, " not"],
  [/'re\b/g, " are"],
  [/'m\b/g, " am"],
  [/'ll\b/g, " will"],
  [/'ve\b/g, " have"],
];
// Compares wording only: case, punctuation and common contractions don't matter.
export function normalizeSentence(text: string) {
  let value = text.toLowerCase().replace(/[’‘`]/g, "'");
  for (const [pattern, replacement] of CONTRACTIONS)
    value = value.replace(pattern, replacement);
  return value
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function sameSentence(answer: string, expected: string) {
  const normalized = normalizeSentence(answer);
  return normalized.length > 0 && normalized === normalizeSentence(expected);
}
// Splits a sentence around the first occurrence of a span for highlighting.
export function splitAround(sentence: string, span: string) {
  const start = span ? sentence.indexOf(span) : -1;
  if (start < 0) return { before: sentence, match: "", after: "" };
  return {
    before: sentence.slice(0, start),
    match: span,
    after: sentence.slice(start + span.length),
  };
}
// Marks every span once, in sentence order, skipping missing or overlapping ones.
export function markSpans(sentence: string, spans: string[]) {
  const ranges = spans
    .map((span) => ({ start: span ? sentence.indexOf(span) : -1, span }))
    .filter((range) => range.start >= 0)
    .sort((a, b) => a.start - b.start)
    .filter(
      (range, index, all) =>
        index === 0 ||
        range.start >= all[index - 1].start + all[index - 1].span.length,
    );
  const parts: { text: string; marked: boolean }[] = [];
  let cursor = 0;
  for (const { start, span } of ranges) {
    if (start > cursor)
      parts.push({ text: sentence.slice(cursor, start), marked: false });
    parts.push({ text: span, marked: true });
    cursor = start + span.length;
  }
  if (cursor < sentence.length)
    parts.push({ text: sentence.slice(cursor), marked: false });
  return parts;
}
