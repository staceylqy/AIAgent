/**
 * ご家族向けページ（/f/:token）のHTML。
 * 外部フォント・外部スクリプトに依存しない単一ファイル（インラインCSS/JS）で、
 * データは API (/api/share/:token) から取得する。
 * - 右上のボタンで日本語 / 英語を切り替えられる（共有された案内は両言語を含む）。
 * - 「チャットで質問する」は共有された案内の内容からのみ答えるチャットボット。
 *   答えられない質問は「相談室に送る」ボタンで担当者（MSW）へ転送できる。
 */
export function familyPageHtml(): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#14746f" />
<title>退院までの準備のご案内</title>
<style>
:root {
  --accent: #14746f;
  --accent-soft: #e3f0ef;
  --ink: #1f2933;
  --muted: #5f6b76;
  --line: #d9e0e6;
  --panel: #ffffff;
  --warn: #b9770e;
  --warn-soft: #fdf3e0;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: #eef2f4;
  color: var(--ink);
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic UI", "Meiryo", system-ui, -apple-system, sans-serif;
  font-size: 18px;
  line-height: 1.7;
}
.wrap { max-width: 640px; margin: 0 auto; padding: 20px 16px 120px; }
.loading { text-align: center; color: var(--muted); padding: 80px 0; }
.hidden { display: none !important; }
.lang-row { display: flex; justify-content: flex-end; margin-bottom: 2px; }
.lang-btn {
  font: inherit;
  font-size: 15px;
  min-height: 40px;
  padding: 4px 16px;
  border-radius: 999px;
  border: 1.5px solid var(--accent);
  background: var(--panel);
  color: var(--accent);
  cursor: pointer;
}
.lang-btn:active { opacity: .85; }
.top h1 { font-size: 24px; color: var(--accent); margin: 0 0 8px; line-height: 1.4; }
.summary { margin: 0 0 14px; }
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(31,41,51,.06);
}
.tip { background: var(--warn-soft); border: 1px solid #ead9b8; }
.tip-title { font-weight: 700; margin: 0 0 6px; }
.tip-line { margin: 2px 0; font-size: 15px; color: var(--ink); }
.tip .btn { margin-top: 10px; }
.btn {
  font: inherit;
  font-size: 17px;
  min-height: 48px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1.5px solid var(--accent);
  background: var(--panel);
  color: var(--accent);
  cursor: pointer;
}
.btn.primary { background: var(--accent); color: #fff; font-weight: 700; }
.btn.ghost { border-color: var(--line); color: var(--muted); }
.btn.small { min-height: 40px; font-size: 15px; padding: 6px 14px; }
.btn:active { opacity: .85; }
.progress-count { margin: 0 0 8px; font-weight: 700; }
.progress-track {
  height: 14px;
  background: #dde5e9;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: var(--accent);
  border-radius: 999px;
  transition: width .3s ease;
}
h2.section-title { font-size: 20px; margin: 22px 0 10px; }
.todo-list { list-style: none; margin: 0; padding: 0; }
.todo { border-bottom: 1px solid var(--line); }
.todo:last-child { border-bottom: none; }
.todo-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  min-height: 56px;
  cursor: pointer;
}
.todo-label input[type="checkbox"] {
  width: 28px;
  height: 28px;
  flex: none;
  accent-color: var(--accent);
}
.todo.done .todo-text { color: var(--muted); }
.todo-chip {
  margin-left: auto;
  flex: none;
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}
.sec { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); margin-bottom: 12px; overflow: hidden; }
.sec-summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 16px;
  min-height: 56px;
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 19px;
}
.sec-summary::-webkit-details-marker { display: none; }
.sec-summary::after { content: "＋"; margin-left: auto; color: var(--muted); font-size: 22px; }
details[open] .sec-summary::after { content: "－"; }
.sec-body { padding: 0 16px 16px; }
.sec-note {
  margin: 0 0 12px;
  font-size: 15px;
  color: var(--warn);
  background: var(--warn-soft);
  border-radius: 8px;
  padding: 10px 12px;
}
.program { border-top: 1px dashed var(--line); padding-top: 12px; margin-top: 12px; }
.program-name { font-size: 18px; margin: 0 0 6px; color: var(--accent); }
.program-text { margin: 0 0 8px; }
.program-line { margin: 4px 0; font-size: 16px; }
.line-label { color: var(--accent); }
.foot { margin-top: 24px; font-size: 15px; color: var(--muted); text-align: center; }
.foot p { margin: 6px 0; }
.linklike {
  font: inherit;
  font-size: 14px;
  background: none;
  border: none;
  color: var(--muted);
  text-decoration: underline;
  cursor: pointer;
  min-height: 44px;
  padding: 8px;
}
.bottombar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,.96);
  border-top: 1px solid var(--line);
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
}
.ask-btn {
  width: 100%;
  max-width: 608px;
  display: block;
  margin: 0 auto;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  min-height: 52px;
  border-radius: 12px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(31,41,51,.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 60;
}
.sheet {
  background: var(--panel);
  border-radius: 16px 16px 0 0;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 640px;
}
.sheet h2 { font-size: 19px; margin: 0 0 14px; }
.fld { display: block; margin-bottom: 14px; font-size: 16px; }
.fld-label { display: block; }
.fld select, .fld input, .fld textarea {
  display: block;
  width: 100%;
  margin-top: 6px;
  font: inherit;
  font-size: 18px;
  padding: 12px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: #fff;
  color: var(--ink);
}
.fld textarea { resize: vertical; }
.count { font-size: 14px; color: var(--muted); margin: -8px 0 10px; text-align: right; }
.err { color: #c0392b; font-size: 15px; margin: 0 0 10px; }
.row { display: flex; gap: 10px; }
.row .btn { flex: 1; }
/* チャット */
.chat-sheet { display: flex; flex-direction: column; max-height: 82vh; }
.chat-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 10px; }
.chat-head h2 { margin: 0; font-size: 19px; }
.chat-log {
  overflow-y: auto;
  max-height: 46vh;
  padding: 4px 2px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chat-row { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; max-width: 88%; }
.chat-row.chat-user { align-self: flex-end; align-items: flex-end; }
.bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-line;
  word-break: break-word;
}
.bubble-bot { background: #eef2f4; border: 1px solid var(--line); }
.bubble-user { background: var(--accent); color: #fff; }
.chat-forward { align-self: flex-start; }
.chat-forwarded { font-size: 14px; color: var(--accent); font-weight: 700; margin: 0; }
.chat-input-row { display: flex; gap: 8px; margin-top: 10px; align-items: flex-end; }
.chat-input-row textarea {
  flex: 1;
  font: inherit;
  font-size: 17px;
  padding: 10px 12px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  resize: none;
  background: #fff;
  color: var(--ink);
}
.chat-send { flex: none; min-width: 92px; min-height: 48px; }
.ended { text-align: center; padding: 60px 8px; }
.ended-msg { font-size: 19px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 20px 16px; }
.toast {
  position: fixed;
  left: 50%;
  bottom: 150px;
  transform: translateX(-50%);
  background: var(--ink);
  color: #fff;
  font-size: 15px;
  padding: 10px 18px;
  border-radius: 999px;
  z-index: 70;
  white-space: nowrap;
}
</style>
</head>
<body>
<div class="wrap">
  <div id="loading" class="loading">読み込み中…</div>
  <div id="ended" class="ended hidden" role="alert"></div>
  <main id="content" class="hidden">
    <div class="lang-row"><button id="lang-toggle" class="lang-btn">English</button></div>
    <header class="top">
      <h1 id="heading"></h1>
      <p id="summary" class="summary"></p>
      <div id="tip" class="card tip hidden">
        <p id="tip-title" class="tip-title">ホーム画面に追加すると、次からすぐに開けます</p>
        <p id="tip-iphone" class="tip-line">iPhone: 画面下部の共有ボタン →「ホーム画面に追加」</p>
        <p id="tip-android" class="tip-line">Android: 右上のメニュー(⋮) →「ホーム画面に追加」</p>
        <button id="tip-close" class="btn small">閉じる</button>
      </div>
      <div class="card">
        <button id="share-btn" class="btn" style="width:100%">ほかのご家族に送る</button>
      </div>
      <div class="card">
        <p id="progress-count" class="progress-count"></p>
        <div class="progress-track" role="progressbar" aria-label="progress">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
      </div>
    </header>
    <h2 id="todo-title" class="section-title">今週やること</h2>
    <div class="card" style="padding: 4px 16px;">
      <ul id="todo-list" class="todo-list"></ul>
    </div>
    <h2 id="detail-title" class="section-title">くわしい内容</h2>
    <div id="sections"></div>
    <footer class="foot">
      <p id="footer-contact"></p>
      <p id="footer-note">この内容は病院の担当者が確認したものです。わからないことは遠慮なくご相談ください。</p>
      <p><button id="reset-name" class="linklike">この端末の名前をリセット</button></p>
    </footer>
  </main>
</div>
<div id="bottombar" class="bottombar hidden">
  <button id="ask-btn" class="ask-btn">チャットで質問する</button>
</div>

<div id="identity-dialog" class="overlay hidden" role="dialog" aria-modal="true" aria-labelledby="id-title">
  <div class="sheet">
    <h2 id="id-title">どなたが完了しましたか？（任意）</h2>
    <label class="fld"><span id="id-relation-label" class="fld-label">続柄</span>
      <select id="id-relation">
        <option value="">選ばない</option>
        <option value="spouse">配偶者</option>
        <option value="child">子</option>
        <option value="sibling">きょうだい</option>
        <option value="grandchild">孫</option>
        <option value="other">その他</option>
      </select>
    </label>
    <label class="fld"><span id="id-name-label" class="fld-label">呼び名（20文字まで・任意）</span>
      <input id="id-name" type="text" maxlength="20" placeholder="例: 長男 太郎">
    </label>
    <div class="row">
      <button id="id-skip" class="btn ghost">スキップ</button>
      <button id="id-save" class="btn primary">保存する</button>
    </div>
  </div>
</div>

<div id="chat-dialog" class="overlay hidden" role="dialog" aria-modal="true" aria-labelledby="chat-title">
  <div class="sheet chat-sheet">
    <div class="chat-head">
      <h2 id="chat-title">質問チャット</h2>
      <button id="chat-close" class="btn small">閉じる</button>
    </div>
    <div id="chat-log" class="chat-log" aria-live="polite"></div>
    <div class="chat-input-row">
      <textarea id="chat-input" maxlength="200" rows="2" placeholder="例: 介護保険の認定はいつ頃できますか"></textarea>
      <button id="chat-send" class="btn primary chat-send">送信</button>
    </div>
  </div>
</div>
<div id="toast" class="toast hidden" role="status"></div>
<script>
(function () {
  "use strict";
  var match = location.pathname.match(/^\\/f\\/([^/]+)\\/?$/);
  var TOKEN = match ? decodeURIComponent(match[1]) : "";
  var LS_ID = "family-identity-v1";
  var LS_TIP = "family-tip-dismissed-v1";
  var LS_LANG = "family-lang-v1";
  var CHAT_MAX = 200;

  var I18N = {
    loading: { ja: "読み込み中…", en: "Loading…" },
    appTitle: { ja: "退院までの準備のご案内", en: "Discharge preparation guide" },
    heading: { ja: "{name}の退院までの準備", en: "Getting ready for {name}'s discharge" },
    todoTitle: { ja: "今週やること", en: "This week's tasks" },
    detailTitle: { ja: "くわしい内容", en: "Details" },
    progress: { ja: "今週やること {d} / {t} 完了", en: "This week's tasks: {d} / {t} done" },
    done: { ja: "完了", en: "Done" },
    tipTitle: { ja: "ホーム画面に追加すると、次からすぐに開けます", en: "Add to your home screen to open it quickly next time" },
    tipIphone: { ja: "iPhone: 画面下部の共有ボタン →「ホーム画面に追加」", en: "iPhone: share button at the bottom of Safari → \\"Add to Home Screen\\"" },
    tipAndroid: { ja: "Android: 右上のメニュー(⋮) →「ホーム画面に追加」", en: "Android: ⋮ menu at the top right of Chrome → \\"Add to Home screen\\"" },
    close: { ja: "閉じる", en: "Close" },
    shareBtn: { ja: "ほかのご家族に送る", en: "Share with other family members" },
    copied: { ja: "リンクをコピーしました", en: "Link copied" },
    saveFailed: { ja: "保存できませんでした。もう一度お試しください", en: "Could not save. Please try again" },
    sectionNow: { ja: "今すぐ", en: "Right now" },
    sectionDuring: { ja: "入院中に", en: "During the hospital stay" },
    sectionAfter: { ja: "退院後", en: "After discharge" },
    afterNote: { ja: "今は手続き不要です。時期が来たら病院や地域の担当者からご案内します", en: "No paperwork is needed right now. The hospital or your local coordinator will guide you when the time comes." },
    actionLabel: { ja: "やること: ", en: "What to do: " },
    contactLabel: { ja: "どこで相談する: ", en: "Where to ask: " },
    noneHere: { ja: "該当するものはありません", en: "Nothing applies here" },
    footerNote: { ja: "この内容は病院の担当者が確認したものです。わからないことは遠慮なくご相談ください。", en: "This information has been reviewed by the hospital staff. Please feel free to ask us anything." },
    resetName: { ja: "この端末の名前をリセット", en: "Reset the name saved on this device" },
    resetConfirm: { ja: "この端末に保存した名前をリセットしますか？", en: "Reset the name saved on this device?" },
    resetDone: { ja: "この端末の名前をリセットしました", en: "The name on this device has been reset" },
    chatBtn: { ja: "チャットで質問する", en: "Ask in chat" },
    chatTitle: { ja: "質問チャット", en: "Q&A chat" },
    chatOpening: { ja: "こんにちは。共有された案内について、わからないことをお尋ねください。", en: "Hello. Ask me anything about this handout." },
    chatPlaceholder: { ja: "例: 介護保険の認定はいつ頃できますか", en: "e.g. When is the care certification done?" },
    chatSend: { ja: "送信", en: "Send" },
    chatFailed: { ja: "送信できませんでした。もう一度お試しください", en: "Could not send. Please try again" },
    chatForward: { ja: "この質問を相談室に送る", en: "Forward this to the staff" },
    chatForwarded: { ja: "送信しました。担当者から連絡します", en: "Sent. Our staff will get back to you." },
    idTitle: { ja: "どなたが完了しましたか？（任意）", en: "Who completed this? (optional)" },
    idRelation: { ja: "続柄", en: "Relationship" },
    idName: { ja: "呼び名（20文字まで・任意）", en: "Name (optional, up to 20 characters)" },
    idNamePlaceholder: { ja: "例: 長男 太郎", en: "e.g. Taro" },
    idSkip: { ja: "スキップ", en: "Skip" },
    idSave: { ja: "保存する", en: "Save" },
    relSpouse: { ja: "配偶者", en: "Spouse" },
    relChild: { ja: "子", en: "Child" },
    relSibling: { ja: "きょうだい", en: "Sibling" },
    relGrandchild: { ja: "孫", en: "Grandchild" },
    relOther: { ja: "その他", en: "Other" },
    relNone: { ja: "選ばない", en: "Prefer not to say" },
    familyMember: { ja: "ご家族", en: "A family member" },
    msgReplaced: { ja: "この案内のリンクは新しくなりました。病院の相談室にお問い合わせください。", en: "This handout's link has been replaced. Please contact the hospital consultation desk." },
    msgEnded: { ja: "この案内の共有は終了しました。病院の相談室にお問い合わせください。", en: "Sharing of this handout has ended. Please contact the hospital consultation desk." },
    msgLoadError: { ja: "読み込めませんでした。ネットワークをご確認ください。", en: "Could not load. Please check your network." },
    msgBadLink: { ja: "リンクが正しくありません。病院の相談室にお問い合わせください。", en: "This link is not valid. Please contact the hospital consultation desk." }
  };
  var RELATION_KEYS = ["spouse", "child", "sibling", "grandchild", "other"];

  var plan = null;
  var lang = lsGet(LS_LANG) === "en" ? "en" : "ja";
  var identity = loadIdentity();
  var pending = {};
  var dialogOpen = false;
  var pendingTodoId = null;
  var pollTimer = null;
  var endedStatus = null;
  var chatLog = [];
  var chatSeeded = false;
  var chatBusy = false;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  function t(key) { return I18N[key][lang]; }
  /** 内容は日本語を主フィールド、英語は _en（なければ日本語） */
  function pick(ja, en) { return lang === "en" && en ? en : ja; }

  function loadIdentity() {
    var raw = lsGet(LS_ID);
    if (raw) {
      try {
        var v = JSON.parse(raw);
        if (v && typeof v === "object") {
          return { relation: String(v.relation || ""), name: String(v.name || ""), saved: true };
        }
      } catch (e) {}
    }
    return { relation: "", name: "", saved: false };
  }
  function saveIdentity() { lsSet(LS_ID, JSON.stringify({ relation: identity.relation, name: identity.name })); }
  function identityLabel() {
    if (identity.name) return lang === "ja" ? identity.name + "さん" : identity.name;
    if (identity.relation && I18N["rel" + identity.relation.charAt(0).toUpperCase() + identity.relation.slice(1)]) {
      return t("rel" + identity.relation.charAt(0).toUpperCase() + identity.relation.slice(1));
    }
    return t("familyMember");
  }

  function api(method, path, body) {
    return fetch("/api/share/" + encodeURIComponent(TOKEN) + path, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (res) { return res.json(); });
  }

  var toastTimer = null;
  function toast(msg) {
    var el2 = $("toast");
    el2.textContent = msg;
    el2.classList.remove("hidden");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el2.classList.add("hidden"); }, 2500);
  }

  /* ===== 言語切替 ===== */

  function applyStaticTexts() {
    document.documentElement.lang = lang;
    document.title = I18N.appTitle[lang];
    $("loading").textContent = t("loading");
    $("lang-toggle").textContent = lang === "ja" ? "English" : "日本語";
    $("tip-title").textContent = t("tipTitle");
    $("tip-iphone").textContent = t("tipIphone");
    $("tip-android").textContent = t("tipAndroid");
    $("tip-close").textContent = t("close");
    $("share-btn").textContent = t("shareBtn");
    $("todo-title").textContent = t("todoTitle");
    $("detail-title").textContent = t("detailTitle");
    $("footer-note").textContent = t("footerNote");
    $("reset-name").textContent = t("resetName");
    $("ask-btn").textContent = t("chatBtn");
    $("chat-title").textContent = t("chatTitle");
    $("chat-close").textContent = t("close");
    $("chat-send").textContent = t("chatSend");
    $("chat-input").placeholder = t("chatPlaceholder");
    $("id-title").textContent = t("idTitle");
    $("id-relation-label").textContent = t("idRelation");
    $("id-name-label").textContent = t("idName");
    $("id-name").placeholder = t("idNamePlaceholder");
    $("id-skip").textContent = t("idSkip");
    $("id-save").textContent = t("idSave");
    var select = $("id-relation");
    select.options[0].textContent = t("relNone");
    for (var i = 0; i < RELATION_KEYS.length; i++) {
      var key = RELATION_KEYS[i];
      select.options[i + 1].textContent = t("rel" + key.charAt(0).toUpperCase() + key.slice(1));
    }
  }

  function applyLang() {
    applyStaticTexts();
    if (endedStatus !== null) { renderEnded(); return; }
    if (!plan) return;
    renderHeader();
    renderProgress();
    renderTodos();
    renderSections();
    renderFooter();
    if (!$("chat-dialog").classList.contains("hidden")) renderChat();
  }

  $("lang-toggle").onclick = function () {
    lang = lang === "ja" ? "en" : "ja";
    lsSet(LS_LANG, lang);
    applyLang();
  };

  /* ===== 終了画面 ===== */

  function renderEnded() {
    var map = {
      replaced: "msgReplaced",
      revoked: "msgEnded",
      expired: "msgEnded",
      not_found: "msgEnded",
      load_error: "msgLoadError",
      bad_link: "msgBadLink"
    };
    var key = map[endedStatus] || "msgEnded";
    $("loading").classList.add("hidden");
    $("content").classList.add("hidden");
    $("bottombar").classList.add("hidden");
    var ended = $("ended");
    ended.classList.remove("hidden");
    ended.textContent = "";
    ended.appendChild(el("p", "ended-msg", t(key)));
    document.title = I18N.appTitle[lang];
  }

  function showEnded(status) {
    endedStatus = status;
    stopPolling();
    renderEnded();
  }

  /* ===== 描画 ===== */

  function renderAll(p) {
    plan = p;
    endedStatus = null;
    $("loading").classList.add("hidden");
    $("ended").classList.add("hidden");
    $("content").classList.remove("hidden");
    $("bottombar").classList.remove("hidden");
    document.title = I18N.appTitle[lang];
    applyStaticTexts();
    renderHeader();
    renderTip();
    renderShareBtn();
    renderTodos();
    renderProgress();
    renderSections();
    renderFooter();
  }

  function renderHeader() {
    if (!plan) return;
    $("heading").textContent = t("heading").replace("{name}", plan.display_name);
    $("summary").textContent = pick(plan.family_summary, plan.family_summary_en);
  }

  function renderTip() {
    if (lsGet(LS_TIP)) return;
    $("tip").classList.remove("hidden");
  }
  $("tip-close").onclick = function () {
    lsSet(LS_TIP, "1");
    $("tip").classList.add("hidden");
  };

  function renderShareBtn() {
    $("share-btn").onclick = function () {
      if (navigator.share) {
        navigator.share({ title: document.title, text: document.title, url: location.href }).catch(function () {});
      } else {
        copyLink();
      }
    };
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  function copyLink() {
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast(t("copied")); },
        function () { legacyCopy(url); toast(t("copied")); }
      );
    } else {
      legacyCopy(url);
      toast(t("copied"));
    }
  }

  function todosSignature(p) {
    return p.todos.map(function (x) { return x.id + ":" + (x.done ? "1" : "0"); }).join(",");
  }

  function renderTodos() {
    if (!plan) return;
    var ul = $("todo-list");
    ul.textContent = "";
    plan.todos.forEach(function (td) {
      var li = el("li", "todo" + (td.done ? " done" : ""));
      var label = el("label", "todo-label");
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = td.done;
      input.setAttribute("aria-label", pick(td.text, td.text_en));
      input.addEventListener("change", function () { onToggle(td.id, input.checked); });
      label.appendChild(input);
      label.appendChild(el("span", "todo-text", pick(td.text, td.text_en)));
      if (td.done) label.appendChild(el("span", "todo-chip", t("done")));
      li.appendChild(label);
      ul.appendChild(li);
    });
  }

  function renderProgress() {
    if (!plan) return;
    var total = plan.todos.length;
    var done = plan.todos.filter(function (x) { return x.done; }).length;
    $("progress-count").textContent = t("progress").replace("{d}", String(done)).replace("{t}", String(total));
    $("progress-fill").style.width = total ? Math.round((done / total) * 100) + "%" : "0%";
  }

  function renderSections() {
    if (!plan) return;
    var root = $("sections");
    root.textContent = "";
    var titles = { now: "sectionNow", during_stay: "sectionDuring", after_discharge: "sectionAfter" };
    plan.sections.forEach(function (sec) {
      var details = el("details", "sec");
      details.open = true;
      var summary = el("summary", "sec-summary");
      summary.appendChild(el("span", "sec-title", t(titles[sec.timing] || "sectionNow")));
      details.appendChild(summary);
      var body = el("div", "sec-body");
      if (sec.timing === "after_discharge") body.appendChild(el("p", "sec-note", t("afterNote")));
      if (sec.programs.length === 0) {
        body.appendChild(el("p", "program-line", t("noneHere")));
      }
      sec.programs.forEach(function (pr) {
        var card = el("article", "program");
        card.appendChild(el("h3", "program-name", pick(pr.name, pr.name_en)));
        if (pr.family_text) card.appendChild(el("p", "program-text", pick(pr.family_text, pr.family_text_en)));
        if (pr.family_action) {
          var act = el("p", "program-line");
          act.appendChild(el("strong", "line-label", t("actionLabel")));
          act.appendChild(document.createTextNode(pick(pr.family_action, pr.family_action_en)));
          card.appendChild(act);
        }
        if (pr.contact) {
          var con = el("p", "program-line");
          con.appendChild(el("strong", "line-label", t("contactLabel")));
          con.appendChild(document.createTextNode(pick(pr.contact, pr.contact_en)));
          card.appendChild(con);
        }
        body.appendChild(card);
      });
      details.appendChild(body);
      root.appendChild(details);
    });
  }

  function renderFooter() {
    if (!plan) return;
    $("footer-contact").textContent = plan.msw_contact;
  }

  function onToggle(id, checked) {
    if (pending[id]) { renderTodos(); return; }
    if (checked && !identity.saved) {
      pendingTodoId = id;
      openIdentityDialog();
      return;
    }
    submitToggle(id, checked, identity.saved ? identityLabel() : t("familyMember"));
  }

  function submitToggle(id, checked, by) {
    if (!plan) return;
    pending[id] = true;
    plan.todos.forEach(function (x) {
      if (x.id !== id) return;
      x.done = checked;
      x.done_by = checked ? by : "";
      x.done_at = checked ? new Date().toISOString() : null;
    });
    renderTodos();
    renderProgress();
    api("POST", "/todo/" + encodeURIComponent(id), { done: checked, done_by: by })
      .then(function () { delete pending[id]; })
      .catch(function () {
        delete pending[id];
        plan.todos.forEach(function (x) {
          if (x.id !== id) return;
          x.done = !checked;
          x.done_by = "";
          x.done_at = null;
        });
        renderTodos();
        renderProgress();
        toast(t("saveFailed"));
      });
  }

  /* ===== 完了者ダイアログ ===== */

  function openIdentityDialog() {
    dialogOpen = true;
    $("id-relation").value = identity.relation || "";
    $("id-name").value = identity.name || "";
    $("identity-dialog").classList.remove("hidden");
    $("id-name").focus();
  }
  function closeIdentityDialog() {
    dialogOpen = false;
    $("identity-dialog").classList.add("hidden");
  }
  $("id-skip").onclick = function () {
    closeIdentityDialog();
    var id = pendingTodoId;
    pendingTodoId = null;
    if (id !== null) submitToggle(id, true, t("familyMember"));
  };
  $("id-save").onclick = function () {
    identity.relation = $("id-relation").value;
    identity.name = $("id-name").value.trim().slice(0, 20);
    identity.saved = true;
    saveIdentity();
    closeIdentityDialog();
    var id = pendingTodoId;
    pendingTodoId = null;
    if (id !== null) submitToggle(id, true, identityLabel());
  };

  $("reset-name").onclick = function () {
    if (window.confirm(t("resetConfirm"))) {
      identity = { relation: "", name: "", saved: false };
      lsDel(LS_ID);
      toast(t("resetDone"));
    }
  };

  /* ===== 質問チャット ===== */

  function openChat() {
    dialogOpen = true;
    if (!chatSeeded) {
      chatLog.push({ who: "bot", text: t("chatOpening"), forwardable: false, forwarded: false, questionText: "" });
      chatSeeded = true;
    }
    $("chat-dialog").classList.remove("hidden");
    renderChat();
    $("chat-input").focus();
  }
  function closeChat() {
    dialogOpen = false;
    $("chat-dialog").classList.add("hidden");
  }
  $("ask-btn").onclick = openChat;
  $("chat-close").onclick = closeChat;

  function renderChat() {
    var log = $("chat-log");
    log.textContent = "";
    chatLog.forEach(function (m) {
      var row = el("div", "chat-row chat-" + m.who);
      row.appendChild(el("div", "bubble bubble-" + m.who, m.text));
      if (m.who === "bot" && m.forwardable && !m.forwarded && m.questionText) {
        var btn = el("button", "btn small chat-forward", t("chatForward"));
        btn.onclick = function () { forwardQuestion(m); };
        row.appendChild(btn);
      }
      if (m.who === "bot" && m.forwarded) {
        row.appendChild(el("p", "chat-forwarded", t("chatForwarded")));
      }
      log.appendChild(row);
    });
    log.scrollTop = log.scrollHeight;
  }

  function forwardQuestion(m) {
    api("POST", "/question", { text: m.questionText, from: identityLabel() })
      .then(function () {
        m.forwarded = true;
        renderChat();
      })
      .catch(function () {
        toast(t("saveFailed"));
      });
  }

  function sendChat() {
    var input = $("chat-input");
    var text = input.value.trim().slice(0, CHAT_MAX);
    if (!text || chatBusy) return;
    chatBusy = true;
    chatLog.push({ who: "user", text: text, forwardable: false, forwarded: false, questionText: "" });
    input.value = "";
    renderChat();
    api("POST", "/chat", { text: text, lang: lang })
      .then(function (res) {
        chatBusy = false;
        if (res && typeof res.reply === "string") {
          chatLog.push({
            who: "bot",
            text: res.reply,
            forwardable: !!res.forwardable,
            forwarded: false,
            questionText: res.forwardable ? text : ""
          });
        } else {
          chatLog.push({ who: "bot", text: t("chatFailed"), forwardable: false, forwarded: false, questionText: "" });
        }
        renderChat();
      })
      .catch(function () {
        chatBusy = false;
        chatLog.push({ who: "bot", text: t("chatFailed"), forwardable: false, forwarded: false, questionText: "" });
        renderChat();
      });
  }
  $("chat-send").onclick = sendChat;
  $("chat-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });

  /* ===== 取得とポーリング ===== */

  function fetchAndRender(first) {
    api("GET", "")
      .then(function (res) {
        if (res && res.status === "ok" && res.plan) {
          var prev = plan;
          if (first || !prev) {
            renderAll(res.plan);
          } else {
            plan = res.plan;
            if (dialogOpen || Object.keys(pending).length > 0) return;
            if (todosSignature(res.plan) !== todosSignature(prev)) {
              renderTodos();
              renderProgress();
            }
          }
        } else {
          showEnded((res && res.status) || "load_error");
        }
      })
      .catch(function () {
        if (first) showEnded("load_error");
      });
  }

  function startPolling() {
    pollTimer = window.setInterval(function () { fetchAndRender(false); }, 3000);
  }
  function stopPolling() {
    if (pollTimer) { window.clearInterval(pollTimer); pollTimer = null; }
  }

  if (!TOKEN) {
    showEnded("bad_link");
  } else {
    applyStaticTexts();
    fetchAndRender(true);
    startPolling();
  }
})();
</script>
</body>
</html>
`;
}
