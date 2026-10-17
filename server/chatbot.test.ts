import { describe, expect, it } from "vitest";
import type { SharedPlan } from "../src/share/types";
import { chatReply } from "./chatbot";

function makePlan(overrides: Partial<SharedPlan> = {}): SharedPlan {
  return {
    token: "test-token-123456",
    created_at: "2026-10-17T09:00:00.000Z",
    expires_at: "2026-11-16T09:00:00.000Z",
    revoked: false,
    replaced_by: null,
    display_name: "お母様",
    msw_contact: "医療相談室 田中 平日9–17時 内線1234",
    family_summary: "案内の導入文",
    sections: [
      {
        timing: "now",
        programs: [
          {
            id: "public_assistance",
            name: "生活保護",
            family_text: "生活費や医療費の支払いが難しいとき、国の制度で暮らしと医療費を支払ってもらえます。",
            family_action: "福祉事務所に相談する日を決める",
            contact: "お住まいの地域の福祉事務所",
            name_en: "Public Assistance",
            family_text_en: "Public assistance can cover living and medical costs.",
            family_action_en: "Set a day to visit the welfare office",
            contact_en: "Local welfare office",
          },
        ],
      },
    ],
    todos: [
      { id: "public_assistance", text: "福祉事務所に相談する日を決める", text_en: "Set a day to visit the welfare office", program_id: "public_assistance", done: false, done_by: "", done_at: null },
      { id: "high_cost_medical", text: "病院の会計窓口で「限度額適用認定証」の申請を確認する", text_en: "Ask the hospital billing desk", program_id: "high_cost_medical", done: true, done_by: "長男 太郎さん", done_at: "2026-10-17T09:30:00.000Z" },
    ],
    questions: [],
    ...overrides,
  };
}

describe("chatReply", () => {
  it("answers program questions from the shared plan (ja)", () => {
    const res = chatReply(makePlan(), "生活保護について教えてください", "ja");
    expect(res.forwardable).toBe(false);
    expect(res.reply).toContain("生活保護");
    expect(res.reply).toContain("福祉事務所に相談する日を決める");
    expect(res.reply).toContain("お住まいの地域の福祉事務所");
  });

  it("answers in English with the English content", () => {
    const res = chatReply(makePlan(), "tell me about public assistance", "en");
    expect(res.forwardable).toBe(false);
    expect(res.reply).toContain("Public Assistance");
    expect(res.reply).toContain("Local welfare office");
  });

  it("matches paraphrased English questions like 'medical costs'", () => {
    const plan = makePlan({
      sections: [
        {
          timing: "during_stay",
          programs: [
            {
              id: "high_cost_medical",
              name: "高額療養費制度",
              family_text: "1か月の支払いには上限があります。",
              family_action: "窓口で申請を確認する",
              contact: "病院の会計窓口",
              name_en: "High-Cost Medical Care Benefit",
              family_text_en: "There is a monthly cap on payments.",
              family_action_en: "Ask at the billing counter",
              contact_en: "Hospital billing counter",
            },
          ],
        },
      ],
    });
    const res = chatReply(plan, "What is the cap on medical costs?", "en");
    expect(res.forwardable).toBe(false);
    expect(res.reply).toContain("High-Cost Medical Care Benefit");
  });

  it("lists remaining todos and skips done ones", () => {
    const res = chatReply(makePlan(), "やることは何が残っていますか", "ja");
    expect(res.reply).toContain("福祉事務所に相談する日を決める");
    expect(res.reply).not.toContain("限度額適用認定証");
  });

  it("says all done when nothing is left", () => {
    const plan = makePlan({
      todos: makePlan().todos.map((t) => ({ ...t, done: true })),
    });
    const res = chatReply(plan, "やること", "ja");
    expect(res.reply).toContain("すべて完了");
  });

  it("returns the MSW contact line", () => {
    const res = chatReply(makePlan(), "連絡先を教えて", "ja");
    expect(res.reply).toContain("医療相談室 田中 平日9–17時 内線1234");
    expect(res.forwardable).toBe(false);
  });

  it("marks questions it cannot answer as forwardable", () => {
    const res = chatReply(makePlan(), "面会時間は何時からですか", "ja");
    expect(res.forwardable).toBe(true);
    expect(res.reply).toContain("お答えできません");
  });

  it("does not match programs that are not in the plan", () => {
    // 介護保険を含まないプランでは「介護」の質問は転送扱いになる
    const res = chatReply(makePlan(), "要介護認定はいつ申請しますか", "ja");
    expect(res.forwardable).toBe(true);
  });

  it("greets and thanks without forwarding", () => {
    expect(chatReply(makePlan(), "こんにちは", "ja").forwardable).toBe(false);
    expect(chatReply(makePlan(), "thank you!", "en").reply).toContain("welcome");
  });
});
