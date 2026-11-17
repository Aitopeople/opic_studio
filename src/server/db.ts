import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Exam, User } from "@/lib/types";

export const dataDir = resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR || ".data",
);
let database: DatabaseSync;
export function db() {
  if (database) return database;
  mkdirSync(join(dataDir, "audio"), { recursive: true });
  database = new DatabaseSync(join(dataDir, "opic.sqlite"));
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, identity TEXT UNIQUE NOT NULL, name TEXT NOT NULL, email TEXT, demo INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created INTEGER NOT NULL, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS exams_user ON exams(user_id, created);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS locks (key TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS oauth_transactions (id TEXT PRIMARY KEY, payload TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS connections (user_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, identity TEXT NOT NULL, credentials TEXT, model TEXT, welcomed INTEGER NOT NULL DEFAULT 0);`);
  return database;
}
export function upsertUser(
  identity: string,
  name: string,
  email: string | null,
  demo = false,
): User {
  const old = db()
    .prepare("SELECT id FROM users WHERE identity = ?")
    .get(identity) as { id: string } | undefined;
  const id = old?.id || randomUUID();
  db()
    .prepare(
      "INSERT INTO users (id,identity,name,email,demo,created) VALUES (?,?,?,?,?,?) ON CONFLICT(identity) DO UPDATE SET name=excluded.name, email=excluded.email",
    )
    .run(id, identity, name.slice(0, 100), email, Number(demo), Date.now());
  return { id, name, email, demo };
}
export function findUser(id: string): User | null {
  const row = db()
    .prepare("SELECT id,name,email,demo FROM users WHERE id=?")
    .get(id) as
    | { id: string; name: string; email: string | null; demo: number }
    | undefined;
  return row ? { ...row, demo: Boolean(row.demo) } : null;
}
export function insertExam(exam: Exam) {
  db()
    .prepare("INSERT INTO exams (id,user_id,created,payload) VALUES (?,?,?,?)")
    .run(exam.id, exam.userId, exam.createdAt, JSON.stringify(exam));
}
export function getExam(
  id: string,
  userId: string,
): { exam: Exam; revision: number } | null {
  const row = db()
    .prepare("SELECT payload,revision FROM exams WHERE id=? AND user_id=?")
    .get(id, userId) as { payload: string; revision: number } | undefined;
  return row ? { exam: JSON.parse(row.payload), revision: row.revision } : null;
}
export function saveExam(exam: Exam, revision: number) {
  const result = db()
    .prepare(
      "UPDATE exams SET payload=?, revision=revision+1 WHERE id=? AND user_id=? AND revision=?",
    )
    .run(JSON.stringify(exam), exam.id, exam.userId, revision);
  return result.changes === 1;
}
export function listExams(userId: string): Exam[] {
  return (
    db()
      .prepare(
        "SELECT payload FROM exams WHERE user_id=? ORDER BY created DESC LIMIT 100",
      )
      .all(userId) as { payload: string }[]
  ).map((r) => JSON.parse(r.payload));
}
export function deleteExam(id: string, userId: string) {
  const record = getExam(id, userId);
  if (!record) return false;
  const result = db()
    .prepare("DELETE FROM exams WHERE id=? AND user_id=?")
    .run(id, userId);
  if (result.changes)
    for (const answer of record.exam.answers)
      if (answer.audio) rmSync(audioPath(answer.audio), { force: true });
  return Boolean(result.changes);
}
export function audioPath(filename: string) {
  if (!/^[a-f0-9-]+\.(webm|ogg|mp4|wav)$/.test(filename))
    throw new Error("Invalid audio identifier");
  return join(dataDir, "audio", filename);
}
export function writeAudio(filename: string, bytes: Uint8Array) {
  writeFileSync(audioPath(filename), bytes);
}
export function readAudio(filename: string) {
  return readFileSync(audioPath(filename));
}
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  db().prepare("DELETE FROM rate_limits WHERE expires < ?").run(now);
  db()
    .prepare(
      "INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
    )
    .run(key, now + windowMs);
  return (
    (
      db().prepare("SELECT count FROM rate_limits WHERE key=?").get(key) as {
        count: number;
      }
    ).count <= limit
  );
}
export function acquireLock(key: string) {
  db().prepare("DELETE FROM locks WHERE expires < ?").run(Date.now());
  return Boolean(
    db()
      .prepare("INSERT OR IGNORE INTO locks (key,expires) VALUES (?,?)")
      .run(key, Date.now() + 15 * 60_000).changes,
  );
}
export function releaseLock(key: string) {
  db().prepare("DELETE FROM locks WHERE key=?").run(key);
}
export function putTransaction(id: string, payload: string) {
  db()
    .prepare("DELETE FROM oauth_transactions WHERE expires < ?")
    .run(Date.now());
  db()
    .prepare(
      "INSERT INTO oauth_transactions (id,payload,expires) VALUES (?,?,?)",
    )
    .run(id, payload, Date.now() + 600_000);
}
export function takeTransaction(id: string) {
  return db()
    .prepare(
      "DELETE FROM oauth_transactions WHERE id=? AND expires>=? RETURNING payload",
    )
    .get(id, Date.now()) as { payload: string } | undefined;
}
export type ConnectionRow = {
  user_id: string;
  client_id: string;
  identity: string;
  credentials: string | null;
  model: string | null;
  welcomed: number;
};
export function getConnection(userId: string) {
  return db()
    .prepare("SELECT * FROM connections WHERE user_id=?")
    .get(userId) as ConnectionRow | undefined;
}
export function saveConnection(
  userId: string,
  clientId: string,
  identity: string,
  encrypted: string,
) {
  db()
    .prepare(
      "INSERT INTO connections (user_id,client_id,identity,credentials) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET client_id=excluded.client_id, identity=excluded.identity, credentials=excluded.credentials",
    )
    .run(userId, clientId, identity, encrypted);
}
export function clearCredentials(userId: string) {
  db()
    .prepare("UPDATE connections SET credentials=NULL WHERE user_id=?")
    .run(userId);
}
export function selectModel(userId: string, model: string) {
  db()
    .prepare("UPDATE connections SET model=? WHERE user_id=?")
    .run(model, userId);
}
export function welcomeConnection(userId: string) {
  db().prepare("UPDATE connections SET welcomed=1 WHERE user_id=?").run(userId);
}
