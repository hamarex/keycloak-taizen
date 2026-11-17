import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateData, lintHtml, loadData, checkPageStructure, PLAN_BY_NO } from '../tools/validate-data.mjs';
import { buildData, buildDataSource, CHAPTER_FILES } from '../tools/build-data.mjs';
import { makeData, makeChapter, chapterSource, validHtml } from './fixture.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clone = (x) => JSON.parse(JSON.stringify(x));
const errs = (data, opts) => validateData(data, opts).errors;
const has = (list, re) => list.some((m) => re.test(m));

test('正しい17章のダミーデータはエラー・警告なし', () => {
  const r = validateData(makeData());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.stats.chapters, 17);
  assert.equal(r.stats.lessons, [...PLAN_BY_NO.values()].reduce((n, p) => n + p.lessons.length, 0));
});

test('ページ数はレッスンごとに自由(1〜多数)', () => {
  const d = clone(makeData([10]));
  const l = d.chapters[0].lessons[0];
  l.pages = [l.pages[0]];
  assert.deepEqual(errs(d, { partial: true }), []);
});

test('章が欠けている: 通常は欠けている章ファイル名つきで NG、--partial なら存在する章のみ照合', () => {
  const some = makeData([10, 11]);
  assert.ok(has(errs(some), /章 1 がありません.*ch01\.js/));
  assert.ok(has(errs(some), /章 17 がありません.*ch17\.js/));
  assert.deepEqual(errs(some, { partial: true }), []);
  const extra = makeData();
  extra.chapters.push({ ...makeChapter(1), no: 18 });
  assert.ok(has(errs(extra), /計画にない章番号 18/));
});

test('章タイトル・レッスン数・レッスンタイトルの不一致', () => {
  const d = clone(makeData([10]));
  d.chapters[0].title = 'ちがう';
  d.chapters[0].lessons[0].title = '別名';
  d.chapters[0].lessons.pop();
  const e = errs(d, { partial: true });
  assert.ok(has(e, /タイトル不一致 \(期待「API 側でのトークン検証」/));
  assert.ok(has(e, /レッスン1: タイトル不一致/));
  assert.ok(has(e, /レッスン数 1/));
});

test('ID の命名・重複・ゼロ埋め(レッスン・ページ)', () => {
  const d = clone(makeData([10]));
  d.chapters[0].lessons[0].pages[0].id = 'c10-l01-p1';
  assert.ok(has(errs(d, { partial: true }), /ページ1: id "c10-l01-p1"/));
  const d2 = clone(makeData([10]));
  d2.chapters[0].lessons[0].id = 'c10-l1';
  assert.ok(has(errs(d2, { partial: true }), /レッスン1: id/));
  const d3 = clone(makeData([10]));
  d3.chapters[0].lessons[0].pages[1].id = d3.chapters[0].lessons[0].pages[0].id;
  assert.ok(has(errs(d3, { partial: true }), /ページ2: id/));
});

test('ox / mc / oxIds は空でなければエラー', () => {
  const d = clone(makeData([10]));
  d.chapters[0].ox.push({ id: 'c10-ox-01' });
  d.chapters[0].mc.push({ id: 'c10-mc-01' });
  d.chapters[0].lessons[0].pages[0].oxIds.push('c10-ox-01');
  const e = errs(d, { partial: true });
  assert.ok(has(e, /ox は空配列/));
  assert.ok(has(e, /mc は空配列/));
  assert.ok(has(e, /oxIds は空配列/));
  const d2 = clone(makeData([10]));
  delete d2.chapters[0].lessons[0].pages[0].oxIds;
  assert.ok(has(errs(d2, { partial: true }), /oxIds は空配列/));
});

test('ページ構成: goal → step(手順 N 連番)、check は pre.out、read は check の後', () => {
  assert.deepEqual(checkPageStructure(validHtml()), []);
  const bad = (html) => checkPageStructure(html);
  const v = validHtml();
  assert.ok(has(bad(v.replace('やりたいこと: ', '')), /先頭は/));
  assert.ok(has(bad('<p class="goal">やりたいこと: x</p>'), /step.*1つ以上/));
  assert.ok(has(bad(v.replace('手順 2　', '手順 3　')), /手順 2」?.*手順 2　題|手順2: h4/));
  assert.ok(has(bad(v.replace('手順 1　実行する', '手順 1 実行する')), /手順1: h4/));
  assert.ok(has(bad(v.replace('手順 1　実行する', '実行する')), /手順1: h4/));
  assert.ok(has(bad(v.replace('<pre class="out">{ "a": 1 }</pre>', '<p>x</p>')), /手順1: check は/));
  assert.ok(has(bad(v.replace('<b>読み方</b><p>', '<b>解説</b><p>')), /手順1: read は/));
  assert.ok(has(bad(v.replace('<h4>手順 2　調べる</h4><p>画面を開く。</p>', '<h4>手順 2　調べる</h4><div class="read"><b>読み方</b><p>x</p></div>')), /read は check の後/));
  assert.ok(has(bad(v.replace('<span class="trap">', '<span class="foo">')), /使えない class "foo"/));
  assert.ok(has(bad(v + '<h2>x</h2>'), /h4 以外の見出し/));
  const d = clone(makeData([10]));
  d.chapters[0].lessons[0].pages[0].html = '<h4>やりたいこと</h4><p>x</p>';
  assert.ok(has(errs(d, { partial: true }), /ページ1: .*先頭は/));
});

test('html の簡易チェック(閉じ忘れ・許可外タグ・エスケープ)は警告', () => {
  assert.deepEqual(lintHtml(validHtml()), []);
  assert.ok(has(lintHtml('<ul><li>x</ul>'), /閉じタグの不整合/));
  assert.ok(has(lintHtml('<p>x'), /閉じ忘れ/));
  assert.ok(has(lintHtml('<a href="x">y</a>'), /許可されていないタグ <a>/));
  assert.ok(has(lintHtml('<p>a & b</p>'), /& がありません|エスケープされていない &/));
  assert.ok(has(lintHtml('<p>a > b</p>'), /エスケープされていない/));
  assert.ok(has(lintHtml('<p>x</script></p>'), /<\/script/));
  const d = clone(makeData([10]));
  d.chapters[0].lessons[0].pages[0].html = d.chapters[0].lessons[0].pages[0].html.replace('<pre>ls</pre>', '<pre>ls</pre><p>x');
  const r = validateData(d, { partial: true });
  assert.deepEqual(r.errors, []);
  assert.ok(has(r.warnings, /閉じ忘れ/));
});

test('title / html が空ならエラー', () => {
  const d = clone(makeData([10]));
  d.chapters[0].lessons[0].pages[0].title = ' ';
  d.chapters[0].lessons[0].pages[1].html = '';
  const e = errs(d, { partial: true });
  assert.ok(has(e, /ページ1: title が空/));
  assert.ok(has(e, /ページ2: html が空/));
});

test('DATA.chapters が配列でなければエラー', () => {
  assert.ok(has(errs({}), /配列ではありません/));
});

test('loadData: window.DATA を vm で読む', () => {
  const d = loadData('window.DATA = { chapters: [] };\nDATA.chapters.push({no:1});');
  assert.equal(d.chapters.length, 1);
});

// ---- build-data ----
function tmpApp(chapterNos) {
  const dir = mkdtempSync(join(tmpdir(), 'kt-build-'));
  writeFileSync(join(dir, 'data_head.js'), 'window.DATA = { chapters: [] };');
  for (const no of chapterNos) writeFileSync(join(dir, `ch${String(no).padStart(2, '0')}.js`), chapterSource(no).trimEnd());
  // 旧 part は読まれないこと
  writeFileSync(join(dir, 'data_part1.js'), 'throw new Error("旧 part を読んではいけません");');
  return dir;
}

test('build-data: 章ファイルが欠けていれば欠けた章を列挙して失敗、data.js は作られない', () => {
  const dir = tmpApp([10, 11]);
  try {
    assert.throws(() => buildData(dir, { outFile: join(dir, 'out-data.js') }), /欠けている章ファイル: ch01\.js.*ch17\.js/);
    assert.ok(!existsSync(join(dir, 'out-data.js')));
    const r = buildDataSource(dir, { allowMissing: true });
    assert.equal(r.missing.length, 15);
    assert.ok(!r.missing.includes('ch10.js'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('build-data: 17章そろえば昇順に連結し、検証も通る', () => {
  const dir = tmpApp(Array.from({ length: 17 }, (_, i) => i + 1));
  try {
    const r = buildData(dir, { outFile: join(dir, 'out-data.js') });
    assert.equal(r.chapterCount, 17);
    const DATA = loadData(readFileSync(join(dir, 'out-data.js'), 'utf8'));
    assert.equal(JSON.stringify(DATA.chapters.map((c) => c.no)), JSON.stringify(Array.from({ length: 17 }, (_, i) => i + 1)));
    assert.deepEqual(validateData(DATA).errors, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('build-data: data_head.js が無ければ失敗 / CHAPTER_FILES は ch01〜ch17', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kt-build-'));
  try {
    assert.throws(() => buildData(dir, { outFile: join(dir, 'out-data.js') }), /data_head\.js/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  assert.equal(CHAPTER_FILES.length, 17);
  assert.equal(CHAPTER_FILES[0], 'ch01.js');
  assert.equal(CHAPTER_FILES[16], 'ch17.js');
});

test('CLI: validate-data.mjs は OK で 0 / NG で 1 / 読めなければ 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kt-cli-'));
  try {
    const ok = join(dir, 'ok.js');
    writeFileSync(ok, 'window.DATA = ' + JSON.stringify(makeData()) + ';');
    const run = (...a) => spawnSync(process.execPath, [join(root, 'tools', 'validate-data.mjs'), ...a], { encoding: 'utf8' });
    assert.equal(run(ok).status, 0);
    const bad = join(dir, 'bad.js');
    writeFileSync(bad, 'window.DATA = ' + JSON.stringify(makeData([10])) + ';');
    assert.equal(run(bad).status, 1);
    assert.equal(run(bad, '--partial').status, 0);
    assert.equal(run(join(dir, 'none.js')).status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
