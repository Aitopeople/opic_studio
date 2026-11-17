"use client";
import { useEffect, useRef } from "react";
export function Waveform({
  analyser,
  compact = false,
}: {
  analyser: AnalyserNode | null;
  compact?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    const draw = () => {
      const data = new Uint8Array(analyser?.frequencyBinCount || 64);
      analyser?.getByteFrequencyData(data);
      ctx.clearRect(0, 0, element.width, element.height);
      const bars = 48,
        width = element.width / bars;
      for (let i = 0; i < bars; i++) {
        const height = Math.max(
          3,
          ((data[i] || 0) / 255) * element.height * 0.85,
        );
        ctx.fillStyle = analyser ? "#147d63" : "#dce1df";
        ctx.beginPath();
        ctx.roundRect(
          i * width + 2,
          (element.height - height) / 2,
          Math.max(2, width - 4),
          height,
          2,
        );
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser]);
  return (
    <canvas
      ref={canvas}
      width={480}
      height={compact ? 48 : 100}
      className={compact ? "waveform compact" : "waveform"}
      aria-label={analyser ? "마이크 입력 음량" : "마이크 대기 중"}
      role="img"
    />
  );
}
