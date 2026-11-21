import { listExams } from "@/server/db";
import { json, requireUser, route } from "@/server/http";
import { grammarProfile } from "@/lib/grammar-profile";

export const GET = route(async () => {
  const user = await requireUser();
  return json({ profile: grammarProfile(listExams(user.id)) });
});
