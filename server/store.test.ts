import { describe, expect, it } from "vitest";
import { createShareStore, SHARE_TTL_DAYS } from "./store";

function makeStore() {
  let current = new Date("2026-10-17T09:00:00.000Z");
  return {
    store: createShareStore(() => current),
    advanceDays: (days: number) => {
      current = new Date(current.getTime() + days * 24 * 60 * 60 * 1000);
    },
  };
}

const payload = {
  display_name: "お父様",
  msw_contact: "医療相談室 ○○ 平日9–17時 内線1234",
  family_summary: "案内の導入文",
  sections: [
    {
      timing: "now",
      programs: [
        {
          id: "public_assistance",
          name: "生活保護",
          family_text: "説明文",
          family_action: "福祉事務所に相談する日を決める",
          contact: "福祉事務所",
        },
      ],
    },
  ],
  todos: [{ id: "public_assistance", text: "福祉事務所に相談する日を決める", program_id: "public_assistance" }],
};

describe("share store", () => {
  it("creates a plan with a token and a 30-day expiry", () => {
    const { store } = makeStore();
    const plan = store.create(payload);
    expect(plan.token).toHaveLength(16);
    expect(plan.token).toMatch(/^[\w-]+$/);
    expect(plan.revoked).toBe(false);
    expect(plan.todos[0]).toMatchObject({ done: false, done_by: "", done_at: null });
    const expiry = new Date(plan.expires_at).getTime();
    const created = new Date(plan.created_at).getTime();
    expect(expiry - created).toBe(SHARE_TTL_DAYS * 24 * 60 * 60 * 1000);
    expect(store.resolve(plan.token).status).toBe("ok");
  });

  it("marks the link expired after 30 days", () => {
    const { store, advanceDays } = makeStore();
    const plan = store.create(payload);
    advanceDays(SHARE_TTL_DAYS + 1);
    expect(store.resolve(plan.token).status).toBe("expired");
  });

  it("records who completed a todo with a default name", () => {
    const { store } = makeStore();
    const plan = store.create(payload);
    expect(store.setTodo(plan.token, "public_assistance", true, "長男 太郎さん")).toBe(true);
    const todo = store.resolve(plan.token).status === "ok"
      ? store.resolve(plan.token).plan.todos[0]
      : undefined;
    expect(todo?.done).toBe(true);
    expect(todo?.done_by).toBe("長男 太郎さん");
    expect(todo?.done_at).toBeTruthy();

    expect(store.setTodo(plan.token, "public_assistance", true, "")).toBe(true);
    const again = store.resolve(plan.token).status === "ok"
      ? store.resolve(plan.token).plan.todos[0]
      : undefined;
    expect(again?.done_by).toBe("ご家族");

    // unchecking clears who/when
    expect(store.setTodo(plan.token, "public_assistance", false, "")).toBe(true);
    const cleared = store.resolve(plan.token).status === "ok"
      ? store.resolve(plan.token).plan.todos[0]
      : undefined;
    expect(cleared).toMatchObject({ done: false, done_by: "", done_at: null });
  });

  it("accepts questions up to 200 chars and rejects empty ones", () => {
    const { store } = makeStore();
    const plan = store.create(payload);
    expect(store.addQuestion(plan.token, "", "長男 太郎さん")).toBeNull();
    expect(store.addQuestion(plan.token, "a".repeat(250), "長男 太郎さん")?.text).toHaveLength(200);
    expect(store.addQuestion(plan.token, "退院はいつですか", "")?.from).toBe("ご家族");
    expect(store.resolve(plan.token).status === "ok"
      ? store.resolve(plan.token).plan.questions
      : []
    ).toHaveLength(2);
  });

  it("revokes and reports replaced links after a reissue, copying todos and questions", () => {
    const { store } = makeStore();
    const old = store.create(payload);
    store.setTodo(old.token, "public_assistance", true, "長男 太郎さん");
    store.addQuestion(old.token, "退院はいつですか", "長男 太郎さん");

    const next = store.reissue(old.token);
    expect(next).not.toBeNull();
    expect(next!.token).not.toBe(old.token);

    expect(store.resolve(old.token)).toMatchObject({ status: "replaced" });
    const resolved = store.resolve(next!.token);
    expect(resolved.status).toBe("ok");
    if (resolved.status !== "ok") return;
    expect(resolved.plan.todos[0]).toMatchObject({ done: true, done_by: "長男 太郎さん" });
    expect(resolved.plan.questions).toHaveLength(1);
    expect(resolved.plan.display_name).toBe("お父様");
  });

  it("a revoked link without replacement shows the ended state", () => {
    const { store } = makeStore();
    const plan = store.create(payload);
    expect(store.revoke(plan.token)).toBe(true);
    expect(store.resolve(plan.token).status).toBe("revoked");
    expect(store.reissue(plan.token)).toBeNull();
  });

  it("sanitizes missing or invalid fields", () => {
    const { store } = makeStore();
    const plan = store.create({ todos: "not-an-array", display_name: "  " });
    expect(plan.display_name).toBe("ご本人");
    expect(plan.msw_contact).toBe("医療相談室");
    expect(plan.todos).toHaveLength(0);
    expect(plan.sections).toHaveLength(0);
  });
});
