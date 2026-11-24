// Measures how many seeded errors the real grammar audit finds, and whether it
// leaves correct speech alone. Uses the connected account's ChatGPT plan usage
// for one request, so it only calls the model when run with --yes.
// Usage: npm run grammar:check -- --yes [--user <user id>]
import { db } from "../src/server/db";
import { newExam } from "../src/server/exam";
import { auditGrammar } from "../src/server/grammar";
import { correctedTranscript } from "../src/lib/corrected-transcript";
import { sentenceContext } from "../src/lib/grammar-profile";
import type { Question, QuestionType } from "../src/lib/types";

type Fixture = {
  type: QuestionType;
  topicLabel: string;
  prompt: string;
  transcript: string;
  // An anchor identifies the issue. The pattern checks the applied correction.
  expected: [string, RegExp][];
  // Correct wording that must never be reported as an error.
  untouched: string[];
};
// Authored learner-style answers. Never copy real users' answers here.
const FIXTURES: Fixture[] = [
  {
    type: "past",
    topicLabel: "여행",
    prompt:
      "Tell me about a memorable trip. What happened, and why was it special?",
    transcript:
      "Okay, good question. Last summer I go to Busan with my two friend. At first, the weather is really bad, and my friend say we should go home. But we stay one more day, and finally we see a beautiful sunset. Our guide told a joke. It was so funny. We laughed all the way home. Thank you.",
    expected: [
      ["I go to Busan", /I (?:went|trave[l]+ed) to Busan/i],
      ["two friend", /two friends/i],
      ["the weather is", /the weather was/i],
      ["my friend say", /my friend (?:said|told)/i],
      ["we stay one more day", /we stayed/i],
      ["we see a beautiful sunset", /we saw a beautiful sunset/i],
    ],
    untouched: ["Okay, good question.", "It was so funny.", "Thank you."],
  },
  {
    type: "opinion",
    topicLabel: "독서",
    prompt:
      "Some people say reading is valuable. What do you think, and why? Give an example.",
    transcript:
      "I think reading books make me smart. Because it give many informations. For example, I read a novel every week, and it helps me relax. So I think it makes valuable.",
    expected: [
      ["reading books make", /reading books makes|reading makes/i],
      ["it give", /it (?:gives|provides)/i],
      [
        "many informations",
        /(?:a lot of|lots of|plenty of|much|useful) information\b/i,
      ],
      [
        "it makes valuable",
        /(?:reading|it)(?: is|'s) valuable|makes (?:reading|it) valuable/i,
      ],
    ],
    untouched: ["I read a novel every week", "it helps me relax"],
  },
  {
    type: "roleplay",
    topicLabel: "공연",
    prompt:
      "You want to see a concert. Call the ticket office and ask three or four questions.",
    transcript:
      "Hi, I want to buy a ticket for the concert. What time the concert starts? And can you tell me where is the parking lot? Also, how much is the ticket for student?",
    expected: [
      [
        "What time the concert starts",
        /what time does the concert (?:start|begin)/i,
      ],
      ["where is the parking lot", /where (?:the parking lot is|I can park)/i],
      ["for student", /for (?:a student|students)|student ticket/i],
    ],
    untouched: ["I want to buy a ticket for the concert."],
  },
  {
    type: "past",
    topicLabel: "영화",
    prompt: "Tell me about the last time you saw a movie.",
    transcript:
      "Last night my sister give me two ticket for a movie. I felt boring while we waited in line with nothing to do. I didn't bought popcorn. My sister borrowed me her scarf because I was cold. I explained her the ending. Now I look forward to see the sequel.",
    expected: [
      ["my sister give", /my sister gave/i],
      ["two ticket", /two tickets/i],
      ["I felt boring", /I (?:felt|was|got) bored/i],
      ["didn't bought", /did(?:n't| not) buy/i],
      [
        "borrowed me her scarf",
        /(?:lent|loaned) me her scarf|I borrowed (?:my sister's|her) scarf/i,
      ],
      ["explained her the ending", /explained the ending to her/i],
      ["look forward to see", /look(?:ing)? forward to seeing/i],
    ],
    untouched: ["because I was cold"],
  },
  {
    type: "past",
    topicLabel: "일상",
    prompt: "Tell me about something that made your week better.",
    transcript:
      "Yesterday my friend said, “I'm taking the bus this week.” It helps her to relax. I'm feeling better, too. We still walk home together on Fridays.",
    expected: [],
    untouched: [
      "Yesterday my friend said",
      "I'm taking the bus this week",
      "It helps her to relax",
      "I'm feeling better, too",
      "We still walk home together on Fridays",
    ],
  },
];

const args = process.argv.slice(2);
if (!args.includes("--yes")) {
  console.log(
    `Grammar audit check: ${FIXTURES.length} authored answers, ${FIXTURES.reduce((n, f) => n + f.expected.length, 0)} seeded errors.`,
  );
  console.log(
    "It sends one request with the connected account's ChatGPT plan usage. Re-run with --yes to call the model.",
  );
  process.exit(0);
}
const connected = db()
  .prepare(
    "SELECT user_id FROM connections WHERE credentials IS NOT NULL ORDER BY user_id",
  )
  .all() as { user_id: string }[];
const userId = args.includes("--user")
  ? args[args.indexOf("--user") + 1]
  : connected.length === 1
    ? connected[0].user_id
    : null;
if (!userId) {
  console.error(
    connected.length
      ? `Several accounts are connected. Pass --user with one of: ${connected.map((c) => c.user_id).join(", ")}`
      : "No connected ChatGPT account. Connect one in the app first.",
  );
  process.exit(2);
}
// A single-question practice shell; its question is replaced by the fixtures below.
const exam = newExam(userId, {
  mode: "practice",
  practiceQuestionId: "travel-past-0",
  difficulty: 4,
  count: 15,
  target: "IH",
  topics: [],
  occupation: "일 경험 없음",
  student: "아니요",
  residence: "혼자 거주",
});
exam.questions = FIXTURES.map((fixture, index): Question => ({
  id: `fixture-${index}`,
  topic: `fixture-${index}`,
  topicLabel: fixture.topicLabel,
  type: fixture.type,
  prompt: fixture.prompt,
  hint: "",
  difficulty: 4,
}));
exam.answers = FIXTURES.map((fixture, index) => ({
  index,
  duration: 60,
  audio: null,
  mime: null,
  transcript: fixture.transcript,
  transcriptSource: "manual",
  skipped: false,
}));
exam.status = "completed";

const items = await auditGrammar(exam);
const overlaps = (text: string, a: string, b: string) => {
  const as = text.indexOf(a),
    bs = text.indexOf(b);
  return as >= 0 && bs >= 0 && as < bs + b.length && bs < as + a.length;
};
let found = 0,
  repaired = 0,
  total = 0,
  wrongFlags = 0;
FIXTURES.forEach((fixture, index) => {
  const mine = items.filter((item) => item.question === index + 1);
  const applied = correctedTranscript(fixture.transcript, mine);
  console.log(`\nQ${index + 1} (${fixture.type})\n  Final: ${applied.text}`);
  for (const [anchor, accepted] of fixture.expected) {
    total++;
    const hit = mine.find(
      (item) =>
        item.kind === "error" &&
        overlaps(fixture.transcript, item.original, anchor),
    );
    if (hit) found++;
    const sentence =
      hit && sentenceContext(fixture.transcript, hit, mine)?.correctedSentence;
    const wholeWords = new RegExp(
      `\\b(?:${accepted.source})\\b`,
      accepted.flags,
    );
    const fixed =
      sentence && applied.text.includes(sentence) && wholeWords.test(sentence);
    if (fixed) repaired++;
    console.log(
      `  ${fixed ? "FIXED " : hit ? "REVIEW" : "MISSED"} ${anchor}${hit ? `  ←  "${hit.original}" → "${hit.corrected}" [${hit.concepts.join(", ")}]` : ""}`,
    );
  }
  for (const text of fixture.untouched) {
    const flagged = mine.filter((item) =>
      overlaps(fixture.transcript, item.original, text),
    );
    for (const item of flagged) {
      const sharesErrorSpan = fixture.expected.some(([anchor]) =>
        overlaps(fixture.transcript, item.original, anchor),
      );
      const wrong =
        item.kind === "error" &&
        (!sharesErrorSpan || !applied.text.includes(text));
      if (wrong) wrongFlags++;
      console.log(
        `  ${wrong ? "WRONG " : "note  "} overlaps protected text "${item.original}" → ${item.corrected} (${item.kind})`,
      );
    }
  }
  const extra = mine.filter(
    (item) =>
      !fixture.expected.some(([anchor]) =>
        overlaps(fixture.transcript, item.original, anchor),
      ) &&
      !fixture.untouched.some((text) =>
        overlaps(fixture.transcript, item.original, text),
      ),
  );
  for (const item of extra)
    console.log(
      `  extra  ${item.original} → ${item.corrected} (${item.kind}) — review by hand`,
    );
});
console.log(
  `\nLocated ${found}/${total}, reference repairs in the final answers ${repaired}/${total}, wrong error flags on protected text: ${wrongFlags}. Review other valid paraphrases by hand.`,
);
db().close();
process.exit(repaired === total && wrongFlags === 0 ? 0 : 1);
