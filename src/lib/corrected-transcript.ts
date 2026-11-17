import type { Evaluation } from "./types";

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
    const start = text.indexOf(item.original);
    if (start < 0 || text.indexOf(item.original, start + 1) >= 0) return [];
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
