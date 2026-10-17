import type { GeneratedProgram } from "../types";
import { ui } from "../i18n";
import type { SharedPlanBody, SharedSection } from "./types";

const phaseRank: Record<string, number> = {
  now: 0,
  during_stay: 1,
  after_discharge: 2,
};

/**
 * 各制度の「どこで相談するか」。
 * programs.json には窓口情報の項目がないため、各制度の todo / reason の
 * 内容に対応する窓口をデモ用に定義している。未知の id は MSW の連絡先にフォールバック。
 */
const programContacts: Record<string, { ja: string; en: string }> = {
  high_cost_medical: {
    ja: "病院の会計窓口",
    en: "Hospital billing counter",
  },
  sickness_allowance: {
    ja: "勤務先の人事・総務部門",
    en: "HR / general affairs at the employer",
  },
  disability_employees_pension: {
    ja: "日本年金機構の年金事務所",
    en: "Japan Pension Service office",
  },
  disability_basic_pension: {
    ja: "日本年金機構の年金事務所",
    en: "Japan Pension Service office",
  },
  ltc_insurance: {
    ja: "お住まいの市区町村の介護保険窓口",
    en: "Long-term care insurance desk of your municipality",
  },
  disability_certificate: {
    ja: "お住まいの市区町村の福祉窓口",
    en: "Welfare desk of your municipality",
  },
  disability_welfare_services: {
    ja: "お住まいの市区町村の障害福祉窓口",
    en: "Disability welfare desk of your municipality",
  },
  special_disability_allowance: {
    ja: "お住まいの市区町村の福祉窓口",
    en: "Welfare desk of your municipality",
  },
  public_assistance: {
    ja: "お住まいの地域の福祉事務所",
    en: "Local welfare office",
  },
  ltc_cost_cap: {
    ja: "お住まいの市区町村の介護保険窓口",
    en: "Long-term care insurance desk of your municipality",
  },
};

export interface SnapshotInput {
  generated: GeneratedProgram[];
  edits: Record<string, string>;
  display_name: string;
  msw_contact: string;
}

/**
 * 共有ボタンを押した時点の「ご家族向け案内」タブの内容をスナップショットとして組み立てる。
 * 日本語・英語の両方のテキストを含め、ご家族側で切り替えて表示できるようにする。
 * セクションは 今すぐ / 入院中に / 退院後 の順。todos は「今週やること」の項目に
 * now フェーズ各制度の family_action を加え、本文で重複排除する。
 */
export function buildSnapshot(input: SnapshotInput): SharedPlanBody {
  const { generated, edits } = input;
  const sorted = [...generated].sort(
    (a, b) => (phaseRank[a.program.phase] ?? 9) - (phaseRank[b.program.phase] ?? 9),
  );

  const sections: SharedSection[] = [];
  for (const g of sorted) {
    const familyTextJa = edits[`${g.program.id}:ja`] ?? g.plainJa;
    const familyTextEn = edits[`${g.program.id}:en`] ?? g.plainEn;
    const contact = programContacts[g.program.id];
    let section = sections.find((s) => s.timing === g.program.phase);
    if (!section) {
      section = { timing: g.program.phase, programs: [] };
      sections.push(section);
    }
    section.programs.push({
      id: g.program.id,
      name: g.program.nameJa,
      family_text: familyTextJa,
      family_action: g.program.todoJa ?? "",
      contact: contact?.ja ?? input.msw_contact.trim() ?? "",
      name_en: g.program.nameEn,
      family_text_en: familyTextEn,
      family_action_en: g.program.todoEn ?? "",
      contact_en: contact?.en ?? input.msw_contact.trim() ?? "",
    });
  }

  const todos: SharedPlanBody["todos"] = [];
  const seenTexts = new Set<string>();
  const addTodo = (id: string, ja: string | undefined, en: string | undefined, programId: string) => {
    const trimmed = (ja ?? "").trim();
    if (!trimmed || seenTexts.has(trimmed)) return;
    seenTexts.add(trimmed);
    todos.push({
      id,
      text: trimmed,
      program_id: programId,
      text_en: (en ?? "").trim() || undefined,
    });
  };

  // 「今週やること」リスト（今すぐ + 入院中に）— ご家族向け資料タブと同じ組み合わせ
  for (const g of sorted) {
    if (g.program.phase !== "now" && g.program.phase !== "during_stay") continue;
    addTodo(g.program.id, g.program.todoJa, g.program.todoEn, g.program.id);
  }
  // now フェーズ各制度の family_action も加える（重複はまとめる）
  for (const g of sorted) {
    if (g.program.phase !== "now") continue;
    addTodo(`now-${g.program.id}`, g.program.todoJa, g.program.todoEn, g.program.id);
  }

  const fallbackContact = input.msw_contact.trim() || "医療相談室";
  return {
    display_name: input.display_name.trim() || "ご本人",
    msw_contact: fallbackContact,
    family_summary: ui.handoutIntro.ja,
    family_summary_en: ui.handoutIntro.en,
    sections,
    todos,
  };
}
