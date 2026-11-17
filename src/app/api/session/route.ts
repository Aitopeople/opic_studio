import {
  currentUser,
  authConfigured,
  demoEnabled,
  localDynamicEnabled,
} from "@/server/auth";
import { connectionState } from "@/server/subscription";
import { json, route } from "@/server/http";
export const runtime = "nodejs";
export const GET = route(async () => {
  const user = await currentUser(),
    connection = user ? await connectionState(user.id) : null;
  return json({
    user,
    authConfigured: authConfigured(),
    authMode: localDynamicEnabled()
      ? "local"
      : authConfigured()
        ? "partner"
        : "pending",
    demoEnabled: demoEnabled(),
    aiConfigured: Boolean(connection?.sharing),
    sharing: Boolean(connection?.sharing),
    showPlanWelcome: Boolean(connection?.sharing && !connection.welcomed),
    model: connection?.model || process.env.OPENAI_MODEL || "gpt-6-luna",
    effort: process.env.OPENAI_REASONING_EFFORT || "medium",
    transcriptionConfigured: Boolean(process.env.OPENAI_TRANSCRIBE_API_KEY),
  });
});
