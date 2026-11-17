"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { recognitionConstructor, type Recognition } from "@/lib/speech";

export function useRecorder({
  transcribe = false,
}: { transcribe?: boolean } = {}) {
  const [status, setStatus] = useState<"idle" | "recording" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0),
    [blob, setBlob] = useState<Blob | null>(null),
    [url, setUrl] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const media = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    context = useRef<AudioContext | null>(null),
    started = useRef(0),
    stopPromise = useRef<Promise<Blob | null> | null>(null);
  const latestUrl = useRef<string | null>(null);
  const recognition = useRef<Recognition | null>(null),
    transcript = useRef(""),
    recognitionFinished = useRef<(() => void) | null>(null),
    recognitionActive = useRef(false),
    recognitionFailed = useRef(false);
  const cleanup = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void context.current?.close().catch(() => {});
    context.current = null;
    setAnalyser(null);
  }, []);
  const reset = useCallback(() => {
    if (recognition.current) {
      recognition.current.onend = null;
      recognition.current.abort();
      recognition.current = null;
    }
    recognitionActive.current = false;
    recognitionFailed.current = false;
    transcript.current = "";
    setTranscriptError(null);
    if (media.current?.state === "recording") media.current.stop();
    cleanup();
    if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
    latestUrl.current = null;
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setStatus("idle");
    setError(null);
    stopPromise.current = null;
  }, [cleanup]);
  const start = useCallback(async () => {
    if (media.current?.state === "recording") return;
    reset();
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "이 브라우저에서는 녹음할 수 없습니다. HTTPS 또는 localhost에서 최신 Chrome·Edge를 이용해 주세요.",
        );
      const input = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      stream.current = input;
      const format = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(input, {
        ...(format ? { mimeType: format } : {}),
        audioBitsPerSecond: 48000,
      });
      media.current = recorder;
      const chunks: Blob[] = [];
      stopPromise.current = new Promise<Blob | null>((resolve) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          const output = new Blob(chunks, {
            type: recorder.mimeType || "audio/webm",
          });
          const objectUrl = URL.createObjectURL(output);
          latestUrl.current = objectUrl;
          setBlob(output);
          setUrl(objectUrl);
          setSeconds(Math.max(0, (Date.now() - started.current) / 1000));
          setStatus("ready");
          cleanup();
          resolve(output);
        };
        recorder.onerror = () => {
          cleanup();
          setError("녹음 중 오류가 발생했습니다. 마이크를 확인해 주세요.");
          setStatus("idle");
          resolve(null);
        };
      });
      const audioContext = new AudioContext();
      context.current = audioContext;
      const node = audioContext.createAnalyser();
      node.fftSize = 256;
      audioContext.createMediaStreamSource(input).connect(node);
      setAnalyser(node);
      recorder.start(1000);
      started.current = Date.now();
      setStatus("recording");
      const Constructor = recognitionConstructor();
      if (transcribe && Constructor) {
        const recognizer = new Constructor();
        recognition.current = recognizer;
        recognizer.lang = "en-US";
        recognizer.continuous = true;
        recognizer.interimResults = false;
        recognizer.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++)
            if (event.results[i].isFinal)
              transcript.current =
                `${transcript.current} ${event.results[i][0].transcript}`
                  .trim()
                  .slice(0, 12000);
        };
        recognizer.onerror = (event) => {
          if (event.error !== "aborted" && event.error !== "no-speech") {
            recognitionFailed.current = true;
            setTranscriptError(
              "자동 전사가 중단되었습니다. 녹음은 계속되며 종료 후 전사를 직접 입력할 수 있습니다.",
            );
          }
        };
        recognizer.onend = () => {
          recognitionActive.current = false;
          recognitionFinished.current?.();
          recognitionFinished.current = null;
          if (
            media.current?.state === "recording" &&
            !recognitionFailed.current
          ) {
            try {
              recognizer.start();
              recognitionActive.current = true;
            } catch {}
          }
        };
        try {
          recognizer.start();
          recognitionActive.current = true;
        } catch {
          setTranscriptError(
            "자동 전사를 시작하지 못했습니다. 종료 후 녹음을 듣고 입력할 수 있습니다.",
          );
        }
      } else if (transcribe)
        setTranscriptError(
          "이 브라우저는 자동 전사를 지원하지 않습니다. 종료 후 녹음을 듣고 직접 입력해 주세요.",
        );
      // Interrupted hardware must not leave a fake recording indicator running.
      input.getAudioTracks()[0].onended = () => {
        if (recorder.state === "recording") {
          setError(
            "마이크 연결이 끊겼습니다. 녹음된 부분을 저장한 뒤 확인해 주세요.",
          );
          recorder.stop();
        }
      };
      return true;
    } catch (e) {
      cleanup();
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "마이크 권한이 필요합니다. 주소창의 사이트 설정에서 마이크를 허용해 주세요."
          : e instanceof Error
            ? e.message
            : "마이크를 사용할 수 없습니다.",
      );
      return false;
    }
  }, [cleanup, reset, transcribe]);
  const stop = useCallback(async () => {
    if (media.current?.state === "recording") media.current.stop();
    const speechFinished =
      recognitionActive.current && recognition.current
        ? new Promise<void>((resolve) => {
            recognitionFinished.current = resolve;
            recognition.current?.stop();
            setTimeout(resolve, 1500);
          })
        : Promise.resolve();
    const result = stopPromise.current ? await stopPromise.current : blob;
    await speechFinished;
    return result;
  }, [blob]);
  useEffect(() => {
    if (status !== "recording") return;
    const timer = setInterval(
      () => setSeconds((Date.now() - started.current) / 1000),
      250,
    );
    return () => clearInterval(timer);
  }, [status]);
  useEffect(
    () => () => {
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.abort();
      }
      if (media.current?.state === "recording") media.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      void context.current?.close().catch(() => {});
      if (latestUrl.current) URL.revokeObjectURL(latestUrl.current);
    },
    [],
  );
  return {
    status,
    error,
    transcriptError,
    seconds,
    blob,
    url,
    analyser,
    start,
    stop,
    reset,
    getTranscript: () => transcript.current,
  };
}
