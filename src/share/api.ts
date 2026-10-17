import type { ShareCreated, ShareLinkResponse } from "./types";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

const tokenPath = (token: string, suffix = "") =>
  `/api/share/${encodeURIComponent(token)}${suffix}`;

export const shareApi = {
  create(body: unknown): Promise<ShareCreated> {
    return jsonFetch<ShareCreated>("/api/share", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  get(token: string, view: "family" | "msw"): Promise<ShareLinkResponse> {
    return jsonFetch<ShareLinkResponse>(
      `${tokenPath(token)}?view=${view}`,
    );
  },
  setTodo(
    token: string,
    todoId: string,
    done: boolean,
    doneBy: string,
  ): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(
      tokenPath(token, `/todo/${encodeURIComponent(todoId)}`),
      { method: "POST", body: JSON.stringify({ done, done_by: doneBy }) },
    );
  },
  askQuestion(
    token: string,
    text: string,
    from: string,
  ): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(tokenPath(token, "/question"), {
      method: "POST",
      body: JSON.stringify({ text, from }),
    });
  },
  revoke(token: string): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(tokenPath(token, "/revoke"), {
      method: "POST",
    });
  },
  reissue(token: string): Promise<ShareCreated> {
    return jsonFetch<ShareCreated>(tokenPath(token, "/reissue"), {
      method: "POST",
    });
  },
  answerQuestion(token: string, questionId: string): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(
      tokenPath(token, `/question/${encodeURIComponent(questionId)}`),
      { method: "PATCH", body: JSON.stringify({ answered: true }) },
    );
  },
};
