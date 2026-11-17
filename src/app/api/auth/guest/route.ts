import { randomUUID } from "node:crypto";
import { demoEnabled, currentUser, loginSession } from "@/server/auth";
import { checkOrigin, HttpError, json, route } from "@/server/http";
import { upsertUser, rateLimit } from "@/server/db";
export const POST = route(async (request) => {
  checkOrigin(request);
  if (!demoEnabled())
    throw new HttpError(404, "배포 환경에서는 체험 계정을 제공하지 않습니다.");
  const old = await currentUser();
  if (old) return json({ user: old });
  if (!rateLimit("guest", 30, 3600_000))
    throw new HttpError(429, "잠시 후 다시 시도해 주세요.");
  const user = upsertUser(`guest:${randomUUID()}`, "체험 수험생", null, true);
  await loginSession(user);
  return json({ user });
});
