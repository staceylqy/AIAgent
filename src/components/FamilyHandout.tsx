import { QRCodeSVG } from "qrcode.react";
import type { GeneratedProgram, Lang, Phase } from "../types";
import { ui } from "../i18n";
import { useShare } from "../share/ShareContext";
import SharePanel from "./SharePanel";

interface Props {
  lang: Lang;
  generated: GeneratedProgram[];
  edits: Record<string, string>;
  onEdit: (key: string, value: string) => void;
}

const phaseRank: Record<Phase, number> = {
  now: 0,
  during_stay: 1,
  after_discharge: 2,
};

function formatToday(lang: Lang): string {
  const now = new Date();
  if (lang === "ja") {
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  }
  return now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FamilyHandout({ lang, generated, edits, onEdit }: Props) {
  const { info, plan } = useShare();
  const sorted = [...generated].sort(
    (a, b) => phaseRank[a.program.phase] - phaseRank[b.program.phase],
  );

  const todos = sorted
    .filter(
      (g) => g.program.phase === "now" || g.program.phase === "during_stay",
    )
    .map((g) => ({
      id: g.program.id,
      text: lang === "ja" ? g.program.todoJa : g.program.todoEn,
    }))
    .filter((t): t is { id: string; text: string } => t.text !== undefined);

  return (
    <div className="family-handout">
      {info ? (
        <div className="print-qr-box print-only" aria-hidden="true">
          <QRCodeSVG value={info.url} />
          <p className="print-qr-url">{info.url}</p>
          <p>{ui.printQrHint1[lang]}</p>
          <p>{ui.printQrHint2[lang]}</p>
        </div>
      ) : null}
      <div className="handout-header">
        <h2>{ui.handoutTitle[lang]}</h2>
        <p>{ui.handoutIntro[lang]}</p>
      </div>
      {sorted.length === 0 ? (
        <p className="placeholder">{ui.noResults[lang]}</p>
      ) : (
        sorted.map((g) => {
          const key = `${g.program.id}:${lang}`;
          const base = lang === "ja" ? g.plainJa : g.plainEn;
          const value = edits[key] ?? base;
          return (
            <section key={g.program.id} className="handout-section">
              <h3>{lang === "ja" ? g.program.nameJa : g.program.nameEn}</h3>
              <textarea
                className="handout-text no-print"
                value={value}
                rows={3}
                onChange={(e) => onEdit(key, e.target.value)}
              />
              <p className="print-only handout-text-print">{value}</p>
            </section>
          );
        })
      )}
      {todos.length > 0 ? (
        <section className="handout-section todo-section">
          <h3>{ui.todoTitle[lang]}</h3>
          <ul className="todo-list">
            {todos.map((t) => (
              <li key={t.id}>
                <label className="todo-item">
                  <input type="checkbox" className="no-print" />
                  <span className="todo-box-print print-only" aria-hidden="true" />
                  <span>{t.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {info ? (
        <div className="print-footer print-only">
          <p>
            {lang === "ja"
              ? `印刷日：${formatToday(lang)}。${ui.printFooterNote[lang]}`
              : `Printed on ${formatToday(lang)}. ${ui.printFooterNote[lang]}`}
          </p>
          {plan ? <p>{plan.msw_contact}</p> : null}
        </div>
      ) : null}
      <div className="handout-actions no-print">
        <p className="edit-hint">{ui.editHint[lang]}</p>
        <button className="primary" onClick={() => window.print()}>
          {ui.print[lang]}
        </button>
      </div>
      <SharePanel lang={lang} generated={generated} edits={edits} />
    </div>
  );
}
