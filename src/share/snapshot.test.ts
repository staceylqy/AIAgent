import { describe, expect, it } from "vitest";
import type { GeneratedProgram, Program } from "../types";
import { ui } from "../i18n";
import { buildSnapshot } from "./snapshot";

function program(overrides: Partial<Program> & Pick<Program, "id" | "phase">): Program {
  return {
    nameJa: "制度A",
    nameEn: "Program A",
    source: { labelJa: "出典", labelEn: "Source", url: "https://example.gov" },
    conditions: {},
    reasonJa: "理由",
    reasonEn: "Reason",
    plainJa: "説明（本文）",
    plainEn: "Explanation",
    ...overrides,
  } as Program;
}

function generated(program: Program): GeneratedProgram {
  return {
    program,
    reasonJa: "理由",
    reasonEn: "Reason",
    plainJa: "説明（本文）",
    plainEn: "Explanation",
  };
}

const baseInput = {
  edits: {},
  display_name: "お父様",
  msw_contact: "医療相談室 平日9時〜17時",
};

describe("buildSnapshot", () => {
  it("groups sections in now / during_stay / after_discharge order", () => {
    const snapshot = buildSnapshot({
      ...baseInput,
      generated: [
        generated(program({ id: "after1", phase: "after_discharge" })),
        generated(program({ id: "now1", phase: "now", todoJa: "今すぐやる" })),
        generated(program({ id: "stay1", phase: "during_stay", todoJa: "入院中にやる" })),
      ],
    });
    expect(snapshot.sections.map((s) => s.timing)).toEqual([
      "now",
      "during_stay",
      "after_discharge",
    ]);
  });

  it("uses edited text for both languages", () => {
    const snapshot = buildSnapshot({
      ...baseInput,
      generated: [generated(program({ id: "p1", phase: "now" }))],
      edits: { "p1:ja": "編集済みの説明", "p1:en": "Edited explanation" },
    });
    const p = snapshot.sections[0].programs[0];
    expect(p.family_text).toBe("編集済みの説明");
    expect(p.family_text_en).toBe("Edited explanation");
  });

  it("builds todos from the week list plus now family_action, deduplicated by text", () => {
    const snapshot = buildSnapshot({
      ...baseInput,
      generated: [
        generated(
          program({ id: "now1", phase: "now", todoJa: "福祉事務所に相談する日を決める", todoEn: "Set a day to visit the welfare office" }),
        ),
        generated(
          program({ id: "stay1", phase: "during_stay", todoJa: "勤務先に連絡する", todoEn: "Contact the employer" }),
        ),
      ],
    });
    // now の todo と now の family_action は同一テキストなので 1 件にまとまる
    expect(snapshot.todos).toHaveLength(2);
    expect(snapshot.todos[0]).toMatchObject({
      text: "福祉事務所に相談する日を決める",
      text_en: "Set a day to visit the welfare office",
    });
    expect(snapshot.todos[1].text).toBe("勤務先に連絡する");
  });

  it("maps known program ids to a contact line and falls back to the MSW contact", () => {
    const snapshot = buildSnapshot({
      ...baseInput,
      generated: [
        generated(program({ id: "high_cost_medical", phase: "during_stay" })),
        generated(program({ id: "unknown_program", phase: "now" })),
      ],
    });
    const byId = new Map(
      snapshot.sections.flatMap((s) => s.programs).map((p) => [p.id, p]),
    );
    expect(byId.get("high_cost_medical")?.contact).toBe("病院の会計窓口");
    expect(byId.get("high_cost_medical")?.contact_en).toBe("Hospital billing counter");
    expect(byId.get("unknown_program")?.contact).toBe("医療相談室 平日9時〜17時");
  });

  it("copies the handout intro in both languages as family_summary", () => {
    const snapshot = buildSnapshot({
      ...baseInput,
      generated: [generated(program({ id: "p1", phase: "now" }))],
    });
    expect(snapshot.family_summary).toBe(ui.handoutIntro.ja);
    expect(snapshot.family_summary_en).toBe(ui.handoutIntro.en);
  });
});
