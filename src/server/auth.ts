import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dataDir, findUser } from "./db";
import type { User } from "@/lib/types";

const COOKIE = "opic_session";
let devSecret: string | undefined;
export function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (
    !isLocalRuntime() &&
    process.env.NODE_ENV === "production" &&
    (!secret || secret.length < 32)
  )
    throw new Error(
      "AUTH_SECRET must contain at least 32 random characters in production.",
    );
  if (!secret && !devSecret) {
    mkdirSync(dataDir, { recursive: true });
    const path = join(dataDir, "session-key");
    if (!existsSync(path)) {
      try {
        writeFileSync(path, randomBytes(48).toString("hex"), {
          flag: "wx",
          mode: 0o600,
        });
      } catch (e) {
        if (!existsSync(path)) throw e;
      }
    }
    devSecret = readFileSync(path, "utf8");
  }
  return createHash("sha256")
    .update(secret || devSecret!)
    .digest();
}
export function isLocalRuntime() {
  const requested =
    process.env.APP_MODE === "local" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.APP_MODE !== "service");
  const url = new URL(process.env.APP_URL || "http://localhost:3000");
  return (
    requested &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.port === "3000"
  );
}
export const demoEnabled = () =>
  isLocalRuntime() && process.env.DEMO_MODE !== "false";
export const localDynamicEnabled = () =>
  isLocalRuntime() &&
  !process.env.CHATGPT_CLIENT_ID &&
  process.env.CHATGPT_LOCAL_AUTH !== "false";
export const authConfigured = () =>
  localDynamicEnabled() ||
  Boolean(
    process.env.CHATGPT_CLIENT_ID &&
    process.env.APP_URL &&
    process.env.AUTH_SECRET,
  );
export function appUrl() {
  if (
    process.env.NODE_ENV === "production" &&
    !isLocalRuntime() &&
    !process.env.APP_URL?.startsWith("https://")
  )
    throw new Error("APP_URL must be a public HTTPS origin.");
  return new URL(process.env.APP_URL || "http://localhost:3000").origin;
}
export async function seal(payload: Record<string, unknown>, seconds: number) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .setIssuer("opic-studio")
    .setAudience("opic-studio")
    .encrypt(secretKey());
}
export async function unseal(token: string) {
  return (
    await jwtDecrypt(token, secretKey(), {
      issuer: "opic-studio",
      audience: "opic-studio",
    })
  ).payload;
}
export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" && !isLocalRuntime(),
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
export async function loginSession(user: User) {
  (await cookies()).set(
    COOKIE,
    await seal({ sub: user.id }, 7 * 86400),
    cookieOptions(7 * 86400),
  );
}
export async function logoutSession() {
  (await cookies()).delete(COOKIE);
}
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const claims = await unseal(token);
    return claims.sub ? findUser(claims.sub) : null;
  } catch {
    return null;
  }
}
