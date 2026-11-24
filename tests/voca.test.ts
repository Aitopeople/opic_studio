import test from "node:test";
import assert from "node:assert/strict";
import {
  answerWord,
  emptyVocaState,
  matchesWord,
  nextWord,
  spellingAnswer,
  spellingLetters,
  spellingTemplate,
  startReview,
  startStudy,
  startWordClock,
  wordSeconds,
  vocaStateSchema,
  wordKey,
} from "../src/lib/voca-quiz";
import { VOCA_BASIC_BOOKS } from "../src/lib/voca-basics";
import { dictionarySenses } from "../src/lib/voca-dictionary";
import {
  VOCA_LEVEL_BOOKS,
  VOCA_TOPIC_WORDS,
  VOCA_WORDS,
} from "../src/lib/voca-words";

test("every catalog term has distinct labelled senses, independently of its quiz clue", () => {
  for (const word of VOCA_WORDS) {
    const senses = dictionarySenses(word.english);
    assert.ok(
      senses.length &&
        senses.every(([part, meaning]) => part.trim() && meaning.trim()),
      word.english,
    );
    assert.equal(
      new Set(senses.map(([, meaning]) => meaning)).size,
      senses.length,
    );
  }
  assert.equal(dictionarySenses(" Height ").length, 3);
  assert.equal(dictionarySenses("boarding pass").length, 1);
  assert.deepEqual(dictionarySenses("a personal expression"), []);
  assert.deepEqual(dictionarySenses("constructor"), []);
});

test("topic entries pair the headword with a usage example and preserve it in saved mistakes", () => {
  for (const word of VOCA_TOPIC_WORDS) {
    assert.ok(word.example?.toLowerCase().includes(word.english), word.english);
  }
  const saved = vocaStateSchema.parse({
    ...emptyVocaState,
    missed: VOCA_TOPIC_WORDS,
  });
  assert.deepEqual(saved.missed, VOCA_TOPIC_WORDS);
});

test("spelling slots supply separators and accept alternative spellings", () => {
  const phrase = { english: "check-in desk", meaning: "탑승 수속대" };
  assert.equal(spellingLetters(phrase.english), "checkindesk");
  assert.equal(spellingLetters("don’t give up"), "dontgiveup");
  assert.equal(spellingAnswer(phrase, "CHECKINDESK"), phrase.english);
  assert.equal(
    matchesWord(phrase, spellingAnswer(phrase, "checkindesks")),
    false,
  );
  const word = {
    english: "neighborhood",
    meaning: "동네",
    alternatives: ["neighbourhood"],
  };
  assert.equal(matchesWord(word, spellingAnswer(word, "NEIGHBOURHOOD")), true);
});

test("all registered spellings fit the board and unrelated extra letters are rejected", () => {
  for (const word of VOCA_WORDS) {
    const length = spellingLetters(word.english).length;
    assert.equal(spellingTemplate(word, ""), word.english);
    assert.equal(spellingTemplate(word, "0".repeat(length + 1)), undefined);
    for (const answer of [word.english, ...(word.alternatives ?? [])]) {
      const letters = spellingLetters(answer).toUpperCase();
      for (let n = 1; n <= letters.length; n++) {
        const template = spellingTemplate(word, letters.slice(0, n));
        assert.ok(template && spellingLetters(template).length >= n, answer);
      }
      assert.ok(matchesWord(word, spellingAnswer(word, letters)), answer);
    }
  }
});

test("study sets prioritize personal expressions and cycle without duplicates", () => {
  assert.equal(
    new Set(VOCA_WORDS.map((w) => wordKey(w.english))).size,
    VOCA_WORDS.length,
  );
  const personal = {
    english: "set some money aside",
    meaning: "돈을 따로 모아 두다",
  };
  let state = startStudy(emptyVocaState, [personal, personal]);
  assert.deepEqual(state.study!.words[0], personal);
  const first = new Set(state.study!.words.map((w) => w.english));
  assert.equal(first.size, 50);
  for (let i = 0; i < 50; i++)
    state = nextWord(answerWord(state, state.study!.words[i].english));
  state = startStudy(state, [personal]);
  assert.equal(state.study!.words.length, 50);
  assert.ok(state.study!.words.every((w) => !first.has(w.english)));
  assert.equal(
    matchesWord(
      {
        english: "neighborhood",
        meaning: "동네",
        alternatives: ["neighbourhood"],
      },
      " Neighbourhood! ",
    ),
    true,
  );
});

test("learners who have seen the topic bank can draw a full round of new basic vocabulary", () => {
  const basics = VOCA_BASIC_BOOKS.flatMap((book) => book.words);
  const next = startStudy(
    {
      ...emptyVocaState,
      seen: VOCA_TOPIC_WORDS.map((w) => wordKey(w.english)),
    },
    [],
  );
  assert.equal(next.study!.words.length, 50);
  assert.equal(basics.length, 899);
  assert.ok(
    next.study!.words.every((w) => basics.some((b) => b.english === w.english)),
  );
  for (const word of basics) {
    assert.ok(
      word.meaning.trim() && word.example.toLowerCase().includes(word.english),
    );
  }
});

test("grade filters cover all 1,000 distinct catalog entries exactly once", () => {
  const headwords = VOCA_WORDS.map((word) => wordKey(word.english)).sort();
  assert.equal(headwords.length, 1000);
  assert.equal(new Set(headwords).size, headwords.length);
  assert.deepEqual(
    VOCA_LEVEL_BOOKS.flatMap((book) =>
      book.words.map((word) => wordKey(word.english)),
    ).sort(),
    headwords,
  );
  assert.equal(
    new Set(VOCA_WORDS.map((word) => word.example)).size,
    headwords.length,
  );
});

test("the 50th distinct mistake starts review and a failed review keeps one copy", () => {
  let state = startStudy(emptyVocaState, []);
  for (let i = 0; i < 50; i++) {
    const graded = answerWord(state, null);
    assert.equal(graded.missed.length, i + 1);
    assert.equal(answerWord(graded, "duplicate"), graded);
    state = nextWord(graded);
    assert.equal(!!state.review, i === 49);
  }
  assert.equal(state.review!.words.length, 50);
  assert.equal(state.study!.index, 50);
  const missedAgain = state.review!.words[0];
  state = answerWord(state, "incorrect");
  assert.equal(state.review!.response, null);
  state = nextWord(answerWord(state, null));
  for (let i = 1; i < 50; i++)
    state = nextWord(answerWord(state, state.review!.words[i].english));
  assert.deepEqual(state.missed, [missedAgain]);
  assert.equal(state.review!.correct, 49);
  state = startReview(state);
  assert.deepEqual(state.review!.words, [missedAgain]);
  state = nextWord(answerWord(state, missedAgain.english));
  assert.deepEqual(state.missed, []);
});

test("manual review below 50 preserves unfinished study across a reload", () => {
  let state = startStudy(emptyVocaState, []);
  assert.equal(startReview(state), state);
  assert.equal(answerWord(state, " "), state);
  state = nextWord(answerWord(state, "incorrect"));
  const suspended = state.study;
  state = vocaStateSchema.parse(JSON.parse(JSON.stringify(startReview(state))));
  assert.equal(state.review!.words.length, 1);
  state = nextWord(
    answerWord(state, state.review!.words[0].english.toUpperCase()),
  );
  assert.deepEqual(state.study, suspended);
  assert.equal(state.missed.length, 0);
});

test("a retry keeps the deadline and schedules the fiftieth missed word for review", () => {
  let state = startStudy(emptyVocaState, []);
  for (let i = 0; i < 49; i++) state = nextWord(answerWord(state, null));
  const word = state.study!.words[49];
  state = startWordClock(state, 1000);
  const deadline = 1000 + wordSeconds(word) * 1000;
  assert.equal(state.study!.deadline, deadline);
  state = answerWord(state, "oops", 2000);
  assert.equal(state.study!.response, null);
  assert.equal(nextWord(state), state);
  assert.equal(state.missed.length, 50);
  state = vocaStateSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.equal(startWordClock(state, 3000).study!.deadline, deadline);
  state = answerWord(state, word.english, deadline - 1);
  assert.equal(state.study!.correct, 1);
  assert.equal(state.missed.length, 50);
  assert.equal(nextWord(state).review!.words.length, 50);
});

test("the deadline wins over a late answer and each new question gets its own clock", () => {
  const original = startStudy(emptyVocaState, []);
  let state = startWordClock(original, 1000);
  const word = state.study!.words[0];
  state = answerWord(state, word.english, state.study!.deadline);
  assert.equal(state.study!.timedOut, true);
  assert.equal(state.study!.response, "");
  assert.equal(state.study!.correct, 0);
  assert.deepEqual(state.missed, [word]);
  assert.equal(answerWord(state, null), state);
  state = nextWord(state);
  assert.equal(state.study!.deadline, undefined);
  assert.equal(state.study!.lastGuess, undefined);
  assert.ok(startWordClock(state, 90000).study!.deadline! > 90000);
});
