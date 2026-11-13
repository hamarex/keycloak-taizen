import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateData, lintHtml, loadData } from '../tools/validate-data.mjs';
import { buildData, PART_FILES } from '../tools/build-data.mjs';
import { makeData, makeChapter } from './fixture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clone = (x) => JSON.parse(JSON.stringify(x));
const errs = (data, opts) => validateData(data, opts).errors;
const has = (list, re) => list.some((m) => re.test(m));

test('正しい17章のダミーデータはエラーなし', () => {
  const r = validateData(makeData());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.stats.chapters, 17);
  assert.equal(r.stats.ox, 281);
  assert.equal(r.stats.mc, 127);
});

test('章が欠けている/計画外: 通常は NG、--partial なら存在する章のみ照合', () => {
  const some = makeData([1, 2]);
  assert.ok(has(errs(some), /章 3 がありません/));
  assert.deepEqual(errs(some, { partial: true }), []);
  const extra = makeData();
  extra.chapters.push({ ...makeChapter(1), no: 18 });
  assert.ok(has(errs(extra), /計画にない章番号 18/));
});

test('章の構成不一致(タイトル・ox数・mc数・レッスン数)を列挙', () => {
  const d = clone(makeData([1]));
  d.chapters[0].title = 'ちがう';
  d.chapters[0].ox.pop();
  d.chapters[0].mc.pop();
  d.chapters[0].lessons.pop();
  const e = errs(d, { partial: true });
  assert.ok(has(e, /タイトル不一致/));
  assert.ok(has(e, /ox 数 9/));
  assert.ok(has(e, /mc 数 5/));
  assert.ok(has(e, /レッスン数 1/));
  assert.ok(has(e, /ページ数/));
});

test('レッスン別ページ数の違いは警告のみ', () => {
  const d = clone(makeData([1]));
  const [l1, l2] = d.chapters[0].lessons;
  l2.pages.push(l1.pages.pop()); // 合計は同じで配分だけ変える
  const r = validateData(d, { partial: true });
  assert.ok(has(r.warnings, /ページ数/));
  assert.ok(has(r.errors, /id/)); // id 規則違反は別途エラーになる
});

test('ID の命名・重複・ゼロ埋め', () => {
  const d = clone(makeData([1]));
  d.chapters[0].ox[0].id = 'c1-ox-1';
  assert.ok(has(errs(d, { partial: true }), /ox1: id "c1-ox-1"/));
  const d2 = clone(makeData([1]));
  d2.chapters[0].ox[1].id = d2.chapters[0].ox[0].id;
  assert.ok(has(errs(d2, { partial: true }), /ox2: id/));
  const d3 = clone(makeData([1]));
  d3.chapters[0].lessons[0].pages[0].id = 'c01-l01-p1';
  assert.ok(has(errs(d3, { partial: true }), /ページ1: id/));
});

test('ox: oxIds 参照整合(未定義・孤児・重複・lesson 不一致)', () => {
  let d = clone(makeData([1]));
  d.chapters[0].lessons[0].pages[0].oxIds.push('c01-ox-99');
  assert.ok(has(errs(d, { partial: true }), /c01-ox-99 が章1の ox に存在しません/));

  d = clone(makeData([1]));
  const removed = d.chapters[0].lessons[0].pages[0].oxIds.shift();
  assert.ok(has(errs(d, { partial: true }), new RegExp(removed + '.*孤児')));

  d = clone(makeData([1]));
  const dup = d.chapters[0].lessons[0].pages[0].oxIds[0];
  d.chapters[0].lessons[1].pages[0].oxIds.push(dup);
  assert.ok(has(errs(d, { partial: true }), new RegExp(dup + '.*複数ページ')));

  d = clone(makeData([1]));
  d.chapters[0].ox[0].lesson = 'c01-l99';
  assert.ok(has(errs(d, { partial: true }), /lesson "c01-l99"/));

  d = clone(makeData([1]));
  const q = d.chapters[0].ox[0];
  q.lesson = q.lesson === 'c01-l01' ? 'c01-l02' : 'c01-l01';
  assert.ok(has(errs(d, { partial: true }), /一致しません/));

  d = clone(makeData([1]));
  d.chapters[0].ox[0].answer = 'true';
  assert.ok(has(errs(d, { partial: true }), /answer が boolean/));
});

test('mc: answer 範囲・型', () => {
  for (const bad of [0, 6, 1.5, '2', null, undefined]) {
    const d = clone(makeData([1]));
    d.chapters[0].mc[0].answer = bad;
    assert.ok(has(errs(d, { partial: true }), /answer .* 1\.\.5/), String(bad));
  }
  for (const ok of [1, 5]) {
    const d = clone(makeData([1]));
    d.chapters[0].mc[0].answer = ok;
    assert.deepEqual(errs(d, { partial: true }), []);
  }
});

test('mc: 組合せ型/正誤選択型の構造', () => {
  let d = clone(makeData([1]));
  d.chapters[0].mc[0].items.pop();
  assert.ok(has(errs(d, { partial: true }), /items は 4 件/));

  d = clone(makeData([1]));
  d.chapters[0].mc[0].items[0].label = 'イ';
  assert.ok(has(errs(d, { partial: true }), /label は A,B,C,D/));

  d = clone(makeData([1]));
  d.chapters[0].mc[0].choices = ['A・B', 'A・C', 'B・C', 'B・D', 'A・D'];
  assert.ok(has(errs(d, { partial: true }), /choices は/));

  d = clone(makeData([1]));
  d.chapters[0].mc[0].explain.pop();
  assert.ok(has(errs(d, { partial: true }), /explain は 4 件/));

  d = clone(makeData([1]));
  d.chapters[0].mc[1].items = [{ label: 'A', text: 'x' }];
  assert.ok(has(errs(d, { partial: true }), /items は空配列/));

  d = clone(makeData([1]));
  d.chapters[0].mc[1].explain.pop();
  assert.ok(has(errs(d, { partial: true }), /explain は 5 件/));

  d = clone(makeData([1]));
  d.chapters[0].mc[0].tip = '';
  assert.ok(has(errs(d, { partial: true }), /tip/));

  d = clone(makeData([1]));
  d.chapters[0].mc[0].stem = '次の記述のうち';
  assert.ok(has(errs(d, { partial: true }), /【組合せ型】か【正誤選択型】/));
});

test('mc: choices にHTMLタグ・実体参照を書くとエラー', () => {
  let d = clone(makeData([1]));
  d.chapters[0].mc[1].choices[0] = '<code>x</code> を使う';
  assert.ok(has(errs(d, { partial: true }), /HTML タグ/));
  d = clone(makeData([1]));
  d.chapters[0].mc[1].choices[0] = 'a &lt; b';
  assert.ok(has(errs(d, { partial: true }), /実体参照/));
});

test('lintHtml: 閉じ忘れ・未許可タグ・未エスケープ', () => {
  assert.deepEqual(lintHtml('<h4>a</h4><ul><li><b class="key">x</b><br></li></ul><pre>a &lt; b &amp; c\nB: &lt;t&gt;</pre>'), []);
  assert.ok(lintHtml('<ul><li>a</ul>').length > 0);
  assert.ok(lintHtml('<ul><li>a</li>').some((m) => /閉じ忘れ/.test(m)));
  assert.ok(lintHtml('<a href="x">l</a>').some((m) => /許可されていないタグ/.test(m)));
  assert.ok(lintHtml('1 < 2').some((m) => /エスケープ/.test(m)));
  assert.ok(lintHtml('a & b').some((m) => /&/.test(m)));
  assert.ok(lintHtml('</script>').some((m) => /script/.test(m)));
});

test('loadData: window.DATA を vm で読む(part 内の DATA 参照が解決される)', () => {
  const src = 'window.DATA = { chapters: [] };\nDATA.chapters.push({ no: 1 });\n';
  assert.equal(loadData(src).chapters.length, 1);
  assert.throws(() => loadData('DATA.chapters.push(1)'));
});

test('build-data: parts を順番に結合し data.js を生成。欠けは例外 / allowMissing でスキップ', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kc-build-'));
  try {
    mkdirSync(join(dir, 'parts'));
    const w = (name, body) => writeFileSync(join(dir, 'parts', name), body);
    w('data_head.js', 'window.DATA = { chapters: [] };\n');
    w('data_part1.js', '// part1\nDATA.chapters.push({ no: 1 });'); // 末尾改行なし
    w('data_part2.js', 'DATA.chapters.push({ no: 2 });\n');
    assert.throws(() => buildData(dir), /data_part3\.js/);
    const r = buildData(dir, { allowMissing: true });
    assert.equal(r.chapterCount, 2);
    assert.deepEqual(r.missing, PART_FILES.slice(3));
    const out = readFileSync(join(dir, 'data.js'), 'utf8');
    assert.ok(out.indexOf('no: 1') < out.indexOf('no: 2'));
    assert.deepEqual([...loadData(out).chapters.map((c) => c.no)], [1, 2]);
    // 構文エラーの part は失敗
    w('data_part2.js', 'DATA.chapters.push({ no: 2 ');
    assert.throws(() => buildData(dir, { allowMissing: true }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: validate-data.mjs の終了コード(0=OK / 1=NG / 2=読み込み失敗)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kc-cli-'));
  const run = (file, ...flags) => spawnSync(process.execPath, [join(root, 'tools', 'validate-data.mjs'), file, ...flags], { encoding: 'utf8' });
  try {
    const good = join(dir, 'good.js');
    writeFileSync(good, 'window.DATA = ' + JSON.stringify(makeData()) + ';');
    assert.equal(run(good).status, 0);

    const bad = makeData();
    bad.chapters[0].mc[0].answer = 9;
    const badPath = join(dir, 'bad.js');
    writeFileSync(badPath, 'window.DATA = ' + JSON.stringify(bad) + ';');
    const rb = run(badPath);
    assert.equal(rb.status, 1);
    assert.match(rb.stderr, /answer/);

    const part = join(dir, 'part.js');
    writeFileSync(part, 'window.DATA = ' + JSON.stringify(makeData([1, 2])) + ';');
    assert.equal(run(part).status, 1);
    assert.equal(run(part, '--partial').status, 0);

    const warnOnly = makeData();
    warnOnly.chapters[0].lessons[0].pages[0].html = '<ul><li>x</ul>';
    const wp = join(dir, 'warn.js');
    writeFileSync(wp, 'window.DATA = ' + JSON.stringify(warnOnly) + ';');
    assert.equal(run(wp).status, 0);
    assert.equal(run(wp, '--strict').status, 1);

    assert.equal(run(join(dir, 'nothing.js')).status, 2);
    const broken = join(dir, 'broken.js');
    writeFileSync(broken, 'window.DATA = {');
    assert.equal(run(broken).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
