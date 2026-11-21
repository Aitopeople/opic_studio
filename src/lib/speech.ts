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

type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "lang"> &
  Partial<Pick<SpeechSynthesisVoice, "voiceURI">>;

// macOS sound-effect and character voices are never suitable for an interviewer.
const NOVELTY =
  /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Eddy|Flo|Fred|Good News|Grandma|Grandpa|Jester|Junior|Kathy|Organ|Ralph|Reed|Rocko|Sandy|Shelley|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i;
// Labels can be localized (e.g. Korean macOS), so check the URI as well as the name.
const quality = (voice: VoiceLike, pattern: RegExp) =>
  pattern.test(voice.name) || pattern.test(voice.voiceURI ?? "");
const PREMIUM = /premium|프리미엄/i,
  ENHANCED = /enhanced|향상/i;

// Ranks by naturalness instead of taking whichever preferred name the browser lists first.
function voiceRank(voice: VoiceLike) {
  const us = voice.lang.toLowerCase().replace("_", "-") === "en-us",
    ava = /\bAva\b/i.test(voice.name);
  if (ava && quality(voice, PREMIUM)) return 0;
  if (ava && quality(voice, ENHANCED)) return 1;
  if (us && /\bNatural\b/i.test(voice.name)) return 2; // Edge neural voices
  if (us && quality(voice, PREMIUM)) return 3;
  if (us && quality(voice, ENHANCED)) return 4;
  if (/^Google US English$/i.test(voice.name)) return 5;
  if (us && /\bSamantha\b/i.test(voice.name)) return 6;
  if (NOVELTY.test(voice.name)) return 9;
  return us ? 7 : 8;
}

export function englishVoice<T extends VoiceLike>(voices: T[]): T | null {
  let best: T | null = null,
    bestRank = Infinity;
  for (const voice of voices) {
    if (!voice.lang.toLowerCase().startsWith("en")) continue;
    const rank = voiceRank(voice);
    if (rank < bestRank) [best, bestRank] = [voice, rank];
  }
  return best;
}

// Chrome fills the voice list asynchronously; wait briefly so the first playback is not the default voice.
export function loadVoices(timeout = 1500): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis,
    ready = synth.getVoices();
  if (ready.length) return Promise.resolve(ready);
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, timeout);
    synth.addEventListener("voiceschanged", done);
  });
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
