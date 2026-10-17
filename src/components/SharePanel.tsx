import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ui } from "../i18n";
import type { GeneratedProgram, Lang } from "../types";
import { useShare } from "../share/ShareContext";
import { buildSnapshot } from "../share/snapshot";
import type { SharedTodo } from "../share/types";

const DEFAULT_DISPLAY_NAME = "ご本人";
const DEFAULT_CONTACT = "医療相談室 平日9時〜17時";

interface Props {
  lang: Lang;
  generated: GeneratedProgram[];
  edits: Record<string, string>;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (lang === "ja") {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (lang === "ja") {
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function doneLine(todo: SharedTodo, lang: Lang): string {
  const when = todo.done_at ? formatTime(todo.done_at, lang) : "";
  return lang === "ja"
    ? `${todo.done_by}が完了（${when}）`
    : `${todo.done_by} completed (${when})`;
}

function todoText(todo: SharedTodo, lang: Lang): string {
  return lang === "en" ? (todo.text_en ?? todo.text) : todo.text;
}

export default function SharePanel({ lang, generated, edits }: Props) {
  const { info, plan, share, reissue, revoke, markAnswered } = useShare();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [displayName, setDisplayName] = useState(DEFAULT_DISPLAY_NAME);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  const handleShare = async () => {
    setBusy(true);
    setError(null);
    try {
      await share(
        buildSnapshot({
          generated,
          edits,
          display_name: displayName,
          msw_contact: contact,
        }),
      );
      setDialogOpen(false);
    } catch {
      setError(ui.shareFailed[lang]);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!info) return;
    const ok = await copyText(info.url);
    if (!ok) return;
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const handleReissue = async () => {
    if (!window.confirm(ui.confirmReissue[lang])) return;
    setBusy(true);
    try {
      await reissue();
    } catch {
      setError(ui.shareFailed[lang]);
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm(ui.confirmRevoke[lang])) return;
    setBusy(true);
    try {
      await revoke();
    } catch {
      setError(ui.shareFailed[lang]);
    } finally {
      setBusy(false);
    }
  };

  const dialog = dialogOpen ? (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setDialogOpen(false);
      }}
    >
      <div className="dialog">
        <h3 id="share-dialog-title">{ui.shareDialogIntro[lang]}</h3>
        <label>
          {ui.displayNameLabel[lang]}
          <input
            value={displayName}
            maxLength={30}
            placeholder="例: お父様"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label>
          {ui.contactLabel[lang]}
          <input
            value={contact}
            maxLength={120}
            placeholder="医療相談室 ○○ 平日9–17時 内線1234"
            onChange={(e) => setContact(e.target.value)}
          />
        </label>
        {error ? <p className="dialog-error">{error}</p> : null}
        <div className="dialog-actions">
          <button className="btn" onClick={() => setDialogOpen(false)}>
            {ui.cancel[lang]}
          </button>
          <button className="share-start" disabled={busy} onClick={handleShare}>
            {ui.shareConfirmBtn[lang]}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!info) {
    return (
      <section className="share-panel no-print">
        <h3>{ui.sharePanelTitle[lang]}</h3>
        <p className="share-note">{ui.shareNote[lang]}</p>
        <button className="share-start" onClick={() => setDialogOpen(true)}>
          {ui.shareStart[lang]}
        </button>
        {dialog}
      </section>
    );
  }

  return (
    <section className="share-panel no-print">
      <h3>{ui.sharePanelTitle[lang]}</h3>
      <div className="share-grid">
        <div className="share-qr">
          <QRCodeSVG value={info.url} size={148} />
        </div>
        <div className="share-meta">
          <p className="share-hint">{ui.shareQrCaption[lang]}</p>
          <p className="share-url">{info.url}</p>
          <div className="share-row">
            <button className="btn" onClick={handleCopy}>
              {copied ? ui.copied[lang] : ui.copyLink[lang]}
            </button>
            <a
              className="btn btn-link"
              href={info.local_url}
              target="_blank"
              rel="noreferrer"
            >
              {ui.openWindow[lang]}
            </a>
          </div>
          <p className="share-expiry">
            {ui.expiryLabel[lang]}: {formatDate(info.expires_at, lang)}
          </p>
        </div>
      </div>
      <div className="share-row">
        <button className="btn" onClick={() => setQrOpen(true)}>
          {ui.showQr[lang]}
        </button>
        <button className="btn" onClick={() => window.print()}>
          {ui.reprint[lang]}
        </button>
        <button className="btn" disabled={busy} onClick={handleReissue}>
          {ui.reissueBtn[lang]}
        </button>
        <button className="btn btn-danger" disabled={busy} onClick={handleRevoke}>
          {ui.revokeBtn[lang]}
        </button>
      </div>
      {error ? <p className="dialog-error">{error}</p> : null}

      {plan ? (
        <div className="share-tasks">
          <h4>{ui.tasksTitle[lang]}</h4>
          <ul>
            {plan.todos.map((t) => (
              <li key={t.id} className={t.done ? "task-done" : undefined}>
                <span className={`chip ${t.done ? "chip-done" : "chip-todo"}`}>
                  {t.done ? ui.statusDone[lang] : ui.statusTodo[lang]}
                </span>
                <span className="task-text">{todoText(t, lang)}</span>
                {t.done && t.done_at ? (
                  <span className="task-meta">{doneLine(t, lang)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan ? (
        <div className="share-questions">
          <h4>{ui.questionsTitle[lang]}</h4>
          {plan.questions.length === 0 ? (
            <p className="share-empty">{ui.noQuestions[lang]}</p>
          ) : (
            <ul>
              {plan.questions.map((q) => (
                <li key={q.id}>
                  <p className="q-text">「{q.text}」</p>
                  <p className="q-meta">
                    {q.from}・{formatTime(q.created_at, lang)}
                  </p>
                  {q.answered ? (
                    <span className="chip chip-done">{ui.statusAnswered[lang]}</span>
                  ) : (
                    <button
                      className="btn btn-small"
                      onClick={() => void markAnswered(q.id)}
                    >
                      {ui.markAnswered[lang]}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {qrOpen ? (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={ui.sharePanelTitle[lang]}
          onClick={(e) => {
            if (e.target === e.currentTarget) setQrOpen(false);
          }}
        >
          <div className="dialog dialog-qr">
            <QRCodeSVG value={info.url} size={248} />
            <p className="share-url">{info.url}</p>
            <div className="dialog-actions">
              <button className="btn" onClick={() => setQrOpen(false)}>
                {ui.close[lang]}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
