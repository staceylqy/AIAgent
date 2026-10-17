import type { SharedPlan, SharedProgram } from "../src/share/types";

export type ChatLang = "ja" | "en";

export interface ChatReply {
  reply: string;
  /** ボットが答えられなかった場合に「相談室へ送る」導線を出すか */
  forwardable: boolean;
}

/**
 * 各制度を引き当てるためのキーワード。
 * プログラム名そのものに加え、ご家族が使いそうな言い換え（日本語・英語）もカバーする。
 */
const PROGRAM_KEYWORDS: Record<string, string[]> = {
  sickness_allowance: ["傷病手当金", "傷病手当", "sickness", "sick pay"],
  special_disability_allowance: ["特別障害者手当", "special disability allowance"],
  high_cost_medical: [
    "高額療養費",
    "限度額適用認定証",
    "高額療養",
    "医療費",
    "high-cost",
    "high cost",
    "medical cost",
    "medical fee",
    "out-of-pocket",
  ],
  ltc_cost_cap: ["高額介護サービス費", "高額介護", "care cost cap"],
  ltc_insurance: [
    "介護保険",
    "要介護認定",
    "要介護",
    "ケアマネ",
    "long-term care",
    "care certification",
  ],
  disability_employees_pension: ["障害厚生年金", "障害年金", "disability pension"],
  disability_basic_pension: ["障害基礎年金", "障害年金", "disability pension", "basic pension"],
  disability_certificate: [
    "身体障害者手帳",
    "障害者手帳",
    "手帳",
    "disability certificate",
  ],
  disability_welfare_services: [
    "障害福祉サービス",
    "自立訓練",
    "ホームヘルプ",
    "welfare services",
    "home help",
  ],
  public_assistance: ["生活保護", "福祉事務所", "public assistance", "welfare office"],
};

const STRINGS: Record<string, Record<ChatLang, string>> = {
  greeting: {
    ja: "こんにちは。この案内について、ご質問をお受けします。",
    en: "Hello. Ask me anything about this handout.",
  },
  thanks: {
    ja: "どういたしまして。また何かあればお尋ねください。",
    en: "You're welcome. Feel free to ask anytime.",
  },
  todosIntro: {
    ja: "残りのやることはこちらです:",
    en: "Here is what is still left to do:",
  },
  todosAllDone: {
    ja: "今週のやることはすべて完了しています。おつかれさまでした。",
    en: "All of this week's tasks are done. Well done!",
  },
  actionLabel: { ja: "やること: ", en: "What to do: " },
  contactLabel: { ja: "相談先: ", en: "Where to ask: " },
  contactIntro: {
    ja: "ご相談窓口はこちらです:",
    en: "Here is the contact for your questions:",
  },
  cantAnswer: {
    ja: "申し訳ありません。その質問には案内の内容からはお答えできません。担当の医療ソーシャルワーカーに確認することができます。",
    en: "Sorry, I could not answer that from the handout. You can forward this question to the medical social worker.",
  },
};

const t = (key: string, lang: ChatLang) => STRINGS[key][lang];

function programAnswer(program: SharedProgram, lang: ChatLang): string {
  const name = lang === "en" ? (program.name_en ?? program.name) : program.name;
  const body = lang === "en" ? (program.family_text_en ?? program.family_text) : program.family_text;
  const action = lang === "en" ? (program.family_action_en ?? program.family_action) : program.family_action;
  const contact = lang === "en" ? (program.contact_en ?? program.contact) : program.contact;
  const lines = [`【${name}】`, body];
  if (action) lines.push(t("actionLabel", lang) + action);
  if (contact) lines.push(t("contactLabel", lang) + contact);
  return lines.join("\n");
}

/**
 * 共有された案内（SharedPlan）の内容だけから答える決定式チャットボット。
 * LLMは使わないため、案内に書かれていないことは答えず「相談室へ送る」導線を返す。
 */
export function chatReply(plan: SharedPlan, rawText: string, lang: ChatLang): ChatReply {
  const text = rawText.trim().toLowerCase();

  if (!text) return { reply: t("greeting", lang), forwardable: false };
  if (/^(こんにちは|こんばんは|おはようございます?|おはよう|hi|hello|hey)[!！。.、\s]*$/.test(text)) {
    return { reply: t("greeting", lang), forwardable: false };
  }
  if (/(ありがとう|thank you|thanks)/.test(text)) {
    return { reply: t("thanks", lang), forwardable: false };
  }

  // 制度を引き当てる（セクション順 now → during_stay → after_discharge の優先度）
  for (const section of plan.sections) {
    for (const program of section.programs) {
      const keywords = PROGRAM_KEYWORDS[program.id] ?? [];
      const names = [program.name, program.name_en ?? ""].map((n) => n.toLowerCase());
      const hit =
        keywords.some((k) => text.includes(k.toLowerCase())) ||
        names.some((n) => n && text.includes(n));
      if (hit) {
        return { reply: programAnswer(program, lang), forwardable: false };
      }
    }
  }

  // やること（残り）を尋ねられている場合
  if (/(やること|チェックリスト|残り|todo|task)/.test(text)) {
    const remaining = plan.todos.filter((todo) => !todo.done);
    if (remaining.length === 0) {
      return { reply: t("todosAllDone", lang), forwardable: false };
    }
    const lines = remaining.map((todo) =>
      "・" + (lang === "en" ? (todo.text_en ?? todo.text) : todo.text),
    );
    return { reply: [t("todosIntro", lang), ...lines].join("\n"), forwardable: false };
  }

  // 相談窓口・連絡先
  if (/(連絡先|窓口|相談|連絡|だれに|誰に|どこへ|contact|consult)/.test(text)) {
    return {
      reply: [t("contactIntro", lang), plan.msw_contact].join("\n"),
      forwardable: false,
    };
  }

  // 案内から答えられない質問 → 相談室へ送る導線
  return { reply: t("cantAnswer", lang), forwardable: true };
}
