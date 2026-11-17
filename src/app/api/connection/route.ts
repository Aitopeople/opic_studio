import { z } from "zod";
import {
  connectionState,
  modelsForUser,
  chooseModel,
  disconnectUser,
} from "@/server/subscription";
import { getConnection, selectModel, welcomeConnection } from "@/server/db";
import {
  checkOrigin,
  HttpError,
  json,
  jsonBody,
  requireUser,
  route,
} from "@/server/http";
export const GET = route(async () => {
  const user = await requireUser(),
    state = await connectionState(user.id);
  if (!state.sharing) return json({ ...state, models: [], selected: null });
  const models = await modelsForUser(user.id);
  let selected = null;
  try {
    selected = chooseModel(models, getConnection(user.id)?.model).slug;
  } catch {}
  return json({ ...state, models, selected });
});
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await requireUser();
  const body = z
    .discriminatedUnion("action", [
      z.object({
        action: z.literal("model"),
        model: z.string().min(1).max(100),
      }),
      z.object({ action: z.literal("welcome") }),
      z.object({ action: z.literal("disconnect") }),
    ])
    .parse(await jsonBody(request));
  if (body.action === "model") {
    const models = await modelsForUser(user.id);
    if (!models.some((m) => m.slug === body.model))
      throw new HttpError(400, "이 계정에서 사용할 수 없는 모델입니다.");
    selectModel(user.id, body.model);
  }
  if (body.action === "welcome") welcomeConnection(user.id);
  if (body.action === "disconnect")
    return json({ ok: true, revoked: await disconnectUser(user.id) });
  return json({ ok: true });
});
