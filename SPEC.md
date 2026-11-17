# Keycloak 大全集 学習アプリ 仕様 (SPEC)

ハンズオン形式（やりたいこと → 手順1…N。各手順は 操作 → 確認 → 読み方）の学習アプリ。構造は kuber-taizen と同一。問題・テスト・章ロックは持たない。
ページ書式は本 SPEC §2。環境(`~/develop/kc-handson/` の docker-compose.yml と自作アプリ)は学習者が本文の手順で作る。元教材は `keycloak-taizen.md`。

## 1. 構成

| 場所 | 役割 |
|---|---|
| `docs/index.html` | 画面(CSS/JS インライン。外部依存なし。`file://` で動く) |
| `docs/logic.js` | 進捗の保存・移行・ページ/レッスン完了の純粋ロジック(Node でテスト可) |
| `docs/data.js` | 教材データ(生成物。`window.DATA`) |
| `src-parts/data_head.js` | `window.DATA = { chapters: [] };` の1行 |
| `src-parts/ch01.js`〜`ch17.js` | 章ごとの本文。`DATA.chapters.push({...});` |
| `tools/build-data.mjs` | `src-parts/data_head.js` + `ch*.js`(昇順)を連結して `docs/data.js` を生成。欠けた章ファイルは名前を列挙してエラー(`--allow-missing` で許容) |
| `tools/validate-data.mjs` | `docs/data.js` の検証(下記) |
| `tests/` | `node --test tests/*.test.mjs` |

配布物は `docs/` の3ファイル(index.html, logic.js, data.js)のみ。

## 2. データ仕様

```
DATA = { chapters: Chapter[] }
Chapter = { no, title, lessons: Lesson[], ox: [], mc: [] }   // ox/mc は常に空配列
Lesson  = { id: "c01-l01", title, pages: Page[] }
Page    = { id: "c01-l01-p01", title, html, oxIds: [] }      // oxIds は常に空配列
```
- 章番号・章タイトル・レッスン id/タイトルは固定(`tools/validate-data.mjs` の PLAN)。ページ数・タイトルは自由で、id は `cNN-lMM-pKK` の連番。
- ページ title は kuber-taizen と同じく短い名詞句(例: `Ingress の状態を読む`)。
- ページ html の構成(kuber-taizen と同一):
  ```
  <p class="goal">やりたいこと: …</p>
  <div class="step"><h4>手順 N　題</h4>(操作: p / pre / ul)
    <div class="check"><b>確認</b><pre class="out">期待出力</pre></div>
    <div class="read"><b>読み方</b><p>…</p> または <ul><li>…</li></ul></div></div>
  ```
  - `goal` は先頭に1つ、`やりたいこと: ` で始める。`step` は1つ以上で、h4 は `手順 N　題`(N は 1 から連番、N と題の間は全角スペース)。
  - `check` は `<b>確認</b>` + `<pre class="out">`(コピーボタン無し)。`read` は `<b>読み方</b>` + `<p>` か `<ul>`。read は check の後にだけ置け、各 step に check / read は各1つまで(操作だけの step も可)。
  - 使える class は `goal step check read out key trap`(`<b class="key">`・`<span class="trap">` は強調用に最小限)。
- 使えるタグ: `h4 div ul ol li b span br p code pre table thead tbody tr th td`。`<` `>` `&` は `&lt; &gt; &amp;`。
- JS 文字列はテンプレートリテラル。文字列内にバッククォート・`${` を書かない。バックスラッシュは `\\`。

## 3. 検証 (`node tools/validate-data.mjs [data.js] [--partial] [--strict]`)
エラー: 章の欠落(欠けた章ファイル名つき)・章/レッスンのタイトル不一致・レッスン数・id 規則・ページ構成違反(goal の欠落・step の連番・check/read の形と順序・許可外 class・h4 以外の見出し)・ox/mc/oxIds が空でない・title/html が空。
警告: html の簡易チェック(閉じ忘れ・許可外タグ・未エスケープ)。`--strict` で警告もエラー。`--partial` は存在する章のみ照合。

## 4. 進捗 (`window.Logic`)
localStorage キー `keycloak-taizen.progress.v2`。
```
{ version: 2, position: null | {ch, lessonId, page?}, lessonsDone: string[], pagesDone: string[], reports: [{id, memo, ts?}] }
```
- `lessonsDone` は「全ページが pagesDone に入ったレッスン」の派生値(`syncLessons`/`markPage` が再計算)。
- version 1(キー `...progress.v1`)は、v2 キーが無いとき自動移行。`lessonsDone` / `reports` / `position` を引き継ぎ、クイズ関連(quizResults, wrongLog, chapterTest, settings)は破棄。v1 のデータは localStorage に残す。移行直後は完了済みレッスンの全ページを完了扱いにする(`syncLessons(p, data, true)`)。
- 進捗JSONの読み込みも v1/v2 両対応。
- API: `emptyProgress, validate, migrateV1, loadProgress, saveProgress, importProgress, isPageDone, lessonStats, isLessonDone, syncLessons, markPage, setPosition, addReport, removeReport`(更新系は新しいオブジェクトを返す)。

## 5. 画面
- ホーム: 全体進捗、続きから、ハンズオン環境カード(第1章で自作する旨・前提ソフト・起動停止・URL早見表)、章一覧(全章最初から開放)、間違いメモ、設定。
- レッスン: 1画面=1ページ。モノトーン配色(白背景・濃グレー文字・青1色のアクセント)、`<pre>` にコピーボタン、ページ末に「このページを試した」トグル(ページ単位で保存、レッスン進捗に反映)、6ページごとに区切り画面、位置保存と続きから。
- 間違いメモ(「記述の間違いをメモ」)、設定(進捗JSONの書き出し/読み込み、消去)。
