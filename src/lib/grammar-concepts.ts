import type { QuestionType } from "./types";

// App-authored grammar notes for Korean OPIc learners. The model only tags
// each correction with one of these IDs, so explanations stay consistent and free.
export const GRAMMAR_AUDIT_VERSION = "grammar-audit-v1";
export const GRAMMAR_CONCEPT_IDS = [
  "past-narration",
  "irregular-past",
  "present-habit",
  "perfect-aspect",
  "future-forms",
  "subject-verb-agreement",
  "articles",
  "countable-plural",
  "prepositions",
  "verb-patterns",
  "causative-complement",
  "adjective-forms",
  "comparatives",
  "sentence-structure",
  "pronoun-reference",
  "question-forms",
  "linking-clauses",
  "collocation",
  "word-meaning",
  "register-jargon",
  "redundancy",
  "other",
] as const;
export type GrammarConceptId = (typeof GRAMMAR_CONCEPT_IDS)[number];
export type GrammarCategory =
  | "tense"
  | "agreement"
  | "articles"
  | "prepositions"
  | "word-order"
  | "word-choice"
  | "other";
export type GrammarConcept = {
  id: GrammarConceptId;
  title: string;
  category: GrammarCategory;
  rule: string;
  points: string[];
  examples: { wrong: string; right: string; note: string }[];
  // Question types that give a learner a real chance to use this concept.
  opportunities: QuestionType[] | "all";
  tip: string;
  // Short English definition sent to the grammar auditor.
  modelHint: string;
};

export const GRAMMAR_CONCEPTS: GrammarConcept[] = [
  {
    id: "past-narration",
    title: "과거 경험은 과거형으로",
    category: "tense",
    rule: "이미 끝난 일을 이야기할 때는 처음부터 끝까지 과거형으로 맞춥니다.",
    points: [
      "Last weekend, When I was a kid처럼 과거 시점을 열었다면 이어지는 동사도 과거형으로 씁니다.",
      "한국어는 현재형으로도 지난 일을 말할 수 있지만, 영어는 동사 형태로 시점을 드러냅니다.",
      "그때 누가 한 말도 과거로 옮깁니다. My friend says → My friend said",
      "지금도 사실인 내용만 현재형으로 남깁니다. I still play it these days.",
    ],
    examples: [
      {
        wrong: "Last year, I go to Jeju with my family.",
        right: "Last year, I went to Jeju with my family.",
        note: "Last year가 과거 시점을 정했으므로 went를 씁니다.",
      },
      {
        wrong: "My friend says we will lose, but we win.",
        right: "My friend said we would lose, but we won.",
        note: "말한 내용과 결과 모두 과거 시점에 맞춥니다.",
      },
    ],
    opportunities: ["past", "comparison"],
    tip: "과거 경험 답변을 마친 뒤 동사만 골라 과거형인지 확인하는 습관을 들이세요.",
    modelHint:
      "Completed past events told in present forms; tense drifting back to present inside a past story, including reported speech (says → said).",
  },
  {
    id: "irregular-past",
    title: "불규칙 동사의 과거형",
    category: "tense",
    rule: "win–won, say–said, see–saw–seen처럼 -ed를 붙이지 않는 동사는 형태를 따로 익힙니다.",
    points: [
      "과거형(saw)과 과거분사(seen)를 구분합니다. have 뒤에는 과거분사가 옵니다.",
      "경험 답변에 자주 나오는 go, see, eat, buy, take, make, win, lose, feel, think부터 익히세요.",
    ],
    examples: [
      {
        wrong: "We winned the game.",
        right: "We won the game.",
        note: "win의 과거형은 won입니다.",
      },
      {
        wrong: "I have never saw the sea at night.",
        right: "I have never seen the sea at night.",
        note: "have 뒤에는 과거분사 seen을 씁니다.",
      },
    ],
    opportunities: ["past", "comparison"],
    tip: "자주 쓰는 불규칙 동사 10개를 골라 I went, I saw처럼 주어와 함께 소리 내어 익히세요.",
    modelHint:
      "Malformed irregular past or past participle forms (winned, buyed, have saw). Use past-narration instead when the verb is simply left in present tense.",
  },
  {
    id: "present-habit",
    title: "습관과 일상은 현재 단순형",
    category: "tense",
    rule: "평소에 반복하는 일과 지금도 사실인 일은 I go, she works처럼 현재 단순형으로 말합니다.",
    points: [
      "usually, every weekend, often 같은 빈도 표현과 함께 현재 단순형을 씁니다.",
      "지금 이 순간 하는 일이 아니라면 I'm going보다 I go가 자연스럽습니다.",
      "예전에 하던 습관은 used to + 동사원형으로 구분합니다.",
    ],
    examples: [
      {
        wrong: "Every morning, I am going to the gym.",
        right: "Every morning, I go to the gym.",
        note: "매일 반복하는 습관입니다.",
      },
      {
        wrong: "These days, I went to the park after work.",
        right: "These days, I go to the park after work.",
        note: "These days는 요즘의 습관을 나타냅니다.",
      },
    ],
    opportunities: ["description", "routine"],
    tip: "일상·습관 문항은 빈도 표현(usually, on weekends)을 먼저 말하고 현재 단순형으로 이어 가세요.",
    modelHint:
      "Simple present for habits, routines and current facts (not progressive or past).",
  },
  {
    id: "perfect-aspect",
    title: "현재완료와 과거완료",
    category: "tense",
    rule: "과거부터 지금까지 이어지는 일은 have + 과거분사, 과거보다 더 앞선 일은 had + 과거분사로 말합니다.",
    points: [
      "for three years, since 2020처럼 지금까지 이어지는 기간에는 현재완료를 씁니다.",
      "yesterday, last year처럼 끝난 시점이 분명하면 현재완료 대신 과거형을 씁니다.",
      "어떤 일보다 먼저 있었던 경험을 돌아볼 때는 had + 과거분사를 씁니다.",
    ],
    examples: [
      {
        wrong: "I live here since 2020.",
        right: "I have lived here since 2020.",
        note: "2020년부터 지금까지 이어지는 일입니다.",
      },
      {
        wrong: "I have visited Busan last year.",
        right: "I visited Busan last year.",
        note: "last year처럼 끝난 시점에는 과거형을 씁니다.",
      },
    ],
    opportunities: ["description", "past", "comparison"],
    tip: "변화를 말할 때 I have been ~ing for ~ 문장 하나를 준비해 두면 시간 흐름이 분명해집니다.",
    modelHint:
      "Present perfect and past perfect (since/for, life experience, an earlier past), and perfect used wrongly with a finished time.",
  },
  {
    id: "future-forms",
    title: "미래와 계획 표현",
    category: "tense",
    rule: "앞으로의 계획은 be going to, 그 자리에서 정한 일이나 약속은 will로 말합니다.",
    points: [
      "해결책을 제안할 때 I'll call the store, I'm going to ask처럼 말합니다.",
      "if나 when으로 시작하는 조건·시간 절 안에서는 미래라도 현재형을 씁니다.",
    ],
    examples: [
      {
        wrong: "Tomorrow I visit the store again.",
        right: "Tomorrow I'm going to visit the store again.",
        note: "앞으로의 계획임을 분명히 합니다.",
      },
      {
        wrong: "If it will rain, we will stay home.",
        right: "If it rains, we will stay home.",
        note: "if 절 안은 현재형으로 씁니다.",
      },
    ],
    opportunities: ["roleplay", "solution"],
    tip: "문제 해결 문항에서는 I'm going to ~, If that doesn't work, I'll ~ 두 문장으로 대안을 이어 보세요.",
    modelHint:
      "Future and plan forms (will, be going to, present tense in if/when clauses).",
  },
  {
    id: "subject-verb-agreement",
    title: "주어와 동사의 수 일치",
    category: "agreement",
    rule: "주어가 he, she, it, my friend처럼 3인칭 단수면 현재형 동사에 -s를 붙입니다.",
    points: [
      "my friend, my family, everyone, 동명사 주어(Reading books)는 단수로 취급합니다.",
      "There is / There are는 뒤에 오는 명사의 수에 맞춥니다.",
      "has / have, doesn't / don't도 같은 원리입니다.",
    ],
    examples: [
      {
        wrong: "My brother play soccer every weekend.",
        right: "My brother plays soccer every weekend.",
        note: "My brother는 3인칭 단수입니다.",
      },
      {
        wrong: "There is many people in the park.",
        right: "There are many people in the park.",
        note: "many people은 복수입니다.",
      },
    ],
    opportunities: "all",
    tip: "가족·친구를 묘사할 때 주어 뒤 첫 동사의 -s를 의식하며 천천히 말해 보세요.",
    modelHint:
      "Subject-verb agreement in present forms (third-person -s, there is/are, has/have, doesn't/don't).",
  },
  {
    id: "articles",
    title: "관사 a / an / the",
    category: "articles",
    rule: "셀 수 있는 단수 명사 앞에는 a/an이나 the 같은 한정어가 필요합니다.",
    points: [
      "처음 꺼내는 대상은 a/an, 이미 말했거나 하나뿐인 대상은 the를 씁니다.",
      "game, park처럼 셀 수 있는 단수 명사를 관사 없이 쓰지 않습니다. I played a game.",
      "일반적인 대상을 말할 때는 복수형을 씁니다. I like movies.",
    ],
    examples: [
      {
        wrong: "I went to park near my house.",
        right: "I went to a park near my house.",
        note: "처음 말하는 공원이므로 a를 붙입니다.",
      },
      {
        wrong: "I played game with my friends.",
        right: "I played a game with my friends.",
        note: "game은 셀 수 있는 단수 명사입니다.",
      },
    ],
    opportunities: "all",
    tip: "명사를 말하기 직전에 '하나? 여러 개? 서로 아는 것?'을 떠올리면 관사가 자연스럽게 따라옵니다.",
    modelHint: "Articles and determiners (a/an/the/zero article) before nouns.",
  },
  {
    id: "countable-plural",
    title: "셀 수 있는 명사와 복수형",
    category: "agreement",
    rule: "여러 개를 말할 때나 many, a few, two 뒤에서는 셀 수 있는 명사를 복수형으로 씁니다.",
    points: [
      "information, advice, furniture처럼 셀 수 없는 명사에는 -s를 붙이지 않고 much, a lot of를 씁니다.",
      "운동 동작처럼 여러 번 하는 것은 복수형으로 말합니다. I do squats.",
      "for students, for kids처럼 일반적인 사람들을 말할 때도 복수형을 씁니다.",
    ],
    examples: [
      {
        wrong: "I took many picture.",
        right: "I took many pictures.",
        note: "many 뒤에는 복수 명사가 옵니다.",
      },
      {
        wrong: "She gave me many advices.",
        right: "She gave me a lot of advice.",
        note: "advice는 셀 수 없는 명사입니다.",
      },
    ],
    opportunities: "all",
    tip: "숫자나 many를 말했다면 뒤에 오는 명사 끝소리 -s를 한 번 더 확인하세요.",
    modelHint:
      "Plural forms after quantity words and countable/uncountable nouns (many pictures, some squats, advice).",
  },
  {
    id: "prepositions",
    title: "시간·장소·방향 전치사",
    category: "prepositions",
    rule: "in(달·연도·넓은 공간), on(요일·날짜), at(시각·지점)처럼 의미에 맞는 전치사를 고릅니다.",
    points: [
      "go to the park, 하지만 go home (home 앞에는 to를 쓰지 않습니다).",
      "with my friends(함께), by bus(교통수단)처럼 짝으로 익힙니다.",
      "listen to, wait for, depend on처럼 동사와 붙어 다니는 전치사도 함께 외웁니다.",
    ],
    examples: [
      {
        wrong: "I go to the gym in Mondays.",
        right: "I go to the gym on Mondays.",
        note: "요일 앞에는 on을 씁니다.",
      },
      {
        wrong: "We arrived to the airport at 7.",
        right: "We arrived at the airport at 7.",
        note: "arrive는 도착 지점 앞에 at을 씁니다.",
      },
    ],
    opportunities: "all",
    tip: "장소와 시간을 말하는 표현은 at the gym, on weekends처럼 전치사까지 한 덩어리로 연습하세요.",
    modelHint:
      "Preposition choice (time, place, movement, verb + preposition pairs).",
  },
  {
    id: "verb-patterns",
    title: "동사 뒤의 to부정사와 -ing",
    category: "other",
    rule: "동사마다 뒤에 오는 형태가 정해져 있습니다. enjoy·finish는 -ing, want·decide·plan은 to + 동사원형.",
    points: [
      "like, love, start는 두 형태가 모두 가능합니다.",
      "stop doing(하던 일을 멈추다)과 stop to do(하려고 멈추다)는 뜻이 다릅니다.",
      "전치사 뒤에는 -ing를 씁니다. I'm interested in learning.",
    ],
    examples: [
      {
        wrong: "We decided going to a cafe.",
        right: "We decided to go to a cafe.",
        note: "decide 뒤에는 to + 동사원형을 씁니다.",
      },
      {
        wrong: "I enjoy to watch movies.",
        right: "I enjoy watching movies.",
        note: "enjoy 뒤에는 -ing를 씁니다.",
      },
    ],
    opportunities: "all",
    tip: "enjoy -ing, decide to ~처럼 동사와 뒤 형태를 짧은 문장으로 묶어 외우세요.",
    modelHint:
      "Verb complement patterns: to-infinitive vs gerund vs bare infinitive after verbs and prepositions.",
  },
  {
    id: "causative-complement",
    title: "make·help·let + 목적어",
    category: "other",
    rule: "make, help, let, keep은 '누구를/무엇을' 다음에 상태나 동작을 붙입니다.",
    points: [
      "make + 목적어 + 형용사: It makes me happy. 목적어를 빠뜨리지 않습니다.",
      "help + 사람 + 동사원형: It helps me relax.",
      "make와 let 뒤의 동작에는 to를 붙이지 않습니다. My mom made me clean my room.",
    ],
    examples: [
      {
        wrong: "Exercise makes happy.",
        right: "Exercise makes me happy.",
        note: "누가 행복해지는지 목적어 me가 필요합니다.",
      },
      {
        wrong: "My boss let me to leave early.",
        right: "My boss let me leave early.",
        note: "let 뒤에는 to 없이 동사원형을 씁니다.",
      },
    ],
    opportunities: "all",
    tip: "의견 문항에서 It makes me ~, It helps me ~ 문장을 이유로 활용하면 정확하고 자연스럽습니다.",
    modelHint:
      "make/let/help/keep/find + object + adjective or bare infinitive (missing object, extra to).",
  },
  {
    id: "adjective-forms",
    title: "형용사 형태 구분 (-ed / -ing, fun / funny)",
    category: "word-choice",
    rule: "느끼는 사람은 -ed(excited, bored), 느낌을 주는 대상은 -ing(exciting, boring)를 씁니다.",
    points: [
      "It was really fun은 '즐거웠다', It was funny는 '웃겼다'입니다.",
      "a 뒤에 형용사만 두지 않습니다. a fun day처럼 명사까지 말합니다.",
      "형용사 자리에 명사나 동사를 쓰지 않았는지 확인합니다.",
    ],
    examples: [
      {
        wrong: "I was very exciting before the trip.",
        right: "I was very excited before the trip.",
        note: "설렘을 느낀 사람은 excited입니다.",
      },
      {
        wrong: "The festival was very funny, so I want to go again.",
        right: "The festival was a lot of fun, so I want to go again.",
        note: "즐거웠다는 뜻이면 fun을 씁니다.",
      },
    ],
    opportunities: "all",
    tip: "경험을 마무리하는 감정 문장 하나를 It was really fun / I was so excited 중에서 정확히 골라 두세요.",
    modelHint:
      "Adjective form confusion (-ed vs -ing, fun vs funny, a + adjective with no noun, noun or verb used as an adjective).",
  },
  {
    id: "comparatives",
    title: "비교급과 최상급",
    category: "other",
    rule: "비교급(better, more convenient)은 비교 대상이 있을 때 쓰고, 셋 이상 중 최고는 the + 최상급으로 말합니다.",
    points: [
      "비교 대상 없이 better만 쓰면 '무엇보다?'라는 질문이 남습니다.",
      "more와 -er을 겹쳐 쓰지 않습니다. more easier가 아니라 easier.",
      "과거와 현재를 비교할 때 than before, than when I was young을 활용합니다.",
    ],
    examples: [
      {
        wrong: "Now the city is more busier.",
        right: "Now the city is busier than before.",
        note: "more와 -er을 함께 쓰지 않고 비교 대상을 밝힙니다.",
      },
      {
        wrong: "It is the most good restaurant in my town.",
        right: "It is the best restaurant in my town.",
        note: "good의 최상급은 best입니다.",
      },
    ],
    opportunities: ["comparison", "opinion", "description"],
    tip: "비교·변화 문항에서는 than before를 붙여 지금과 예전의 차이를 한 문장으로 정리하세요.",
    modelHint:
      "Comparatives and superlatives (double comparatives, irregular forms, a comparative with no comparison target).",
  },
  {
    id: "sentence-structure",
    title: "문장의 뼈대: 주어·동사",
    category: "word-order",
    rule: "영어 문장에는 주어와 동사가 필요하고, be동사와 일반동사를 함께 쓰지 않습니다.",
    points: [
      "주어를 생략하지 않습니다. Is very fun이 아니라 It is very fun.",
      "I am agree, I'm very like it처럼 be동사와 일반동사를 겹치지 않습니다.",
      "명사나 형용사 자리에 동사를 그대로 두지 않습니다.",
    ],
    examples: [
      {
        wrong: "I am agree with that idea.",
        right: "I agree with that idea.",
        note: "agree는 일반동사이므로 am이 필요 없습니다.",
      },
      {
        wrong: "Is really fun to play tennis with friends.",
        right: "It is really fun to play tennis with friends.",
        note: "문장 앞에 주어 It이 필요합니다.",
      },
    ],
    opportunities: "all",
    tip: "긴 문장이 꼬일 때는 '누가 + 무엇을 했다' 두 단어부터 먼저 말하고 살을 붙이세요.",
    modelHint:
      "Clause skeleton errors: missing subject, verb or object; be + main verb; a verb used where a noun or adjective is needed.",
  },
  {
    id: "pronoun-reference",
    title: "대명사가 가리키는 대상",
    category: "other",
    rule: "it, they, this가 무엇을 가리키는지 바로 알 수 있어야 합니다. 대상이 바뀌면 명사로 다시 말합니다.",
    points: [
      "단수는 it, 복수는 they/them으로 수를 맞춥니다.",
      "he/she, his/her를 섞지 않습니다.",
      "앞 문장 전체를 가리킬 때는 that을 씁니다.",
    ],
    examples: [
      {
        wrong: "I like my sneakers because it is comfortable.",
        right: "I like my sneakers because they are comfortable.",
        note: "sneakers는 복수이므로 they를 씁니다.",
      },
      {
        wrong: "My sister loves cooking. He makes pasta every weekend.",
        right: "My sister loves cooking. She makes pasta every weekend.",
        note: "sister는 she로 받습니다.",
      },
    ],
    opportunities: "all",
    tip: "it이 두 번 이상 이어지면 한 번은 명사(the gym, exercise)로 다시 말해 듣는 사람을 도와주세요.",
    modelHint:
      "Pronoun choice and reference (it/they number, he/she, an unclear antecedent).",
  },
  {
    id: "question-forms",
    title: "의문문과 간접의문문 어순",
    category: "word-order",
    rule: "직접 묻는 의문문은 do/does/can을 주어 앞에 두고, Can you tell me 뒤에서는 평서문 어순으로 말합니다.",
    points: [
      "질문하기 롤플레이는 정확한 의문문 3~4개를 말하는 것이 핵심입니다.",
      "do/does/did를 빠뜨리지 않습니다. Where you live?가 아니라 Where do you live?",
      "Could you ~? Is it possible to ~?로 공손하게 묻습니다.",
    ],
    examples: [
      {
        wrong: "What time it opens?",
        right: "What time does it open?",
        note: "일반동사 의문문에는 does가 필요합니다.",
      },
      {
        wrong: "Can you tell me where is the store?",
        right: "Can you tell me where the store is?",
        note: "Can you tell me 뒤에서는 평서문 어순입니다.",
      },
    ],
    opportunities: ["roleplay"],
    tip: "롤플레이 전에 When / How much / Is there 세 가지로 시작하는 질문을 하나씩 준비하세요.",
    modelHint:
      "Question formation and embedded question word order (auxiliary inversion, do-support).",
  },
  {
    id: "linking-clauses",
    title: "접속사와 문장 연결",
    category: "other",
    rule: "because와 so, although와 but처럼 같은 관계의 접속사를 한 문장에 겹쳐 쓰지 않습니다.",
    points: [
      "이유는 because, 결과는 so 중 하나만 골라 두 내용을 잇습니다.",
      "although를 썼다면 but을 덧붙이지 않습니다.",
      "연결어 없이 문장을 계속 이어 붙여 뜻이 흐려지지 않게 끊어 말합니다.",
    ],
    examples: [
      {
        wrong: "Because it was raining, so we stayed home.",
        right: "Because it was raining, we stayed home.",
        note: "because와 so를 함께 쓰지 않습니다.",
      },
      {
        wrong: "Although it was expensive, but I bought it.",
        right: "Although it was expensive, I bought it.",
        note: "although와 but을 함께 쓰지 않습니다.",
      },
    ],
    opportunities: "all",
    tip: "So, Because, But 중 하나로 문장을 시작했다면 그 문장 안에서는 다른 접속사를 쓰지 않도록 연습하세요.",
    modelHint:
      "Conjunction and clause linking errors (because…so, although…but, run-ons that obscure meaning).",
  },
  {
    id: "collocation",
    title: "자연스러운 단어 짝 (한국어 직역)",
    category: "word-choice",
    rule: "영어에는 함께 쓰는 단어 짝이 정해져 있습니다. 한국어를 그대로 옮기기보다 짝으로 익힙니다.",
    points: [
      "체중을 줄이다 → lose weight, 약을 먹다 → take medicine",
      "사진을 찍다 → take pictures, 결정을 내리다 → make a decision",
      "스트레스를 받다 → get stressed, 스트레스를 풀다 → relieve stress",
    ],
    examples: [
      {
        wrong: "I want to reduce my weight.",
        right: "I want to lose weight.",
        note: "체중 감량은 lose weight로 말합니다.",
      },
      {
        wrong: "I ate medicine for my cold.",
        right: "I took medicine for my cold.",
        note: "약은 take로 말합니다.",
      },
    ],
    opportunities: "all",
    tip: "자주 말하는 주제(운동, 여행, 음식)의 동사 + 명사 짝을 5개씩 모아 두세요.",
    modelHint:
      "Collocations and Korean-literal phrasing (reduce weight, eat medicine, do stress).",
  },
  {
    id: "word-meaning",
    title: "뜻이 비슷한 단어 구분",
    category: "word-choice",
    rule: "see/watch, borrow/lend, say/tell처럼 비슷하지만 쓰임이 다른 단어를 문맥에 맞게 고릅니다.",
    points: [
      "watch TV, see a movie, look at a picture",
      "borrow는 빌려 오다, lend는 빌려 주다입니다.",
      "tell 뒤에는 사람이, say 뒤에는 말한 내용이 옵니다.",
    ],
    examples: [
      {
        wrong: "Can you borrow me your pen?",
        right: "Can you lend me your pen?",
        note: "빌려 주는 쪽은 lend를 씁니다.",
      },
      {
        wrong: "He said me the news.",
        right: "He told me the news.",
        note: "사람을 바로 뒤에 둘 때는 tell을 씁니다.",
      },
    ],
    opportunities: "all",
    tip: "헷갈리는 단어 쌍은 뜻보다 예문 하나로 기억하세요. I watched TV. / I saw a movie.",
    modelHint:
      "A wrong word whose meaning or usage differs from the intended one (see/watch, borrow/lend, say/tell).",
  },
  {
    id: "register-jargon",
    title: "처음 듣는 사람도 아는 표현 (은어·줄임말)",
    category: "word-choice",
    rule: "게임·인터넷 은어나 줄임말은 채점자가 모를 수 있습니다. 처음 듣는 사람도 이해할 표현으로 풀어 말합니다.",
    points: [
      "OPIc 채점자는 그 분야 동료가 아니라 일반 청자라고 생각하세요.",
      "은어를 쓰고 싶다면 바로 뒤에 뜻을 풀어 줍니다.",
    ],
    examples: [
      {
        wrong: "My character was OP in that match.",
        right: "My character was really powerful in that match.",
        note: "OP는 게임 줄임말입니다.",
      },
      {
        wrong: "It was a total noob mistake.",
        right: "It was a beginner's mistake.",
        note: "noob은 인터넷 은어입니다.",
      },
    ],
    opportunities: "all",
    tip: "취미 답변에 쓰는 전문 용어를 일반 표현으로 바꿔 말하는 연습을 해 두세요.",
    modelHint:
      "Slang, gaming or internet jargon, and abbreviations a general listener may not understand.",
  },
  {
    id: "redundancy",
    title: "뜻이 겹치는 표현",
    category: "other",
    rule: "return back, the reason is because처럼 같은 뜻을 두 번 담은 표현을 피합니다.",
    points: [
      "return에는 이미 '돌아가다'의 뜻이 있어 back이 필요 없습니다.",
      "The reason is 뒤에는 because 대신 that을 씁니다.",
      "말을 고르며 반복한 단어는 문법 오류가 아니라 말하기 과정입니다.",
    ],
    examples: [
      {
        wrong: "I returned back home at night.",
        right: "I returned home at night.",
        note: "return에 back의 뜻이 들어 있습니다.",
      },
      {
        wrong: "The reason is because it's cheap.",
        right: "The reason is that it's cheap.",
        note: "reason과 because가 같은 뜻을 반복합니다.",
      },
    ],
    opportunities: "all",
    tip: "이유를 말할 때는 The reason is that ~ 또는 Because ~ 중 하나만 고르세요.",
    modelHint:
      "Lexical redundancy (return back, the reason is because). Never use for fillers, restarts or self-repairs.",
  },
  {
    id: "other",
    title: "기타 문법·표현",
    category: "other",
    rule: "위 개념에 딱 맞지 않는 문법·표현입니다. 교정문과 설명을 함께 확인하세요.",
    points: ["반복해서 나온다면 교정문을 소리 내어 따라 말하며 익혀 보세요."],
    examples: [],
    opportunities: "all",
    tip: "교정문을 듣고 세 번 따라 말한 뒤, 같은 구조로 내 문장을 하나 더 만들어 보세요.",
    modelHint: "Anything that fits none of the concepts above.",
  },
];

const BY_ID = new Map(GRAMMAR_CONCEPTS.map((concept) => [concept.id, concept]));
export function getGrammarConcept(id: string): GrammarConcept | undefined {
  return BY_ID.get(id as GrammarConceptId);
}
export function conceptHasOpportunity(
  concept: GrammarConcept,
  type: QuestionType,
) {
  return (
    concept.opportunities === "all" || concept.opportunities.includes(type)
  );
}
