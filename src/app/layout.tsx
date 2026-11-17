import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "opic studio — 나의 말하기 연습 공간",
  description:
    "실전 같은 40분 OPIc 모의시험. 배경 설문부터 음성 답변, AI 학습 피드백과 녹음 복습까지.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
