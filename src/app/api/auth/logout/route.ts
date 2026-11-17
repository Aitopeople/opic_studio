import { currentUser, logoutSession } from "@/server/auth";
import { disconnectUser } from "@/server/subscription";
import { checkOrigin, json, route } from "@/server/http";
export const POST = route(async (request) => {
  checkOrigin(request);
  const user = await currentUser();
  const revoked = user ? await disconnectUser(user.id) : true;
  await logoutSession();
  return json({ ok: true, revoked });
});
