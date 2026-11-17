import { z } from "zod";
import type { ExamConfig, Question, QuestionType } from "./types";

export const TOPICS = [
  {
    id: "home",
    label: "집",
    group: "생활",
    subject: "your home",
    detail: "your favorite room",
    past: "something unexpected happened at home",
    change: "the homes you have lived in",
  },
  {
    id: "neighborhood",
    label: "동네",
    group: "생활",
    subject: "your neighborhood",
    detail: "a place you often visit near your home",
    past: "you got to know someone in your neighborhood",
    change: "your neighborhood",
  },
  {
    id: "cafe",
    label: "카페 가기",
    group: "여가",
    subject: "a café you enjoy visiting",
    detail: "the atmosphere and the people there",
    past: "a visit to a café did not go as you expected",
    change: "cafés and how people use them",
  },
  {
    id: "movies",
    label: "영화 보기",
    group: "여가",
    subject: "the kinds of movies you enjoy",
    detail: "a movie theater you like",
    past: "you watched a movie that stayed with you",
    change: "the way you watch movies",
  },
  {
    id: "music",
    label: "음악 감상",
    group: "취미",
    subject: "the music you enjoy listening to",
    detail: "a musician you like and their music",
    past: "a song reminded you of an important moment",
    change: "your taste in music",
  },
  {
    id: "concerts",
    label: "공연·콘서트",
    group: "여가",
    subject: "the live performances you enjoy",
    detail: "a venue you have visited",
    past: "you attended a memorable live performance",
    change: "live performances and their audiences",
  },
  {
    id: "parks",
    label: "공원 가기",
    group: "여가",
    subject: "a park you like visiting",
    detail: "the paths and facilities in that park",
    past: "something memorable happened during a park visit",
    change: "public parks in your area",
  },
  {
    id: "walking",
    label: "걷기",
    group: "운동",
    subject: "a place where you enjoy walking",
    detail: "your favorite walking route",
    past: "a walk turned into an unexpected experience",
    change: "your walking habits",
  },
  {
    id: "running",
    label: "조깅",
    group: "운동",
    subject: "a place where you go jogging",
    detail: "the things you take when you go running",
    past: "you had a problem while running",
    change: "your exercise routine",
  },
  {
    id: "fitness",
    label: "헬스·운동",
    group: "운동",
    subject: "the exercise you enjoy doing",
    detail: "the place where you usually exercise",
    past: "you tried a new kind of exercise",
    change: "the way people exercise",
  },
  {
    id: "cooking",
    label: "요리하기",
    group: "취미",
    subject: "a dish you like to cook",
    detail: "the ingredients and equipment you use",
    past: "a meal you cooked did not turn out as planned",
    change: "your cooking skills and habits",
  },
  {
    id: "shopping",
    label: "쇼핑",
    group: "생활",
    subject: "a place where you like to shop",
    detail: "the kinds of things you shop for",
    past: "you had a problem with a purchase",
    change: "the way you shop",
  },
  {
    id: "travel",
    label: "국내 여행",
    group: "여행",
    subject: "a place you like to travel to in your country",
    detail: "the local scenery and places to visit",
    past: "something unexpected happened on a domestic trip",
    change: "the way you plan trips",
  },
  {
    id: "overseas",
    label: "해외 여행",
    group: "여행",
    subject: "a country you have visited or would like to visit",
    detail: "the things visitors can do there",
    past: "you faced a challenge while traveling",
    change: "traveling abroad",
  },
  {
    id: "staycation",
    label: "집에서 휴가",
    group: "여행",
    subject: "the way you enjoy a vacation at home",
    detail: "a relaxing activity you do at home",
    past: "you spent a memorable holiday at home",
    change: "your idea of a good vacation",
  },
  {
    id: "beach",
    label: "해변 가기",
    group: "여가",
    subject: "a beach you have visited",
    detail: "the scenery and things people do there",
    past: "something surprising happened during a beach visit",
    change: "beaches you know and how people spend time there",
  },
  {
    id: "reading",
    label: "독서",
    group: "취미",
    subject: "the books you enjoy reading",
    detail: "a comfortable place where you read",
    past: "a book changed the way you thought about something",
    change: "your reading habits",
  },
  {
    id: "games",
    label: "게임",
    group: "취미",
    subject: "a game you enjoy playing",
    detail: "the people you play with",
    past: "you had an especially memorable game",
    change: "the games you play",
  },
  {
    id: "work",
    label: "직장 생활",
    group: "생활",
    subject: "your workplace or a workplace you know",
    detail: "a typical workspace and its equipment",
    past: "you solved a difficult problem with other people",
    change: "the way people work",
  },
  {
    id: "study",
    label: "학교 생활",
    group: "생활",
    subject: "a class or course you have taken",
    detail: "a place where you like to study",
    past: "you worked on a memorable class project",
    change: "the way you learn new things",
  },
  {
    id: "sns",
    label: "SNS 사용",
    group: "여가",
    subject: "a social media platform you use",
    detail: "the features you find useful",
    past: "an online interaction led to a memorable experience",
    change: "the way you use social media",
  },
  {
    id: "people",
    label: "가족·친구",
    group: "생활",
    subject: "a person you enjoy spending time with",
    detail: "their personality and interests",
    past: "you and someone close to you shared a special experience",
    change: "the way you keep in touch with people",
  },
  {
    id: "jobsearch",
    label: "취업 준비",
    group: "생활",
    subject: "the kind of work you would like to do",
    detail: "the skills that would be useful for that work",
    past: "you prepared for an important interview or application",
    change: "the way people look for work",
  },
] as const;
export const UNEXPECTED_TOPICS = [
  {
    id: "technology",
    label: "기술",
    subject: "a device you use every day",
    detail: "its most useful features",
    past: "your device stopped working when you needed it",
    change: "technology and communication",
  },
  {
    id: "transport",
    label: "교통",
    subject: "public transportation in your area",
    detail: "a route you use often",
    past: "a transportation delay changed your plans",
    change: "transportation in your city",
  },
  {
    id: "weather",
    label: "날씨",
    subject: "the weather in your country",
    detail: "your favorite season",
    past: "unexpected weather affected your plans",
    change: "the weather patterns you have noticed",
  },
  {
    id: "recycling",
    label: "재활용",
    subject: "recycling where you live",
    detail: "how waste is collected in your area",
    past: "you had trouble disposing of an item",
    change: "recycling habits in your community",
  },
  {
    id: "appointments",
    label: "약속",
    subject: "the kinds of appointments you make",
    detail: "how you keep track of your schedule",
    past: "you had to change an important appointment",
    change: "the way people arrange appointments",
  },
  {
    id: "health",
    label: "건강",
    subject: "healthy habits in your daily life",
    detail: "a healthy meal you enjoy",
    past: "you tried to build a new healthy habit",
    change: "people's attitudes toward staying healthy",
  },
] as const;
type Topic = {
  id: string;
  label: string;
  subject: string;
  detail: string;
  past: string;
  change: string;
};
const types: QuestionType[] = [
  "description",
  "routine",
  "past",
  "comparison",
  "opinion",
];
export function makeQuestion(
  topic: Topic,
  type: QuestionType,
  difficulty: number,
  variant = 0,
): Question {
  const easy = difficulty <= 2;
  const prompts: Partial<Record<QuestionType, string>> = {
    description: easy
      ? `Please tell me about ${topic.subject}. What is it like?`
      : `I would like to hear about ${topic.subject}. Describe ${topic.detail} in detail. What makes it special to you?`,
    routine: variant
      ? `How do you prepare for activities related to ${topic.subject}? Explain what you arrange in advance and why it helps.`
      : easy
        ? `Tell me what you usually do when it comes to ${topic.subject}.`
        : `Walk me through your usual routine related to ${topic.subject}. What do you do first, and what happens after that? Include the small details.`,
    past: easy
      ? `Tell me about a time when ${topic.past}. What happened?`
      : variant
        ? `Think back to the first time you became interested in ${topic.subject}. How did it happen, and what do you remember most clearly?`
        : `Tell me about a particular time when ${topic.past}. Explain what led up to it, what happened, and how things turned out.`,
    comparison: `How has ${topic.change} changed over time? Compare the past with the present and explain which differences matter most to you.`,
    opinion: `People have different views about ${topic.subject}. What do you think makes it valuable? Explain your opinion with a specific example${difficulty >= 5 ? ", and consider a different point of view" : ""}.`,
  };
  const hints: Partial<Record<QuestionType, string>> = {
    description: "전체 모습 → 구체적인 특징 두 가지 → 나에게 특별한 이유",
    routine: "시작 → 순서대로 하는 일 → 평소 느낌",
    past: "배경 → 사건 → 해결·결과 → 느낀 점. 과거 시제를 유지해 보세요.",
    comparison: "과거의 모습 → 현재의 모습 → 가장 큰 변화와 이유",
    opinion: "내 생각 → 이유 → 구체적인 사례 → 다른 관점",
  };
  return {
    id: `${topic.id}-${type}-${variant}`,
    topic: topic.id,
    topicLabel: topic.label,
    type,
    prompt: prompts[type]!,
    hint: hints[type]!,
    difficulty,
  };
}
const scenarios = [
  {
    id: "hotel",
    label: "호텔 예약",
    setup: "You are planning a weekend stay at a hotel. Call the front desk",
    ask: "the room types, prices, and check-in arrangements",
    problem:
      "The hotel has just told you that the room you booked is no longer available",
    memory: "a reservation or travel plan had to be changed",
  },
  {
    id: "cafe-booking",
    label: "카페 모임",
    setup: "You want to arrange a small gathering at a café. Call the manager",
    ask: "seating, available times, and group orders",
    problem: "The café has accidentally reserved a table for the wrong date",
    memory: "a plan to meet other people did not go smoothly",
  },
  {
    id: "ticket",
    label: "공연 티켓",
    setup:
      "You would like to buy tickets for a live performance. Call the ticket office",
    ask: "seats, performance times, and ticket policies",
    problem:
      "You received tickets for a different performance from the one you requested",
    memory: "you had a problem with tickets or admission",
  },
  {
    id: "rental",
    label: "차량 대여",
    setup: "You need to rent a car for a short trip. Call the rental company",
    ask: "available cars, insurance, and return arrangements",
    problem: "The rental company cannot provide the car you reserved",
    memory: "transportation arrangements suddenly changed",
  },
  {
    id: "purchase",
    label: "물건 교환",
    setup:
      "You are interested in buying a pair of headphones. Call an electronics shop",
    ask: "features, availability, and returns",
    problem:
      "The headphones you bought do not work, and you cannot find your receipt",
    memory: "you needed to return or replace something you bought",
  },
  {
    id: "gym",
    label: "운동 수업",
    setup: "You want to join a new exercise class. Call the gym",
    ask: "class levels, schedules, and membership costs",
    problem: "The class you signed up for has been canceled at short notice",
    memory: "an activity you had planned was canceled",
  },
  {
    id: "restaurant",
    label: "식당 예약",
    setup:
      "You want to reserve a restaurant for a family celebration. Call the restaurant",
    ask: "the menu, seating, and reservation conditions",
    problem:
      "You arrive at the restaurant and find that your reservation was not recorded",
    memory: "you had to find a quick alternative to your original plan",
  },
  {
    id: "friend",
    label: "친구와 약속",
    setup: "You want to spend a day out with a friend. Call your friend",
    ask: "their preferences, availability, and how to meet",
    problem:
      "Something urgent has come up, so you cannot meet your friend as planned",
    memory: "you had to apologize and rearrange plans with someone",
  },
] as const;
export function roleplaySet(index: number, difficulty: number): Question[] {
  const s = scenarios[index % scenarios.length];
  return [
    {
      id: `${s.id}-roleplay`,
      type: "roleplay",
      prompt: `${s.setup} and ask three or four questions about ${s.ask}. Speak as if you are on the phone.`,
      hint: "인사 → 상황 설명 → 서로 다른 질문 3~4개 → 마무리",
    },
    {
      id: `${s.id}-solution`,
      type: "solution",
      prompt: `${s.problem}. Contact the person responsible, explain the situation, and suggest two possible solutions.`,
      hint: "문제 설명 → 대안 두 가지 → 상대 의견 확인",
    },
    {
      id: `${s.id}-past`,
      type: "past",
      prompt: `Have you ever been in a situation when ${s.memory}? Tell me the whole story, including how you handled it and the outcome.`,
      hint: "비슷한 실제 경험 → 대처 방법 → 결과",
    },
  ].map((q) => ({
    ...q,
    type: q.type as QuestionType,
    topic: s.id,
    topicLabel: s.label,
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
export function createQuestionSet(
  config: ExamConfig,
  random = Math.random,
): Question[] {
  if (config.practiceQuestionId) {
    const q = QUESTION_BANK.find((q) => q.id === config.practiceQuestionId);
    if (q) return [{ ...q, difficulty: config.difficulty }];
  }
  const eligible = TOPICS.filter(
    (t) =>
      config.topics.includes(t.id) &&
      (t.id !== "work" || config.occupation === "직장인") &&
      (t.id !== "study" || config.student === "예"),
  );
  const picked = shuffle(
    eligible.length >= 2
      ? eligible
      : TOPICS.filter((t) => config.topics.includes(t.id)),
    random,
  );
  const first = picked[0],
    second = picked[1];
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
  const firstSession = [
    intro,
    ...[first, second].flatMap((t) => [
      makeQuestion(t, "description", config.difficulty),
      makeQuestion(t, "routine", config.difficulty),
      makeQuestion(t, "past", config.difficulty),
    ]),
  ];
  return [
    ...firstSession,
    ...createSecondSession(config, Math.floor(random() * 10000)),
  ];
}
export function createSecondSession(
  config: ExamConfig,
  seed: number,
): Question[] {
  const topic = UNEXPECTED_TOPICS[seed % UNEXPECTED_TOPICS.length];
  const count = config.count;
  const surprise = (
    count === 15 ? ["description", "routine", "past"] : ["description", "past"]
  ) as QuestionType[];
  const roles = roleplaySet(seed % scenarios.length, config.difficulty);
  const extra =
    count === 15
      ? [
          makeQuestion(
            topic,
            config.difficulty >= 5 ? "comparison" : "routine",
            config.difficulty,
            1,
          ),
          makeQuestion(
            topic,
            config.difficulty >= 5 ? "opinion" : "past",
            config.difficulty,
            1,
          ),
        ]
      : [];
  return [
    ...surprise.map((type) => makeQuestion(topic, type, config.difficulty)),
    ...roles,
    ...extra,
  ];
}
