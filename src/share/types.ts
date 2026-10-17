import type { Phase } from "../types";

/** 共有スナップショットの1つの制度（日本語は主フィールド、英語は _en） */
export interface SharedProgram {
  id: string;
  name: string;
  /** ご家族向け案内の編集済み本文（日本語） */
  family_text: string;
  /** やること（program.todoJa/En・日本語） */
  family_action: string;
  /** どこで相談するか（日本語） */
  contact: string;
  /** 英語版（なければ日本語にフォールバック） */
  name_en?: string;
  family_text_en?: string;
  family_action_en?: string;
  contact_en?: string;
}

export interface SharedSection {
  timing: Phase;
  programs: SharedProgram[];
}

export interface SharedTodoBase {
  id: string;
  /** やること（日本語） */
  text: string;
  program_id: string | null;
  /** 英語版（なければ日本語にフォールバック） */
  text_en?: string;
}

export interface SharedTodo extends SharedTodoBase {
  done: boolean;
  done_by: string;
  done_at: string | null;
}

export interface SharedQuestion {
  id: string;
  text: string;
  from: string;
  created_at: string;
  answered: boolean;
}

/** クライアントが POST /api/share に送る本文（共有時点の案内のスナップショット） */
export interface SharedPlanBody {
  display_name: string;
  msw_contact: string;
  /** 導入文（日本語） */
  family_summary: string;
  /** 導入文（英語・なければ日本語にフォールバック） */
  family_summary_en?: string;
  sections: SharedSection[];
  todos: SharedTodoBase[];
}

/** サーバーが保持する共有プラン */
export interface SharedPlan extends SharedPlanBody {
  token: string;
  created_at: string;
  expires_at: string;
  revoked: boolean;
  replaced_by: string | null;
  todos: SharedTodo[];
  questions: SharedQuestion[];
}

export type ShareLinkStatus = "ok" | "replaced" | "revoked" | "expired" | "not_found";

export interface ShareLinkResponse {
  status: ShareLinkStatus;
  message?: string;
  plan?: SharedPlan;
}

/** POST /api/share・/reissue の応答 */
export interface ShareCreated {
  token: string;
  /** スマホから開けるURL（LANアドレス）。QRコード・印刷に使う */
  url: string;
  /** 今開いているオリジンでのURL。2つ目のウィンドウ確認用 */
  local_url: string;
  created_at: string;
  expires_at: string;
}
