// App-authored study goals informed by public speaking-level descriptions.
// These are not official scoring rubrics, thresholds, or IM sublevel cutoffs.
export const TARGET_LEVELS = ["IL", "IM1", "IM2", "IM3", "IH", "AL"] as const;
export type TargetGrade = (typeof TARGET_LEVELS)[number];
export const TARGET_CRITERIA = [
  "task",
  "organization",
  "timeframes",
  "clarity",
] as const;
export type TargetCriterionId = (typeof TARGET_CRITERIA)[number];
export const TARGET_PROFILE_VERSION = "target-coaching-v1";
export type TargetProfile = {
  target: TargetGrade;
  summary: string;
  note: string;
  criteria: { id: TargetCriterionId; title: string; description: string }[];
};
const titles: Record<TargetCriterionId, string> = {
  task: "질문이 요구한 과제",
  organization: "답변의 연결과 구성",
  timeframes: "상황에 맞는 시점 표현",
  clarity: "의미를 분명하게 전달하기",
};
const IM_NOTE =
  "IM1·IM2·IM3은 공개된 IM 설명을 공통 바탕으로 삼고, 아래 연습 초점은 앱에서 구분했습니다. 공식 세부 등급의 합격 기준이 아닙니다.";
function profile(
  target: TargetGrade,
  summary: string,
  descriptions: string[],
  note = "공개된 말하기 수준 설명을 참고해 전사문에서 확인할 학습 목표로 정리했습니다. 공식 채점표가 아닙니다.",
): TargetProfile {
  return {
    target,
    summary,
    note,
    criteria: TARGET_CRITERIA.map((id, i) => ({
      id,
      title: titles[id],
      description: descriptions[i],
    })),
  };
}
export const TARGET_PROFILES: TargetProfile[] = [
  profile("IL", "익숙한 일상 질문에 자신의 뜻을 짧은 문장으로 전달하는 연습", [
    "자신·집·취미처럼 익숙한 질문에 맞는 기본 정보를 전달합니다.",
    "단어 목록에 머물지 않고 자신의 뜻이 있는 짧은 문장을 만듭니다.",
    "일상과 선호를 설명할 때 기본적인 현재 표현으로 상황을 구분합니다.",
    "익숙한 어휘와 기본 문장으로 누가 무엇을 하는지 드러냅니다.",
  ]),
  profile(
    "IM1",
    "익숙한 주제에서 기본 문장을 만들고 필요한 정보를 주고받는 연습",
    [
      "친숙한 묘사·일상 질문에 관련된 정보를 답하고, 질문하기 과제에서는 필요한 정보를 묻습니다.",
      "한 주제에 관련된 문장들을 이어 말하며 암기한 표현을 자기 상황에 맞게 바꿉니다.",
      "일상 설명의 현재 시점을 유지하고 질문이 요구한 시간 배경을 드러냅니다.",
      "기본 문법과 어휘로 핵심 뜻이 전달되는지 확인합니다.",
    ],
    IM_NOTE,
  ),
  profile(
    "IM2",
    "익숙한 상황을 여러 문장으로 설명하고 필요한 세부 정보를 덧붙이는 연습",
    [
      "익숙한 생활·거래 상황의 질문을 처리하고 필요한 질문이나 설명을 합니다.",
      "같은 주제의 문장을 이어 말하고 이유나 구체적인 예를 덧붙입니다.",
      "일상과 특정 사건의 시간 배경을 질문에 맞게 구분해 전달합니다.",
      "문장 형태와 어휘를 활용해 핵심 정보와 이유를 이해할 수 있게 전달합니다.",
    ],
    IM_NOTE,
  ),
  profile(
    "IM3",
    "익숙한 주제의 설명을 확장하고 경험·상황 변화에 대응하는 연습",
    [
      "친숙한 질문의 여러 요구 사항을 다루고, 상황에 필요한 질문·설명을 확장합니다.",
      "구체적인 세부 내용을 더해 관련 문장들의 흐름을 유지합니다.",
      "경험을 묻는 질문에서는 사건의 시간 배경과 순서를 드러내는 연습을 합니다.",
      "표현을 다양하게 시도하면서도 핵심 의미가 달라지거나 모호해지지 않게 합니다.",
    ],
    IM_NOTE,
  ),
  profile(
    "IH",
    "일상 과제를 수행하면서 경험 서술과 연결된 설명으로 범위를 넓히는 연습",
    [
      "일상적인 정보 교환을 처리하고 경험·문제 상황 등 더 복잡한 과제도 시도합니다.",
      "경험과 묘사를 문장 나열에서 연결된 이야기로 확장합니다. 모든 과제에서 완벽한 유지를 요구하지는 않습니다.",
      "질문이 요구하는 과거·현재·미래의 서술을 시도하고, 시점이 흐려지는 부분을 보완합니다.",
      "주제에 맞는 어휘와 문장으로 뜻을 전달하고 복잡한 설명에서 생기는 불명확함을 줄입니다.",
    ],
  ),
  profile(
    "AL",
    "여러 시점의 연결된 서술과 예상하지 못한 상황 대응을 유지하는 연습",
    [
      "묘사·경험 서술을 수행하고, 문제가 생긴 상황에서는 문제와 대응 방안을 설명합니다.",
      "사건과 세부 내용을 하나의 흐름으로 연결해 문단 수준의 이야기를 구성합니다.",
      "관련 질문들에서 과거·현재·미래의 시간 배경을 구분하고 서술 중 일관성을 유지합니다.",
      "일부 오류가 있어도 사건·관계·대안의 의미가 전달되도록 표현을 조절합니다.",
    ],
  ),
];
export function getTargetProfile(target: string) {
  return TARGET_PROFILES.find((profile) => profile.target === target);
}
export const TARGET_SOURCES = [
  {
    label: "OPIc 공식 등급 설명",
    url: "https://www.opic.co.kr/opics/servlet/controller.opic.site.about.AboutServlet?p_process=move-introduce-opic",
  },
  {
    label: "ACTFL 2024 말하기 수준 설명",
    url: "https://www.opic.co.kr/senior/img/com_2/ACTFL_Proficiency_Guidelines_2024.pdf",
  },
];
