import type {
  AdlLevel,
  Diagnosis,
  Employment,
  FamilySituation,
  InsuranceType,
  Lang,
  Phase,
} from "./types";

export type Text = Record<Lang, string>;

export const ui = {
  appTitle: { ja: "脳卒中 支援制度ナビ", en: "Stroke Support Navigator" },
  tagline: {
    ja: "急性期病院の医療ソーシャルワーカー向け 支援プログラム判定ツール",
    en: "Support-program eligibility tool for acute-care hospital medical social workers",
  },
  formTitle: { ja: "患者情報の入力", en: "Patient information" },
  age: { ja: "年齢", en: "Age" },
  ageUnit: { ja: "歳", en: "y/o" },
  insurance: { ja: "医療保険", en: "Health insurance" },
  employment: { ja: "就労状況", en: "Employment" },
  diagnosis: { ja: "診断名", en: "Diagnosis" },
  family: { ja: "ご家族の状況", en: "Family situation" },
  adl: { ja: "退院時のADL見込み", en: "Expected ADL at discharge" },
  adlShort: { ja: "ADL見込み", en: "Expected ADL" },
  check: { ja: "支援を判定・生成する", en: "Check eligibility & generate" },
  formHint: {
    ja: "判定は規則表(JSON)による決定的処理です。LLMは説明文の生成のみに使用します。",
    en: "Eligibility is decided by a deterministic JSON rule table; the LLM only drafts explanations.",
  },
  placeholder: {
    ja: "患者情報を入力し、「支援を判定・生成する」を押してください。",
    en: "Enter patient information and press the button to generate results.",
  },
  tabMsw: { ja: "MSWタイムライン", en: "MSW timeline" },
  tabFamily: { ja: "ご家族向け資料", en: "Family handout" },
  patientSummary: { ja: "患者サマリー", en: "Patient summary" },
  noResults: {
    ja: "該当する支援プログラムは見つかりませんでした。",
    en: "No matching programs found.",
  },
  handoutTitle: { ja: "受けられる支援のご案内", en: "Guide to available support" },
  handoutIntro: {
    ja: "この資料は、入院から退院までに検討できる支援制度をまとめたものです。わからないことは病院の医療ソーシャルワーカーに何でもご相談ください。",
    en: "This handout summarizes the support programs to consider during the stay and after discharge. Please ask the hospital medical social worker anything you are unsure about.",
  },
  todoTitle: { ja: "今週の「やること」リスト", en: "To-do this week" },
  editHint: {
    ja: "MSW用メモ: 各説明文は確認・編集してから印刷し、ご家族にお渡しください。",
    en: "MSW note: review and edit each explanation before printing and handing it to the family.",
  },
  print: { ja: "印刷", en: "Print" },
  disclaimer: {
    ja: "本ツールは学習用デモです。判定は簡略化した規則表に基づき、実際の受給資格を保証するものではありません。申請前に必ず公式情報・担当窓口でご確認ください。",
    en: "This is a learning demo. Eligibility uses a simplified rule table and is not a guarantee; always verify with official sources before applying.",
  },
  sharePanelTitle: { ja: "家族との共有", en: "Share with family" },
  shareNote: {
    ja: "共有されるのは、ご家族向け案内の内容だけです。",
    en: "Only the content of the family handout is shared.",
  },
  shareStart: { ja: "家族と共有する", en: "Share with family" },
  shareDialogIntro: {
    ja: "共有リンクとQRコードを作成します。ご家族は日本語・英語を切り替えて見られます。",
    en: "Create a share link and QR code. The family can view it in Japanese or English.",
  },
  displayNameLabel: {
    ja: "表示名（ご家族での本人の呼び方）",
    en: "Display name (how to refer to the patient)",
  },
  contactLabel: {
    ja: "担当窓口の案内（印刷面と共有ページに載ります）",
    en: "Contact line (printed and shown on the family page)",
  },
  cancel: { ja: "キャンセル", en: "Cancel" },
  shareConfirmBtn: { ja: "共有する", en: "Share" },
  shareFailed: {
    ja: "共有できませんでした。開発サーバーが起動しているか確認してください。",
    en: "Sharing failed. Make sure the dev server is running.",
  },
  shareQrCaption: {
    ja: "スマホのカメラで読み取ると、ご家族のページが開きます。",
    en: "Scanning with a phone camera opens the family page.",
  },
  copyLink: { ja: "リンクをコピー", en: "Copy link" },
  copied: { ja: "コピーしました", en: "Copied" },
  openWindow: {
    ja: "別のウィンドウで開く（確認用）",
    en: "Open in another window (check)",
  },
  expiryLabel: { ja: "有効期限", en: "Expires" },
  showQr: { ja: "QRコードを再表示", en: "Show QR code again" },
  close: { ja: "閉じる", en: "Close" },
  reprint: { ja: "案内を再印刷", en: "Reprint handout" },
  reissueBtn: { ja: "リンクを作り直す", en: "Issue a new link" },
  revokeBtn: { ja: "共有を停止", en: "Stop sharing" },
  confirmReissue: {
    ja: "今のリンクは使えなくなります。新しいQRコードとリンクを作ります。よろしいですか？",
    en: "The current link will stop working. Issue a new QR code and link?",
  },
  confirmRevoke: {
    ja: "共有を停止すると、ご家族はこのページを見られなくなります。よろしいですか？",
    en: "Once stopped, the family can no longer open this page. Stop sharing?",
  },
  tasksTitle: { ja: "やることの状況", en: "Task status" },
  statusDone: { ja: "完了", en: "Done" },
  statusTodo: { ja: "未完了", en: "Not yet" },
  questionsTitle: { ja: "ご家族からの質問", en: "Questions from the family" },
  noQuestions: { ja: "質問はまだありません。", en: "No questions yet." },
  markAnswered: { ja: "対応済みにする", en: "Mark answered" },
  statusAnswered: { ja: "対応済み", en: "Answered" },
  printQrHint1: {
    ja: "スマホで読み取ると、最新の状況とチェックリストを見られます",
    en: "Scan with your phone to see the latest status and checklist",
  },
  printQrHint2: {
    ja: "この用紙は大切に保管してください。なくした場合は病院の相談室にお声がけください",
    en: "Keep this sheet safe. If you lose it, please ask the hospital consultation desk",
  },
  printFooterNote: {
    ja: "最新の内容はQRコードからご確認ください。",
    en: "Check the QR code for the latest information.",
  },
} satisfies Record<string, Text>;

export const insuranceLabels: Record<InsuranceType, Text> = {
  employees_health: {
    ja: "職場の健康保険(協会けんぽ・組合健保)",
    en: "Employees' health insurance",
  },
  national_health: { ja: "国民健康保険", en: "National Health Insurance" },
  elderly: {
    ja: "後期高齢者医療制度",
    en: "Elderly medical care system (75+)",
  },
};

export const employmentLabels: Record<Employment, Text> = {
  employed: { ja: "会社員・公務員", en: "Employed" },
  self_employed: { ja: "自営業", en: "Self-employed" },
  not_employed: { ja: "無職(定年退職を含む)", en: "Not employed (incl. retired)" },
};

export const diagnosisLabels: Record<Diagnosis, Text> = {
  cerebral_infarction: { ja: "脳梗塞", en: "Cerebral infarction" },
  cerebral_hemorrhage: { ja: "脳出血", en: "Cerebral hemorrhage" },
  subarachnoid_hemorrhage: {
    ja: "くも膜下出血",
    en: "Subarachnoid hemorrhage",
  },
};

export const familyLabels: Record<FamilySituation, Text> = {
  with_family: { ja: "家族と同居", en: "Living with family" },
  alone: { ja: "一人暮らし", en: "Living alone" },
};

export const adlLabels: Record<AdlLevel, Text> = {
  independent: { ja: "自立", en: "Independent" },
  support_needed: {
    ja: "部分介助(要支援〜要介護2相当)",
    en: "Partial assistance needed",
  },
  care_needed: {
    ja: "広範囲な介助(要介護3〜相当)",
    en: "Extensive assistance needed",
  },
};

export const phaseLabels: Record<Phase, Text> = {
  now: { ja: "今すぐ", en: "Now" },
  during_stay: { ja: "入院中", en: "During stay" },
  after_discharge: { ja: "退院後", en: "After discharge" },
};
