import type { Evaluation, TargetFeedback } from "./types";
import { TARGET_PROFILE_VERSION } from "./target-profiles";

// Authored preview data. Never persist as a user's exam or present as a model response.
export const FEEDBACK_EXAMPLE = {
  prompt:
    "Tell me about a memorable trip. Where did you go, and what made it special?",
  transcript:
    "Last summer, I go to Busan with my friends. We stayed there for three days. On the first day, we visited a beach and took many picture. The weather was very hot, so we decided going to a cafe. I was tired because we walked a lot, but the trip was really fun. The most memorable part was watching the sunset. Before that trip, I have never saw the sea at sunset. We made a lot of memories, and I want to go back there again.",
  summary:
    "여행의 장소와 기간, 활동, 기억에 남는 장면을 순서대로 전달했습니다. 과거 시제와 동사 뒤에 오는 형태를 고치면 의미를 더 분명하게 전달할 수 있습니다.",
  targetFeedback: {
    version: TARGET_PROFILE_VERSION,
    target: "IH",
    summary:
      "여행 경험을 구체적으로 전달했습니다. IH를 목표로 과거 시점의 일관성을 보완하고, 다른 유형의 질문에서도 연결된 설명을 연습해 보세요. 한 답변으로 IH 도달 여부를 판단하지 않습니다.",
    criteria: [
      {
        id: "task",
        status: "demonstrated",
        feedback:
          "여행의 장소와 기간, 기억에 남는 장면으로 질문에 답했습니다. 문제 해결 과제의 수행 여부는 이번 문항으로 확인하지 않습니다.",
        evidence: [
          {
            question: 1,
            quote: "The most memorable part was watching the sunset.",
          },
        ],
        practice:
          "여행에서 기억에 남는 장면이 왜 특별했는지 실제 이유를 덧붙여 다시 말해 보세요.",
      },
      {
        id: "organization",
        status: "demonstrated",
        feedback: "활동과 그때의 감정을 연결해 하나의 경험으로 전달했습니다.",
        evidence: [
          {
            question: 1,
            quote:
              "I was tired because we walked a lot, but the trip was really fun.",
          },
        ],
        practice:
          "걷기와 노을 감상 사이의 사건 순서를 연결해 같은 여행을 다시 이야기해 보세요.",
      },
      {
        id: "timeframes",
        status: "developing",
        feedback:
          "과거의 여행을 이야기하면서 현재형 go와 have가 섞입니다. 이번 답변에서는 과거의 시간 관계를 분명히 하는 데 집중해 보세요.",
        evidence: [
          { question: 1, quote: "Last summer, I go to Busan with my friends." },
          {
            question: 1,
            quote: "Before that trip, I have never saw the sea at sunset.",
          },
        ],
        practice:
          "Last summer에는 went, 여행 이전 경험에는 had never seen을 써서 사건의 앞뒤를 다시 말해 보세요.",
      },
      {
        id: "clarity",
        status: "developing",
        feedback:
          "카페에 가기로 결정했다는 뜻은 전달됩니다. decide 뒤의 동사 형태를 다듬으면 표현이 더 분명해집니다.",
        evidence: [{ question: 1, quote: "we decided going to a cafe." }],
        practice:
          "we decided to go to a cafe를 사용해 그때 내린 결정과 이유를 연결해 보세요.",
      },
    ],
  } satisfies TargetFeedback,
  grammar: [
    {
      question: 1,
      original: "I go to Busan with my friends.",
      corrected: "I went to Busan with my friends.",
      explanation:
        "Last summer라는 끝난 과거의 시점을 이야기하므로 go의 과거형 went를 씁니다.",
      category: "tense",
      kind: "error",
    },
    {
      question: 1,
      original: "many picture",
      corrected: "many pictures",
      explanation:
        "many 뒤에는 셀 수 있는 명사의 복수형이 옵니다. picture를 pictures로 바꿉니다.",
      category: "agreement",
      kind: "error",
    },
    {
      question: 1,
      original: "we decided going to a cafe.",
      corrected: "we decided to go to a cafe.",
      explanation:
        "무엇을 하기로 결정했다고 말할 때는 decide 뒤에 to + 동사원형을 씁니다.",
      category: "other",
      kind: "error",
    },
    {
      question: 1,
      original: "Before that trip, I have never saw the sea at sunset.",
      corrected: "Before that trip, I had never seen the sea at sunset.",
      explanation:
        "그 여행보다 앞선 경험을 돌아보므로 과거완료 had + 과거분사를 씁니다. see의 과거분사는 saw가 아니라 seen입니다.",
      category: "tense",
      kind: "error",
    },
    {
      question: 1,
      original: "the trip was really fun.",
      corrected: "I had a great time on the trip.",
      explanation:
        "원문도 올바른 문장입니다. 여행을 즐겼다는 같은 의미를 다른 방식으로 표현한 선택 사항이며, 반드시 바꿀 필요는 없습니다.",
      category: "word-choice",
      kind: "naturalness",
    },
  ] satisfies NonNullable<Evaluation["grammar"]>,
  strengths: [
    "장소 → 기간 → 활동 → 인상 깊은 장면의 흐름이 있습니다.",
    "피곤함과 즐거움을 함께 이야기해 경험에 감정을 담았습니다.",
  ],
  practice: [
    "go → went, see → seen을 문장 안에서 다시 말해 보세요.",
    "decided to go를 넣어 여행 중 내린 결정을 한 가지 더 설명해 보세요.",
    "노을을 봤을 때의 색이나 느낌을 실제 경험에 맞게 한 문장 덧붙여 보세요.",
  ],
};
