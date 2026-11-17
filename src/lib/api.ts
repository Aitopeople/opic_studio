export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body && typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...options?.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.error ||
        "서버에 연결하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.",
    );
  return body;
}
export function answerForm(
  clip: Blob,
  index: number,
  duration: number,
  transcript: string,
) {
  const form = new FormData();
  form.set("audio", clip, "answer");
  form.set("index", String(index));
  form.set("duration", String(duration));
  form.set("transcript", transcript);
  return form;
}
