// docs/data.js (結合後) を検証する(ハンズオン形式)。
// 使い方: node tools/validate-data.mjs [path/to/data.js] [--partial] [--strict]
//   --partial: data.js に含まれる章だけを計画(PLAN)と照合する(作業途中の確認用)。欠けている章は通常エラー。
//   --strict : 警告(html 簡易チェック)もエラー扱いにする。
// 終了コード: 0=OK / 1=エラーあり / 2=読み込み失敗
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(here, '..', 'docs', 'data.js');

// 計画: [章no, タイトル, [レッスンタイトル...]]。章・レッスンの id とタイトルは変更禁止。ページ構成は自由。
const PLAN = [
  [1, "全体像", [
    "Keycloak とは・登場人物",
    "Keycloak の中身 (Realm〜Session)",
  ]],
  [2, "主要エンドポイント(OIDC)", [
    "Discovery と認可・トークン・userinfo・jwks・introspection",
    "logout・device・revoke・issuer・呼び出し元整理・注意",
  ]],
  [3, "トークンと Claim", [
    "Claim とは・トークン種類・JWT構造",
    "payload 例と標準 Claim",
    "Keycloak 独自 Claim・読み方",
  ]],
  [4, "Client Scope と Mapper", [
    "3部品の関係・Client Scope・Default/Optional",
    "標準 Client Scope・Dedicated",
    "Mapper とは・種類",
    "Mapper 設定項目・具体例・Full Scope Allowed・Lightweight",
  ]],
  [5, "Client 設定", [
    "基本項目・Capability config",
    "Access・Login・Logout settings",
    "Credentials・各タブ・Token 寿命",
  ]],
  [6, "Client authentication ON / OFF", [
    "要点・比較表・token リクエストの差",
    "切替の影響・エラー・選び方",
  ]],
  [7, "フローの前提: アプリ種別・state・nonce・PKCE", [
    "3つのアプリ(SPA・Web・API)の違い",
    "用語整理と state",
    "nonce",
    "PKCE",
  ]],
  [8, "トークンの書式と Authorization Code Flow", [
    "JWT / JWS / JWE",
    "kid と JWKS",
    "Bearer token と Introspection",
    "1回のログインから API 呼び出しまで",
    "Authorization Code Flow (+PKCE) の手順",
    "Authorization Code Flow のシーケンス図",
  ]],
  [9, "その他のフロー", [
    "Client Credentials Flow",
    "Refresh Token Flow",
    "Password Grant (非推奨) と Device Grant",
    "Token Exchange と Logout",
    "SAML SSO と Identity Brokering",
  ]],
  [10, "API 側でのトークン検証", [
    "JWT のローカル検証",
    "Introspection・Userinfo・比較・実装例",
  ]],
  [11, "ユーザー・ロール・グループ", [
    "User と Role",
    "Group・Service Account・Required Actions・Organizations・ロール設計指針",
  ]],
  [12, "認証フロー(Authentication Flows)", [
    "Flow の構成要素・標準フロー・Execution",
    "認証強化機能・設定例",
  ]],
  [13, "User Federation(LDAP / AD)", [
    "User Federation とは・用語・主な設定項目",
    "LDAP Mapper・Kerberos・Brokering との違い",
  ]],
  [14, "セキュリティ・運用", [
    "本番で守ること(理由つき)",
    "鍵管理・監視・構成・設定優先順位・テーマ/SPI",
  ]],
  [15, "Admin REST API", [
    "概要・トークンの取り方・必要ロール",
    "主な API・自動化手段",
  ]],
  [16, "手を動かす(ハンズオン)", [
    "ゴールと準備・Step 0〜3",
    "Step 4 Authorization Code Flow を手動実行",
    "Step 5〜7 トークンを読む・Evaluate・Userinfo",
    "Step 8〜10 Confidential client・Client Credentials",
    "Step 11〜12 Client Role と Mapper",
    "Step 13〜15 Refresh・Logout・API 検証・便利機能",
  ]],
  [17, "トラブルシューティング・用語集・学習リソース", [
    "エラー早見表",
    "API側で401・claim が出ない",
    "用語集",
    "学習リソース",
  ]],
]; 
export const PLAN_BY_NO = new Map(PLAN.map(([no, title, lessons]) => [no, { title, lessons }]));

// ページ規則(kuber-taizen と同じ構造):
//   <p class="goal">やりたいこと: …</p> の後に <div class="step"> を1つ以上。
//   各 step は <h4>手順 N　題</h4>(N は 1 から連番、N と題の間は全角スペース)で始まり、
//   操作(p / pre / ul など)、任意で <div class="check"><b>確認</b><pre class="out">…</pre></div> と
//   <div class="read"><b>読み方</b><p>|<ul>…</div> を(この順に、各1つまで)置く。read は check があるときだけ置ける。
export const GOAL_PREFIX = 'やりたいこと: ';
const STEP_RE = /^手順 (\d+)\u3000\S/;
const ALLOWED_CLASSES = new Set(['goal', 'step', 'check', 'read', 'out', 'key', 'trap']);

const ALLOWED_TAGS = new Set(['h4', 'div', 'ul', 'ol', 'li', 'b', 'span', 'br', 'p', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td']);
const VOID_TAGS = new Set(['br']);
const pad = (n) => String(n).padStart(2, '0');
const isStr = (x) => typeof x === 'string';
const isNonEmptyStr = (x) => isStr(x) && x.trim().length > 0;
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// data.js を vm で読み、DATA を返す。失敗時は例外。
export function loadData(source, filename = 'data.js') {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename });
  return sandbox.DATA;
}

// html 文字列の簡易チェック。問題点の文字列配列を返す。
export function lintHtml(html) {
  const problems = [];
  if (!isStr(html)) return ['文字列ではありません'];
  if (/<\/script/i.test(html)) problems.push('</script を含みます');
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^<>]*)>/g;
  let rest = '';
  let last = 0;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    rest += html.slice(last, m.index);
    last = tagRe.lastIndex;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (!ALLOWED_TAGS.has(name)) { problems.push(`許可されていないタグ <${name}>`); continue; }
    if (VOID_TAGS.has(name)) continue;
    if (closing) {
      const top = stack.pop();
      if (top !== name) { problems.push(`閉じタグの不整合 </${name}> (対応: ${top ? '<' + top + '>' : 'なし'})`); }
    } else {
      stack.push(name);
    }
  }
  rest += html.slice(last);
  if (stack.length) problems.push('閉じ忘れ: ' + stack.map((t) => '<' + t + '>').join(''));
  if (/[<>]/.test(rest)) problems.push('エスケープされていない < または > があります(&lt; &gt; を使う)');
  if (/&(?!(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-fA-F]+);)/.test(rest)) problems.push('エスケープされていない & があります(&amp; を使う)');
  return problems;
}

// step ブロックを { h4, body } の配列に分ける(div.step は入れ子にならない前提)。
function splitSteps(html) {
  const marker = '<div class="step">';
  const parts = html.split(marker);
  return { head: parts[0], steps: parts.slice(1) };
}

// ページ構成の規則違反を文字列配列で返す。
export function checkPageStructure(html) {
  const out = [];
  const classRe = /<[a-zA-Z][^<>]*?\sclass\s*=\s*"([^"]*)"/g;
  let cm;
  while ((cm = classRe.exec(html)) !== null) {
    for (const c of cm[1].split(/\s+/).filter(Boolean)) {
      if (!ALLOWED_CLASSES.has(c)) out.push(`使えない class "${c}"`);
    }
  }
  if (/<\/?h[1-3,5-6]\b/i.test(html)) out.push('h4 以外の見出しタグは使えません');
  const { head, steps } = splitSteps(html);
  const goalRe = new RegExp('^<p class="goal">' + GOAL_PREFIX + '[\\s\\S]+?</p>$');
  if (!goalRe.test(head.trim())) out.push(`先頭は <p class="goal">${GOAL_PREFIX}…</p> にする`);
  if (steps.length < 1) { out.push('<div class="step"> が1つ以上必要です'); return out; }
  steps.forEach((raw, i) => {
    const n = i + 1;
    const body = raw.trim();
    if (!body.endsWith('</div>')) { out.push(`手順${n}: </div> で閉じる`); return; }
    const inner = body.slice(0, -'</div>'.length);
    const m = /^<h4>([\s\S]*?)<\/h4>/.exec(inner);
    if (!m) { out.push(`手順${n}: 先頭は <h4>手順 ${n}　題</h4> にする`); return; }
    const sm = STEP_RE.exec(m[1]);
    if (!sm || Number(sm[1]) !== n) out.push(`手順${n}: h4「${m[1]}」は「手順 ${n}　題」(全角スペース区切り)にする`);
    const rest = inner.slice(m[0].length);
    const checks = (rest.match(/<div class="check">/g) || []).length;
    const reads = (rest.match(/<div class="read">/g) || []).length;
    if (checks > 1 || reads > 1) out.push(`手順${n}: check / read は各1つまで`);
    if (reads > checks) out.push(`手順${n}: read は check の後にだけ置ける`);
    const ci = rest.indexOf('<div class="check">');
    const ri = rest.indexOf('<div class="read">');
    if (checks && reads && ci > ri) out.push(`手順${n}: check は read より前に置く`);
    if (checks && !/<div class="check"><b>確認<\/b>\s*<pre class="out">[\s\S]*?<\/pre>\s*<\/div>/.test(rest)) out.push(`手順${n}: check は <b>確認</b> + <pre class="out"> の形にする`);
    if (reads && !/<div class="read"><b>読み方<\/b>\s*<(?:p|ul)>[\s\S]*<\/div>$/.test(rest.trim())) out.push(`手順${n}: read は <b>読み方</b> + <p> か <ul> の形にし、step の末尾に置く`);
  });
  return out;
}

// DATA を検証する。{ errors: string[], warnings: string[], stats } を返す。
export function validateData(DATA, { partial = false } = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const stats = { chapters: 0, lessons: 0, pages: 0 };

  if (!isObj(DATA) || !Array.isArray(DATA.chapters)) {
    err('DATA.chapters が配列ではありません');
    return { errors, warnings, stats };
  }
  const chapters = DATA.chapters;
  stats.chapters = chapters.length;

  // --- 章構成 ---
  const nos = chapters.map((c) => (isObj(c) ? c.no : undefined));
  for (let i = 1; i < nos.length; i++) {
    if (!(nos[i] > nos[i - 1])) err(`章番号が昇順ではありません: ${nos.join(',')}`);
  }
  if (new Set(nos).size !== nos.length) err(`章番号が重複しています: ${nos.join(',')}`);
  if (!partial) {
    for (const no of PLAN_BY_NO.keys()) {
      if (!nos.includes(no)) err(`章 ${no} がありません(欠けている章: ch${pad(no)}.js)`);
    }
    for (const no of nos) if (!PLAN_BY_NO.has(no)) err(`計画にない章番号 ${no} があります`);
  }

  const globalIds = new Map(); // id -> 場所
  const claim = (id, where) => {
    if (globalIds.has(id)) err(`${where}: ID ${id} が重複しています(既出: ${globalIds.get(id)})`);
    else globalIds.set(id, where);
  };

  for (const c of chapters) {
    if (!isObj(c)) { err('章がオブジェクトではありません'); continue; }
    const cp = `c${pad(c.no)}`;
    const where = `章${c.no}`;
    if (!Number.isInteger(c.no) || c.no < 1) { err(`${where}: no が正の整数ではありません`); continue; }
    if (!isNonEmptyStr(c.title)) err(`${where}: title が空です`);
    for (const k of ['lessons', 'ox', 'mc']) if (!Array.isArray(c[k])) err(`${where}: ${k} が配列ではありません`);
    if (!Array.isArray(c.lessons)) continue;
    if (Array.isArray(c.ox) && c.ox.length) err(`${where}: ox は空配列にする(問題は廃止) (実際 ${c.ox.length})`);
    if (Array.isArray(c.mc) && c.mc.length) err(`${where}: mc は空配列にする(問題は廃止) (実際 ${c.mc.length})`);
    const unknownKeys = Object.keys(c).filter((k) => !['no', 'title', 'lessons', 'ox', 'mc'].includes(k));
    if (unknownKeys.length) warn(`${where}: 不要なキー ${unknownKeys.join(',')}`);

    const plan = PLAN_BY_NO.get(c.no);
    const pageTotal = c.lessons.reduce((n, l) => n + (isObj(l) && Array.isArray(l.pages) ? l.pages.length : 0), 0);
    stats.lessons += c.lessons.length;
    stats.pages += pageTotal;
    if (plan) {
      if (c.title !== plan.title) err(`${where}: タイトル不一致 (期待「${plan.title}」/ 実際「${c.title}」)`);
      if (c.lessons.length !== plan.lessons.length) err(`${where}: レッスン数 ${c.lessons.length} (期待 ${plan.lessons.length})`);
    }

    // --- レッスン・ページ ---
    c.lessons.forEach((l, li) => {
      const lw = `${where} レッスン${li + 1}`;
      if (!isObj(l)) { err(`${lw}: オブジェクトではありません`); return; }
      const expectId = `${cp}-l${pad(li + 1)}`;
      if (l.id !== expectId) err(`${lw}: id ${JSON.stringify(l.id)} (期待 ${expectId})`);
      else claim(l.id, lw);
      if (!isNonEmptyStr(l.title)) err(`${lw}: title が空です`);
      else if (plan && li < plan.lessons.length && l.title !== plan.lessons[li]) {
        err(`${lw}: タイトル不一致 (期待「${plan.lessons[li]}」/ 実際「${l.title}」)`);
      }
      if (!Array.isArray(l.pages) || l.pages.length < 1) { err(`${lw}: pages が空です`); return; }
      const lessonUnknown = Object.keys(l).filter((k) => !['id', 'title', 'pages'].includes(k));
      if (lessonUnknown.length) warn(`${lw}: 不要なキー ${lessonUnknown.join(',')}`);
      l.pages.forEach((p, pi) => {
        const pw = `${lw} ページ${pi + 1}`;
        if (!isObj(p)) { err(`${pw}: オブジェクトではありません`); return; }
        const expectPid = `${cp}-l${pad(li + 1)}-p${pad(pi + 1)}`;
        if (p.id !== expectPid) err(`${pw}: id ${JSON.stringify(p.id)} (期待 ${expectPid})`);
        else claim(p.id, pw);
        if (!isNonEmptyStr(p.title)) err(`${pw}: title が空です`);
        if (!isNonEmptyStr(p.html)) err(`${pw}: html が空です`);
        else {
          for (const m of lintHtml(p.html)) warn(`${pw}: html ${m}`);
          for (const m of checkPageStructure(p.html)) err(`${pw}: ${m}`);
        }
        const pageUnknown = Object.keys(p).filter((k) => !['id', 'title', 'html', 'oxIds'].includes(k));
        if (pageUnknown.length) warn(`${pw}: 不要なキー ${pageUnknown.join(',')}`);
        if (!Array.isArray(p.oxIds) || p.oxIds.length !== 0) err(`${pw}: oxIds は空配列にする`);
      });
    });
  }

  return { errors, warnings, stats };
}

function main(argv) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const partial = argv.includes('--partial');
  const strict = argv.includes('--strict');
  const path = args[0] || DEFAULT_PATH;
  let DATA;
  try {
    DATA = loadData(readFileSync(path, 'utf8'), path);
  } catch (e) {
    console.error(`読み込み失敗: ${path}\n  ${e && e.message ? e.message : e}`);
    return 2;
  }
  const { errors, warnings, stats } = validateData(DATA, { partial });
  for (const m of errors) console.error('ERROR   ' + m);
  for (const m of warnings) console.error((strict ? 'ERROR   ' : 'WARNING ') + m);
  console.log(`章${stats.chapters} / レッスン${stats.lessons} / ページ${stats.pages}`);
  const bad = errors.length + (strict ? warnings.length : 0);
  console.log(bad ? `NG: エラー ${errors.length} 件, 警告 ${warnings.length} 件` : `OK (警告 ${warnings.length} 件)`);
  return bad ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
