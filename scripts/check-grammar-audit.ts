// Measures how many seeded errors the real grammar audit finds, and whether it
// leaves correct speech alone. Uses the connected account's ChatGPT plan usage
// for one request, so it only calls the model when run with --yes.
// Usage: npm run grammar:check -- --yes [--user <user id>]
import { db } from "../src/server/db";
import { newExam } from "../src/server/exam";
import { auditGrammar } from "../src/server/grammar";
import type { Question, QuestionType } from "../src/lib/types";

type Fixture = {
  type: QuestionType;
  topicLabel: string;
  prompt: string;
  transcript: string;
  // Each anchor marks one seeded error; any reported span that overlaps it counts.
  expected: string[];
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
      "Okay, good question. My most exciting trip is when I go to Busan last summer with my two friend. At first, the weather is really bad, and my friend say we should go home. But we stay one more day, and finally we see a beautiful sunset. It was so funny and I get a lot of energy. Thank you.",
    expected: [
      "is when",
      "I go to Busan",
      "two friend",
      "the weather is",
      "my friend say",
      "we stay one more day",
      "we see a beautiful sunset",
      "so funny",
      "I get a lot of energy",
    ],
    untouched: ["Okay, good question.", "Thank you."],
  },
  {
    type: "opinion",
    topicLabel: "독서",
    prompt:
      "Some people say reading is valuable. What do you think, and why? Give an example.",
    transcript:
      "I think reading books make me smart. Because it give many informations. For example, I read a novel every week, and it helps me relax. So I think it makes valuable.",
    expected: [
      "reading books make",
      "it give",
      "many informations",
      "it makes valuable",
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
      "What time the concert starts",
      "where is the parking lot",
      "for student",
    ],
    untouched: ["I want to buy a ticket for the concert."],
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
  total = 0,
  wrongFlags = 0;
FIXTURES.forEach((fixture, index) => {
  const mine = items.filter((item) => item.question === index + 1);
  console.log(`\nQ${index + 1} (${fixture.type})`);
  for (const anchor of fixture.expected) {
    total++;
    const hit = mine.find((item) =>
      overlaps(fixture.transcript, item.original, anchor),
    );
    if (hit) found++;
    console.log(
      `  ${hit ? "found " : "MISSED"} ${anchor}${hit ? `  ←  "${hit.original}" → "${hit.corrected}" [${hit.concepts.join(", ")}]` : ""}`,
    );
  }
  for (const text of fixture.untouched) {
    const flagged = mine.filter((item) =>
      overlaps(fixture.transcript, item.original, text),
    );
    for (const item of flagged) {
      if (item.kind === "error") wrongFlags++;
      console.log(
        `  ${item.kind === "error" ? "WRONG " : "note  "} flagged correct text "${item.original}" → ${item.corrected} (${item.kind})`,
      );
    }
  }
  const extra = mine.filter(
    (item) =>
      !fixture.expected.some((anchor) =>
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
const recall = found / total;
console.log(
  `\nRecall ${found}/${total} (${Math.round(recall * 100)}%), wrong error flags on correct text: ${wrongFlags}`,
);
db().close();
process.exit(recall >= 0.8 && wrongFlags === 0 ? 0 : 1);
