"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Headphones,
  Mic,
  Play,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Toggle } from "@/components/ui/toggle";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Card } from "@/components/ui/card";
import { HStack, VStack, Grid, GridItem } from "@/components/layout/stack";
import { TOPICS } from "@/lib/questions";
import type { ExamConfig } from "@/lib/types";
import { useRecorder } from "@/hooks/use-recorder";
import { Waveform } from "@/components/waveform";
import { clock } from "@/lib/utils";

const steps = ["배경 설문", "자기평가", "장비 점검", "시험 안내"];
export const defaultConfig: ExamConfig = {
  mode: "simulation",
  difficulty: 4,
  count: 15,
  target: "IH",
  topics: [
    "home",
    "cafe",
    "movies",
    "music",
    "parks",
    "walking",
    "cooking",
    "travel",
    "staycation",
    "shopping",
    "reading",
    "concerts",
  ],
  occupation: "일 경험 없음",
  student: "아니요",
  residence: "가족과 거주",
};
export function Setup({
  mode,
  initialQuestionId,
  initialTarget = "IH",
  onStart,
  onCancel,
  busy,
}: {
  mode: ExamConfig["mode"];
  initialQuestionId?: string;
  initialTarget?: string;
  onStart: (config: ExamConfig) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [step, setStep] = useState(0),
    [config, setConfig] = useState<ExamConfig>({
      ...defaultConfig,
      target: initialTarget,
      mode,
      practiceQuestionId: initialQuestionId,
    }),
    [consent, setConsent] = useState(false),
    [speakerChecked, setSpeakerChecked] = useState(false),
    [micChecked, setMicChecked] = useState(false),
    [samplePlayed, setSamplePlayed] = useState(false);
  const [orientationLeft, setOrientationLeft] = useState(20 * 60);
  const recorder = useRecorder();
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(
      () =>
        setOrientationLeft(
          Math.max(0, 1200 - Math.floor((Date.now() - start) / 1000)),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  function update<K extends keyof ExamConfig>(key: K, value: ExamConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }
  function sample() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(
      "This is a sound check. Please make sure you can hear this clearly.",
    );
    speech.lang = "en-US";
    speech.rate = 0.92;
    speech.onend = () => setSamplePlayed(true);
    window.speechSynthesis.speak(speech);
  }
  const minTopics = mode === "simulation" ? 12 : 3;
  const nextEnabled =
    step === 0
      ? config.topics.length >= minTopics
      : step === 2
        ? micChecked && speakerChecked
        : step === 3
          ? consent
          : true;
  return (
    <VStack gap={8} className="setup-page">
      <HStack justify="between" wrap>
        <VStack gap={2}>
          <h1>모의시험 준비</h1>
          <p className="text-subtle">
            나에게 맞는 질문을 준비하고, 소리와 마이크를 확인합니다.
          </p>
        </VStack>
        <span className="timer quiet">준비 시간 {clock(orientationLeft)}</span>
      </HStack>
      {orientationLeft === 0 && (
        <div className="notice">
          준비 시간이 지났습니다. 연습에서는 장비 점검을 마친 후 시작할 수
          있습니다.
        </div>
      )}
      <ol className="setup-steps">
        {steps.map((name, i) => (
          <li key={name} data-active={i === step} data-complete={i < step}>
            <span>{i < step ? <Check size={14} /> : `0${i + 1}`}</span>
            <strong>{name}</strong>
          </li>
        ))}
      </ol>
      <Grid>
        <GridItem span={8}>
          <Card className="setup-card gap-8 px-6 shadow-none">
            {step === 0 && (
              <VStack gap={8}>
                <VStack gap={2}>
                  <h2>배경 설문</h2>
                  <p className="text-subtle">
                    실제 경험에 가까운 항목을 선택해 주세요. 설문은 연습용으로
                    재구성했습니다.
                  </p>
                </VStack>
                <Grid>
                  <GridItem span={6}>
                    <label className="field [&_[data-slot=native-select-wrapper]]:w-full">
                      현재 하는 일
                      <NativeSelect
                        value={config.occupation}
                        onChange={(e) => update("occupation", e.target.value)}
                      >
                        {["직장인", "학생", "일 경험 없음", "기타"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </NativeSelect>
                    </label>
                  </GridItem>
                  <GridItem span={6}>
                    <label className="field [&_[data-slot=native-select-wrapper]]:w-full">
                      현재 학생인가요?
                      <NativeSelect
                        value={config.student}
                        onChange={(e) => update("student", e.target.value)}
                      >
                        <option>아니요</option>
                        <option>예</option>
                      </NativeSelect>
                    </label>
                  </GridItem>
                  <GridItem span={12}>
                    <label className="field [&_[data-slot=native-select-wrapper]]:w-full">
                      어디에 살고 있나요?
                      <NativeSelect
                        value={config.residence}
                        onChange={(e) => update("residence", e.target.value)}
                      >
                        {["가족과 거주", "혼자 거주", "기숙사·공동 주거"].map(
                          (x) => (
                            <option key={x}>{x}</option>
                          ),
                        )}
                      </NativeSelect>
                    </label>
                  </GridItem>
                </Grid>
                <VStack gap={4}>
                  <HStack justify="between">
                    <h3>관심사와 일상</h3>
                    <span className="badge">{config.topics.length}개 선택</span>
                  </HStack>
                  <p className="caption">
                    최소 {minTopics}개를 선택해 주세요. 제공된 가이드의 준비
                    방식을 참고한 연습용 설문입니다.
                  </p>
                  {["생활", "여가", "취미", "운동", "여행"].map((group) => (
                    <VStack gap={3} key={group}>
                      <span className="field-label">{group}</span>
                      <HStack gap={2} wrap>
                        {TOPICS.filter((t) => t.group === group).map((t) => (
                          <Toggle
                            variant="outline"
                            type="button"
                            key={t.id}
                            pressed={config.topics.includes(t.id)}
                            className="topic-chip"
                            onClick={() =>
                              update(
                                "topics",
                                config.topics.includes(t.id)
                                  ? config.topics.filter((id) => id !== t.id)
                                  : [...config.topics, t.id],
                              )
                            }
                          >
                            {config.topics.includes(t.id) && (
                              <Check size={14} />
                            )}
                            {t.label}
                          </Toggle>
                        ))}
                      </HStack>
                    </VStack>
                  ))}
                </VStack>
              </VStack>
            )}
            {step === 1 && (
              <VStack gap={8}>
                <VStack gap={2}>
                  <h2>지금의 말하기 수준을 알려주세요.</h2>
                  <p className="text-subtle">
                    목표 등급과 난이도는 별개입니다. 어려운 질문이 높은 등급을
                    보장하지 않습니다.
                  </p>
                </VStack>
                <label className="field [&_[data-slot=native-select-wrapper]]:w-full">
                  목표 등급
                  <NativeSelect
                    value={config.target}
                    onChange={(e) => update("target", e.target.value)}
                  >
                    {["IL", "IM1", "IM2", "IM3", "IH", "AL"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </NativeSelect>
                </label>
                <RadioGroup
                  value={String(config.difficulty)}
                  aria-label="자기평가 난이도"
                  onValueChange={(value) => {
                    const difficulty = Number(value);
                    update("difficulty", difficulty);
                    update("count", difficulty < 3 ? 12 : 15);
                  }}
                  className="gap-3"
                >
                  {[
                    "단어와 짧은 표현으로 기본적인 정보를 말할 수 있어요.",
                    "간단한 문장으로 나와 일상에 대해 말할 수 있어요.",
                    "익숙한 주제에 대해 여러 문장으로 이야기할 수 있어요.",
                    "경험을 순서대로 설명하고 이유를 덧붙일 수 있어요.",
                    "과거·현재·미래를 연결하고 예상 밖 상황에 대응할 수 있어요.",
                    "복잡한 주제에서도 논리를 펼치고 관점을 설명할 수 있어요.",
                  ].map((text, i) => (
                    <label
                      className="level-option"
                      data-selected={config.difficulty === i + 1}
                      key={text}
                    >
                      <span className="level-number">{i + 1}</span>
                      <span>{text}</span>
                      <RadioGroupItem
                        value={String(i + 1)}
                        aria-label={`${i + 1}단계`}
                      />
                    </label>
                  ))}
                </RadioGroup>
                <label className="field [&_[data-slot=native-select-wrapper]]:w-full">
                  연습 문항 수
                  <NativeSelect
                    value={config.count}
                    onChange={(e) =>
                      update("count", Number(e.target.value) as 12 | 15)
                    }
                  >
                    <option value={15}>15문항 · 7 + 8</option>
                    <option value={12}>12문항 · 7 + 5</option>
                  </NativeSelect>
                </label>
                <p className="caption">
                  실제 문항 수는 자기평가에 따라 정해집니다. 여기서는 준비를
                  위해 직접 바꿀 수 있습니다.
                </p>
              </VStack>
            )}
            {step === 2 && (
              <VStack gap={8}>
                <VStack gap={2}>
                  <h2>장비 점검</h2>
                  <p className="text-subtle">
                    조용한 곳에서 헤드셋을 착용해 주세요. 점검 녹음은 업로드되지
                    않습니다.
                  </p>
                </VStack>
                <VStack className="equipment-section" gap={4}>
                  <HStack gap={3}>
                    <span className="icon-tile">
                      <Headphones size={20} />
                    </span>
                    <h3>소리 확인</h3>
                  </HStack>
                  <p>아래 음성을 듣고 소리가 선명한지 확인해 주세요.</p>
                  <Button variant="outline" onClick={sample}>
                    <Volume2 size={16} />
                    테스트 음성 듣기
                  </Button>
                  <label className="checkbox-label">
                    <Checkbox
                      checked={speakerChecked}
                      disabled={!samplePlayed}
                      onCheckedChange={(checked) =>
                        setSpeakerChecked(checked === true)
                      }
                    />
                    소리가 잘 들립니다.
                  </label>
                  {!samplePlayed && (
                    <span className="caption">
                      음성을 끝까지 듣고 확인할 수 있습니다.
                    </span>
                  )}
                </VStack>
                <VStack className="equipment-section" gap={4}>
                  <HStack gap={3}>
                    <span className="icon-tile">
                      <Mic size={20} />
                    </span>
                    <h3>마이크 확인</h3>
                  </HStack>
                  <p>
                    “Hello, I am ready for my speaking practice.”를 말하고
                    녹음을 들어보세요.
                  </p>
                  <Waveform analyser={recorder.analyser} compact />
                  <HStack>
                    <Button
                      variant="outline"
                      onClick={() =>
                        recorder.status === "recording"
                          ? void recorder.stop()
                          : void recorder.start()
                      }
                    >
                      {recorder.status === "recording" ? (
                        <Square size={16} />
                      ) : (
                        <Mic size={16} />
                      )}
                      {recorder.status === "recording"
                        ? "녹음 마치기"
                        : "테스트 녹음"}
                    </Button>
                    <span className="caption mono">
                      {clock(recorder.seconds)}
                    </span>
                  </HStack>
                  {recorder.url && (
                    <audio
                      controls
                      src={recorder.url}
                      onEnded={() => setMicChecked(true)}
                      aria-label="마이크 테스트 녹음 재생"
                    />
                  )}
                  {recorder.error && (
                    <p role="alert" className="error-text">
                      {recorder.error}
                    </p>
                  )}
                  <label className="checkbox-label">
                    <Checkbox
                      disabled={!recorder.url}
                      checked={micChecked}
                      onCheckedChange={(checked) =>
                        setMicChecked(checked === true)
                      }
                    />
                    내 목소리가 선명하게 녹음되었습니다.
                  </label>
                </VStack>
              </VStack>
            )}
            {step === 3 && (
              <VStack gap={8}>
                <VStack gap={2}>
                  <h2>시험 안내</h2>
                  <p className="text-subtle">
                    완벽한 문장보다, 나의 이야기에 집중해 보세요.
                  </p>
                </VStack>
                <VStack gap={5}>
                  {[
                    {
                      n: "01",
                      title: "전체 40분, 질문당 시간 제한 없음",
                      text: "질문을 듣는 시간과 중간 난이도 선택 시간도 전체 시간에 포함됩니다.",
                    },
                    {
                      n: "02",
                      title: "질문은 최대 두 번",
                      text: "질문이 끝나면 녹음을 시작합니다. 다시 듣기는 답변을 시작하기 전에 사용할 수 있습니다.",
                    },
                    {
                      n: "03",
                      title: "7문항 뒤 난이도 재선택",
                      text: "쉬운 질문, 비슷한 질문, 어려운 질문 중에서 선택합니다.",
                    },
                    {
                      n: "04",
                      title: "답변 제출 후 이전 문항으로 돌아갈 수 없음",
                      text: "실전 모드에서는 질문 자막과 도움말을 숨기며, 모든 피드백은 종료 후 제공합니다.",
                    },
                  ].map((rule) => (
                    <HStack key={rule.n} align="start" gap={4}>
                      <span className="step-index">{rule.n}</span>
                      <VStack gap={1}>
                        <h3>{rule.title}</h3>
                        <p className="text-subtle">{rule.text}</p>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
                <div className="notice">
                  <ShieldCheck size={18} />
                  <span>
                    녹음과 전사문은 내 계정에 저장됩니다. 본시험 자동 전사는
                    브라우저 공급자의 음성 인식 서비스를 사용할 수 있습니다. AI
                    평가 시 질문·전사문을 OpenAI에 전송하고 본인의 ChatGPT 구독
                    사용량을 사용합니다. 기록에서 언제든 삭제할 수 있습니다.
                  </span>
                </div>
                <label className="checkbox-label">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                  />
                  녹음 저장·음성 인식 서비스·AI 평가의 외부 전송을 확인했습니다.
                </label>
              </VStack>
            )}
            <HStack className="setup-actions" justify="between">
              <Button
                variant="ghost"
                onClick={() => (step ? setStep((s) => s - 1) : onCancel())}
              >
                <ArrowLeft size={16} />
                {step ? "이전 단계" : "돌아가기"}
              </Button>
              <Button
                disabled={
                  !nextEnabled || busy || recorder.status === "recording"
                }
                onClick={() =>
                  step < 3 ? setStep((s) => s + 1) : onStart(config)
                }
              >
                {busy
                  ? "시험 준비 중…"
                  : step === 3
                    ? "모의시험 시작"
                    : "다음 단계"}
                {step === 3 ? <Play size={16} /> : <ArrowRight size={16} />}
              </Button>
            </HStack>
          </Card>
        </GridItem>
        <GridItem span={4}>
          <VStack gap={4} className="sticky-aside">
            <Card className="side-summary px-6 shadow-none">
              <h3>{mode === "simulation" ? "실전 모의시험" : "자유 연습"}</h3>
              <dl className="summary-list">
                <div>
                  <dt>목표 등급</dt>
                  <dd>{config.target}</dd>
                </div>
                <div>
                  <dt>초기 난이도</dt>
                  <dd>{config.difficulty}단계</dd>
                </div>
                <div>
                  <dt>관심 주제</dt>
                  <dd>{config.topics.length}개</dd>
                </div>
                <div>
                  <dt>문항 수</dt>
                  <dd>{initialQuestionId ? "1" : config.count}문항</dd>
                </div>
                <div>
                  <dt>시험 시간</dt>
                  <dd>{mode === "simulation" ? "40분" : "60분 · 연습 설정"}</dd>
                </div>
              </dl>
            </Card>
            <div className="small-note">
              <CheckCircle2 size={16} />
              <p>
                공식 진행 절차를 바탕으로 만든 독립적인 연습 서비스입니다. 공식
                문항·화면·음성을 복제하지 않습니다.
              </p>
            </div>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
