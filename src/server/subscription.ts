import * as oidc from "openid-client";
import { z } from "zod";
import { seal, unseal } from "./auth";
import {
  acquireLock,
  clearCredentials,
  getConnection,
  releaseLock,
  saveConnection,
} from "./db";
import { HttpError } from "./http";
import { oidcConfig, RESOURCE } from "./oidc";

const credentialSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  scopes: z.array(z.string()),
  expiresAt: z.number(),
});
export type Credentials = z.infer<typeof credentialSchema>;
export type AccountModel = {
  slug: string;
  display_name: string;
  visibility?: string;
};
export async function connectionState(userId: string) {
  const row = getConnection(userId);
  if (!row?.credentials)
    return {
      connected: false,
      sharing: false,
      welcomed: Boolean(row?.welcomed),
      model: row?.model || null,
    };
  try {
    const c = credentialSchema.parse(await unseal(row.credentials));
    return {
      connected: true,
      sharing: c.scopes.includes("chatgpt.tokens.use.direct"),
      welcomed: Boolean(row.welcomed),
      model: row.model,
    };
  } catch {
    return {
      connected: false,
      sharing: false,
      welcomed: Boolean(row.welcomed),
      model: row.model,
    };
  }
}
export async function accessForUser(userId: string): Promise<string> {
  const row = getConnection(userId);
  if (!row?.credentials)
    throw new HttpError(401, "ChatGPT 계정을 다시 연결해 주세요.");
  let credentials: Credentials;
  try {
    credentials = credentialSchema.parse(await unseal(row.credentials));
  } catch {
    throw new HttpError(
      401,
      "ChatGPT 연결이 만료되었습니다. 다시 연결해 주세요.",
    );
  }
  if (!credentials.scopes.includes("chatgpt.tokens.use.direct"))
    throw new HttpError(
      403,
      "본인 ChatGPT 구독 사용 권한이 필요합니다. 계정 설정에서 사용을 허용해 주세요.",
    );
  if (credentials.expiresAt > Date.now() + 60_000)
    return credentials.accessToken;
  if (!credentials.refreshToken)
    throw new HttpError(401, "ChatGPT 연결을 갱신하려면 다시 연결해 주세요.");
  const lock = `refresh:${userId}`;
  if (!acquireLock(lock))
    throw new HttpError(
      409,
      "계정 연결을 갱신하고 있습니다. 잠시 후 다시 시도해 주세요.",
    );
  try {
    const newest = getConnection(userId);
    if (!newest?.credentials)
      throw new HttpError(401, "ChatGPT 연결이 해제되었습니다.");
    credentials = credentialSchema.parse(await unseal(newest.credentials));
    if (credentials.expiresAt > Date.now() + 60_000)
      return credentials.accessToken;
    const result = await oidc.refreshTokenGrant(
      await oidcConfig(row.client_id),
      credentials.refreshToken!,
      { resource: RESOURCE },
    );
    const refreshedIdentity = result.claims();
    if (
      refreshedIdentity &&
      `${refreshedIdentity.iss}|${row.client_id}|${refreshedIdentity.sub}` !==
        row.identity
    ) {
      clearCredentials(userId);
      throw new HttpError(
        401,
        "갱신된 ChatGPT 계정이 기존 연결과 일치하지 않습니다. 다시 연결해 주세요.",
      );
    }
    const next = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token || credentials.refreshToken,
      idToken: result.id_token || credentials.idToken,
      scopes: result.scope ? result.scope.split(" ") : credentials.scopes,
      expiresAt: Date.now() + (result.expires_in || 3600) * 1000,
    };
    saveConnection(
      userId,
      row.client_id,
      row.identity,
      await seal(next, 30 * 86400),
    );
    if (!next.scopes.includes("chatgpt.tokens.use.direct"))
      throw new HttpError(403, "ChatGPT 구독 사용 권한이 해제되었습니다.");
    return next.accessToken;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const code =
      error && typeof error === "object" && "error" in error
        ? String(error.error)
        : "";
    if (
      [
        "invalid_grant",
        "invalid_refresh_token",
        "token_expired",
        "refresh_token_expired",
        "refresh_token_invalidated",
        "refresh_token_reused",
      ].includes(code)
    ) {
      clearCredentials(userId);
      throw new HttpError(
        401,
        "ChatGPT 연결이 만료되었거나 해제되었습니다. 다시 연결해 주세요.",
      );
    }
    throw new HttpError(
      503,
      "ChatGPT 연결을 갱신하지 못했습니다. 연결 정보는 유지됩니다. 잠시 후 다시 시도해 주세요.",
    );
  } finally {
    releaseLock(lock);
  }
}
export async function modelsForUser(userId: string): Promise<AccountModel[]> {
  const token = await accessForUser(userId);
  const response = await fetch(`${RESOURCE}/models`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) throw await subscriptionFailure(response);
  const body = await response.json();
  if (!Array.isArray(body.models))
    throw new HttpError(502, "ChatGPT 모델 목록을 확인할 수 없습니다.");
  return body.models.filter(
    (m: AccountModel) =>
      m.visibility === "list" &&
      typeof m.slug === "string" &&
      typeof m.display_name === "string",
  );
}
export function chooseModel(models: AccountModel[], chosen?: string | null) {
  const preferred = chosen || process.env.OPENAI_MODEL || "gpt-6-luna";
  const exact = models.find((m) => m.slug === preferred);
  if (exact) return exact;
  if (chosen)
    throw new HttpError(
      400,
      "선택한 모델을 이 ChatGPT 계정에서 사용할 수 없습니다. 모델을 다시 선택해 주세요.",
    );
  const luna = models.find((m) => /luna/i.test(m.slug));
  if (!luna)
    throw new HttpError(
      400,
      "이 계정에서 Luna 모델을 사용할 수 없습니다. 계정 설정에서 이용 가능한 모델을 선택해 주세요.",
    );
  return luna;
}
export function planError(
  code: string,
  status: number,
  requestId?: string | null,
) {
  if (code === "subscription_sharing_usage_limit_exceeded") status = 429;
  if (
    [
      "subscription_sharing_usage_unavailable",
      "subscription_sharing_user_unavailable",
    ].includes(code)
  )
    status = 503;
  if (code === "subscription_sharing_user_not_eligible") status = 403;
  if (code === "subscription_sharing_invalid_user") status = 401;
  if (code === "subscription_sharing_unsupported_capability") status = 400;
  let message =
    "ChatGPT 구독 요청을 완료하지 못했습니다. 연결과 이용 권한을 확인해 주세요.";
  if (code === "subscription_sharing_usage_limit_exceeded" || status === 429)
    message =
      "ChatGPT 구독 또는 이 앱의 사용 한도에 도달했습니다. ChatGPT 사용량 관리에서 한도를 확인해 주세요.";
  else if (code === "subscription_sharing_user_not_eligible")
    message =
      "현재 ChatGPT 계정·워크스페이스에서 구독 사용량 연동을 허용하지 않습니다.";
  else if (code === "subscription_sharing_usage_unavailable" || status === 503)
    message =
      "ChatGPT 구독 사용량을 일시적으로 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  else if (status === 401)
    message =
      "ChatGPT 연결을 확인할 수 없습니다. 계정 설정에서 다시 연결해 주세요.";
  else if (code === "subscription_sharing_unsupported_capability")
    message =
      "선택한 ChatGPT 모델이 이 평가 요청의 기능을 지원하지 않습니다. 다른 모델을 선택해 주세요.";
  const diagnostic = [code, requestId ? `요청 ${requestId}` : ""]
    .filter(Boolean)
    .join(" · ");
  return new HttpError(
    [400, 401, 403, 409, 429, 503].includes(status) ? status : 502,
    diagnostic ? `${message} (${diagnostic})` : message,
  );
}
async function subscriptionFailure(response: Response) {
  const body = await response.json().catch(() => null);
  const code = typeof body?.error?.code === "string" ? body.error.code : "";
  return planError(code, response.status, response.headers.get("x-request-id"));
}
export async function readCompletedResponse(
  response: Response,
): Promise<string> {
  if (!response.ok) throw await subscriptionFailure(response);
  if (!response.body)
    throw new HttpError(502, "ChatGPT 응답 스트림이 없습니다.");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    text = "",
    size = 0,
    completed = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 2_000_000)
        throw new HttpError(502, "평가 응답이 너무 큽니다.");
      buffer = (buffer + decoder.decode(chunk.value, { stream: true })).replace(
        /\r\n/g,
        "\n",
      );
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const raw = event
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trimStart())
          .join("\n");
        if (!raw || raw === "[DONE]") continue;
        const data = JSON.parse(raw);
        if (data.type === "response.output_text.delta")
          text += data.delta || "";
        if (data.type === "response.failed" || data.type === "error")
          throw planError(
            data.response?.error?.code ||
              data.error?.code ||
              data.code ||
              "response_failed",
            502,
            response.headers.get("x-request-id"),
          );
        if (data.type === "response.incomplete")
          throw new HttpError(
            502,
            "ChatGPT 평가가 완성되지 않았습니다. 부분 응답은 저장하지 않습니다.",
          );
        if (data.type === "response.completed") {
          if (data.response?.status && data.response.status !== "completed")
            throw new HttpError(502, "평가가 정상 완료되지 않았습니다.");
          completed = true;
          const full = (data.response?.output || [])
            .flatMap(
              (item: { content?: { type: string; text?: string }[] }) =>
                item.content || [],
            )
            .filter((part: { type: string }) => part.type === "output_text")
            .map((part: { text: string }) => part.text)
            .join("");
          if (full) text = full;
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (!completed || !text.trim())
    throw new HttpError(
      502,
      "ChatGPT 응답이 중단되었습니다. 완료된 평가만 저장합니다. 다시 시도해 주세요.",
    );
  return text;
}
export async function subscriptionResponse(
  userId: string,
  body: Record<string, unknown>,
) {
  const token = await accessForUser(userId),
    models = await modelsForUser(userId),
    model = chooseModel(models, getConnection(userId)?.model);
  const response = await fetch(`${RESOURCE}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      ...body,
      model: model.slug,
      store: false,
      stream: true,
    }),
  });
  return readCompletedResponse(response);
}
export async function disconnectUser(userId: string) {
  const row = getConnection(userId);
  if (!row?.credentials) return true;
  let confirmed = false;
  try {
    const c = credentialSchema.parse(await unseal(row.credentials));
    if (c.refreshToken) {
      const config = await oidcConfig(row.client_id);
      await oidc.tokenRevocation(config, c.refreshToken, {
        token_type_hint: "refresh_token",
      });
      confirmed = true;
    }
  } catch {
    /* Local disconnection still proceeds, and UI reports unconfirmed remote revocation. */
  }
  clearCredentials(userId);
  return confirmed;
}
