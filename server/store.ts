import type {
  SharedPlan,
  SharedPlanBody,
  SharedProgram,
  SharedQuestion,
  SharedSection,
  SharedTodo,
} from "../src/share/types";

/** 共有リンクの有効期間（日数）。デモでは定数で変更可能にしている */
export const SHARE_TTL_DAYS = 30;

const TTL_MS = SHARE_TTL_DAYS * 24 * 60 * 60 * 1000;

const PHASES = new Set(["now", "during_stay", "after_discharge"]);

/** URL safe なランダム文字列（16文字 = 128bit 相当） */
export function generateToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

function randomId(len: number): string {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, len);
}

/** 文字列を末尾切断・制御文字除去・trim して清掃する */
function clean(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const s = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
  return s || fallback;
}

/** 任意の文字列フィールド（空なら undefined） */
function cleanOptional(value: unknown, max: number): string | undefined {
  return clean(value, max) || undefined;
}

export function sanitizeBody(input: unknown): SharedPlanBody | null {
  if (typeof input !== "object" || input === null) return null;
  const b = input as Record<string, unknown>;

  const sections: SharedSection[] = [];
  if (Array.isArray(b.sections)) {
    for (const raw of b.sections.slice(0, 3)) {
      if (typeof raw !== "object" || raw === null) continue;
      const s = raw as Record<string, unknown>;
      const timing =
        typeof s.timing === "string" && PHASES.has(s.timing)
          ? (s.timing as SharedSection["timing"])
          : null;
      if (!timing) continue;
      const programs: SharedProgram[] = [];
      if (Array.isArray(s.programs)) {
        for (const p of s.programs.slice(0, 30)) {
          if (typeof p !== "object" || p === null) continue;
          const pr = p as Record<string, unknown>;
          const id = typeof pr.id === "string" ? pr.id.slice(0, 64) : "";
          if (!id) continue;
          programs.push({
            id,
            name: clean(pr.name, 100),
            family_text: clean(pr.family_text, 2000),
            family_action: clean(pr.family_action, 500),
            contact: clean(pr.contact, 120),
            name_en: cleanOptional(pr.name_en, 100),
            family_text_en: cleanOptional(pr.family_text_en, 2000),
            family_action_en: cleanOptional(pr.family_action_en, 500),
            contact_en: cleanOptional(pr.contact_en, 120),
          });
        }
      }
      sections.push({ timing, programs });
    }
  }

  const todos: SharedPlanBody["todos"] = [];
  if (Array.isArray(b.todos)) {
    const usedIds = new Set<string>();
    for (const raw of b.todos.slice(0, 30)) {
      if (typeof raw !== "object" || raw === null) continue;
      const t = raw as Record<string, unknown>;
      const text = clean(t.text, 200);
      if (!text) continue;
      let id = typeof t.id === "string" && t.id ? t.id.slice(0, 64) : randomId(8);
      while (usedIds.has(id)) id = `${id.slice(0, 56)}-${randomId(4)}`;
      usedIds.add(id);
      todos.push({
        id,
        text,
        program_id:
          typeof t.program_id === "string" ? t.program_id.slice(0, 64) : null,
        text_en: cleanOptional(t.text_en, 200),
      });
    }
  }

  return {
    display_name: clean(b.display_name, 30, "ご本人"),
    msw_contact: clean(b.msw_contact, 120, "医療相談室"),
    family_summary: clean(b.family_summary, 1000),
    family_summary_en: cleanOptional(b.family_summary_en, 1000),
    sections,
    todos,
  };
}

export type ResolveResult =
  | { status: "not_found" | "replaced" | "revoked" | "expired" }
  | { status: "ok"; plan: SharedPlan };

export type ShareStore = ReturnType<typeof createShareStore>;

/**
 * 共有プランのインメモリストア（デモ用）。
 * `now` を差し替えることでテストから時刻を制御できる。
 */
export function createShareStore(now: () => Date = () => new Date()) {
  const plans = new Map<string, SharedPlan>();

  function create(body: unknown): SharedPlan {
    const body_ = sanitizeBody(body);
    if (!body_) throw new Error("invalid share payload");
    const token = generateToken();
    const createdAt = now();
    const plan: SharedPlan = {
      ...body_,
      token,
      created_at: createdAt.toISOString(),
      expires_at: new Date(createdAt.getTime() + TTL_MS).toISOString(),
      revoked: false,
      replaced_by: null,
      todos: body_.todos.map<SharedTodo>((t) => ({
        ...t,
        done: false,
        done_by: "",
        done_at: null,
      })),
      questions: [],
    };
    plans.set(token, plan);
    return plan;
  }

  function resolve(token: string): ResolveResult {
    const plan = plans.get(token);
    if (!plan) return { status: "not_found" };
    if (plan.revoked) {
      return { status: plan.replaced_by ? "replaced" : "revoked" };
    }
    if (now().getTime() > new Date(plan.expires_at).getTime()) {
      return { status: "expired" };
    }
    return { status: "ok", plan };
  }

  function setTodo(
    token: string,
    todoId: string,
    done: boolean,
    doneBy: string,
  ): boolean {
    const plan = plans.get(token);
    if (!plan) return false;
    const todo = plan.todos.find((t) => t.id === todoId);
    if (!todo) return false;
    todo.done = done;
    todo.done_by = done ? clean(doneBy, 40, "ご家族") : "";
    todo.done_at = done ? now().toISOString() : null;
    return true;
  }

  function addQuestion(
    token: string,
    text: string,
    from: string,
  ): SharedQuestion | null {
    const plan = plans.get(token);
    if (!plan) return null;
    const cleanText = clean(text, 200);
    if (!cleanText) return null;
    const question: SharedQuestion = {
      id: `q-${randomId(8)}`,
      text: cleanText,
      from: clean(from, 40, "ご家族"),
      created_at: now().toISOString(),
      answered: false,
    };
    plan.questions.push(question);
    return question;
  }

  function markAnswered(token: string, questionId: string): boolean {
    const plan = plans.get(token);
    if (!plan) return false;
    const question = plan.questions.find((q) => q.id === questionId);
    if (!question) return false;
    question.answered = true;
    return true;
  }

  function revoke(token: string): boolean {
    const plan = plans.get(token);
    if (!plan) return false;
    plan.revoked = true;
    return true;
  }

  /** 現在のリンクを無効化し、todos と questions を引き継いだ新しいリンクを発行する */
  function reissue(token: string): SharedPlan | null {
    const old = plans.get(token);
    if (!old || old.revoked) return null;
    // プランは JSON のみで構成されるため、JSON 複製でディープコピーする
    const next = JSON.parse(JSON.stringify(old)) as SharedPlan;
    next.token = generateToken();
    const createdAt = now();
    next.created_at = createdAt.toISOString();
    next.expires_at = new Date(createdAt.getTime() + TTL_MS).toISOString();
    next.revoked = false;
    next.replaced_by = null;
    old.revoked = true;
    old.replaced_by = next.token;
    plans.set(next.token, next);
    return next;
  }

  return {
    create,
    resolve,
    setTodo,
    addQuestion,
    markAnswered,
    revoke,
    reissue,
    size: () => plans.size,
  };
}
