# Keycloak 大全集 学習アプリ 設計仕様 (SPEC)

このファイルだけ読めば、各担当が独立して作業できる。元アプリ = `/Users/hiroham/develop/gaimuin/app/`(証券外務員一種 学習アプリ)。
本アプリは元アプリと**同一仕様**で、試験対策ではなく「Keycloak の知識・理解を深める」用途に文言と一部ロジックだけ変える。
元ネタ(教材本文) = `/Users/hiroham/develop/keycloak-taizen/keycloak-taizen.md` (2070行)。

## 0. 成果物と制約

- 成果物は `/Users/hiroham/develop/keycloak-taizen/app/` の **index.html, logic.js, data.js の3ファイルのみ**。外部依存なし、`file://` で動く。ビルド不要。
- 作業用ファイルは app/ 内の `parts/`(data の分割部分。最終的に data.js に結合)と、app/ の外の `tools/` `tests/` に置く。`parts/` と `SPEC.md` は app/ に残ってよいが、配布物は3ファイル。
- 言語は日本語。変数名・ファイル名は英語。
- 画面遷移・保存・章ロック解除・復習・間違いメモ・設定・JSONバックアップは元アプリと**完全に同じ**。

## 1. 元アプリのデータ仕様 (data.js の `window.DATA`)

元は `window.DATA = {"chapters":[...]}` (1行JSON, 約1.2MB)。index.html が実際に使うのは `DATA.chapters` のみ。

```
DATA = { chapters: Chapter[] }

Chapter = {
  no: number,            // 章番号 1,2,...(昇順・連番。ロック解除の判定は no-1 の章末テスト合格)
  title: string,
  lessons: Lesson[],
  ox: Ox[],              // この章の○×問題(全レッスン分をここに集約)
  mc: Mc[]               // この章の五肢選択(章末テスト用。章末テスト = c.mc を全問順に出題)
  // 元データには headingCount, basePages もあるが index.html は未使用 → 本アプリでは付けない
}
Lesson = {
  id: "c01-l01",         // 章2桁-レッスン2桁
  title: string,
  pages: Page[]          // 1画面=1ページ。1レッスン1ページ以上
  // 元データの lesson.html / lesson.sections は index.html 未使用 → 付けない
}
Page = {
  id: "c01-l01-p01",     // 間違いメモ(reportBtn)のIDにも使われる
  title: string,         // 画面の h1
  html: string,          // 本文HTML(下記「html で使うタグ・クラス」)
  oxIds: string[]        // このページの確認クイズ(○×)の問題ID。0個でもよい。順序=出題順。
  // 元データの cont:false は未使用 → 付けない
}
Ox = {
  id: "c01-ox-01",       // 章2桁-ox-連番2桁
  text: string,          // 問題文(HTMLとしてそのまま innerHTML に入る)
  answer: boolean,       // true=○ / false=×
  explain: string,       // 解説(HTML。<p>で包まれて表示される)
  lesson: "c01-l01"      // 所属レッスンID(必須。lessonQs が参照)
  // 元データの sec は未使用 → 付けない
}
Mc = {
  id: "c01-mc-01",       // 章2桁-mc-連番2桁
  stem: string,          // 問題文(HTML)。先頭に【組合せ型】or【正誤選択型】
  items: [{label:string, text:string}],   // 組合せ型: 4件(label は後述)。正誤選択型: 空配列 []
  choices: string[5],    // 5択。**プレーンテキスト**(index.html が esc() するので HTMLタグ・実体参照は書かない)
  answer: number,        // **1始まり**(1..5)。正解の choices[answer-1]
  explain: string[],     // HTML文字列の配列。組合せ型は items と同数(A→D順)、正誤選択型は5件(選択肢1→5順)
  tip: string            // 考え方・覚え方のコツ(HTML可)。必ず文字列で入れる
}
```

### 元データの実測(参考)
元は10章・レッスン4〜6/章・ページ約700・ox約1000・mc約90(章8〜10問)。組合せ型の items ラベルは イ・ロ・ハ・ニ、choices は `["イ・ロ","イ・ハ","ロ・ハ","ロ・ニ","ハ・ニ"]`。正誤選択型は items=[]、choices が5つの文。explain は組合せ型で `"イ：○ ..."`、正誤選択型で `"1：× ..."` の形式。ID は `c01-l01-p01` / `c01-ox-01` / `c01-mc-01`(2桁ゼロ埋め)。`logic.js` の `chapterOf(id)` は `/^c(\d+)-/` で章番号を取る。

### html で使うタグ・クラス(元アプリ)
元の `lesson.html`/`page.html` は次のみ: `<h4>`(ページ内の小見出し。左に青線) / `<ul><li>`(ネスト可) / `<b class="key">`(最重要語。赤太字) / `<span class="trap">`(ひっかけ・注意。橙太字+薄橙背景) / `<br>`。index.html の CSS は `.lesson` 内で `table`(border付き、横スクロール)も許す。

### 本アプリで追加するタグ(index.html の CSS も追加する → §4 Agent B)
`<p>` / `<ol>` / `<code>`(インライン。トークン名・URL・パラメータ) / `<pre>`(コマンド・JSON・シーケンス図。等幅・横スクロール) / `<table><tr><th|td>`(比較表。`<thead>/<tbody>` は不要)。
- `b.key` = 覚えるべき重要用語。1ページ 3〜8 個。
- `span.trap` = 「混同しやすい点」「よくある落とし穴」「注意」。元アプリの"ひっかけ"に相当。1ページ 0〜2 個。
- **エスケープ規則**: html 中のテキストとして `<` `>` `&` を出すときは `&lt;` `&gt;` `&amp;`(例: `Authorization: Bearer &lt;access_token&gt;`)。`<pre>` の中も同じ。ox.text / mc.stem / mc.items[].text / explain / tip は innerHTML なので同様。`choices` だけは esc 済み表示のため**生の文字**(`<` などをそのまま)で書く。

## 2. 元アプリの logic.js 公開API (`window.Logic` / `module.exports`)

UMD風。`(function (root){ ... module.exports = api (あれば); root.Logic = api; })(window or globalThis)`。ES5 スタイル(var / function)。純粋関数中心でDOM非依存、`storage` は引数で受け取る(Node でテスト可能)。

| 名前 | シグネチャ / 内容 |
|---|---|
| `STORAGE_KEY` | localStorage キー文字列。元 = `'gaimuin.progress.v1'` |
| `gradeOx(q, ans)` | `{correct: ans === q.answer}` (ans は boolean) |
| `gradeMc(q, ans)` | `{correct: ans === q.answer}` (ans は 1始まり number) |
| `emptyProgress()` | 下の Progress の初期値を返す |
| `loadProgress(storage)` | `{progress, ok}`。getItem 例外 → `{emptyProgress, ok:false}`。キー無し → `{empty, ok:true}`。JSON壊れ/validate NG → `{empty, ok:false}` |
| `saveProgress(storage, p)` | `setItem(KEY, JSON.stringify(p))` → true / 例外で false |
| `importProgress(json, current)` | `{progress, error}`。JSON不正 → `{current, 'JSONとして読めませんでした'}`、validate エラー文字列 → `{current, err}`、成功 `{p, null}` |
| `isChapterUnlocked(p, no)` | `no<=1` or `settings.unlockAll` で true。それ以外は `p.chapterTest[no-1].passed` |
| `examUnlocked(p, data)` | `unlockAll` or 全章の `chapterTest[c.no].passed` が true |
| `buildExam(data, rng?)` | `{ox:Ox[], mc:Mc[]}`。各章の問題数に比例配分(最大剰余法・章の問題数が上限)で OX_N / MC_N 問を無作為抽出し、全体をシャッフル。rng 省略時 Math.random。内部関数 allocate/sample/pick は非公開 |
| `scoreExam(exam, answers)` | `answers` = `{[問題ID]: boolean|number}`。キー無し/null/undefined は未回答で0点。戻り `{points, max, pass, byChapter:{[章no]:{correct,total}}}`。章は `chapterOf(q.id)` |

### Progress の形 (localStorage に JSON で保存)
```
{ version: 1,
  position: null | { ch:number, lessonId:string, page?:int>=0 },
  lessonsDone: string[],                       // 完了したレッスンID
  quizResults: { [問題ID]: { correct:boolean, ts:number } },
  wrongLog: string[],                          // 間違えた問題ID(復習対象)
  chapterTest: { [章no]: { score:number(0..1), passed:boolean } },
  reports: [ { id:string, memo:string, ts:number } ],   // validate は id/memo が string であることのみ要求
  settings: { passRate:number, unlockAll:boolean } }
```
`validate(p)` は不正理由の文字列 or null を返す(version!==1, position, lessonsDone, quizResults, wrongLog, chapterTest, reports, settings の各形をチェック。メッセージ文は元のまま)。`index.html` が参照する他のAPIは無い(`L.OX_PT` 等の定数は元は非公開)。

## 3. 元 index.html の構造(Agent B 用の要約。原本を必ず読んでコピー元にすること)

1ファイル(CSS+JS inline, 約480行)。`<script src="data.js">` → `<script src="logic.js">` → inline IIFE。`view` オブジェクトでビューを切替(`home / lesson / run / break / chapterend / ctresult / exam / reports / settings / simple`)し `render()` で `#app.innerHTML` を差し替え、`click` はイベント委譲で `data-act` を `switch`。
- ホーム: 全体進捗バー・「続きから」・章一覧(ロック/進行中/完了タグ、学習する/始める、章末テスト)・その他(総仕上げ・復習・間違いメモ・設定)。
- レッスン: 1画面=1ページ。ページ末に○×確認クイズ(`oxIds`)。6ページ(`PAGES_PER_BREAK`)ごとに「ここまで読みました」休憩画面。最後のページでレッスン完了→次レッスン or 章の終わり画面→章末テスト。
- 章末テスト: `c.mc` 全問を1問ずつ即採点 → 正答率 ≥ `settings.passRate` で `chapterTest[no]` を更新し次章解放(前に合格していれば合格状態は維持)。
- 復習: `wrongLog` の問題を出題、正解で wrongLog から除去。
- 総仕上げ: `L.buildExam` → 全問1画面 → 採点 → 章別成績・間違い一覧。
- 間違いメモ: `window.prompt` でメモ追加、一覧・削除・JSON書き出し。設定: 合格基準%、全章開放、進捗JSON 書き出し/読み込み、全消去。
- 起動時、`P.position` が有効なら該当レッスンを直接開く。

## 4. 差分仕様(本アプリで変える点。これ以外は元と同一)

### 4.1 名称・文言
| 元 | 本アプリ |
|---|---|
| アプリ名 `証券外務員一種 学習アプリ`(title, h1) | `Keycloak 大全集 学習アプリ` |
| 合格 / 不合格(章末テスト) | `クリア` / `もう一歩`(ホームの章末テスト表示 `章末テスト 80%（クリア）` / `（もう一歩）`、結果画面 `クリア` / `もう一歩（基準 N%）`) |
| 章末テストの合格基準(設定画面) | `章末テストのクリア基準`。章末テスト画面文言「正答率 N% 以上でクリア、次章が開きます」「前の章の章末テストをクリアすると開きます」 |
| 総仕上げ（本番形式） | `総合理解チェック`(ホームのボタン、ロック文言「全章の章末テストをクリアすると開きます」、画面h1、結果h1 `総合理解チェック 結果`) |
| 設定「全章を開放」説明 | 「章のロックと総合理解チェックのロックを解除します。」 |
| 結果画面の「分野別（章別）成績」 | 「章別の理解度」 |
| 結果文言「合格ライン到達 / 合格ライン（308点）未満」 | 「目安ライン到達 / 目安ライン（70%）未満」(70% は `L.EXAM_PASS_RATE` から生成) |
| 総仕上げの説明「○×70問（各2点）＋五肢選択30問（各10点）。308点以上で合格。… 制限時間は未確認…」 | 「○×N問（各1点）＋五肢選択M問（各2点）。目安は 70% 以上です。時間制限はありません。未回答は0点です。」N/M は `ex.ox.length` / `ex.mc.length`、点は `L.OX_PT` / `L.MC_PT` から生成 |
| 経過時間表示 | 「経過時間（参考）」とし、制限なしの旨を併記。タイマー機能自体(1秒更新)は残してよい |
| ダウンロード名 `gaimuin-progress-YYYYMMDD.json` / `gaimuin-reports-...` | `keycloak-taizen-progress-...` / `keycloak-taizen-reports-...` |
| 「間違いをメモ」 | そのまま(「間違い・不明点をメモ」に変えてもよいが、`data-act="report"` と挙動は不変) |

### 4.2 ロジック(logic.js のみ)
| 項目 | 元 | 本アプリ |
|---|---|---|
| `STORAGE_KEY` | `gaimuin.progress.v1` | **`keycloak-taizen.progress.v1`** |
| 総合チェック出題数 | OX_N=70, MC_N=30 | **OX_N=40, MC_N=20**(`allocate` が章の問題数を上限に丸めるので総数が足りない場合は自動で減る) |
| 配点 | OX_PT=2, MC_PT=10 (max 440, 合格 308) | **OX_PT=1, MC_PT=2**。`max = ox.length*OX_PT + mc.length*MC_PT` を**実際の出題内容から計算**(固定値 440 は廃止) |
| 合否 | `points >= 308` | `pass = max>0 && points/max >= EXAM_PASS_RATE`(**EXAM_PASS_RATE = 0.7**)。戻り値のキー名 `pass` は維持(index.html が参照) |
| 公開API追加 | - | `OX_N, MC_N, OX_PT, MC_PT, EXAM_PASS_RATE` を api に追加(index.html の文言生成用)。既存APIのシグネチャは不変 |
| `emptyProgress().settings.passRate` | 0.7 | **0.6**(章末テストは1章6〜10問。8問なら5問正解でクリア)。`validate` は不変(number かつ finite のみ) |
| `chapterOf` | `/^c(\d+)-/` | 変更なし(ID `c01-...` 〜 `c17-...` で動く) |
| その他 | | 変更なし(validate のメッセージ、position/page検証、importProgress 等) |

進捗JSONの `version` は 1 のまま(別アプリなのでキーが別、互換性問題なし)。

### 4.3 index.html の追加CSS(Agent B)
元CSSに追加:
- `.lesson pre { background:#f3f4f7; border:1px solid var(--line); border-radius:6px; padding:8px 12px; overflow-x:auto; white-space:pre; overflow-wrap:normal; font:0.82rem/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }`
- `.lesson code { background:#f0f2f6; border-radius:4px; padding:0 4px; font:0.9em ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; overflow-wrap:anywhere; } .lesson pre code { background:none; padding:0; }`
- `.lesson th { background:#f3f6fc; }`、`.lesson p { margin:.4em 0; }`
- 本文中の `<pre>` はシーケンス図の罫線文字(│ ─ ┬ ▼ など)を含むので、モバイルでも折り返さず横スクロール。
- `.explain`, `.q`, `.items` 内でも `code` は同じ見た目になるよう `.explain code, .q code, .items code` にも code スタイルを適用する。

### 4.4 データ面の差分
- ID 命名・スキーマは元と同じ(§1)。章は 1〜17(下表)。**章番号はアプリ独自で、md の章番号とは一致しない**(md §7 を app 第7〜9章に分割したため以降1つずれる。対応表は §5)。
- レッスン本文は「試験での出方」「暗記すべき数字」ページを持たない。代わりに各ページは**「なぜそうなっているか」「何と何が違うか」「具体例」**を重視する。
- 章末テスト(mc)は暗記ではなく**理解・区別・因果**を問う。
- 教材外の用語・数値を勝手に足さない。補足する場合も Keycloak 26 系で正確なことのみ。

## 5. 章・レッスン・ページ・問題数の計画と担当ブロック

md の行番号は `keycloak-taizen.md` の実際の行番号(本SPEC作成時点で確認済み)。**md §17(学習リソース 2058-2070)は app 第17章の最終レッスンに取り込む**。

データ総量: 17章 / 約45レッスン / 163ページ / ox 281 / mc 127。

### 命名規則(厳守)
- 章ID接頭辞 `cNN`(NNは2桁ゼロ埋め): `c01`〜`c17`
- レッスン `cNN-lMM`(MM=章内連番2桁)、ページ `cNN-lMM-pKK`(KK=レッスン内連番2桁)
- ox `cNN-ox-XX`(章内連番、ページ登場順に 01 から)、mc `cNN-mc-XX`(章内連番)
- `ox.lesson` = その ox を `oxIds` に持つページが属するレッスンID。**1つの ox は必ずちょうど1ページの oxIds に載せる**(孤児・重複禁止)。

### ブロック分割(部ごとに1つの parts/data_partN.js)

#### Block 1 → `parts/data_part1.js`(md 11-430, 約420行) 章 1〜4 / 40ページ / ox 68 / mc 31
| 章 | タイトル | md範囲 | レッスン(行範囲) | ページ数 | ox | mc |
|---|---|---|---|---|---|---|
| c01 | 全体像 | 11-53 | l01 Keycloak とは・登場人物 (11-23) 2p / l02 Keycloak の中身(Realm〜Session) (24-53) 4p | 6 | 10 | 6 |
| c02 | 主要エンドポイント(OIDC) | 54-135 | l01 Discovery と認可・トークン・userinfo・jwks・introspection (54-96) 4p / l02 logout・device・revoke・issuer・呼び出し元整理・注意 (97-135) 4p | 8 | 14 | 7 |
| c03 | トークンと Claim | 136-249 | l01 Claim とは・トークン種類・JWT構造 (136-168) 3p / l02 payload 例と標準 Claim (169-239) 5p / l03 Keycloak 独自 Claim・読み方 (240-249) 1p | 9 | 16 | 8 |
| c04 | Client Scope と Mapper | 250-430 | l01 3部品の関係・Client Scope・Default/Optional (250-290) 4p / l02 標準 Client Scope・Dedicated (291-322) 3p / l03 Mapper とは・種類 (323-377) 5p / l04 Mapper 設定項目・具体例・Full Scope Allowed・Lightweight (378-430) 5p | 17 | 28 | 10 |

#### Block 2 → `parts/data_part2.js`(md 431-884, 約454行) 章 5〜7 / 30ページ / ox 52 / mc 23
| 章 | タイトル | md範囲 | レッスン | ページ数 | ox | mc |
|---|---|---|---|---|---|---|
| c05 | Client 設定 | 431-531 | l01 基本項目・Capability config (431-467) 4p / l02 Access・Login・Logout settings (468-493) 3p / l03 Credentials・各タブ・Token 寿命 (494-531) 3p | 10 | 17 | 8 |
| c06 | Client authentication ON / OFF | 532-595 | l01 要点・比較表・token リクエスト差 (532-581) 4p / l02 切替の影響・エラー・選び方 (582-595) 2p | 6 | 11 | 6 |
| c07 | フローの前提: アプリ種別・state・nonce・PKCE | 596-884 | l01 3つのアプリ(SPA/Web/API)の違い (596-652) 3p / l02 用語整理と state (653-744) 4p / l03 nonce (745-803) 3p / l04 PKCE (804-884) 4p | 14 | 24 | 9 |

#### Block 3 → `parts/data_part3.js`(md 885-1357, 約473行・図が多い) 章 8〜9 / 29ページ / ox 48 / mc 18
| 章 | タイトル | md範囲 | レッスン | ページ数 | ox | mc |
|---|---|---|---|---|---|---|
| c08 | トークンの書式と Authorization Code Flow | 885-1105 | l01 JWT/JWS/JWE (885-900) 2p / l02 kid と JWKS (901-928) 2p / l03 Bearer token・Introspection (929-955) 2p / l04 1回のログインから API 呼び出しまで(まとめ図) (956-992) 2p / l05 7-1 Authorization Code Flow(+PKCE) 手順1〜11 (993-1066) 5p / l06 7-1 のシーケンス図(SPA版・Web版) (1067-1105) 2p | 15 | 24 | 9 |
| c09 | その他のフロー | 1106-1357 | l01 Client Credentials (1106-1141) 2p / l02 Refresh Token (1142-1176) 3p / l03 Password Grant(非推奨)・Device Grant (1177-1239) 3p / l04 Token Exchange・Logout (1240-1307) 4p / l05 SAML SSO・Identity Brokering (1308-1357) 2p | 14 | 24 | 9 |

#### Block 4 → `parts/data_part4.js`(md 1358-1695, 約338行・文章が密) 章 10〜15 / 33ページ / ox 59 / mc 37
| 章 | タイトル | md範囲 | レッスン | ページ数 | ox | mc |
|---|---|---|---|---|---|---|
| c10 | API 側でのトークン検証 | 1358-1446 | l01 JWT のローカル検証 (1358-1401) 3p / l02 Introspection・Userinfo・比較・実装例 (1402-1446) 3p | 6 | 11 | 6 |
| c11 | ユーザー・ロール・グループ | 1447-1510 | l01 User と Role (1447-1480) 4p / l02 Group・Service Account・Required Actions・Organizations・ロール設計指針 (1481-1510) 3p | 7 | 12 | 7 |
| c12 | 認証フロー(Authentication Flows) | 1511-1563 | l01 Flow の構成要素・標準フロー・Execution (1511-1546) 3p / l02 認証強化機能・設定例 (1547-1563) 2p | 5 | 9 | 6 |
| c13 | User Federation(LDAP / AD) | 1564-1596 | l01 用語・主な設定項目 (1564-1584) 2p / l02 同期・LDAP Mapper・Kerberos・Brokering との違い (1585-1596) 2p | 4 | 7 | 6 |
| c14 | セキュリティ・運用 | 1597-1650 | l01 本番で守ること(理由つき) (1597-1613) 2p / l02 鍵管理・監視・構成・設定優先順位・テーマ/SPI (1614-1650) 4p | 6 | 11 | 6 |
| c15 | Admin REST API | 1651-1695 | l01 概要・トークンの取り方・必要ロール (1651-1673) 3p / l02 主な API・自動化手段 (1674-1695) 2p | 5 | 9 | 6 |

#### Block 5 → `parts/data_part5.js`(md 1696-2070, 約375行) 章 16〜17 / 31ページ / ox 54 / mc 18
| 章 | タイトル | md範囲 | レッスン | ページ数 | ox | mc |
|---|---|---|---|---|---|---|
| c16 | 手を動かす(ハンズオン) | 1696-1971 | l01 ゴールと準備・Step 0〜3 (1696-1755) 4p / l02 Step 4 Authorization Code Flow を手動実行 (1756-1798) 4p / l03 Step 5〜7 トークンを読む・Evaluate・Userinfo (1799-1828) 3p / l04 Step 8〜10 Confidential client・Client Credentials (1829-1884) 4p / l05 Step 11〜12 Client Role と Mapper (1885-1910) 3p / l06 Step 13〜15 Refresh・Logout・API 検証・便利機能 (1911-1971) 4p | 22 | 36 | 10 |
| c17 | トラブルシューティング・用語集・学習リソース | 1972-2070 | l01 エラー早見表 (1972-1993) 2p / l02 API側で401・claim が出ない (1994-2007) 2p / l03 用語集 (2008-2057) 4p / l04 学習リソース (2058-2070) 1p | 9 | 18 | 8 |

(md §14 のハンズオンは ox を「このコマンドの結果はどうなるか」「失敗したときの原因は何か」の形にする。c17 l04 のページは oxIds が空でよい。)

### md → app 章対応表
md§1→c01, §2→c02, §3→c03, §4→c04, §5→c05, §6→c06, §7前半(596-884)→c07, §7後半(885-1105, 7-1まで)→c08, §7(1106-1357, 7-2〜7-9)→c09, §8→c10, §9→c11, §10→c12, §11→c13, §12→c14, §13→c15, §14→c16, §15〜17→c17。
(章間の参照「第N章」は md の番号。ページ本文で他章を参照するときは **app の章番号に直して**書く(例: md「第14章の Step 4」→「第16章の Step 4」、md「第4章」→「第4章」、md「第7-1」→「第8章の Authorization Code Flow」、md「第8章」→「第10章」、md「第9章」→「第11章」)。)

## 6. data.js の結合方法

- 先頭(メタ)は `parts/data_head.js` 1ファイル: 中身は**次の1行のみ**(**Agent C(part1担当)が作成**):
  ```js
  window.DATA = { chapters: [] };
  ```
- 各 part は `DATA.chapters.push({ ... });` を章ごとに1回、**章番号の昇順**で並べる(1 part に複数の push)。`window.` は付けない(`DATA` はグローバル参照)。part ファイル先頭にコメント1行(`// Keycloak 大全集 data part N: 章 a〜b`)はよい。
- 結合: `cat parts/data_head.js parts/data_part1.js parts/data_part2.js parts/data_part3.js parts/data_part4.js parts/data_part5.js > data.js`(順番厳守。**Agent A が `tools/build-data.mjs` として実装**。`node tools/build-data.mjs` で app/data.js を再生成する)。
- 各 part は単独でも文法的に有効な JS であること(先頭に `var DATA = DATA || window.DATA || { chapters: [] };` などは**書かない**。結合前に単体検証するときは `global.DATA = {chapters:[]}` を先に用意して `vm` で実行する)。
- 文字列は**すべてバッククォート(テンプレートリテラル)**で書く(HTML内に `"` が多いため)。ルール: (1) 文字列内にバッククォートを書かない(コードは `<code>`)、(2) `${` を書かない(`$TOKEN` は可、`${TOKEN}` は不可 → `$TOKEN` に言い換える)、(3) バックスラッシュは `\\` と書く(curl の行継続 `\` → `\\`、`a\.b` → `a\\.b`)、(4) 改行は `<pre>` 内のみ実改行でよい。他は1行。ID・boolean・number は素のリテラル。
- 例(形式の見本):
  ```js
  DATA.chapters.push({
    no: 1, title: `全体像`,
    lessons: [
      { id: 'c01-l01', title: `Keycloak とは・登場人物`, pages: [
        { id: 'c01-l01-p01', title: `Keycloak とは何か`,
          html: `<h4>…</h4><ul><li><b class="key">IdP</b>…</li></ul><span class="trap">…</span>`,
          oxIds: ['c01-ox-01', 'c01-ox-02'] }
      ] }
    ],
    ox: [
      { id: 'c01-ox-01', text: `…`, answer: true, explain: `…`, lesson: 'c01-l01' }
    ],
    mc: [
      { id: 'c01-mc-01', stem: `【組合せ型】…`, items: [{ label: 'A', text: `…` }, …], choices: ['A・B','A・C','B・C','B・D','C・D'], answer: 2,
        explain: [`A：○ …`, …], tip: `…` }
    ]
  });
  ```
  (id/lesson/choices は `'…'` でも `` `…` `` でもよい。統一は不要。)

## 7. データ執筆ガイド(Agent C〜G 共通)

### 7.1 方針
- **読み物として分かる**ことが最優先。md の箇条書きをそのまま詰めず、1ページ=1つの概念(または1つの手順)にまとめ、「結論 → なぜ → 具体例」の順に。md にある「たとえ話」「攻撃シナリオ」「(ここが一番の疑問点)」は削らず活かす。
- 元アプリのページより少し長くてよい: 本文 400〜900字(図・コマンドを含むページは最大約1500字)。1ページを画面1つ分(スマホで2〜3スクロール以内)に収める。
- 内容は md に忠実に。md の事実を変えない/足さない。md 内のコード・JSON・シーケンス図・表は、必要なものを `<pre>` / `<table>` で載せてよい(長い図は要点に絞って切り出し可。図は英語のままでよい)。
- 本文を md から**書き写さずに**、日本語は常体(「〜である」「〜する」)で統一。
- ページの `title` は本文冒頭の `<h4>` と重複させない(title は画面h1。html 内の `<h4>` は節の見出しとして 0〜3 個)。
- 教材外のURLにはリンクを付けない(`<a>` は使わない。URL は `<code>`)。

### 7.2 ox(○×確認クイズ)
- 1ページ 0〜3 問(基本は各ページ 1〜2 問。参照だけのページ(用語集・リソース)は 0〜1 問)。**そのページの本文だけで答えられる**こと。
- 暗記の確認ではなく**理解**を問う: 「〜のとき何が起きるか」「AとBの違い」「なぜ〜が必要か」「〜はどのトークンに入るか」。
- **○と×を約半々**にする(章単位で 45〜55% が false)。×の文は、md の記述を**一語だけ誤りに替えた**もっともらしい文(例: Public/Confidential の取り違え、aud と azp の取り違え、ブラウザ経由/バックチャネルの取り違え)。
- `explain` は1〜2文: 正誤の**理由**を書き、核心語を `<b class="key">` で。×の問題は正しい内容も書く。
- 問題文は1文〜2文。「常に」「必ず」「すべて」など一般化の語で×にするだけのひっかけは避ける。

### 7.3 mc(章末テスト・五肢選択)
- 章ごとの問題数は §5 の表どおり(正確に)。各章 **約半数ずつ【組合せ型】と【正誤選択型】**(奇数なら組合せ型が1多い)。
- 【組合せ型】: stem は `【組合せ型】○○に関する次の記述のうち、正しいものの組合せとして正しいものはどれか。`(「誤っているものの組合せ」でもよい)。`items` は 4件、label は **`A` `B` `C` `D`**(元の イ/ロ/ハ/ニ の代わり)。`choices` は常に **`["A・B","A・C","B・C","B・D","C・D"]`**(この順)。正しい組合せは1つだけになるよう A〜D の○×を設計する(2つが○・2つが×)。`explain` は4件: `A：○ 理由` / `A：× 理由(正しくは…)`。
- 【正誤選択型】: stem は `【正誤選択型】○○に関する次の記述のうち、正しいものはどれか。`(または 誤っているもの)。`items: []`。`choices` は5つの完結した文(プレーンテキスト)。`explain` は5件: `1：× 理由` 〜 `5：○ 理由`。
- `answer` は 1〜5。**章内および全体で 1〜5 が偏らないよう**散らす(組合せ型の正解位置も)。
- `tip` は「考え方・覚え方」を1文(「Public は secret を隠せない→PKCE」のような因果の言い換え)。空にしない。
- 暗記数値の羅列ではなく、**区別・因果・使い分け**を問う。章内の ox と同じ文をコピーしない(同じ論点を別の角度で問うのは可)。
- 選択肢の長さを揃え、正解だけ長い/短いにしない。

### 7.4 品質チェックリスト(各担当が自分の part で確認)
1. `DATA.chapters.push` の章番号・タイトル・レッスン数・ページ数・ox数・mc数が §5 の表と**一致**。
2. 全 ID がゼロ埋め2桁で、命名規則どおり・重複なし。ox.lesson は存在するレッスンID。
3. 全 ox が**ちょうど1つ**のページの oxIds に載る。oxIds に未定義IDなし。
4. mc: 組合せ型は items=4・explain=4・choices が固定5件、正誤選択型は items=[]・explain=5・choices 5件。answer は 1..5 の整数。tip は非空文字列。
5. html: タグの閉じ忘れなし。`<`/`>`/`&` のエスケープ(§1)。テンプレートリテラル規則(§6)違反なし(`${`・バッククォート・生の `\`)。`</script>` 文字列なし。
6. `choices` に HTML を書いていない。
7. `node` で単体ロードできる(例: `global.DATA={chapters:[]}; vm.runInThisContext(読んだpart)` が例外なしで、`DATA.chapters` が期待どおり)。
8. 事実関係を md と突き合わせた(特に数値・パス・パラメータ名・ON/OFF・Public/Confidential・「誰が呼ぶか」)。

## 8. 担当割り当て

| 担当 | 成果物 | 内容 |
|---|---|---|
| **Agent A** | `app/logic.js`, `tests/logic.test.mjs`, `tools/validate-data.mjs`, `tools/build-data.mjs` | gaimuin/app/logic.js を §4.2 の差分で調整(定数・キー・max/pass・API追加)。`/Users/hiroham/develop/gaimuin/tests/logic.test.mjs` を元に `/Users/hiroham/develop/keycloak-taizen/tests/logic.test.mjs` を作る(`node --test tests/` で通る。**app/ には置かない**)。`tools/build-data.mjs` = §6 の結合。`tools/validate-data.mjs` = 結合後 `app/data.js` を vm で読み §7.4 の機械チェック(1〜4,6)と章構成(§5 の表)を検証して不一致を列挙する(`node tools/validate-data.mjs [path]`、終了コードで合否)。 |
| **Agent B** | `app/index.html` | gaimuin/app/index.html を原本として §4.1 の文言差分・§4.3 のCSS追加のみ行う。**構造・イベント・関数は変えない**。文言用に `L.OX_N / MC_N / OX_PT / MC_PT / EXAM_PASS_RATE` を使うが、未定義でも落ちないようフォールバック値(40/20/1/2/0.7)を持たせる。動作確認は scratchpad のダミー data.js(app/ に置かない)や、結合後の実 data.js で行う(HTML表示・pre の横スクロール・章ロック・総合理解チェック・設定・エクスポート)。 |
| **Agent C** | `app/parts/data_head.js`, `app/parts/data_part1.js` | Block 1(章1〜4)。md 11-430 |
| **Agent D** | `app/parts/data_part2.js` | Block 2(章5〜7)。md 431-884 |
| **Agent E** | `app/parts/data_part3.js` | Block 3(章8〜9)。md 885-1357 |
| **Agent F** | `app/parts/data_part4.js` | Block 4(章10〜15)。md 1358-1695 |
| **Agent G** | `app/parts/data_part5.js` | Block 5(章16〜17)。md 1696-2070 |

注: 指示では data 担当が C〜E の3名・part1〜3 だったが、md が約2070行で17章あるため、1人あたりの分量を揃えて**5ブロック(part1〜5)・担当C〜G**にした。人数が3名に限られる場合の統合案: **C = part1 + part5、D = part2 + part4、E = part3**(行数 約795 / 792 / 473。part3 は図が多く実質的な文章量が少ない)。ファイル名と章分担は変えない。

### 結合・検証(統括)
1. A/B/C〜G 完了後: `node tools/build-data.mjs` → `node tools/validate-data.mjs` → `node --test tests/`。
2. `app/index.html` を `file://` で開き、ホーム→第1章→レッスン→確認クイズ→章末テスト→クリアで第2章解放、設定「全章を開放」→総合理解チェック→採点、JSON書き出し/読み込み、`localStorage` キー `keycloak-taizen.progress.v1` を確認。
3. 全ページの `<pre>` 表示(横スクロール、罫線文字の崩れなし)と、`<` `>` の表示崩れがないことを目視確認。
