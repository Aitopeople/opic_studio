import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
process.env.DATA_DIR = join(process.cwd(), "output", "tests", randomUUID());
const {
  upsertUser,
  getExam,
  insertExam,
  saveExam,
  deleteExam,
  rateLimit,
  acquireLock,
  releaseLock,
  db,
  putTransaction,
  takeTransaction,
  getConnection,
  saveConnection,
} = await import("../src/server/db");
const { newExam } = await import("../src/server/exam");
const { TOPICS } = await import("../src/lib/questions");
const config = {
  mode: "simulation" as const,
  difficulty: 4,
  count: 15 as const,
  target: "IH",
  topics: TOPICS.slice(0, 12).map((t) => t.id),
  occupation: "일 경험 없음",
  student: "아니요",
  residence: "혼자 거주",
};
test("one user's exam cannot be read, updated or deleted by another account", () => {
  const alice = upsertUser("oidc|a", "Alice", null),
    bob = upsertUser("oidc|b", "Bob", null);
  const exam = newExam(alice.id, config);
  insertExam(exam);
  assert.equal(getExam(exam.id, bob.id), null);
  assert.equal(deleteExam(exam.id, bob.id), false);
  assert.equal(saveExam({ ...exam, userId: bob.id }, 0), false);
  assert.ok(getExam(exam.id, alice.id));
});
test("optimistic revisions reject concurrent edits instead of overwriting answers", () => {
  const alice = upsertUser("oidc|a", "Alice", null),
    exam = newExam(alice.id, config);
  insertExam(exam);
  const a = getExam(exam.id, alice.id)!,
    b = getExam(exam.id, alice.id)!;
  assert.equal(saveExam(a.exam, a.revision), true);
  assert.equal(saveExam(b.exam, b.revision), false);
});
test("identity linking uses issuer and subject, not email addresses", () => {
  const a = upsertUser("issuer1|sub", "A", "same@example.com"),
    b = upsertUser("issuer2|sub", "B", "same@example.com");
  assert.notEqual(a.id, b.id);
  assert.equal(upsertUser("issuer1|sub", "Renamed", null).id, a.id);
});
test("evaluation locks and server rate limits are shared in the database", () => {
  assert.equal(acquireLock("eval"), true);
  assert.equal(acquireLock("eval"), false);
  releaseLock("eval");
  assert.equal(acquireLock("eval"), true);
  assert.equal(rateLimit("cost", 2, 3600000), true);
  assert.equal(rateLimit("cost", 2, 3600000), true);
  assert.equal(rateLimit("cost", 2, 3600000), false);
});
test.after(() => db().close());
test("OAuth transactions are consumed once and caller credential records stay separate", () => {
  putTransaction("one-time", "encrypted-transaction");
  assert.equal(takeTransaction("one-time")?.payload, "encrypted-transaction");
  assert.equal(takeTransaction("one-time"), undefined);
  saveConnection(
    "alice",
    "client-a",
    "issuer|client-a|subject-a",
    "encrypted-a",
  );
  saveConnection("bob", "client-b", "issuer|client-b|subject-b", "encrypted-b");
  assert.equal(getConnection("alice")?.credentials, "encrypted-a");
  assert.equal(getConnection("bob")?.client_id, "client-b");
  assert.equal(getConnection("unknown"), undefined);
});
