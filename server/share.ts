import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";
import type { ServerResponse } from "node:http";
import { createShareStore } from "./store";
import { chatReply } from "./chatbot";
import type { ChatLang } from "./chatbot";
import { familyPageHtml } from "./familyPage";

const MAX_BODY_BYTES = 512 * 1024;
const TOKEN_RE = /^[\w-]{8,64}$/;

const MESSAGE_REPLACED =
  "この案内のリンクは新しくなりました。病院の相談室にお問い合わせください。";
const MESSAGE_ENDED =
  "この案内の共有は終了しました。病院の相談室にお問い合わせください。";

interface UrlSource {
  resolvedUrls: { local: string[]; network: string[] } | null;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * 家族共有機能のサーバー（デモ用・インメモリ）。
 * - /api/share* : 共有プランの作成・取得・チェック更新・質問・停止・再発行
 * - /f/:token   : ご家族向けページ（QRコードのリンク先）
 * 開発サーバー / プレビューサーバーの両方で動作する。
 */
export function sharePlugin(): Plugin {
  const store = createShareStore();
  let serverRef: UrlSource | null = null;

  const sendJson = (res: ServerResponse, status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(body));
  };

  const notFound = (
    res: ServerResponse,
    status: "not_found" | "replaced" | "revoked" | "expired",
  ) => sendJson(res, 200, { status, message: MESSAGE_ENDED });

  /** スマホから開けるURL（LAN）と、今のオリジンでのURLを返す */
  const baseUrl = (host: string | undefined) => {
    const urls = serverRef?.resolvedUrls;
    const network = urls?.network?.[0]?.replace(/\/+$/, "");
    const local =
      urls?.local?.[0]?.replace(/\/+$/, "") ??
      (host ? `http://${host}` : "http://localhost:5173");
    return { url: network ?? local, localUrl: local };
  };

  const createdResponse = (
    token: string,
    host: string | undefined,
    plan: { created_at: string; expires_at: string },
  ) => {
    const { url, localUrl } = baseUrl(host);
    return {
      token,
      url: `${url}/f/${token}`,
      local_url: `${localUrl}/f/${token}`,
      created_at: plan.created_at,
      expires_at: plan.expires_at,
    };
  };

  async function handleApi(
    req: Connect.IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: URLSearchParams,
    host: string | undefined,
  ): Promise<void> {
    const parts = pathname.split("/").filter(Boolean);
    // parts = ["api", "share", token, ...rest]
    if (parts.length === 2) {
      if (req.method !== "POST") {
        sendJson(res, 405, { message: "method not allowed" });
        return;
      }
      const body = parseJson(await readBody(req));
      try {
        const plan = store.create(body);
        sendJson(res, 200, createdResponse(plan.token, host, plan));
      } catch {
        sendJson(res, 400, { message: "invalid payload" });
      }
      return;
    }

    const token = parts[2] ?? "";
    if (!TOKEN_RE.test(token)) {
      notFound(res, "not_found");
      return;
    }
    const rest = parts.slice(3);

    // GET /api/share/:token — プラン取得（view=msw で質問を含む）
    if (rest.length === 0) {
      if (req.method !== "GET") {
        sendJson(res, 405, { message: "method not allowed" });
        return;
      }
      const found = store.resolve(token);
      if (found.status !== "ok") {
        if (found.status === "replaced") {
          sendJson(res, 200, { status: "replaced", message: MESSAGE_REPLACED });
        } else {
          notFound(res, found.status);
        }
        return;
      }
      const plan = found.plan;
      const includeQuestions = query.get("view") === "msw";
      sendJson(res, 200, {
        status: "ok",
        plan: includeQuestions ? plan : { ...plan, questions: undefined },
      });
      return;
    }

    // POST /api/share/:token/todo/:id — チェックの更新
    if (rest[0] === "todo" && rest.length === 2 && req.method === "POST") {
      const body = parseJson(await readBody(req)) as {
        done?: unknown;
        done_by?: unknown;
      } | null;
      const ok = store.setTodo(
        token,
        decodeURIComponent(rest[1]),
        body?.done === true,
        typeof body?.done_by === "string" ? body.done_by : "",
      );
      if (ok) sendJson(res, 200, { ok: true });
      else notFound(res, "not_found");
      return;
    }

    // POST /api/share/:token/question — 質問の受付
    if (rest[0] === "question" && rest.length === 1 && req.method === "POST") {
      const body = parseJson(await readBody(req)) as {
        text?: unknown;
        from?: unknown;
      } | null;
      const question = store.addQuestion(
        token,
        typeof body?.text === "string" ? body.text : "",
        typeof body?.from === "string" ? body.from : "",
      );
      if (question) sendJson(res, 200, { ok: true });
      else sendJson(res, 400, { message: "質問を入力してください" });
      return;
    }

    // PATCH /api/share/:token/question/:id — 対応済みにする
    if (rest[0] === "question" && rest.length === 2 && req.method === "PATCH") {
      const ok = store.markAnswered(token, decodeURIComponent(rest[1]));
      if (ok) sendJson(res, 200, { ok: true });
      else notFound(res, "not_found");
      return;
    }

    // POST /api/share/:token/chat — チャットボット（案内の内容からのみ回答）
    if (rest[0] === "chat" && rest.length === 1 && req.method === "POST") {
      const found = store.resolve(token);
      if (found.status !== "ok") {
        notFound(res, found.status);
        return;
      }
      const body = parseJson(await readBody(req)) as {
        text?: unknown;
        lang?: unknown;
      } | null;
      const lang: ChatLang = body?.lang === "en" ? "en" : "ja";
      const text = typeof body?.text === "string" ? body.text : "";
      sendJson(res, 200, chatReply(found.plan, text, lang));
      return;
    }

    // POST /api/share/:token/revoke — 共有の停止
    if (rest[0] === "revoke" && rest.length === 1 && req.method === "POST") {
      if (store.revoke(token)) sendJson(res, 200, { ok: true });
      else notFound(res, "not_found");
      return;
    }

    // POST /api/share/:token/reissue — リンクの作り直し
    if (rest[0] === "reissue" && rest.length === 1 && req.method === "POST") {
      const plan = store.reissue(token);
      if (plan) sendJson(res, 200, createdResponse(plan.token, host, plan));
      else notFound(res, "not_found");
      return;
    }

    sendJson(res, 404, { message: "not found" });
  }

  const install = (middlewares: Connect.Server) => {
    const handler: Connect.NextHandleFunction = (req, res, next) => {
      const raw = req.url ?? "/";
      const qIndex = raw.indexOf("?");
      const pathname = qIndex === -1 ? raw : raw.slice(0, qIndex);
      const query = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
      const host = req.headers.host;

      if (req.method === "GET" && /^\/f\/[\w-]+\/?$/.test(pathname)) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(familyPageHtml());
        return;
      }

      if (pathname === "/api/share" || pathname.startsWith("/api/share/")) {
        void handleApi(req, res, pathname, query, host).catch(() => {
          if (!res.headersSent) {
            sendJson(res, 500, { message: "internal error" });
          }
        });
        return;
      }

      next();
    };
    middlewares.use(handler);
  };

  return {
    name: "family-share-server",
    configureServer(server: ViteDevServer) {
      serverRef = server;
      install(server.middlewares);
    },
    configurePreviewServer(server: PreviewServer) {
      serverRef = server;
      install(server.middlewares);
    },
  };
}
