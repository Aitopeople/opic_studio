import { VocaGame } from "@/components/workspace/voca-game";
import { currentUser } from "@/server/auth";

export const metadata = { title: "단어 퀴즈 · OPIc Studio" };

export default async function VocaGamePage() {
  const user = await currentUser();
  return <VocaGame key={user?.id ?? "guest"} userId={user?.id} />;
}
