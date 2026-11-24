import { z } from "zod";
import type { ExamConfig, Question } from "./types";
import { TOPICS, UNEXPECTED_TOPICS } from "./question-topics";

export { TOPICS, UNEXPECTED_TOPICS };
type Topic = (typeof TOPICS)[number] | (typeof UNEXPECTED_TOPICS)[number];
const types = [
  "description",
  "routine",
  "past",
  "comparison",
  "opinion",
] as const;
type TopicTask = (typeof types)[number];

const hints: Record<TopicTask, string> = {
  description:
    "듣는 사람이 장면을 떠올릴 수 있도록 구체적인 특징을 짚어 보세요.",
  routine: "평소에 하는 일을 떠올리고 자기만의 방식이나 순서를 설명해 보세요.",
  past: "한 번의 사건을 골라 당시 상황과 그 뒤에 일어난 일을 이야기해 보세요.",
  comparison: "비교할 두 대상을 밝히고 같은 기준으로 차이를 설명해 보세요.",
  opinion: "내 선택이나 제안을 말하고 그 이유가 드러나는 사례를 들어 보세요.",
};

export function makeQuestion(
  topic: Topic,
  type: TopicTask,
  difficulty: number,
  variant = 0,
): Question {
  const prompt =
    type === "past" && variant && "otherPast" in topic
      ? topic.otherPast
      : topic[type];
  // Each opening sentence is a standalone task. The follow-up elicits more detail.
  return {
    id: `${topic.id}-${type}-${variant}`,
    topic: topic.id,
    topicLabel: topic.label,
    type,
    difficulty,
    prompt: difficulty <= 2 ? prompt.split(/(?<=[.?]) /, 1)[0] : prompt,
    hint: hints[type],
  };
}

const scenarios = [
  {
    id: "hotel",
    label: "호텔 예약",
    ask: "Your train arrives near midnight and you need a room for the night. Call a hotel and ask three or four questions before you book.",
    solve:
      "At check-in the clerk says your room was given to another guest. You have already paid. Speak to the clerk and suggest two ways the hotel could help you tonight.",
    past: "Tell me about a time you arrived somewhere and the arrangements were different from what you expected. What did you do that night?",
  },
  {
    id: "cafe-booking",
    label: "카페 모임",
    ask: "Your book club wants to meet at a café. You are there with the owner now. Ask three or four questions to find out whether the space will work for your group.",
    solve:
      "The owner shows you a table for four, but eight people are on their way. Explain the mix-up to the owner and suggest two seating arrangements that would work.",
    past: "Have you ever had trouble finding room for everyone at a gathering? Tell me how the group ended up spending its time.",
  },
  {
    id: "ticket",
    label: "공연 티켓",
    ask: "A friend has an extra ticket to a show tonight. Call your friend. Ask three or four questions to decide whether you can go along.",
    solve:
      "You agreed to go, but the last train home leaves before the show ends. Leave your friend a message explaining the problem and offering two plans for the evening.",
    past: "Tell me about a time you went out for the evening and getting home became complicated. How did the night end?",
  },
  {
    id: "rental",
    label: "차량 대여",
    ask: "You are at a rental counter with two friends and three large bags. Ask the agent three or four questions to choose a car for your trip.",
    solve:
      "At pickup, the only car available is too small for your bags. Explain what you need to the rental agent and propose two ways to get everyone on the road today.",
    past: "Tell me about a journey when you had to change how you traveled. What caused the change and where did you end up?",
  },
  {
    id: "purchase",
    label: "물건 교환",
    ask: "You want wireless headphones for your commute. Talk to a salesperson and ask three or four questions that will help you choose a pair.",
    solve:
      "The left side of your new headphones has stopped working. You lost the paper receipt but have the payment on your phone. Explain this to the salesperson and propose two ways to settle the problem.",
    past: "Tell me about something you bought that did not work as advertised. What happened when you tried to get help?",
  },
  {
    id: "gym",
    label: "운동 수업",
    ask: "A friend invited you to try an exercise class together. Call the instructor and ask three or four questions about joining as a beginner.",
    solve:
      "The instructor moved the class to a time your friend cannot make. Call your friend, pass on the news and offer two ways you could still exercise together.",
    past: "Tell me about a time you tried an activity with someone else. How did you decide what to do and how did it go?",
  },
  {
    id: "restaurant",
    label: "식당 예약",
    ask: "You are choosing a restaurant for a family birthday. One guest has a food allergy. Call the restaurant and ask three or four questions before reserving a table.",
    solve:
      "At dinner the server tells you the dish you ordered contains the ingredient your guest cannot eat. Speak to the server and suggest two alternatives so your guest can join the meal.",
    past: "Tell me about a meal when someone needed something different from the rest of the group. How did everyone work it out?",
  },
  {
    id: "friend",
    label: "친구와 약속",
    ask: "A friend knows a good place for a picnic. Call your friend and ask three or four questions to plan a picnic there this weekend.",
    solve:
      "You get to the park first and find the picnic area closed. Leave a message for your friend, who is already on the way. Explain what you see and suggest two other ways to spend the afternoon.",
    past: "Tell me about an outing with someone close to you that changed at the last minute. What did you end up doing together?",
  },
] as const;

export function roleplaySet(index: number, difficulty: number): Question[] {
  const scenario = scenarios[index % scenarios.length];
  return [
    {
      type: "roleplay",
      prompt: scenario.ask,
      hint: "상대에게 직접 말을 걸고 결정에 필요한 질문을 3~4개 해 보세요.",
    },
    {
      type: "solution",
      prompt: scenario.solve,
      hint: "지금 생긴 문제를 설명하고 가능한 대안 두 가지를 제시해 보세요.",
    },
    { type: "past", prompt: scenario.past, hint: hints.past },
  ].map(({ type, prompt, hint }) => ({
    id: `${scenario.id}-${type}`,
    topic: scenario.id,
    topicLabel: scenario.label,
    type: type as Question["type"],
    prompt,
    hint,
    difficulty,
  }));
}

export const QUESTION_BANK: Question[] = [
  ...TOPICS.flatMap((t) => [
    ...types.map((type) => makeQuestion(t, type, 4)),
    makeQuestion(t, "past", 4, 1),
  ]),
  ...UNEXPECTED_TOPICS.flatMap((t) =>
    types.map((type) => makeQuestion(t, type, 4)),
  ),
  ...scenarios.flatMap((_, i) => roleplaySet(i, 4)),
];
export const examConfigSchema = z
  .object({
    mode: z.enum(["simulation", "practice"]),
    difficulty: z.number().int().min(1).max(6),
    count: z.union([z.literal(12), z.literal(15)]),
    target: z.enum(["IL", "IM1", "IM2", "IM3", "IH", "AL"]),
    topics: z
      .array(z.enum(TOPICS.map((t) => t.id)))
      .max(TOPICS.length)
      .refine(
        (items) => new Set(items).size === items.length,
        "관심사를 중복 선택할 수 없습니다.",
      ),
    occupation: z.enum(["직장인", "학생", "일 경험 없음", "기타"]),
    student: z.enum(["예", "아니요"]),
    residence: z.enum(["혼자 거주", "가족과 거주", "기숙사·공동 주거"]),
    practiceQuestionId: z.string().max(100).optional(),
  })
  .refine(
    (config) =>
      (config.mode === "practice" && Boolean(config.practiceQuestionId)) ||
      config.topics.length >= (config.mode === "simulation" ? 12 : 3),
    {
      message:
        "실전 모의시험은 12개, 자유 연습은 3개 이상의 관심사를 선택해 주세요.",
      path: ["topics"],
    },
  )
  .refine(
    (config) =>
      !config.practiceQuestionId ||
      QUESTION_BANK.some((q) => q.id === config.practiceQuestionId),
    {
      message: "선택한 연습 문제를 찾을 수 없습니다.",
      path: ["practiceQuestionId"],
    },
  );
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function selectedTopics(config: ExamConfig) {
  return TOPICS.filter(
    (t) =>
      config.topics.includes(t.id) &&
      (t.id !== "work" || config.occupation === "직장인") &&
      (t.id !== "study" || config.student === "예"),
  );
}

function comboPlans(difficulty: number): readonly (readonly TopicTask[])[] {
  if (difficulty <= 2)
    return [
      ["description", "routine", "past"],
      ["routine", "description", "comparison"],
    ];
  return [
    ["description", "routine", "past"],
    ["routine", "past", "comparison"],
    ["description", "comparison", "past"],
    ...(difficulty >= 5 ? [["past", "comparison", "opinion"] as const] : []),
  ];
}

function topicCombo(
  topic: Topic,
  tasks: readonly TopicTask[],
  difficulty: number,
  random: () => number,
) {
  return tasks.map((type) =>
    makeQuestion(
      topic,
      type,
      difficulty,
      type === "past" && "otherPast" in topic && random() < 0.5 ? 1 : 0,
    ),
  );
}

export function createQuestionSet(
  config: ExamConfig,
  random = Math.random,
): Question[] {
  if (config.practiceQuestionId) {
    const q = QUESTION_BANK.find((q) => q.id === config.practiceQuestionId);
    if (q) return [{ ...q, difficulty: config.difficulty }];
  }
  const picked = shuffle(selectedTopics(config), random);
  const first = picked[0];
  // A short practice survey can leave only one eligible interest.
  const second = picked[1] ?? shuffle(UNEXPECTED_TOPICS, random)[0];
  const intro: Question = {
    id: "intro",
    topic: "intro",
    topicLabel: "자기소개",
    type: "intro",
    difficulty: config.difficulty,
    prompt:
      "To get started, please introduce yourself. Tell me a little about your life and the things you enjoy.",
    hint: "이름·일상 → 관심사. 준비운동 문항으로 AI 등급 근거에서 제외합니다.",
  };
  const plans = shuffle(comboPlans(config.difficulty), random);
  const firstSession = [
    intro,
    ...topicCombo(first, plans[0], config.difficulty, random),
    ...topicCombo(second, plans[1], config.difficulty, random),
  ];
  return [
    ...firstSession,
    ...createSecondSession(config, Math.floor(random() * 1_000_000), [
      first.id,
      second.id,
    ]),
  ];
}

export function createSecondSession(
  config: ExamConfig,
  seed: number,
  previousTopics: readonly string[] = [],
): Question[] {
  const { difficulty, count } = config;
  // Consume a separate digit for each choice so a surprise topic can pair with any scenario.
  function nextIndex(length: number) {
    const index = seed % length;
    seed = Math.floor(seed / length);
    return index;
  }
  const pick = <T>(items: readonly T[]) => items[nextIndex(items.length)];
  const available = UNEXPECTED_TOPICS.filter(
    (t) => !previousTopics.includes(t.id),
  );
  const surprise = pick(available);
  const plans = comboPlans(difficulty);
  const surprisePlan = pick(plans);
  const questions = [
    ...surprisePlan
      .slice(0, count === 15 ? 3 : 2)
      .map((type) => makeQuestion(surprise, type, difficulty)),
    ...roleplaySet(nextIndex(scenarios.length), difficulty),
  ];
  if (count === 15) {
    const remaining = selectedTopics(config).filter(
      (t) => !previousTopics.includes(t.id),
    );
    const closing = remaining.length
      ? pick(remaining)
      : pick(available.filter((t) => t !== surprise));
    const closingTasks: readonly TopicTask[] =
      difficulty >= 5
        ? ["comparison", "opinion"]
        : pick(plans.filter((plan) => plan !== surprisePlan)).slice(-2);
    questions.push(
      ...closingTasks.map((type) => makeQuestion(closing, type, difficulty)),
    );
  }
  return questions;
}
