import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { shareApi } from "./api";
import type { ShareCreated, SharedPlan } from "./types";

const POLL_MS = 3000;
const LS_KEY = "family-share-info-v1";

interface SeenState {
  questionIds: Set<string>;
  doneTodoIds: Set<string>;
  ready: boolean;
}

interface ShareContextValue {
  /** 現在有効な共有（null = 未共有 / 停止済み） */
  info: ShareCreated | null;
  /** 直近のポーリングで取得したプラン（ご家族のチェック状況・質問を含む） */
  plan: SharedPlan | null;
  /** 未確認の新着（新しい質問 + 新たに完了したタスク）の件数 */
  unread: number;
  share: (body: unknown) => Promise<void>;
  reissue: () => Promise<void>;
  revoke: () => Promise<void>;
  markAnswered: (questionId: string) => Promise<void>;
  markSeen: () => void;
}

const ShareContext = createContext<ShareContextValue | null>(null);

function loadStoredInfo(): ShareCreated | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as ShareCreated;
    if (value && typeof value.token === "string" && typeof value.url === "string") {
      return value;
    }
  } catch {
    // localStorage が使えない環境では無視
  }
  return null;
}

function storeInfo(info: ShareCreated | null) {
  try {
    if (info) window.localStorage.setItem(LS_KEY, JSON.stringify(info));
    else window.localStorage.removeItem(LS_KEY);
  } catch {
    // 保存できなくても動作には影響しない
  }
}

export function ShareProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<ShareCreated | null>(() => loadStoredInfo());
  const [plan, setPlan] = useState<SharedPlan | null>(null);
  const [unread, setUnread] = useState(0);
  const seenRef = useRef<SeenState>({
    questionIds: new Set(),
    doneTodoIds: new Set(),
    ready: false,
  });
  const lastJsonRef = useRef<string>("");

  const applyInfo = useCallback((next: ShareCreated | null) => {
    seenRef.current = { questionIds: new Set(), doneTodoIds: new Set(), ready: false };
    lastJsonRef.current = "";
    setPlan(null);
    setInfo(next);
    storeInfo(next);
  }, []);

  const ingest = useCallback((next: SharedPlan) => {
    const seen = seenRef.current;
    let fresh = 0;
    for (const q of next.questions) {
      if (!seen.questionIds.has(q.id)) {
        seen.questionIds.add(q.id);
        if (!q.answered && seen.ready) fresh += 1;
      }
    }
    for (const t of next.todos) {
      if (t.done && !seen.doneTodoIds.has(t.id)) {
        seen.doneTodoIds.add(t.id);
        if (seen.ready) fresh += 1;
      }
    }
    seen.ready = true;
    const json = JSON.stringify(next);
    if (json !== lastJsonRef.current) {
      lastJsonRef.current = json;
      setPlan(next);
    }
    if (fresh > 0) setUnread((count) => count + fresh);
  }, []);

  const share = useCallback(
    async (body: unknown) => {
      const created = await shareApi.create(body);
      applyInfo(created);
    },
    [applyInfo],
  );

  const reissue = useCallback(async () => {
    if (!info) return;
    const created = await shareApi.reissue(info.token);
    applyInfo(created);
  }, [info, applyInfo]);

  const revoke = useCallback(async () => {
    if (!info) return;
    await shareApi.revoke(info.token);
    applyInfo(null);
    setUnread(0);
  }, [info, applyInfo]);

  const markAnswered = useCallback(
    async (questionId: string) => {
      if (!info) return;
      await shareApi.answerQuestion(info.token, questionId);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.id === questionId ? { ...q, answered: true } : q,
              ),
            }
          : prev,
      );
    },
    [info],
  );

  const markSeen = useCallback(() => setUnread(0), []);

  // 3秒ごとにサーバーから共有状況を取得（未読バッジの検出もここで行う）
  const token = info?.token;
  useEffect(() => {
    if (!token) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await shareApi.get(token, "msw");
        if (!alive) return;
        if (res.status === "ok" && res.plan) {
          ingest(res.plan);
        } else {
          // リンクが無効化・失効・作り直しされた場合は共有パネルを初期状態へ
          applyInfo(null);
          setUnread(0);
        }
      } catch {
        // 一時的なネットワークエラーは無視して次回のポーリングに委ねる
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [token, ingest, applyInfo]);

  const value = useMemo(
    () => ({
      info,
      plan,
      unread,
      share,
      reissue,
      revoke,
      markAnswered,
      markSeen,
    }),
    [info, plan, unread, share, reissue, revoke, markAnswered, markSeen],
  );

  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
}

export function useShare(): ShareContextValue {
  const value = useContext(ShareContext);
  if (!value) throw new Error("useShare must be used within ShareProvider");
  return value;
}
