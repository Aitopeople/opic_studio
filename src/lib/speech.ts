// Minimal Web Speech API interfaces for browsers exposing a vendor-prefixed constructor.
export interface RecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        resultIndex: number;
        results: { length: number; [index: number]: RecognitionResult };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export function recognitionConstructor() {
  const browser = window as typeof window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}

export function englishVoice(voices: SpeechSynthesisVoice[]) {
  const english = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );
  return (
    english.find((voice) =>
      /Samantha|Jenny|Aria|Google US English/i.test(voice.name),
    ) ||
    english.find((voice) => voice.lang.toLowerCase() === "en-us") ||
    english[0] ||
    null
  );
}

// Keep long answers in bounded utterances and prefer natural sentence boundaries.
export function speechChunks(text: string): string[] {
  const sentences =
    typeof Intl.Segmenter === "function"
      ? Array.from(
          new Intl.Segmenter("en", { granularity: "sentence" }).segment(text),
          (part) => part.segment.trim(),
        )
      : [text.trim()];
  return sentences.flatMap((sentence) => {
    const chunks: string[] = [];
    let chunk = "";
    for (const word of sentence.split(/\s+/).filter(Boolean)) {
      if (chunk && chunk.length + word.length + 1 > 220) {
        chunks.push(chunk);
        chunk = "";
      }
      // A long unbroken token should not exceed an utterance's chunk limit either.
      if (word.length > 220) {
        if (chunk) {
          chunks.push(chunk);
          chunk = "";
        }
        for (let i = 0; i < word.length; i += 220)
          chunks.push(word.slice(i, i + 220));
      } else chunk = chunk ? `${chunk} ${word}` : word;
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  });
}
