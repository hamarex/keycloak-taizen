// app/data.js (結合後) を検証する。SPEC §5 の章構成と §7.4 の機械チェック(1〜4,6 と html 簡易チェック)。
// 使い方: node tools/validate-data.mjs [path/to/data.js] [--partial] [--strict]
//   --partial: data.js に含まれる章だけを §5 の表と照合する(作業途中の確認用)。
//   --strict : 警告(レッスン別ページ数の不一致・html 簡易チェック)もエラー扱いにする。
// 終了コード: 0=OK / 1=エラーあり / 2=読み込み失敗
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(here, '..', 'app', 'data.js');

// SPEC §5 の計画: [章no, タイトル, [レッスンごとのページ数...], ox数, mc数]
const PLAN = [
  [1, '全体像', [2, 4], 10, 6],
  [2, '主要エンドポイント(OIDC)', [4, 4], 14, 7],
  [3, 'トークンと Claim', [3, 5, 1], 16, 8],
  [4, 'Client Scope と Mapper', [4, 3, 5, 5], 28, 10],
  [5, 'Client 設定', [4, 3, 3], 17, 8],
  [6, 'Client authentication ON / OFF', [4, 2], 11, 6],
  [7, 'フローの前提: アプリ種別・state・nonce・PKCE', [3, 4, 3, 4], 24, 9],
  [8, 'トークンの書式と Authorization Code Flow', [2, 2, 2, 2, 5, 2], 24, 9],
  [9, 'その他のフロー', [2, 3, 3, 4, 2], 24, 9],
  [10, 'API 側でのトークン検証', [3, 3], 11, 6],
  [11, 'ユーザー・ロール・グループ', [4, 3], 12, 7],
  [12, '認証フロー(Authentication Flows)', [3, 2], 9, 6],
  [13, 'User Federation(LDAP / AD)', [2, 2], 7, 6],
  [14, 'セキュリティ・運用', [2, 4], 11, 6],
  [15, 'Admin REST API', [3, 2], 9, 6],
  [16, '手を動かす(ハンズオン)', [4, 4, 3, 4, 3, 4], 36, 10],
  [17, 'トラブルシューティング・用語集・学習リソース', [2, 2, 4, 1], 18, 8],
];
export const PLAN_BY_NO = new Map(PLAN.map(([no, title, pages, ox, mc]) => [no, { title, pages, ox, mc }]));

const COMBO_CHOICES = ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'];
const COMBO_LABELS = ['A', 'B', 'C', 'D'];
const ALLOWED_TAGS = new Set(['h4', 'ul', 'ol', 'li', 'b', 'span', 'br', 'p', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td']);
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

// DATA を検証する。{ errors: string[], warnings: string[], stats } を返す。
export function validateData(DATA, { partial = false } = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const stats = { chapters: 0, lessons: 0, pages: 0, ox: 0, mc: 0 };

  if (!isObj(DATA) || !Array.isArray(DATA.chapters)) {
    err('DATA.chapters が配列ではありません');
    return { errors, warnings, stats };
  }
  const chapters = DATA.chapters;
  stats.chapters = chapters.length;

  // --- 章構成 (SPEC §5) ---
  const nos = chapters.map((c) => (isObj(c) ? c.no : undefined));
  for (let i = 1; i < nos.length; i++) {
    if (!(nos[i] > nos[i - 1])) err(`章番号が昇順ではありません: ${nos.join(',')}`);
  }
  if (new Set(nos).size !== nos.length) err(`章番号が重複しています: ${nos.join(',')}`);
  if (!partial) {
    const expected = PLAN.map((p) => p[0]);
    for (const no of expected) if (!nos.includes(no)) err(`章 ${no} がありません`);
    for (const no of nos) if (!PLAN_BY_NO.has(no)) err(`計画にない章番号 ${no} があります`);
  }

  const globalIds = new Map(); // id -> 場所(全種別でグローバルに一意)
  const claim = (id, where) => {
    if (globalIds.has(id)) err(`${where}: ID ${id} が重複しています(既出: ${globalIds.get(id)})`);
    else globalIds.set(id, where);
  };
  const mcAnswerCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const c of chapters) {
    if (!isObj(c)) { err('章がオブジェクトではありません'); continue; }
    const cp = `c${pad(c.no)}`;
    const where = `章${c.no}`;
    if (!Number.isInteger(c.no) || c.no < 1) { err(`${where}: no が正の整数ではありません`); continue; }
    if (!isNonEmptyStr(c.title)) err(`${where}: title が空です`);
    for (const k of ['lessons', 'ox', 'mc']) if (!Array.isArray(c[k])) err(`${where}: ${k} が配列ではありません`);
    if (!Array.isArray(c.lessons) || !Array.isArray(c.ox) || !Array.isArray(c.mc)) continue;
    const unknownKeys = Object.keys(c).filter((k) => !['no', 'title', 'lessons', 'ox', 'mc'].includes(k));
    if (unknownKeys.length) warn(`${where}: 不要なキー ${unknownKeys.join(',')}`);

    const plan = PLAN_BY_NO.get(c.no);
    const pageTotal = c.lessons.reduce((n, l) => n + (isObj(l) && Array.isArray(l.pages) ? l.pages.length : 0), 0);
    stats.lessons += c.lessons.length;
    stats.pages += pageTotal;
    stats.ox += c.ox.length;
    stats.mc += c.mc.length;
    if (plan) {
      if (c.title !== plan.title) err(`${where}: タイトル不一致 (期待「${plan.title}」/ 実際「${c.title}」)`);
      if (c.lessons.length !== plan.pages.length) err(`${where}: レッスン数 ${c.lessons.length} (期待 ${plan.pages.length})`);
      const planPages = plan.pages.reduce((a, b) => a + b, 0);
      if (pageTotal !== planPages) err(`${where}: ページ数 ${pageTotal} (期待 ${planPages})`);
      if (c.ox.length !== plan.ox) err(`${where}: ox 数 ${c.ox.length} (期待 ${plan.ox})`);
      if (c.mc.length !== plan.mc) err(`${where}: mc 数 ${c.mc.length} (期待 ${plan.mc})`);
      c.lessons.forEach((l, i) => {
        const n = isObj(l) && Array.isArray(l.pages) ? l.pages.length : 0;
        if (i < plan.pages.length && n !== plan.pages[i]) warn(`${where} レッスン${i + 1}: ページ数 ${n} (計画 ${plan.pages[i]})`);
      });
    }

    // --- レッスン・ページ ---
    const lessonIds = new Set();
    const oxById = new Map(c.ox.map((q) => [isObj(q) ? q.id : undefined, q]));
    const oxPage = new Map(); // oxId -> [pageId...]
    c.lessons.forEach((l, li) => {
      const lw = `${where} レッスン${li + 1}`;
      if (!isObj(l)) { err(`${lw}: オブジェクトではありません`); return; }
      const expectId = `${cp}-l${pad(li + 1)}`;
      if (l.id !== expectId) err(`${lw}: id ${JSON.stringify(l.id)} (期待 ${expectId})`);
      else { claim(l.id, lw); lessonIds.add(l.id); }
      if (!isNonEmptyStr(l.title)) err(`${lw}: title が空です`);
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
        else for (const m of lintHtml(p.html)) warn(`${pw}: html ${m}`);
        const pageUnknown = Object.keys(p).filter((k) => !['id', 'title', 'html', 'oxIds'].includes(k));
        if (pageUnknown.length) warn(`${pw}: 不要なキー ${pageUnknown.join(',')}`);
        if (!Array.isArray(p.oxIds) || !p.oxIds.every(isStr)) { err(`${pw}: oxIds が文字列配列ではありません`); return; }
        if (new Set(p.oxIds).size !== p.oxIds.length) err(`${pw}: oxIds 内に重複があります`);
        for (const oid of p.oxIds) {
          if (!oxById.has(oid)) err(`${pw}: oxIds の ${oid} が章${c.no}の ox に存在しません`);
          else {
            const q = oxById.get(oid);
            if (q.lesson !== l.id) err(`${pw}: ${oid} の lesson (${JSON.stringify(q.lesson)}) がこのページのレッスン ${l.id} と一致しません`);
          }
          oxPage.set(oid, (oxPage.get(oid) || []).concat(p.id));
        }
      });
    });

    // --- ox ---
    c.ox.forEach((q, i) => {
      const qw = `${where} ox${i + 1}`;
      if (!isObj(q)) { err(`${qw}: オブジェクトではありません`); return; }
      const expectId = `${cp}-ox-${pad(i + 1)}`;
      if (q.id !== expectId) err(`${qw}: id ${JSON.stringify(q.id)} (期待 ${expectId})`);
      else claim(q.id, qw);
      if (!isNonEmptyStr(q.text)) err(`${qw}: text が空です`);
      if (typeof q.answer !== 'boolean') err(`${qw}: answer が boolean ではありません`);
      if (!isNonEmptyStr(q.explain)) err(`${qw}: explain が空です`);
      if (!lessonIds.has(q.lesson)) err(`${qw}: lesson ${JSON.stringify(q.lesson)} が存在するレッスンIDではありません`);
      else if (!String(q.lesson).startsWith(cp + '-')) err(`${qw}: lesson ${q.lesson} が別の章です`);
      const pages = oxPage.get(q.id) || [];
      if (pages.length === 0) err(`${qw} (${q.id}): どのページの oxIds にも載っていません(孤児)`);
      if (pages.length > 1) err(`${qw} (${q.id}): 複数ページの oxIds に載っています: ${pages.join(', ')}`);
      for (const f of ['text', 'explain']) for (const m of lintHtml(q[f])) warn(`${qw}: ${f} ${m}`);
    });
    if (c.ox.length >= 10) {
      const falseRatio = c.ox.filter((q) => q && q.answer === false).length / c.ox.length;
      if (falseRatio < 0.35 || falseRatio > 0.65) warn(`${where}: ox の × の割合 ${(falseRatio * 100).toFixed(0)}% (目安 45〜55%)`);
    }

    // --- mc ---
    c.mc.forEach((q, i) => {
      const qw = `${where} mc${i + 1}`;
      if (!isObj(q)) { err(`${qw}: オブジェクトではありません`); return; }
      const expectId = `${cp}-mc-${pad(i + 1)}`;
      if (q.id !== expectId) err(`${qw}: id ${JSON.stringify(q.id)} (期待 ${expectId})`);
      else claim(q.id, qw);
      if (!isNonEmptyStr(q.stem)) err(`${qw}: stem が空です`);
      const combo = isStr(q.stem) && q.stem.startsWith('【組合せ型】');
      const tf = isStr(q.stem) && q.stem.startsWith('【正誤選択型】');
      if (!combo && !tf) err(`${qw}: stem が【組合せ型】か【正誤選択型】で始まっていません`);
      if (!Array.isArray(q.items)) err(`${qw}: items が配列ではありません`);
      if (!Array.isArray(q.choices) || q.choices.length !== 5 || !q.choices.every(isNonEmptyStr)) {
        err(`${qw}: choices が非空文字列5件ではありません`);
      } else {
        q.choices.forEach((ch, ci) => {
          if (/<\/?[a-zA-Z][^<>]*>/.test(ch)) err(`${qw}: choices[${ci}] に HTML タグがあります(プレーンテキストで書く)`);
          if (/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/.test(ch)) err(`${qw}: choices[${ci}] に実体参照があります(生の文字で書く)`);
        });
      }
      if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > 5) err(`${qw}: answer ${JSON.stringify(q.answer)} が 1..5 の整数ではありません`);
      else mcAnswerCount[q.answer]++;
      if (!Array.isArray(q.explain) || !q.explain.every(isNonEmptyStr)) err(`${qw}: explain が非空文字列の配列ではありません`);
      if (!isNonEmptyStr(q.tip)) err(`${qw}: tip が非空文字列ではありません`);
      if (Array.isArray(q.items) && Array.isArray(q.explain)) {
        if (combo) {
          if (q.items.length !== 4) err(`${qw}: 組合せ型の items は 4 件 (実際 ${q.items.length})`);
          else if (!q.items.every((it, k) => isObj(it) && it.label === COMBO_LABELS[k] && isNonEmptyStr(it.text))) {
            err(`${qw}: items の label は A,B,C,D の順で text は非空にする`);
          }
          if (q.explain.length !== 4) err(`${qw}: 組合せ型の explain は 4 件 (実際 ${q.explain.length})`);
          if (Array.isArray(q.choices) && JSON.stringify(q.choices) !== JSON.stringify(COMBO_CHOICES)) {
            err(`${qw}: 組合せ型の choices は ${JSON.stringify(COMBO_CHOICES)} 固定`);
          }
        } else if (tf) {
          if (q.items.length !== 0) err(`${qw}: 正誤選択型の items は空配列 (実際 ${q.items.length})`);
          if (q.explain.length !== 5) err(`${qw}: 正誤選択型の explain は 5 件 (実際 ${q.explain.length})`);
        }
      }
      for (const m of lintHtml(q.stem)) warn(`${qw}: stem ${m}`);
      if (Array.isArray(q.items)) q.items.forEach((it, k) => { if (isObj(it)) for (const m of lintHtml(it.text)) warn(`${qw}: items[${k}].text ${m}`); });
      if (Array.isArray(q.explain)) q.explain.forEach((e, k) => { for (const m of lintHtml(e)) warn(`${qw}: explain[${k}] ${m}`); });
      for (const m of lintHtml(q.tip)) warn(`${qw}: tip ${m}`);
    });
  }

  stats.mcAnswerCount = mcAnswerCount;
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
  const s = stats;
  console.log(`章${s.chapters} / レッスン${s.lessons} / ページ${s.pages} / ox${s.ox} / mc${s.mc}` +
    (s.mcAnswerCount ? ` / mc正解分布 ${JSON.stringify(s.mcAnswerCount)}` : ''));
  const bad = errors.length + (strict ? warnings.length : 0);
  console.log(bad ? `NG: エラー ${errors.length} 件, 警告 ${warnings.length} 件` : `OK (警告 ${warnings.length} 件)`);
  return bad ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
