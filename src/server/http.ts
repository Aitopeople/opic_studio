import { ZodError } from "zod";
import { appUrl, currentUser, isLocalRuntime } from "./auth";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "로그인이 필요합니다.");
  return user;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  const allowedLocal =
    isLocalRuntime() &&
    localOrigins.includes(origin || "") &&
    localOrigins.includes(new URL(request.url).origin);
  if (origin !== appUrl() && !allowedLocal)
    throw new HttpError(
      403,
      "허용되지 않은 요청입니다. 앱 주소를 확인해 주세요.",
    );
}
export async function jsonBody(request: Request, limit = 64_000) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new HttpError(413, "요청이 너무 큽니다.");
  const bytes = await limitedBytes(request, limit);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "잘못된 JSON 요청입니다.");
  }
}
export async function limitedBytes(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413, "녹음 파일은 24MB 이하여야 합니다.");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function route(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError)
        return json({ error: error.message }, error.status);
      if (error instanceof ZodError)
        return json(
          {
            error: "입력 항목을 확인해 주세요.",
            details: error.issues.map((i) => ({
              path: i.path,
              message: i.message,
            })),
          },
          400,
        );
      console.error(
        "Request failed:",
        error instanceof Error ? error.name : "UnknownError",
      );
      return json(
        { error: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
        500,
      );
    }
  };
}
